/**
 * Muthu Browser — Public Suffix List (PSL) Aware Domain Classifier
 *
 * Uses the Mozilla Public Suffix List via the industry-standard `tldts` library
 * to accurately parse hostnames into:
 * - hostname (e.g. 'news.example.co.uk')
 * - registrableDomain / base domain (e.g. 'example.co.uk')
 * - publicSuffix / TLD (e.g. 'co.uk')
 * - subdomain (e.g. 'news')
 * - isIp / isLocalhost
 */

import { parse, getDomain } from 'tldts';

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
 * Public Suffix List aware domain parser powered by tldts.
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

  // Handle localhost explicitly
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

  // Handle IP addresses explicitly
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

  const parsed = parse(cleanHost);
  const hostname = parsed.hostname || cleanHost;
  const registrableDomain = parsed.domain || cleanHost;
  const publicSuffix = parsed.publicSuffix || '';
  const subdomain = parsed.subdomain || '';

  return {
    hostname,
    registrableDomain,
    publicSuffix,
    subdomain,
    isIp: Boolean(parsed.isIp),
    isLocalhost: cleanHost === 'localhost' || cleanHost.endsWith('.localhost'),
  };
}

/**
 * Get the registrable base domain for a given hostname or URL.
 */
export function getBaseDomain(input: string): string {
  try {
    if (!input) return '';
    const res = getDomain(input);
    if (res) return res;

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
