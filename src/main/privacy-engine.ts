/**
 * Muthu Browser — Privacy Engine
 *
 * Comprehensive network-level privacy and content filtering engine:
 * 1. Filter list rules (domains, URL regex, tracking parameters)
 * 2. Public Suffix List (PSL) aware domain extraction
 * 3. Third-party tracker and script detection
 * 4. Third-party cookie blocking
 * 5. Per-site privacy statistics (ads, trackers, third-party requests, cookies)
 * 6. Per-site shield toggling and domain whitelisting
 */

import type { Session, OnBeforeRequestListenerDetails } from 'electron';
import { stripTrackingParams } from './url-utils';
import { parseDomain, getBaseDomain } from './domain-utils';

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
  /\/telemetry\//i,
  /\/collect\?v=/i,
  /\/analytics\//i,
  /\/tracking\//i,
  /\/pixel\.(png|gif)/i,
  /\/event\?.*type=track/i,
  /[?&]utm_[a-z]+=/i,
  /[?&]fbclid=/i,
  /[?&]gclid=/i,
  /[?&]msclkid=/i,
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

  /** Extract PSL-aware base root domain */
  public getBaseDomain(hostname: string): string {
    return getBaseDomain(hostname);
  }

  /** Check if a hostname and path match known tracking filters */
  public matchesTracker(hostname: string, pathAndQuery: string): boolean {
    if (!this.isEnabled) return false;
    const cleanHost = hostname.toLowerCase().trim();
    const base = this.getBaseDomain(cleanHost);

    if (this.whitelist.has(base) || this.whitelist.has(cleanHost)) {
      return false;
    }

    const isTrackerHost = TRACKER_DOMAINS.has(cleanHost) || TRACKER_DOMAINS.has(base) ||
      Array.from(TRACKER_DOMAINS).some((d) => cleanHost.endsWith('.' + d));
    if (isTrackerHost) return true;

    return TRACKING_PATTERNS.some((p) => p.test(pathAndQuery));
  }

  public isBlockThirdPartyCookiesEnabled(): boolean {
    return this.isEnabled && this.blockThirdPartyCookies;
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

  /** Record ad blocked for site */
  public recordAdBlocked(domain: string): void {
    const base = this.getBaseDomain(domain);
    const site = this.getSiteStats(base);
    site.adsBlocked++;
    this.siteStats.set(base, site);
    this.globalStats.totalAdsBlocked++;
    this.globalStats.sessionBlocked++;
    this.onStatsChanged?.(this.getGlobalStats());
  }

  /** Record tracker blocked for site */
  public recordTrackerBlocked(domain: string): void {
    const base = this.getBaseDomain(domain);
    const site = this.getSiteStats(base);
    site.trackersBlocked++;
    this.siteStats.set(base, site);
    this.globalStats.totalTrackersBlocked++;
    this.globalStats.sessionBlocked++;
    this.onStatsChanged?.(this.getGlobalStats());
  }

  /** Record third-party request blocked for site */
  public recordThirdPartyBlocked(domain: string): void {
    const base = this.getBaseDomain(domain);
    const site = this.getSiteStats(base);
    site.thirdPartyBlocked++;
    this.siteStats.set(base, site);
  }

  /** Record third-party cookie blocked for site */
  public recordCookieBlocked(domain: string): void {
    const base = this.getBaseDomain(domain);
    const site = this.getSiteStats(base);
    site.cookiesBlocked++;
    this.siteStats.set(base, site);
    this.globalStats.totalCookiesBlocked++;
    this.onStatsChanged?.(this.getGlobalStats());
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
      this.siteStats.set(base, record);
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
}
