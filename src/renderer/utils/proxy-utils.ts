/**
 * Muthu Browser — Frontend Embed Proxy Utilities
 * Pure browser-compatible helper functions with ZERO Node.js dependencies.
 */

export const EMBED_PROXY_PREFIX = '/__muthu_proxy__/';

/** Convert a real URL into a same-origin proxy path */
export function toEmbedProxyUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return `${EMBED_PROXY_PREFIX}${u.protocol.replace(':', '')}/${u.host}${u.pathname}${u.search}`;
  } catch {
    return rawUrl;
  }
}
