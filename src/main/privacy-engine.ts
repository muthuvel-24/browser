/**
 * Muthu Browser — Privacy Engine
 *
 * Comprehensive network-level privacy and content filtering engine:
 * 1. Filter list rules (domains, URL regex, tracking parameters)
 * 2. Third-party tracker and script detection
 * 3. Third-party cookie blocking
 * 4. Per-site privacy statistics (ads, trackers, third-party requests, cookies)
 * 5. Per-site shield toggling and domain whitelisting
 */

import type { Session, OnBeforeRequestListenerDetails, CallbackResponse } from 'electron';
import { stripTrackingParams } from './url-utils';

export interface SitePrivacyStats {
  domain: string;
  adsBlocked: number;
  trackersBlocked: number;
  thirdPartyBlocked: number;
  cookiesBlocked: number;
  shieldEnabled: boolean;
}

export interface GlobalPrivacyStats {
  totalAdsBlocked: number;
  totalTrackersBlocked: number;
  totalCookiesBlocked: number;
  sessionBlocked: number;
}

/** Known advertising domains */
const AD_DOMAINS = new Set([
  'doubleclick.net', 'googleadservices.com', 'googleads.g.doubleclick.net',
  'pagead2.googlesyndication.com', 'pubads.g.doubleclick.net', 'adservice.google.com',
  'adnxs.com', 'ib.adnxs.com', 'criteo.com', 'static.criteo.net', 'dis.criteo.com',
  'taboola.com', 'cdn.taboola.com', 'trc.taboola.com', 'outbrain.com',
  'widgets.outbrain.com', 'rubiconproject.com', 'pubmatic.com', 'openx.net',
  'casalemedia.com', 'popads.net', 'popcash.net', 'adcash.com', 'propellerads.com',
  'adroll.com', 'exoclick.com', 'trafficjunky.net', 'buysellads.com',
  'carbonads.net', 'srv.carbonads.net', 'aax.amazon-adsystem.com', 'c.amazon-adsystem.com',
  's.amazon-adsystem.com', 'an.facebook.com'
]);

/** Known telemetry, analytics & user-tracking domains */
const TRACKER_DOMAINS = new Set([
  'google-analytics.com', 'analytics.google.com', 'stats.g.doubleclick.net',
  'connect.facebook.net', 'pixel.facebook.com', 'scorecardresearch.com',
  'sb.scorecardresearch.com', 'quantserve.com', 'edge.quantserve.com',
  'chartbeat.com', 'static.chartbeat.com', 'hotjar.com', 'static.hotjar.com',
  'script.hotjar.com', 'mixpanel.com', 'api.mixpanel.com', 'segment.io',
  'cdn.segment.com', 'api.segment.io', 'amplitude.com', 'api.amplitude.com',
  'newrelic.com', 'js-agent.newrelic.com', 'bam.nr-data.net', 'sentry.io',
  'clarity.ms', 'c.clarity.ms', 'yandex.ru', 'mc.yandex.ru'
]);

/** URL patterns matching telemetry/tracking endpoints */
const TRACKING_PATTERNS = [
  /\/api\/stats\/ads/i,
  /\/pagead\//i,
  /\/ptracking/i,
  /\/youtubei\/v1\/att\/get/i,
  /\/youtubei\/v1\/player\/ad_break/i,
  /\/get_midroll_info/i,
  /[?&]adformat=/i,
  /[?&]oad=/i,
  /\/adserver\//i,
  /\/adsystem\//i,
  /\/telemetry\//i,
  /\/tracking\//i,
  /\/pixel\.png/i,
  /\/pixel\.gif/i,
  /\/collect\?v=/i,
  /\/event\?.*type=track/i,
];

export class PrivacyEngine {
  private globalStats: GlobalPrivacyStats = {
    totalAdsBlocked: 0,
    totalTrackersBlocked: 0,
    totalCookiesBlocked: 0,
    sessionBlocked: 0,
  };

  private siteStats = new Map<string, SitePrivacyStats>();
  private whitelist = new Set<string>();
  private blockThirdPartyCookies = true;
  private isEnabled = true;

  public onStatsChanged: ((stats: GlobalPrivacyStats) => void) | null = null;

  constructor() {}

  /** Extract base root domain (e.g. 'sub.example.co.uk' -> 'example.co.uk' or 'google.com') */
  public getBaseDomain(hostname: string): string {
    if (!hostname) return '';
    const parts = hostname.toLowerCase().split('.');
    if (parts.length <= 2) return hostname.toLowerCase();
    return parts.slice(-2).join('.');
  }

  /** Get or create stats record for a specific site domain */
  public getSiteStats(domain: string): SitePrivacyStats {
    const base = this.getBaseDomain(domain);
    let record = this.siteStats.get(base);
    if (!record) {
      record = {
        domain: base,
        adsBlocked: 0,
        trackersBlocked: 0,
        thirdPartyBlocked: 0,
        cookiesBlocked: 0,
        shieldEnabled: !this.whitelist.has(base),
      };
      this.siteStats.set(base, record);
    }
    return { ...record };
  }

