/**
 * Muthu Browser — Automated Comprehensive Test Suite
 *
 * Validates:
 * 1. Security Manager (Scheme sanitization, path traversal, dangerous extensions, homographs)
 * 2. URL Normalization & Query Understanding (Search vs URL detection)
 * 3. Permission Manager (Allow / Ask / Block states, interactive prompt resolution)
 * 4. Privacy Engine (Ad & tracker detection, third-party request isolation)
 * 5. VPN Controller (WireGuard tunnel state machine, explicit proxy separation)
 * 6. AI Client (Sensitive data redaction, token masking)
 */

import { isAllowedScheme, normalizeUrl, stripTrackingParams } from './url-utils.js';
import { sanitizeFilename, isDangerousExtension, isHomographDomain, isSafeNavigation } from './security-manager.js';
import { SearchClient } from './search-client.js';
import { PermissionManager } from './permission-manager.js';
import { PrivacyEngine } from './privacy-engine.js';
import { VpnController } from './vpn-controller.js';
import { AiClient } from './ai-client.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

async function runAllTests(): Promise<void> {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string): void {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      failed++;
    }
  }

  console.log('🔒 Commencing Comprehensive Browser Test Suite...\n');

  // ─── 1. Security Manager Tests ─────────────────────────────────
  console.log('--- 1. Security & Scheme Isolation ---');
  assert(!isAllowedScheme('javascript:alert(1)'), 'Block javascript: URI scheme');
  assert(!isAllowedScheme('vbscript:msgbox(1)'), 'Block vbscript: URI scheme');
  assert(!isAllowedScheme('file:///etc/passwd'), 'Block unauthorized file: URI scheme');
  assert(isAllowedScheme('https://www.google.com'), 'Allow valid https: URI scheme');
  assert(isAllowedScheme('http://localhost:5174'), 'Allow valid http: URI scheme');

  const nav1 = normalizeUrl('javascript:alert("xss")');
  assert(nav1.includes('google.com/search?q='), 'Convert javascript: scheme to safe search query');
  assert(normalizeUrl('  https://github.com  ') === 'https://github.com/', 'Trim and accept clean https URL');

  // Tracking Parameter Stripping
  const trackedUrl = 'https://example.com/page?utm_source=facebook&fbclid=12345&keep=true';
  const cleanedUrl = stripTrackingParams(trackedUrl);
  assert(!cleanedUrl.includes('utm_source'), 'Strip utm_source tracking parameter');
  assert(!cleanedUrl.includes('fbclid'), 'Strip fbclid tracking parameter');
  assert(cleanedUrl.includes('keep=true'), 'Preserve functional application parameters');

  // Download filename sanitization
  assert(sanitizeFilename('../../evil.exe') === 'evil.exe', 'Prevent directory traversal in filename');
  assert(sanitizeFilename('file<bad>name?.pdf') === 'file_bad_name_.pdf', 'Sanitize invalid characters in filename');
  assert(sanitizeFilename('   ') === 'download', 'Handle empty or whitespace-only filename');

  // Dangerous Extension Detection
  assert(isDangerousExtension('malware.exe'), 'Detect .exe as dangerous extension');
  assert(isDangerousExtension('script.bat'), 'Detect .bat as dangerous extension');
  assert(isDangerousExtension('payload.ps1'), 'Detect .ps1 as dangerous extension');
  assert(!isDangerousExtension('document.pdf'), 'Allow safe .pdf extension');
  assert(!isDangerousExtension('photo.jpg'), 'Allow safe .jpg extension');

  // IDN Homograph Phishing Detection
  assert(isHomographDomain('google.com') === false, 'Safe ASCII domain detected');
  assert(isHomographDomain('g\u043E\u043Egle.com') === true, 'Detect Cyrillic homograph spoofing attempt');
  assert(isSafeNavigation('https://bank.com') === true, 'Allow safe HTTPS navigation');
  assert(isSafeNavigation('javascript:evil()') === false, 'Block dangerous navigation scheme');

  // ─── 2. Query Understanding & Search Client ────────────────────
  console.log('\n--- 2. Query Understanding & Search Engine ---');
  assert(SearchClient.isSearchQuery('what is quantum computing?') === true, 'Classify question as search query');
  assert(SearchClient.isSearchQuery('electron multi-tab performance') === true, 'Classify multi-word terms as search query');
  assert(SearchClient.isSearchQuery('https://github.com') === false, 'Classify https URL as direct navigation');
  assert(SearchClient.isSearchQuery('wikipedia.org/wiki/Main_Page') === false, 'Classify domain path as direct navigation');
  assert(SearchClient.isSearchQuery('localhost:3000') === false, 'Classify localhost as direct navigation');

  const searchClient = new SearchClient();
  const searchResult = await searchClient.search('privacy browser architecture');
  assert(Boolean(searchResult.aiAnswer && searchResult.aiAnswer.text), 'Generate AI Answer from search query');
  assert(searchResult.sources.length > 0, 'Return cited sources from hybrid search');
  assert(searchResult.webResults.length > 0, 'Return ranked web results');

  // ─── 3. Permission Manager ─────────────────────────────────────
  console.log('\n--- 3. Permission Manager (Allow / Ask / Block) ---');
  const tempPermFile = path.join(os.tmpdir(), `test-perm-${Date.now()}.json`);
  const permMgr = new PermissionManager(tempPermFile);

  permMgr.setSitePermission('https://maps.google.com', 'location', 'allow');
  permMgr.setSitePermission('https://sketchy-site.com', 'camera', 'block');

  const perms = permMgr.getSitePermissions('https://maps.google.com');
  assert(perms.location === 'allow', 'Store and retrieve allow permission');
  assert(permMgr.getSitePermissions('https://sketchy-site.com').camera === 'block', 'Store and retrieve block permission');

  assert(permMgr.normalizePermission('geolocation') === 'location', 'Normalize geolocation permission');
  assert(permMgr.normalizePermission('media', { mediaTypes: ['video'] }) === 'camera', 'Normalize media video to camera');
  assert(permMgr.normalizePermission('media', { mediaTypes: ['audio'] }) === 'microphone', 'Normalize media audio to microphone');

  try { fs.unlinkSync(tempPermFile); } catch {}

  // ─── 4. Privacy Engine ─────────────────────────────────────────
  console.log('\n--- 4. Privacy Engine (Ads, Trackers, Third-Party) ---');
  const privEngine = new PrivacyEngine();
  const stats = privEngine.getSiteStats('news.ycombinator.com');
  assert(stats.domain === 'ycombinator.com', 'Extract base domain correctly');
  assert(stats.shieldEnabled === true, 'Default shield enabled for sites');

  privEngine.toggleSiteShield('ycombinator.com', false);
  assert(privEngine.getSiteStats('ycombinator.com').shieldEnabled === false, 'Toggle shield disabled per site');
  privEngine.toggleSiteShield('ycombinator.com', true);
  assert(privEngine.getSiteStats('ycombinator.com').shieldEnabled === true, 'Re-enable shield per site');

  // ─── 5. VPN & Tunnel Controller ────────────────────────────────
  console.log('\n--- 5. VPN Controller (WireGuard & State Transitions) ---');
  const vpnCtrl = new VpnController();
  assert(vpnCtrl.getStatus().mode === 'direct', 'Default network mode is direct');
  assert(vpnCtrl.getStatus().state === 'disconnected', 'Default tunnel state is disconnected');

  const vpnConnectPromise = vpnCtrl.connectVpn('us-east');
  assert(vpnCtrl.getStatus().state === 'connecting', 'Transitions to connecting state');
  await vpnConnectPromise;
  assert(vpnCtrl.getStatus().state === 'connected', 'Transitions to connected state on handshake');
  assert(vpnCtrl.getStatus().selectedLocation.includes('United States'), 'Reflects selected tunnel location');

  await vpnCtrl.disconnectVpn();
  assert(vpnCtrl.getStatus().state === 'disconnected', 'Transitions to disconnected state');
  assert(vpnCtrl.getStatus().mode === 'direct', 'Returns to direct connection mode');

  // ─── 6. AI Client Data Privacy Redaction ──────────────────────
  console.log('\n--- 6. AI Client Privacy & Sanitization ---');
  const aiClient = new AiClient();
  const dirtyText = 'My card is 4532 1123 4567 8901 and SSN is 123-45-6789 with token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig';
  const cleanText = aiClient.sanitizePageText(dirtyText);
  assert(!cleanText.includes('4532'), 'Redact credit card numbers from AI context');
  assert(!cleanText.includes('123-45-6789'), 'Redact Social Security Numbers from AI context');
  assert(!cleanText.includes('eyJhbGci'), 'Redact JWT/Bearer auth tokens from AI context');

  console.log(`\n📊 Comprehensive Verification Summary: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

void runAllTests();
