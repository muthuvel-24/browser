/**
 * Vite middleware that reverse-proxies external sites for in-tab <iframe> use.
 * Strips frame-ancestors / X-Frame-Options so sites like chatgpt.com, github.com,
 * and claude.ai can render inside the standalone web preview (localhost Vite server).
 */
import type { Plugin, Connect } from 'vite';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

export const EMBED_PROXY_PREFIX = '/__muthu_proxy__/';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'content-encoding',
  'content-length',
  'content-security-policy',
  'content-security-policy-report-only',
  'x-frame-options',
  'x-content-type-options',
]);

/** Convert a real URL into a same-origin proxy path */
export function toEmbedProxyUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return `${EMBED_PROXY_PREFIX}${u.protocol.replace(':', '')}/${u.host}${u.pathname}${u.search}`;
  } catch {
    return rawUrl;
  }
}

/** Parse /__muthu_proxy__/https/host/path → https://host/path */
function parseProxyTarget(reqUrl: string): URL | null {
  if (!reqUrl.startsWith(EMBED_PROXY_PREFIX)) return null;
  const rest = reqUrl.slice(EMBED_PROXY_PREFIX.length);
  // Match http or https
  const match = rest.match(/^(https?)\/([^/?#]+)([^?#]*)(\?[^#]*)?/);
  if (!match) return null;
  const [, protocol, host, pathname, search = ''] = match;
  try {
    return new URL(`${protocol}://${host}${pathname || '/'}${search}`);
  } catch {
    return null;
  }
}

function rewriteHtml(html: string, target: URL): string {
  const proxyBase = toEmbedProxyUrl(`${target.origin}/`);
  const origin = target.origin;

  // Force relative resolution through our proxy
  let out = html.replace(/<head([^>]*)>/i, `<head$1><base href="${proxyBase}">`);

  // Rewrite absolute same-origin URLs that appear in common attributes
  out = out.replace(
    /(\b(?:href|src|action)=["'])https?:\/\/[^"']+/gi,
    (full, prefix: string) => {
      const absolute = full.slice(prefix.length);
      try {
        const u = new URL(absolute);
        if (u.origin === origin) return prefix + toEmbedProxyUrl(absolute);
      } catch {
        /* keep original */
      }
      return full;
    }
  );

  // Inject fetch/XHR rewrite so SPA API calls stay on the proxy
  const bridge = `<script>(function(){
  var PREFIX=${JSON.stringify(EMBED_PROXY_PREFIX)};
  var ORIGIN=${JSON.stringify(origin)};
  function proxify(u){
    try{
      var x=new URL(String(u), ORIGIN);
      if(x.origin!==ORIGIN) return u;
      return PREFIX+x.protocol.replace(':','')+'/'+x.host+x.pathname+x.search;
    }catch(e){ return u; }
  }
  var of=window.fetch;
  window.fetch=function(input, init){
    if(typeof input==='string') input=proxify(input);
    else if(input && typeof Request!=='undefined' && input instanceof Request)
      input=new Request(proxify(input.url), input);
    return of.call(this, input, init);
  };
  var XO=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(method, url){
    var args=Array.prototype.slice.call(arguments);
    if(typeof url==='string') args[1]=proxify(url);
    return XO.apply(this, args);
  };
})();</script>`;

  out = out.replace(/<head([^>]*)>/i, `<head$1>${bridge}`);
  return out;
}

function proxyRequest(req: Connect.IncomingMessage, res: http.ServerResponse, target: URL): void {
  const client = target.protocol === 'https:' ? https : http;
  const headers: Record<string, string | string[] | undefined> = { ...req.headers };
  headers.host = target.host;
  headers.origin = target.origin;
  headers.referer = target.origin + '/';
  headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  delete headers['accept-encoding']; // simplify body handling

  const upstream = client.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: target.pathname + target.search,
      method: req.method,
      headers,
    },
    (upRes) => {
      // Follow redirects through the proxy
      if (upRes.statusCode && upRes.statusCode >= 300 && upRes.statusCode < 400 && upRes.headers.location) {
        const next = new URL(upRes.headers.location, target).href;
        res.statusCode = upRes.statusCode;
        res.setHeader('Location', toEmbedProxyUrl(next));
        res.end();
        upRes.resume();
        return;
      }

      res.statusCode = upRes.statusCode || 502;
      for (const [key, value] of Object.entries(upRes.headers)) {
        if (value == null) continue;
        if (HOP_BY_HOP.has(key.toLowerCase())) continue;
        res.setHeader(key, value);
      }
      // Explicitly allow embedding in our localhost UI
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Security-Policy', "frame-ancestors *");
      res.removeHeader('X-Frame-Options');

      const contentType = String(upRes.headers['content-type'] || '');
      if (contentType.includes('text/html')) {
        const chunks: Buffer[] = [];
        upRes.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        upRes.on('end', () => {
          const html = Buffer.concat(chunks).toString('utf8');
          const rewritten = rewriteHtml(html, target);
          res.setHeader('Content-Length', Buffer.byteLength(rewritten));
          res.end(rewritten);
        });
        return;
      }

      upRes.pipe(res);
    }
  );

  upstream.on('error', (err) => {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`Muthu embed proxy error: ${err.message}`);
  });

  req.pipe(upstream);
}

export function muthuEmbedProxyPlugin(): Plugin {
  return {
    name: 'muthu-embed-proxy',
    configureServer(server) {
      // Return middleware function from configureServer so it runs BEFORE Vite internal HTML fallback!
      return () => {
        server.middlewares.use((req, res, next) => {
          if (!req.url || !req.url.startsWith(EMBED_PROXY_PREFIX)) {
            next();
            return;
          }
          const target = parseProxyTarget(req.url);
          if (!target) {
            res.statusCode = 400;
            res.end('Invalid embed proxy URL');
            return;
          }
          proxyRequest(req, res, target);
        });
      };
    },
  };
}
