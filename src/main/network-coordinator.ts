/**
 * Muthu Browser — Unified Network Request Coordinator
 *
 * Solves Electron's single-listener limitation for session.webRequest APIs.
 * Electron allows only ONE listener per event per session (onBeforeRequest,
 * onBeforeSendHeaders, onHeadersReceived). Later registrations overwrite earlier ones.
 *
 * This coordinator acts as the single authoritative owner of all webRequest events
 * per session, integrating:
 * 1. Tracking parameter removal on navigations
 * 2. Network-level ad & tracker blocking
 * 3. PSL-aware third-party cookie stripping
 * 4. Per-site privacy rules and whitelists
 * 5. Security response headers (nosniff, referrer-policy)
 * 6. Chrome User-Agent & Client Hints injection
 * 7. Unified telemetry and blocked request statistics
 */

import type { Session, OnBeforeRequestListenerDetails, OnHeadersReceivedListenerDetails, OnBeforeSendHeadersListenerDetails } from 'electron';
import { parseDomain, getBaseDomain } from './domain-utils';
import { stripTrackingParams } from './url-utils';
import type { PrivacyEngine } from './privacy-engine';
import type { AdBlockEngine } from './adblock-engine';
import type { SettingsStore } from './settings-store';

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export class NetworkCoordinator {
  private managedSessions = new WeakSet<Session>();

  constructor(
    private readonly privacyEngine: PrivacyEngine,
    private readonly adBlockEngine: AdBlockEngine,
    private readonly settingsStore?: SettingsStore
  ) {}

  /**
   * Attach the unified coordinator to an Electron session.
   * Ensures exactly one listener is registered for each webRequest event.
   */
  public attachToSession(targetSession: Session, isToolbarSession = false): void {
    if (this.managedSessions.has(targetSession)) return;
    this.managedSessions.add(targetSession);

    // ─── 1. Single Authoritative onBeforeRequest Handler ──────────────
    if (!isToolbarSession) {
      targetSession.webRequest.onBeforeRequest(
        { urls: ['*://*/*'] },
        (details: OnBeforeRequestListenerDetails, callback) => {
          let callbackCalled = false;
          const safeCallback = (response: Electron.CallbackResponse) => {
            if (!callbackCalled) {
              callbackCalled = true;
              callback(response);
            }
          };

          try {
            const urlStr = details.url;

            // Step A: Main frame navigations — strip tracking parameters
            if (details.resourceType === 'mainFrame') {
              const cleanedUrl = stripTrackingParams(urlStr);
              if (cleanedUrl !== urlStr) {
                safeCallback({ redirectURL: cleanedUrl });
                return;
              }
              safeCallback({});
              return;
            }

            // Step B: Sub-resource requests — check per-site shield and whitelist
            let requestUrl: URL;
            try {
              requestUrl = new URL(urlStr);
            } catch {
              safeCallback({});
              return;
            }

            const requestDomainInfo = parseDomain(requestUrl.hostname);
            const requestBase = requestDomainInfo.registrableDomain;

            // Extract top-level domain from details.initiator or referrer
            let topHost = '';
            const initiator = (details as unknown as { initiator?: string }).initiator;
            if (initiator) {
              try { topHost = new URL(initiator).hostname; } catch { /* ignore */ }
            } else if (details.referrer) {
              try { topHost = new URL(details.referrer).hostname; } catch { /* ignore */ }
            }

            const topDomainInfo = parseDomain(topHost);
            const topBase = topDomainInfo.registrableDomain || requestBase;

            // Check if user disabled shield or whitelisted this site
            const siteStats = this.privacyEngine.getSiteStats(topBase);
            if (!siteStats.shieldEnabled || this.adBlockEngine.isDomainWhitelisted(topBase) || this.adBlockEngine.isDomainWhitelisted(requestBase)) {
              safeCallback({});
              return;
            }

            // Step C: Check if URL or host matches ad or tracker filters
            const isAd = this.adBlockEngine.matchesAd(requestUrl.hostname, requestUrl.pathname + requestUrl.search);
            const isTracker = this.privacyEngine.matchesTracker(requestUrl.hostname, requestUrl.pathname + requestUrl.search);
            const isThirdParty = topBase && requestBase && (topBase !== requestBase);

            if (isAd || isTracker) {
              // Record metrics in both engines
              if (isAd) {
                this.adBlockEngine.recordBlocked(details.webContentsId);
                this.privacyEngine.recordAdBlocked(topBase);
              }
              if (isTracker) {
                this.privacyEngine.recordTrackerBlocked(topBase);
              }
              if (isThirdParty) {
                this.privacyEngine.recordThirdPartyBlocked(topBase);
              }

              safeCallback({ cancel: true });
              return;
            }

            safeCallback({});
          } catch (err) {
            console.error('[NetworkCoordinator] Error in onBeforeRequest:', err);
            safeCallback({});
          }
        }
      );
    }

    // ─── 2. Single Authoritative onBeforeSendHeaders Handler ──────────
    targetSession.webRequest.onBeforeSendHeaders((details: OnBeforeSendHeadersListenerDetails, callback) => {
      let callbackCalled = false;
      const safeCallback = (response: Electron.BeforeSendResponse) => {
        if (!callbackCalled) {
          callbackCalled = true;
          callback(response);
        }
      };

      try {
        const requestHeaders = { ...(details.requestHeaders ?? {}) };

        // Set realistic Chrome Desktop User-Agent & Client Hints
        requestHeaders['User-Agent'] = CHROME_UA;
        requestHeaders['sec-ch-ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
        requestHeaders['sec-ch-ua-mobile'] = '?0';
        requestHeaders['sec-ch-ua-platform'] = '"Windows"';
        requestHeaders['sec-ch-ua-arch'] = '"x86"';
        requestHeaders['sec-ch-ua-bitness'] = '"64"';
        requestHeaders['sec-ch-ua-full-version-list'] = '"Google Chrome";v="131.0.6778.205", "Chromium";v="131.0.6778.205", "Not_A Brand";v="24.0.0.0"';

        if (this.settingsStore?.get('doNotTrack')) {
          requestHeaders['DNT'] = '1';
        }

        safeCallback({ requestHeaders });
      } catch (err) {
        console.error('[NetworkCoordinator] Error in onBeforeSendHeaders:', err);
        safeCallback({ requestHeaders: details.requestHeaders });
      }
    });

    // ─── 3. Single Authoritative onHeadersReceived Handler ────────────
    targetSession.webRequest.onHeadersReceived((details: OnHeadersReceivedListenerDetails, callback) => {
      let callbackCalled = false;
      const safeCallback = (response: Electron.HeadersReceivedResponse) => {
        if (!callbackCalled) {
          callbackCalled = true;
          callback(response);
        }
      };

      try {
        const responseHeaders = { ...(details.responseHeaders ?? {}) };

        if (isToolbarSession) {
          // Toolbar UI Security Headers
          responseHeaders['X-Frame-Options'] = ['DENY'];
          responseHeaders['X-Content-Type-Options'] = ['nosniff'];
          responseHeaders['Referrer-Policy'] = ['strict-origin-when-cross-origin'];
          responseHeaders['Content-Security-Policy'] = [
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:*;"
          ];
          safeCallback({ responseHeaders });
          return;
        }

        // Web Browsing Tab Security Headers
        if (!responseHeaders['X-Content-Type-Options']) {
          responseHeaders['X-Content-Type-Options'] = ['nosniff'];
        }
        if (!responseHeaders['Referrer-Policy']) {
          responseHeaders['Referrer-Policy'] = ['strict-origin-when-cross-origin'];
        }

        // Third-party cookie blocking using PSL domain analysis
        if (this.privacyEngine.isBlockThirdPartyCookiesEnabled()) {
          try {
            const requestHost = new URL(details.url).hostname;
            const requestBase = parseDomain(requestHost).registrableDomain;

            let topHost = '';
            const initiator = (details as unknown as { initiator?: string }).initiator;
            if (initiator) {
              try { topHost = new URL(initiator).hostname; } catch { /* ignore */ }
            }
            const topBase = parseDomain(topHost).registrableDomain;

            // If third-party, strip Set-Cookie response header
            if (topBase && requestBase && topBase !== requestBase) {
              const siteStats = this.privacyEngine.getSiteStats(topBase);
              if (siteStats.shieldEnabled) {
                if (responseHeaders['set-cookie'] || responseHeaders['Set-Cookie']) {
                  delete responseHeaders['set-cookie'];
                  delete responseHeaders['Set-Cookie'];
                  this.privacyEngine.recordCookieBlocked(topBase);
                }
              }
            }
          } catch {
            // ignore parsing error
          }
        }

        safeCallback({ responseHeaders });
      } catch (err) {
        console.error('[NetworkCoordinator] Error in onHeadersReceived:', err);
        safeCallback({ responseHeaders: details.responseHeaders });
      }
    });

    console.log(`[NetworkCoordinator] Single coordinated network pipeline active on session (toolbar: ${isToolbarSession})`);
  }
}
