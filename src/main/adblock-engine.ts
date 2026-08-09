/**
 * Muthu Browser — Ad & Tracker Blocking Engine
 *
 * Uses @ghostery/adblocker-electron for network-level ad/tracker blocking.
 * - Loads prebuilt EasyList + EasyPrivacy filter lists
 * - Caches compiled engine to disk for instant startup
 * - Tracks per-tab and session-wide blocking statistics
 * - Strips tracking query parameters from outbound requests
 */

import { app, type Session } from 'electron';
import { ElectronBlocker, fromElectronDetails } from '@ghostery/adblocker-electron';
import fetch from 'cross-fetch';
import { promises as fs } from 'fs';
import path from 'path';
import { stripTrackingParams } from './url-utils';
import type { AdBlockStats } from './types';

/** How often to refresh filter lists from remote (24 hours) */
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Path to the serialized engine binary on disk */
const getCachePath = () => path.join(app.getPath('userData'), 'adblock-engine.bin');

export class AdBlockEngine {
  private blocker: ElectronBlocker | null = null;
  private stats: AdBlockStats = {
    totalBlocked: 0,
    sessionBlocked: 0,
    perTab: {},
  };

  /** Callback fired whenever stats are updated */
  public onStatsUpdated: ((stats: AdBlockStats) => void) | null = null;

  /**
   * Initialize the ad-blocking engine.
   * Attempts to load a cached engine from disk first;
   * falls back to downloading fresh filter lists.
   */
  async initialize(): Promise<void> {
    const cachePath = getCachePath();

    try {
      // Try loading cached engine binary
      const stat = await fs.stat(cachePath);
      const age = Date.now() - stat.mtimeMs;

      if (age < CACHE_MAX_AGE_MS) {
        const buffer = await fs.readFile(cachePath);
        this.blocker = ElectronBlocker.deserialize(new Uint8Array(buffer));
        console.log('[AdBlock] Loaded engine from cache');
      } else {
        console.log('[AdBlock] Cache is stale, refreshing...');
        await this.downloadAndCache(cachePath);
      }
    } catch {
      // Cache doesn't exist or is corrupt — download fresh
      console.log('[AdBlock] No cache found, downloading filter lists...');
      await this.downloadAndCache(cachePath);
    }

    if (this.blocker) {
      this.attachEventListeners();
    }
  }

  /**
   * Download prebuilt ad + tracking filter lists and cache to disk.
   */
  private async downloadAndCache(cachePath: string): Promise<void> {
    try {
      this.blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
      // Serialize to disk for next startup
      const serialized = this.blocker.serialize();
      await fs.mkdir(path.dirname(cachePath), { recursive: true });
      await fs.writeFile(cachePath, Buffer.from(serialized));
      console.log('[AdBlock] Engine downloaded and cached to disk');
    } catch (err) {
      console.error('[AdBlock] Failed to download filter lists:', err);
    }
  }

  /**
   * Attach event listeners to track blocked requests.
   */
  private attachEventListeners(): void {
    if (!this.blocker) return;

    this.blocker.on('request-blocked', (request: { tabId: number; url: string }) => {
      this.stats.totalBlocked++;
      this.stats.sessionBlocked++;

      // Track per-tab stats using tabId from the request
      const tabKey = String(request.tabId ?? 'unknown');
      this.stats.perTab[tabKey] = (this.stats.perTab[tabKey] ?? 0) + 1;

      this.onStatsUpdated?.(this.getStats());
    });

    this.blocker.on('request-redirected', () => {
      this.stats.totalBlocked++;
      this.stats.sessionBlocked++;
      this.onStatsUpdated?.(this.getStats());
    });
  }

  /**
   * Enable ad-blocking on the given session.
   */
  enableOnSession(targetSession: Session): void {
    if (!this.blocker) {
      console.warn('[AdBlock] Engine not initialized — skipping session');
      return;
    }

    // Enable network-level blocking (request interception + cosmetic filtering)
    try {
      this.blocker.enableBlockingInSession(targetSession);
      console.log('[AdBlock] Full blocking enabled on session (network + cosmetic)');
    } catch (err) {
      console.warn('[AdBlock] Full blocking failed, falling back to network-only:', err);
      // Fallback: manually attach webRequest listeners for network-level blocking
      this.enableNetworkBlocking(targetSession);
    }

  }

  /**
   * Disable ad-blocking on the given session.
   */
  disableOnSession(targetSession: Session): void {
    if (!this.blocker) return;
    this.blocker.disableBlockingInSession(targetSession);
    console.log('[AdBlock] Blocking disabled on session');
  }

  /**
   * Fallback: enable network-level blocking only (no cosmetic filtering).
   * Manually hooks into webRequest to check each request against the engine.
   * Works on all Electron versions without session.registerPreloadScript.
   */
  private enableNetworkBlocking(targetSession: Session): void {
    if (!this.blocker) return;

    const blocker = this.blocker;

    targetSession.webRequest.onBeforeRequest(
      { urls: ['*://*/*'] },
      (details, callback) => {
        // NEVER cancel main frame navigations (e.g. google.com, gemini.google.com, youtube.com)
        if (details.resourceType === 'mainFrame') {
          callback({});
          return;
        }

        const { match } = blocker.match(fromElectronDetails(details));

        if (match) {
          this.stats.totalBlocked++;
          this.stats.sessionBlocked++;
          const tabKey = String(details.webContentsId ?? 'unknown');
          this.stats.perTab[tabKey] = (this.stats.perTab[tabKey] ?? 0) + 1;
          this.onStatsUpdated?.(this.getStats());

          callback({ cancel: true });
          return;
        }

        callback({});
      }
    );

    console.log('[AdBlock] Network-only blocking enabled (fallback mode)');
  }

  /**
   * Install tracking query parameter stripping via webRequest.onBeforeRequest.
   * Runs before the Ghostery engine so both layers are active.
   */
  private installTrackingParamStripping(targetSession: Session): void {
    targetSession.webRequest.onBeforeRequest(
      { urls: ['*://*/*'] },
      (details, callback) => {
        // Only strip params from main navigations and sub-frame navigations
        if (details.resourceType === 'mainFrame' || details.resourceType === 'subFrame') {
          const cleaned = stripTrackingParams(details.url);
          if (cleaned !== details.url) {
            console.log(`[AdBlock] Stripped tracking params: ${details.url} → ${cleaned}`);
            callback({ redirectURL: cleaned });
            return;
          }
        }
        callback({});
      }
    );
  }

  /**
   * Get current blocking statistics.
   */
  getStats(): AdBlockStats {
    return { ...this.stats, perTab: { ...this.stats.perTab } };
  }

  /**
   * Increment the per-tab blocked count for a specific tab ID.
   * Called by the tab manager when a tab's webContents ID is mapped.
   */
  mapTabId(webContentsId: number, tabId: string): void {
    // Transfer any existing stats from webContentsId to tabId
    const wcKey = String(webContentsId);
    if (this.stats.perTab[wcKey]) {
      this.stats.perTab[tabId] = (this.stats.perTab[tabId] ?? 0) + this.stats.perTab[wcKey];
      delete this.stats.perTab[wcKey];
    }
  }
}
