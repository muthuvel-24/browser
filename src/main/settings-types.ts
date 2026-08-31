/**
 * Muthu Browser — Settings Type Definitions
 *
 * Shared interfaces for user-configurable browser settings,
 * data clearing options, and download security warnings.
 */

// ─── Search Engine ──────────────────────────────────────────────
export type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'yahoo';

export const SEARCH_ENGINE_URLS: Record<SearchEngine, string> = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  yahoo: 'https://search.yahoo.com/search?p=',
};

// ─── Startup Behavior ───────────────────────────────────────────
export type StartupBehavior = 'newTab' | 'lastSession' | 'homepage';

// ─── Theme ──────────────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light' | 'system';

// ─── Font Size ──────────────────────────────────────────────────
export type FontSize = 'small' | 'medium' | 'large';

// ─── VPN Region (re-export from types.ts) ───────────────────────
export type SettingsVpnRegion = 'US' | 'EU' | 'Asia';

// ─── Browser Settings Interface ─────────────────────────────────

export interface BrowserSettings {
  // ── General ─────────────────────────────────────────────────
  /** Default search engine for omnibox queries */
  searchEngine: SearchEngine;
  /** Homepage URL (used when startupBehavior is 'homepage') */
  homepage: string;
  /** What to show when the browser starts */
  startupBehavior: StartupBehavior;

  // ── Appearance ──────────────────────────────────────────────
  /** UI color theme */
  theme: ThemeMode;
  /** Text size preference */
  fontSize: FontSize;
  /** Page zoom level (percentage: 25–500) */
  zoomLevel: number;

  // ── Privacy & Security ──────────────────────────────────────
  /** Upgrade HTTP navigations to HTTPS when possible */
  httpsOnlyMode: boolean;
  /** Enable safe browsing / phishing detection */
  safeBrowsing: boolean;
  /** Block third-party (cross-site) cookies */
  blockThirdPartyCookies: boolean;
  /** Send Do Not Track header with requests */
  doNotTrack: boolean;
  /** Clear cookies when browser exits */
  clearCookiesOnExit: boolean;
  /** Clear browsing history on exit */
  clearHistoryOnExit: boolean;
  /** Clear cache on exit */
  clearCacheOnExit: boolean;
  /** Reduce browser fingerprinting surface */
  fingerprintProtection: boolean;

  // ── Ad Blocker ──────────────────────────────────────────────
  /** Master toggle for the ad/tracker blocker */
  adBlockerEnabled: boolean;
  /** Domains excluded from ad blocking */
  adBlockerWhitelist: string[];

  // ── Downloads ───────────────────────────────────────────────
  /** Default save directory for downloads */
  downloadPath: string;
  /** Prompt user to choose location for each download */
  askBeforeDownload: boolean;
  /** Warn before downloading potentially dangerous files */
  warnDangerousDownloads: boolean;

  // ── Content ─────────────────────────────────────────────────
  /** Block popup windows */
  blockPopups: boolean;
  /** Block media autoplay */
  blockAutoplay: boolean;
  /** Allow JavaScript execution on pages */
  enableJavascript: boolean;

  // ── VPN ─────────────────────────────────────────────────────
  /** Auto-connect VPN on browser startup */
  vpnAutoConnect: boolean;
  /** Default VPN region */
  vpnDefaultRegion: SettingsVpnRegion;
}

// ─── Default Settings ───────────────────────────────────────────

export const DEFAULT_SETTINGS: BrowserSettings = {
  // General
  searchEngine: 'google',
  homepage: 'speeddial',
  startupBehavior: 'newTab',

  // Appearance
  theme: 'dark',
  fontSize: 'medium',
  zoomLevel: 100,

  // Privacy & Security
  httpsOnlyMode: true,
  safeBrowsing: true,
  blockThirdPartyCookies: false,
  doNotTrack: true,
  clearCookiesOnExit: false,
  clearHistoryOnExit: false,
  clearCacheOnExit: false,
  fingerprintProtection: true,

  // Ad Blocker
  adBlockerEnabled: true,
  adBlockerWhitelist: [],

  // Downloads
  downloadPath: '',  // Will be resolved to app.getPath('downloads') at runtime
  askBeforeDownload: true,
  warnDangerousDownloads: true,

  // Content
  blockPopups: true,
  blockAutoplay: false,
  enableJavascript: true,

  // VPN
  vpnAutoConnect: false,
  vpnDefaultRegion: 'US',
};

// ─── Clear Browsing Data Options ────────────────────────────────

export interface ClearDataOptions {
  /** Clear all cookies */
  cookies: boolean;
  /** Clear disk/memory cache */
  cache: boolean;
  /** Clear localStorage and sessionStorage */
  localStorage: boolean;
  /** Clear IndexedDB databases */
  indexedDB: boolean;
  /** Clear Service Worker registrations */
  serviceWorkers: boolean;
}

// ─── Download Security ──────────────────────────────────────────

export type DownloadWarningReason = 'dangerous-extension' | 'suspicious-url' | 'large-file';

export interface DownloadWarning {
  downloadId: string;
  filename: string;
  reason: DownloadWarningReason;
  message: string;
}

/** File extensions considered potentially dangerous */
export const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.ps1', '.vbs', '.vbe', '.js', '.jse',
  '.wsf', '.wsh', '.msi', '.msp', '.mst', '.scr', '.dll', '.com',
  '.pif', '.hta', '.cpl', '.inf', '.reg', '.rgs', '.sct', '.shb',
  '.sys', '.jar', '.app', '.action', '.command', '.workflow',
  '.sh', '.csh', '.ksh', '.out', '.run', '.bin',
]);
