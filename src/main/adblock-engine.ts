/**
 * Muthu Browser — High-Performance Pure TypeScript Ad & Tracker Blocker
 *
 * 100% self-contained engine that operates at the network level.
 * - Zero external native module dependencies (no runtime crashes in app.asar)
 * - Comprehensive blocklist for ad servers, tracking pixels, and telemetry
 * - Per-tab & session statistics tracking
 * - Outbound query parameter sanitization
 */

import { app, type Session } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { stripTrackingParams } from './url-utils';
import type { AdBlockStats } from './types';

/** Common ad and tracker domain rules */
const AD_DOMAINS = new Set([
  // YouTube & Google Ad Serving
  'ad.youtube.com',
  'ads.youtube.com',
  's.youtube.com',
  'googleads.g.doubleclick.net',
  'static.doubleclick.net',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'googleadservices.com',
  'www.googleadservices.com',
  'stats.g.doubleclick.net',
  'ad.doubleclick.net',
  'm.doubleclick.net',
  'cm.g.doubleclick.net',
  'securepubads.g.doubleclick.net',
  'pubads.g.doubleclick.net',
  'google-analytics.com',
  'www.google-analytics.com',
  'analytics.google.com',

  // Facebook / Meta Tracking
  'connect.facebook.net',
  'pixel.facebook.com',
  'an.facebook.com',

  // Amazon Ads
  'aax.amazon-adsystem.com',
  'c.amazon-adsystem.com',
  's.amazon-adsystem.com',

  // Popular Ad Networks & Trackers
  'taboola.com',
  'cdn.taboola.com',
  'trc.taboola.com',
  'outbrain.com',
  'widgets.outbrain.com',
  'criteo.com',
  'static.criteo.net',
  'dis.criteo.com',
  'adnxs.com',
  'ib.adnxs.com',
  'rubiconproject.com',
  'pubmatic.com',
  'openx.net',
  'casalemedia.com',
  'scorecardresearch.com',
  'sb.scorecardresearch.com',
  'quantserve.com',
  'edge.quantserve.com',
  'chartbeat.com',
  'static.chartbeat.com',
  'hotjar.com',
  'static.hotjar.com',
  'script.hotjar.com',
  'mixpanel.com',
  'api.mixpanel.com',
  'segment.io',
  'cdn.segment.com',
  'api.segment.io',
  'amplitude.com',
  'api.amplitude.com',
  'newrelic.com',
  'js-agent.newrelic.com',
  'bam.nr-data.net',
  'sentry.io',
  'clarity.ms',
  'c.clarity.ms',
  'yandex.ru',
  'mc.yandex.ru',
  'popads.net',
  'popcash.net',
  'adcash.com',
  'propellerads.com',
  'adroll.com',
  'exoclick.com',
  'trafficjunky.net',
  'buysellads.com',
  'carbonads.net',
  'srv.carbonads.net',
]);

/** URL patterns matching common ad/tracker endpoints */
const AD_PATTERNS = [
  // YouTube Video Ads & Telemetry
  /\/api\/stats\/ads/i,
  /\/pagead\//i,
  /\/ptracking/i,
  /\/youtubei\/v1\/att\/get/i,
  /\/youtubei\/v1\/player\/ad_break/i,
  /\/get_midroll_info/i,
  /[?&]adformat=/i,
  /[?&]oad=/i,

  // General Ad & Tracking Patterns
  /\/adserver\//i,
  /\/adsystem\//i,
  /\/googleads\//i,
  /\/doubleclick\//i,
  /\/telemetry\//i,
  /\/tracking\//i,
  /\/pixel\.png/i,
  /\/pixel\.gif/i,
  /\/collect\?v=/i,
  /\/event\?.*type=track/i,
];

export class AdBlockEngine {
  private stats: AdBlockStats = {
    totalBlocked: 0,
    sessionBlocked: 0,
    perTab: {},
  };

  /** Callback fired whenever stats update */
  public onStatsUpdated: ((stats: AdBlockStats) => void) | null = null;

  async initialize(): Promise<void> {
    console.log('[AdBlock] Native TypeScript Ad & Tracker Blocker initialized');
  }

  /**
   * Enable network-level ad/tracker blocking on an Electron session.
   */
  enableOnSession(targetSession: Session): void {
    targetSession.webRequest.onBeforeRequest(
      { urls: ['*://*/*'] },
      (details, callback) => {
        const urlStr = details.url;

        // 1. NEVER block main frame navigations (user opened website)
        if (details.resourceType === 'mainFrame') {
          const cleanedUrl = stripTrackingParams(urlStr);
          if (cleanedUrl !== urlStr) {
            callback({ redirectURL: cleanedUrl });
            return;
          }
          callback({});
          return;
        }

        // 2. Check if host or URL matches ad/tracker list
        try {
          const parsed = new URL(urlStr);
          const host = parsed.hostname.toLowerCase();

          const isAdHost = AD_DOMAINS.has(host) || Array.from(AD_DOMAINS).some((domain) => host.endsWith('.' + domain));
          const isAdPath = AD_PATTERNS.some((pattern) => pattern.test(parsed.pathname + parsed.search));

          if (isAdHost || isAdPath) {
            this.stats.totalBlocked++;
            this.stats.sessionBlocked++;
            const tabKey = String(details.webContentsId ?? 'unknown');
            this.stats.perTab[tabKey] = (this.stats.perTab[tabKey] ?? 0) + 1;
            this.onStatsUpdated?.(this.getStats());

            callback({ cancel: true });
            return;
          }
        } catch {
          // Ignore invalid URLs
        }

        callback({});
      }
    );

    console.log('[AdBlock] Network ad/tracker blocking active on session');
  }

  /**
   * Disable ad-blocking on a session.
   */
  disableOnSession(targetSession: Session): void {
    targetSession.webRequest.onBeforeRequest(null);
    console.log('[AdBlock] Blocking disabled on session');
  }

  /**
   * Get current ad-block statistics.
   */
  getStats(): AdBlockStats {
    return { ...this.stats, perTab: { ...this.stats.perTab } };
  }

  mapTabId(webContentsId: number, tabId: string): void {
    const wcKey = String(webContentsId);
    if (this.stats.perTab[wcKey]) {
      this.stats.perTab[tabId] = (this.stats.perTab[tabId] ?? 0) + this.stats.perTab[wcKey];
      delete this.stats.perTab[wcKey];
    }
  }
}
