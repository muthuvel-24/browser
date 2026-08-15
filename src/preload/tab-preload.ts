/**
 * Muthu Browser — Tab Content Preload Script
 *
 * Runs inside every web page and sub-frame BEFORE any page scripts execute.
 * Responsibilities:
 * 1. Google Sign-In & Bot Detection Bypass (spoof navigator.webdriver, window.chrome, navigator.plugins)
 * 2. Ultra-Fast YouTube Ad Blocker & Ad Skipper (DOM cleaner, instant video ad skipper, anti-adblock modal closer)
 */

import { webFrame } from 'electron';

// ─── 1. Google Sign-In & Browser Environment Spoofing ────────────
const INJECTION_SCRIPT = `
(() => {
  try {
    // 1. Remove automation / webdriver flag
    try {
      delete Object.getPrototypeOf(navigator).webdriver;
    } catch (e) {}
    try {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        set: () => {},
        configurable: true,
        enumerable: true
      });
    } catch (e) {}

    // 2. Provide realistic Chrome runtime object
    try {
      if (!window.chrome) {
        window.chrome = {};
      }
      window.chrome.app = {
        isInstalled: false,
        InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
        RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
        getDetails: function() {},
        getIsInstalled: function() { return false; },
        installState: function() { return 'not_installed'; },
        runningState: function() { return 'cannot_run'; }
      };
      window.chrome.csi = function() {
        return { startE: Date.now(), onloadT: Date.now() + 500, pageT: 500, tran: 15 };
      };
      window.chrome.loadTimes = function() {
        var now = Date.now() / 1000;
        return {
          requestTime: now,
          startLoadTime: now,
          commitLoadTime: now + 0.05,
          finishDocumentLoadTime: now + 0.2,
          finishLoadTime: now + 0.4,
          firstPaintTime: now + 0.15,
          firstPaintAfterLoadTime: 0,
          navigationType: 'Other',
          wasFetchedViaSpdy: true,
          wasNpnNegotiated: true,
          npnNegotiatedProtocol: 'h2',
          wasAlternateProtocolAvailable: false,
          connectionInfo: 'h2'
        };
      };
      window.chrome.runtime = {
        OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
        OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
        PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
        RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', THROTTLED: 'throttled', UPDATE_AVAILABLE: 'update_available' },
        connect: function() { return { disconnect: function() {}, onDisconnect: { addListener: function() {} }, onMessage: { addListener: function() {} }, postMessage: function() {} }; },
        sendMessage: function() {}
      };
    } catch (e) {}

    // 3. Mock Standard Desktop Chrome Plugins
    try {
      var fakePlugins = [
        { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
      ];
      Object.defineProperty(navigator, 'plugins', {
        get: () => fakePlugins,
        configurable: true,
        enumerable: true
      });
    } catch (e) {}

    // 4. Mock Standard Languages
    try {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
        configurable: true,
        enumerable: true
      });
    } catch (e) {}

    // 5. Clean YouTube Player Ads from window.ytInitialPlayerResponse
    if (location.hostname.includes('youtube.com')) {
      var originalDefineProperty = Object.defineProperty;
      var cleanYtResponse = function(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (obj.adPlacements) obj.adPlacements = [];
        if (obj.playerAds) obj.playerAds = [];
        if (obj.adSlots) obj.adSlots = [];
        return obj;
      };

      try {
        var ytResponseValue = undefined;
        Object.defineProperty(window, 'ytInitialPlayerResponse', {
          get: function() { return ytResponseValue; },
          set: function(val) { ytResponseValue = cleanYtResponse(val); },
          configurable: true
        });
      } catch (e) {}
    }
  } catch (err) {}
})();
`;

// Inject into Main World context before website scripts execute
try {
  webFrame.executeJavaScript(INJECTION_SCRIPT);
} catch (e) {}

// ─── 2. YouTube Ad-Shield & Instant Video Ad Skipper ─────────────
if (window.location.hostname.includes('youtube.com')) {
  // Inject CSS to hide all ad elements, banners, and overlays
  const YOUTUBE_AD_CSS = `
    .video-ads,
    .ytp-ad-module,
    .ytp-ad-player-overlay,
    .ytp-ad-player-overlay-layout,
    .ytp-ad-image-overlay,
    .ytp-ad-text-overlay,
    .ytp-ad-overlay-container,
    .ytp-ad-message-container,
    ytd-ad-slot-renderer,
    ytd-banner-promo-renderer,
    ytd-promoted-video-renderer,
    ytd-in-feed-ad-layout-renderer,
    ytd-statement-banner-renderer,
    ytd-display-ad-renderer,
    #player-ads,
    #masthead-ad,
    .ytd-merch-shelf-renderer,
    ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
    ytd-item-section-renderer:has(ytd-ad-slot-renderer),
    ytd-ad-slot-renderer,
    #panels ytd-ad-slot-renderer,
    ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"],
    tp-yt-paper-dialog:has(ytd-mealbar-promo-renderer),
    ytd-popup-container:has(ytd-mealbar-promo-renderer),
    ytd-enforcement-message-view-model {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      height: 0 !important;
      width: 0 !important;
    }
  `;

  const injectStyles = () => {
    try {
      const style = document.createElement('style');
      style.id = 'muthu-yt-adblock';
      style.textContent = YOUTUBE_AD_CSS;
      (document.head || document.documentElement).appendChild(style);
    } catch (e) {}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }

  // Active Ad Skipper Engine: Auto-skips video ads in 0 milliseconds
  const skipAds = () => {
    try {
      const moviePlayer = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      const isAdActive = moviePlayer && (
        moviePlayer.classList.contains('ad-showing') ||
        moviePlayer.classList.contains('ad-interrupting') ||
        document.querySelector('.ytp-ad-player-overlay') !== null ||
        document.querySelector('.ytp-ad-player-overlay-layout') !== null
      );

      const video = (document.querySelector('video.html5-main-video') || document.querySelector('video')) as HTMLVideoElement | null;

      if (isAdActive && video) {
        // Fast-forward video ad to completion instantly
        video.muted = true;
        video.playbackRate = 16.0;
        if (!isNaN(video.duration) && video.duration > 0) {
          video.currentTime = video.duration + 1;
        }
      }

      // Auto-click all known skip buttons instantly
      const skipButtons = [
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-modern',
        '.ytp-skip-ad-button',
        '.ytp-ad-skip-button-container button',
        'button.ytp-ad-skip-button',
        '.ytp-ad-overlay-close-button',
        'tp-yt-paper-dialog #dismiss-button',
        'ytd-enforcement-message-view-model #dismiss-button'
      ];

      for (const selector of skipButtons) {
        const btn = document.querySelector(selector) as HTMLElement | null;
        if (btn) {
          btn.click();
        }
      }
    } catch (e) {}
  };

  // Run skip loop every 50 milliseconds
  setInterval(skipAds, 50);

  // Also hook into DOM mutations for instant response
  const observer = new MutationObserver(() => {
    skipAds();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });
  }
}