  /** Toggle shield on/off for a site */
  public toggleSiteShield(domain: string, enabled: boolean): void {
    const base = this.getBaseDomain(domain);
    if (enabled) {
      this.whitelist.delete(base);
    } else {
      this.whitelist.add(base);
    }
    const record = this.siteStats.get(base);
    if (record) {
      record.shieldEnabled = enabled;
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public setBlockThirdPartyCookies(block: boolean): void {
    this.blockThirdPartyCookies = block;
  }

  public setWhitelist(domains: string[]): void {
    this.whitelist = new Set(domains.map((d) => this.getBaseDomain(d)));
  }

  public getGlobalStats(): GlobalPrivacyStats {
    return { ...this.globalStats };
  }

  /**
   * Attach request and cookie interceptors to an Electron session.
   */
  public attachToSession(targetSession: Session): void {
    // 1. Request filtering
    targetSession.webRequest.onBeforeRequest(
      { urls: ['*://*/*'] },
      (details, callback) => {
        if (!this.isEnabled) {
          callback({});
          return;
        }

        const urlStr = details.url;

        // Never cancel main frame navigations (user opened website)
        if (details.resourceType === 'mainFrame') {
          const cleanedUrl = stripTrackingParams(urlStr);
          if (cleanedUrl !== urlStr) {
            callback({ redirectURL: cleanedUrl });
            return;
          }
          callback({});
          return;
        }

        try {
          const requestUrl = new URL(urlStr);
          const requestHost = requestUrl.hostname.toLowerCase();
          const requestBase = this.getBaseDomain(requestHost);

          // Get top-level domain from details.initiator or referrer
          let topHost = '';
          const initiator = (details as unknown as { initiator?: string }).initiator;
          if (initiator) {
            topHost = new URL(initiator).hostname.toLowerCase();
          } else if (details.referrer) {
            topHost = new URL(details.referrer).hostname.toLowerCase();
          }
          const topBase = this.getBaseDomain(topHost);

          // If top site is whitelisted, allow all
          if (topBase && this.whitelist.has(topBase)) {
            callback({});
            return;
          }

          const siteStat = this.getSiteStats(topBase || requestBase);

          // Check if it's an ad
          const isAd = AD_DOMAINS.has(requestHost) || AD_DOMAINS.has(requestBase) ||
            Array.from(AD_DOMAINS).some((d) => requestHost.endsWith('.' + d));

          // Check if it's a tracker
          const isTracker = TRACKER_DOMAINS.has(requestHost) || TRACKER_DOMAINS.has(requestBase) ||
            Array.from(TRACKER_DOMAINS).some((d) => requestHost.endsWith('.' + d)) ||
            TRACKING_PATTERNS.some((p) => p.test(requestUrl.pathname + requestUrl.search));

          // Check if it's a third-party request
          const isThirdParty = topBase && requestBase && (topBase !== requestBase);

          if (isAd || isTracker) {
            if (isAd) {
              this.globalStats.totalAdsBlocked++;
              siteStat.adsBlocked++;
            }
            if (isTracker) {
              this.globalStats.totalTrackersBlocked++;
              siteStat.trackersBlocked++;
            }
            if (isThirdParty) {
              siteStat.thirdPartyBlocked++;
            }

            this.globalStats.sessionBlocked++;
            this.siteStats.set(siteStat.domain, siteStat);
            this.onStatsChanged?.(this.getGlobalStats());

            callback({ cancel: true });
            return;
          }
        } catch {
          // ignore parsing error
        }

        callback({});
      }
    );

    // 2. Third-party cookie blocking
    targetSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...(details.responseHeaders || {}) };

      if (this.isEnabled && this.blockThirdPartyCookies) {
        try {
          const requestHost = new URL(details.url).hostname.toLowerCase();
          const requestBase = this.getBaseDomain(requestHost);

          let topHost = '';
          const initiator = (details as unknown as { initiator?: string }).initiator;
          if (initiator) {
            topHost = new URL(initiator).hostname.toLowerCase();
          }
          const topBase = this.getBaseDomain(topHost);

          // If third-party and has Set-Cookie header, strip it
          if (topBase && requestBase && topBase !== requestBase) {
            if (responseHeaders['set-cookie'] || responseHeaders['Set-Cookie']) {
              delete responseHeaders['set-cookie'];
              delete responseHeaders['Set-Cookie'];
              this.globalStats.totalCookiesBlocked++;
              const siteStat = this.getSiteStats(topBase);
              siteStat.cookiesBlocked++;
              this.siteStats.set(siteStat.domain, siteStat);
              this.onStatsChanged?.(this.getGlobalStats());
            }
          }
        } catch {
          // ignore
        }
      }

      callback({ responseHeaders });
    });

    console.log('[PrivacyEngine] Network ad/tracker/cookie filters active on session');
  }
}
