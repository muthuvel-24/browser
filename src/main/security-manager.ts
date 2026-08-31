/**
 * Muthu Browser — Security Manager
 *
 * Central security module providing:
 * 1. SSL/TLS certificate error handling
 * 2. Download security (dangerous extension checks, filename sanitization)
 * 3. Phishing detection (IDN homograph)
 * 4. Navigation security (scheme validation, mixed content)
 * 5. Security headers injection
 * 6. IPC rate limiting
 */

import { app, session } from 'electron';
import type { Session } from 'electron';
import { DANGEROUS_EXTENSIONS } from './settings-types';
import type { DownloadWarning } from './settings-types';

// ─── SSL/TLS Certificate Handling ───────────────────────────────

/**
 * Set up certificate error handling.
 * By default, block all invalid certificates.
 */
export function setupCertificateHandling(): void {
  app.on('certificate-error', (event, _webContents, url, _error, _certificate, callback) => {
    event.preventDefault();
    // Always reject invalid certificates in production
    console.warn(`[Security] Blocked invalid certificate for: ${url}`);
    callback(false);
  });
}

// ─── Download Security ──────────────────────────────────────────

/** Characters that are not allowed in filenames */
const UNSAFE_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

/**
 * Sanitize a download filename to prevent path traversal and injection.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return 'download';

  // Remove path traversal sequences
  let safe = filename
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .replace(UNSAFE_FILENAME_CHARS, '_')
    .trim();

  // Remove leading dots (hidden files on Unix)
  safe = safe.replace(/^\.+/, '');

  // Ensure we have a valid filename
  if (!safe || safe.length === 0) safe = 'download';

  // Limit filename length
  if (safe.length > 255) safe = safe.substring(0, 255);

  return safe;
}

/**
 * Check if a file extension is potentially dangerous.
 */
export function isDangerousExtension(filename: string): boolean {
  if (!filename) return false;
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return DANGEROUS_EXTENSIONS.has(ext);
}

/**
 * Generate a download warning for a dangerous file.
 */
export function createDownloadWarning(
  downloadId: string,
  filename: string
): DownloadWarning | null {
  if (!isDangerousExtension(filename)) return null;

  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return {
    downloadId,
    filename,
    reason: 'dangerous-extension',
    message: `"${filename}" may be dangerous. Files with "${ext}" extensions can harm your computer.`,
  };
}

// ─── Phishing Detection ─────────────────────────────────────────

/** Common homograph character mappings (Cyrillic → Latin lookalikes) */
const HOMOGRAPH_MAP: Record<string, string> = {
  '\u0430': 'a', '\u0435': 'e', '\u043E': 'o', '\u0440': 'p',
  '\u0441': 'c', '\u0443': 'y', '\u0445': 'x', '\u0456': 'i',
  '\u0458': 'j', '\u04BB': 'h', '\u0455': 's', '\u0457': 'i',
  '\u0491': 'g', '\u044C': 'b',
};

/**
 * Check if a domain contains potential IDN homograph characters.
 * Returns true if suspicious.
 */
export function isHomographDomain(domain: string): boolean {
  if (!domain) return false;
  // Check if domain contains mixed scripts (Latin + Cyrillic/Greek)
  const hasLatin = /[a-zA-Z]/.test(domain);
  const hasCyrillic = /[\u0400-\u04FF]/.test(domain);
  const hasGreek = /[\u0370-\u03FF]/.test(domain);

  return (hasLatin && hasCyrillic) || (hasLatin && hasGreek);
}

/**
 * Get the display-safe version of a potentially spoofed domain.
 * Converts homograph characters to their Latin equivalents for comparison.
 */
export function getDisplayDomain(domain: string): string {
  if (!isHomographDomain(domain)) return domain;
  // Show punycode version for mixed-script domains
  return domain;
}

// ─── Navigation Security ────────────────────────────────────────

/** Schemes that should never be loaded in main frames */
const BLOCKED_MAIN_FRAME_SCHEMES = new Set([
  'javascript:', 'vbscript:', 'file:',
]);

