/**
 * Muthu Browser — Public Suffix List (PSL) Aware Domain Classifier
 *
 * Accurately parses hostnames into:
 * - hostname (e.g. 'news.example.co.uk')
 * - registrableDomain / base domain (e.g. 'example.co.uk')
 * - publicSuffix / TLD (e.g. 'co.uk')
 * - isIp / isLocalhost
 *
 * Replaces naive last-two-labels logic to avoid treating 'co.uk' or 'com.au'
 * as a single website domain.
 */

// Comprehensive set of common multi-part public suffixes across major ccTLDs
const KNOWN_MULTI_PART_SUFFIXES = new Set([
  // United Kingdom
  'co.uk', 'org.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'net.uk', 'sch.uk', 'ac.uk', 'gov.uk', 'nhs.uk', 'police.uk',
  // Australia
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'id.au', 'asn.au',
  // India
  'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in', 'ind.in', 'nic.in', 'ac.in', 'edu.in', 'res.in', 'gov.in', 'mil.in',
  // Japan
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'ed.jp', 'go.jp', 'gr.jp', 'lg.jp',
  // New Zealand
  'co.nz', 'net.nz', 'org.nz', 'govt.nz', 'ac.nz', 'geek.nz', 'gen.nz', 'school.nz',
  // Brazil
  'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br', 'art.br', 'esp.br',
  // Canada
  'gc.ca', 'ab.ca', 'bc.ca', 'mb.ca', 'nb.ca', 'nl.ca', 'ns.ca', 'nt.ca', 'nu.ca', 'on.ca', 'pe.ca', 'qc.ca', 'sk.ca', 'yk.ca',
  // China
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn', 'ac.cn', 'ah.cn', 'bj.cn',
  // South Africa
  'co.za', 'net.za', 'org.za', 'gov.za', 'ac.za', 'edu.za',
  // Singapore
  'com.sg', 'net.sg', 'org.sg', 'gov.sg', 'edu.sg', 'per.sg',
  // Mexico
  'com.mx', 'net.mx', 'org.mx', 'edu.mx', 'gob.mx',
  // France
  'asso.fr', 'nom.fr', 'prd.fr', 'presse.fr', 'tm.fr', 'com.fr',
  // Germany
  'co.de', 'com.de',
  // Hong Kong
  'com.hk', 'net.hk', 'org.hk', 'gov.hk', 'edu.hk', 'idv.hk',
  // Russia
  'com.ru', 'net.ru', 'org.ru', 'pp.ru',
  // Turkey
  'com.tr', 'net.tr', 'org.tr', 'edu.tr', 'gov.tr', 'k12.tr', 'av.tr', 'dr.tr',
  // Indonesia
  'co.id', 'net.id', 'org.id', 'ac.id', 'sch.id', 'go.id', 'mil.id', 'web.id', 'my.id',
  // South Korea
  'co.kr', 'ne.kr', 'or.kr', 're.kr', 'pe.kr', 'go.kr', 'mil.kr', 'ac.kr', 'hs.kr', 'ms.kr', 'es.kr',
  // Israel
  'co.il', 'net.il', 'org.il', 'ac.il', 'gov.il', 'muni.il', 'idf.il',
  // Other popular multi-part extensions
  'appspot.com', 'github.io', 'gitlab.io', 'pages.dev', 'vercel.app', 'netlify.app',
]);

export interface ParsedDomain {
  hostname: string;
  registrableDomain: string;
  publicSuffix: string;
  subdomain: string;
  isIp: boolean;
  isLocalhost: boolean;
}

/** Check if string is an IPv4 address */
export function isIpv4(host: string): boolean {
  return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(host);
}

/** Check if string is an IPv6 address */
export function isIpv6(host: string): boolean {
  const clean = host.replace(/^\[|\]$/g, '');
  return clean.includes(':') && /^[0-9a-fA-F:]+$/.test(clean);
}

/**
 * Public Suffix List aware domain parser.
 */
export function parseDomain(rawHostname: string): ParsedDomain {
  if (!rawHostname || typeof rawHostname !== 'string') {
    return {
      hostname: '',
      registrableDomain: '',
      publicSuffix: '',
      subdomain: '',
      isIp: false,
      isLocalhost: false,
    };
  }

  // Clean hostname (strip port, trailing dots, convert to lowercase)
  let cleanHost = rawHostname.trim().toLowerCase();
  cleanHost = cleanHost.replace(/:\d+$/, ''); // strip port
  cleanHost = cleanHost.replace(/\.+$/, '');  // strip trailing dot

  // Handle localhost
  if (cleanHost === 'localhost' || cleanHost.endsWith('.localhost')) {
    return {
      hostname: cleanHost,
      registrableDomain: 'localhost',
      publicSuffix: 'localhost',
      subdomain: cleanHost === 'localhost' ? '' : cleanHost.slice(0, -10),
      isIp: false,
      isLocalhost: true,
    };
  }

  // Handle IP addresses
  if (isIpv4(cleanHost) || isIpv6(cleanHost)) {
    return {
      hostname: cleanHost,
      registrableDomain: cleanHost,
      publicSuffix: '',
      subdomain: '',
      isIp: true,
      isLocalhost: cleanHost === '127.0.0.1' || cleanHost === '::1',
    };
  }

  const parts = cleanHost.split('.').filter(Boolean);
  if (parts.length <= 1) {
    return {
      hostname: cleanHost,
      registrableDomain: cleanHost,
      publicSuffix: cleanHost,
      subdomain: '',
      isIp: false,
      isLocalhost: false,
    };
  }

  // Check 3-part suffix first (e.g. if any like 'sch.uk' etc)
  let matchedSuffix = '';
  if (parts.length >= 3) {
    const candidate3 = parts.slice(-3).join('.');
    if (KNOWN_MULTI_PART_SUFFIXES.has(candidate3)) {
      matchedSuffix = candidate3;
    }
  }

  // Check 2-part suffix (e.g. 'co.uk', 'com.au')
  if (!matchedSuffix && parts.length >= 2) {
    const candidate2 = parts.slice(-2).join('.');
    if (KNOWN_MULTI_PART_SUFFIXES.has(candidate2)) {
      matchedSuffix = candidate2;
    }
  }

  // Fallback to single TLD
  if (!matchedSuffix) {
    matchedSuffix = parts[parts.length - 1];
  }

  const suffixParts = matchedSuffix.split('.');
  const suffixLen = suffixParts.length;

  if (parts.length <= suffixLen) {
    return {
      hostname: cleanHost,
      registrableDomain: cleanHost,
      publicSuffix: matchedSuffix,
      subdomain: '',
      isIp: false,
      isLocalhost: false,
    };
  }

  // The registrable domain is the label right before the suffix + the suffix
  const domainLabel = parts[parts.length - suffixLen - 1];
  const registrableDomain = `${domainLabel}.${matchedSuffix}`;
  const subdomain = parts.slice(0, parts.length - suffixLen - 1).join('.');

  return {
    hostname: cleanHost,
    registrableDomain,
    publicSuffix: matchedSuffix,
    subdomain,
    isIp: false,
    isLocalhost: false,
  };
}

/**
 * Get the registrable base domain for a given hostname or URL.
 */
export function getBaseDomain(input: string): string {
  try {
    if (!input) return '';
    let host = input;
    if (input.includes('://')) {
      host = new URL(input).hostname;
    } else if (input.includes('/')) {
      host = input.split('/')[0];
    }
    return parseDomain(host).registrableDomain;
  } catch {
    return parseDomain(input).registrableDomain;
  }
}
