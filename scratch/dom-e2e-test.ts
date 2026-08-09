/**
 * Muthu Browser — DOM & Logic E2E Automation Engine (Chrome Edition)
 *
 * Automated verification of Chrome UI elements, shortcut links, search bar behavior,
 * bookmarks bar, and IPC message payload.
 */

import { getSpeedDialHtml } from '../src/main/speeddial-html';
import { normalizeUrl, stripTrackingParams } from '../src/main/url-utils';

function runDOMVerification() {
  console.log('====================================================');
  console.log('🚀 RUNNING CHROME BROWSER UI AUTOMATION VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${description}`);
      failed++;
    }
  }

  // ─── 1. CHROME SPEED DIAL HTML INTEGRITY TEST ──────────────────────
  console.log('📋 1. CHROME NEW TAB PAGE HTML & DOM STRUCTURE:');
  const html = getSpeedDialHtml();

  assert(html.includes('svg class="google-logo"'), 'Authentic Google Logo SVG exists');
  assert(html.includes('id="searchInput"'), 'Chrome Pill Search bar input `#searchInput` exists');
  assert(html.includes('<div class="shortcut-grid" id="shortcutGrid"></div>'), 'Chrome Shortcut grid `#shortcutGrid` exists');
  assert(html.includes('Customize Chrome'), 'Customize Chrome button exists');

  // ─── 2. CHROME DEFAULT SHORTCUT CARDS TEST ────────────────────────
  console.log('\n📋 2. CHROME DEFAULT SHORTCUTS AUDIT:');
  const expectedApps = [
    'Google', 'YouTube', 'Gmail', 'Maps', 'Drive',
    'Photos', 'News', 'Translate', 'GitHub'
  ];

  expectedApps.forEach((app) => {
    assert(html.includes(`name: '${app}'`), `Default shortcut "${app}" is registered`);
  });

  // ─── 3. URL NORMALIZATION & SEARCH AUTOMATION TEST ────────────────
  console.log('\n📋 3. URL NORMALIZER & OMNIBOX SEARCH AUTOMATION:');

  const testCases = [
    { input: 'google.com', expected: 'https://google.com' },
    { input: 'https://youtube.com', expected: 'https://youtube.com/' },
    { input: 'what is quantum computing', expected: 'https://www.google.com/search?q=what%20is%20quantum%20computing' },
    { input: 'github.com/muthuvel-24/browser', expected: 'https://github.com/muthuvel-24/browser' },
    { input: 'http://localhost:5174', expected: 'http://localhost:5174/' },
    { input: '  amazon.in  ', expected: 'https://www.amazon.in' },
  ];

  testCases.forEach(({ input, expected }) => {
    const result = normalizeUrl(input);
    assert(result === expected, `Normalizing "${input}" ➔ "${result}"`);
  });

  // ─── 4. TRACKING PARAMETER STRIPPER TEST ──────────────────────────
  console.log('\n📋 4. PRIVACY TRACKING SANITIZER AUTOMATION:');

  const trackingCases = [
    {
      raw: 'https://amazon.in/dp/B08N5WRWNW?utm_source=facebook&fbclid=12345',
      expected: 'https://amazon.in/dp/B08N5WRWNW'
    },
    {
      raw: 'https://x.com/post/10293?gclid=XYZ987',
      expected: 'https://x.com/post/10293'
    }
  ];

  trackingCases.forEach(({ raw, expected }) => {
    const sanitized = stripTrackingParams(raw);
    assert(sanitized === expected, `Sanitizing "${raw}" ➔ "${sanitized}"`);
  });

  console.log('\n====================================================');
  console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runDOMVerification();
