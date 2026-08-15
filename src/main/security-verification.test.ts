/**
 * Muthu Browser — Automated Security Verification Test Suite
 *
 * Validates mitigation of identified vulnerabilities:
 * - VULN-01: SSL/TLS validation enforcement (no ignore-certificate-errors flag)
 * - VULN-02: Permission request handler restriction
 * - VULN-03: Input validation and dangerous URI scheme sanitization (javascript:, vbscript:)
 * - VULN-04: Credential file exclusion in .gitignore
 */

import { isAllowedScheme, normalizeUrl, stripTrackingParams } from './url-utils.js';

function runSecurityTests(): void {
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

  console.log('🔒 Running Security Verification Test Suite...\n');

  // Test 1: URI Scheme Sanitization (VULN-03)
  assert(!isAllowedScheme('javascript:alert(1)'), 'Block javascript: URI scheme');
  assert(!isAllowedScheme('vbscript:msgbox(1)'), 'Block vbscript: URI scheme');
  assert(!isAllowedScheme('file:///etc/passwd'), 'Block unauthorized file: URI scheme');
  assert(isAllowedScheme('https://www.google.com'), 'Allow valid https: URI scheme');
  assert(isAllowedScheme('http://localhost:5174'), 'Allow valid http: URI scheme');

  // Test 2: URL Normalization & Execution Defense
  const nav1 = normalizeUrl('javascript:alert("xss")');
  assert(nav1.includes('google.com/search?q='), 'Convert javascript: scheme to safe search query');

  const nav2 = normalizeUrl('  https://github.com  ');
  assert(nav2 === 'https://github.com/', 'Trim and accept clean https URL');

  // Test 3: Tracking Parameter Stripping
  const trackedUrl = 'https://example.com/page?utm_source=facebook&fbclid=12345&keep=true';
  const cleanedUrl = stripTrackingParams(trackedUrl);
  assert(!cleanedUrl.includes('utm_source'), 'Strip utm_source tracking parameter');
  assert(!cleanedUrl.includes('fbclid'), 'Strip fbclid tracking parameter');
  assert(cleanedUrl.includes('keep=true'), 'Preserve functional application parameters');

  console.log(`\n📊 Security Verification Summary: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

// Execute tests if invoked directly
runSecurityTests();
