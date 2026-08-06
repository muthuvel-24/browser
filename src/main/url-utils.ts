/**
 * Muthu Browser — URL Utilities
 *
 * Handles URL normalization (bare domains, search queries, brand shortcuts)
 * and tracking parameter stripping for privacy.
 */

// ─── Tracking Parameters ────────────────────────────────────────

/** Set of known tracking query parameter prefixes/names */
const TRACKING_PARAMS = new Set([
  // Google Analytics / Ads
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
  'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',
  '_ga', '_gl', '_gac',

  // Facebook / Meta
  'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_ref', 'fb_source',

  // Microsoft / Bing
  'msclkid',

  // Twitter / X
  'twclid',

  // Instagram
  'igshid', 'ig_mid', 'ig_rid',

  // Mailchimp / Email
  'mc_cid', 'mc_eid',

  // HubSpot
  'hsa_cam', 'hsa_grp', 'hsa_mt', 'hsa_src', 'hsa_ad', 'hsa_acc',
  'hsa_net', 'hsa_ver', 'hsa_la', 'hsa_ol', 'hsa_kw',
  '_hsenc', '_hsmi', '__hssc', '__hstc', '__hsfp',

  // Adobe / Marketo / Misc
  'mkt_tok', 'trk', 'trkCampaign', 'trkInfo',
  'epik',       // Pinterest
  'si',         // Spotify
  'igsh',       // Instagram stories
  'ref',        // Generic referrer tracking
  's_kwcid',    // Adobe Advertising Cloud
  'ef_id',      // Adobe
]);

/**
 * Strips known tracking query parameters from a URL.
 * Preserves the rest of the URL intact.
 *
 * @param urlString - The full URL to sanitize
 * @returns The URL with tracking params removed
 */
export function stripTrackingParams(urlString: string): string {
  try {
    const url = new URL(urlString);

    // Collect params to delete (can't mutate while iterating)
    const paramsToRemove: string[] = [];
    for (const key of url.searchParams.keys()) {
      const lowerKey = key.toLowerCase();
      if (TRACKING_PARAMS.has(lowerKey) || lowerKey.startsWith('utm_')) {
        paramsToRemove.push(key);
      }
    }

    for (const key of paramsToRemove) {
      url.searchParams.delete(key);
    }

    return url.toString();
  } catch {
    // If URL is malformed, return as-is
    return urlString;
  }
}

// ─── URL Normalization & Brand Shortcuts ────────────────────────

/** Pattern to detect if input looks like a URL with domain extension */
const URL_PATTERN = /^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/;

/** Default search engine template */
const SEARCH_ENGINE_URL = 'https://www.google.com/search?q=';

/** Explicit domain mappings for popular keywords */
const KEYWORD_DOMAINS: Record<string, string> = {
  'amazon': 'https://www.amazon.com',
  'amazon.in': 'https://www.amazon.in',
  'flipkart': 'https://www.flipkart.com',
  'claude': 'https://claude.ai',
  'claude.ai': 'https://claude.ai',
  'chatgpt': 'https://chatgpt.com',
  'youtube': 'https://www.youtube.com',
  'google': 'https://www.google.com',
  'github': 'https://github.com',
  'wikipedia': 'https://www.wikipedia.org',
  'reddit': 'https://www.reddit.com',
  'facebook': 'https://www.facebook.com',
  'instagram': 'https://www.instagram.com',
  'twitter': 'https://twitter.com',
  'x': 'https://x.com',
  'linkedin': 'https://www.linkedin.com',
  'netflix': 'https://www.netflix.com',
  'spotify': 'https://open.spotify.com',
  'whatsapp': 'https://web.whatsapp.com',
  'gmail': 'https://mail.google.com',
  'yahoo': 'https://www.yahoo.com',
  'bing': 'https://www.bing.com',
  'duckduckgo': 'https://duckduckgo.com',
  'ebay': 'https://www.ebay.com',
};

/**
 * Normalizes user input from the address bar into a valid URL.
 *
 * - Handles explicit protocols (https://, http://)
 * - Resolves direct brand keywords (e.g., "amazon" → "https://www.amazon.com")
 * - Handles bare domains (e.g., "amazon.in", "github.com")
 * - Single words without spaces resolve to https://www.[word].com
 * - Inputs with spaces are treated as Google searches
 *
 * @param input - Raw address bar input
 * @returns A fully-qualified URL
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return 'about:blank';

  const lower = trimmed.toLowerCase();

  // 1. Explicit keyword match (e.g., "amazon", "claude")
  if (KEYWORD_DOMAINS[lower]) {
    return KEYWORD_DOMAINS[lower];
  }

  // 2. Already has a protocol (http://, https://, file://)
  if (/^https?:\/\//i.test(trimmed) || /^file:\/\//i.test(trimmed)) {
    return stripTrackingParams(trimmed);
  }

  // 3. Domain with TLD extension (e.g. "amazon.in", "github.com", "sub.domain.co.uk")
  if (URL_PATTERN.test(trimmed) || /^[\w-]+\.(ai|com|org|net|io|co|in|dev|tech|app|edu|gov)$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // 4. Localhost with optional port
  if (/^localhost(:\d+)?(\/\S*)?$/i.test(trimmed)) {
    return `http://${trimmed}`;
  }

  // 5. Single word with no spaces (e.g., "mybrand" → "https://www.mybrand.com")
  if (/^[a-zA-Z0-9-]+$/.test(trimmed)) {
    return `https://www.${lower}.com`;
  }

  // 6. Treat multi-word or special input as a Google Search query
  return `${SEARCH_ENGINE_URL}${encodeURIComponent(trimmed)}`;
}