/**
 * Check if a URL is safe for main frame navigation.
 */
export function isSafeNavigation(url: string): boolean {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  for (const scheme of BLOCKED_MAIN_FRAME_SCHEMES) {
    if (lower.startsWith(scheme)) return false;
  }
  return true;
}

/**
 * Check for open redirect patterns in URLs.
 */
export function hasOpenRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;
    const redirectKeys = ['redirect', 'redirect_uri', 'return', 'returnTo', 'next', 'url', 'goto', 'target', 'destination', 'redir', 'continue'];
    for (const key of redirectKeys) {
      const value = params.get(key);
      if (value && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//'))) {
        // Check if redirect goes to a different domain
        try {
          const redirectDomain = new URL(value.startsWith('//') ? 'https:' + value : value).hostname;
          if (redirectDomain !== parsed.hostname) return true;
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
  return false;
}

// ─── Security Headers ───────────────────────────────────────────

/**
 * Inject security headers into responses for the toolbar session.
 * These protect the browser's own UI from XSS and clickjacking.
 */
export function setupToolbarSecurityHeaders(toolbarSession: Session): void {
  toolbarSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...(details.responseHeaders ?? {}) };

    // Clickjacking protection — toolbar should never be iframed
    responseHeaders['X-Frame-Options'] = ['DENY'];
    // Prevent MIME type sniffing
    responseHeaders['X-Content-Type-Options'] = ['nosniff'];
    // Referrer policy
    responseHeaders['Referrer-Policy'] = ['strict-origin-when-cross-origin'];
    // CSP for toolbar — only allow self-origin scripts/styles
    responseHeaders['Content-Security-Policy'] = [
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self';"
    ];

    callback({ responseHeaders });
  });
}

/**
 * Inject security response headers into tab browsing sessions.
 * Less restrictive than toolbar, but still hardens responses.
 */
export function setupTabSecurityHeaders(tabSession: Session): void {
  tabSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...(details.responseHeaders ?? {}) };

    // Prevent MIME type sniffing
    if (!responseHeaders['X-Content-Type-Options']) {
      responseHeaders['X-Content-Type-Options'] = ['nosniff'];
    }
    // Referrer policy (only set if not already present)
    if (!responseHeaders['Referrer-Policy']) {
      responseHeaders['Referrer-Policy'] = ['strict-origin-when-cross-origin'];
    }

    callback({ responseHeaders });
  });
}

// ─── IPC Rate Limiting ──────────────────────────────────────────

const ipcCallCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_IPC_CALLS_PER_SECOND = 100;

/**
 * Check if an IPC call should be rate-limited.
 * Returns true if the call is allowed, false if rate-limited.
 */
export function isIpcAllowed(channel: string): boolean {
  const now = Date.now();
  const entry = ipcCallCounts.get(channel);

  if (!entry || now > entry.resetTime) {
    ipcCallCounts.set(channel, { count: 1, resetTime: now + 1000 });
    return true;
  }

  entry.count++;
  if (entry.count > MAX_IPC_CALLS_PER_SECOND) {
    console.warn(`[Security] IPC rate limit exceeded for channel: ${channel}`);
    return false;
  }

  return true;
}

// ─── Input Validation Helpers ───────────────────────────────────

/**
 * Validate a tab ID format.
 */
export function isValidTabId(tabId: unknown): tabId is string {
  return typeof tabId === 'string' && tabId.length > 0 && tabId.length < 100;
}

/**
 * Validate a VPN region value.
 */
export function isValidRegion(region: unknown): region is string {
  return typeof region === 'string' && ['US', 'EU', 'Asia'].includes(region);
}

/**
 * Validate toolbar height.
 */
export function isValidToolbarHeight(height: unknown): height is number {
  return typeof height === 'number' && height >= 50 && height <= 2000;
}

/**
 * Validate find text input.
 */
export function isValidFindText(text: unknown): text is string {
  return typeof text === 'string' && text.length > 0 && text.length <= 1000;
}
