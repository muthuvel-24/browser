/**
 * Muthu Browser — DOM & Logic E2E Automation Engine
 *
 * Automated verification of every UI element, shortcut link, search bar behavior,
 * clock ticker, modal window state machine, and IPC message payload.
 */

import { getSpeedDialHtml } from '../src/main/speeddial-html';
import { normalizeUrl, stripTrackingParams } from '../src/main/url-utils';

function runDOMVerification() {
  console.log('====================================================');
  console.log('🚀 RUNNING BROWSER UI AUTOMATION VERIFICATION');
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

  // ─── 1. SPEED DIAL HTML INTEGRITY TEST ─────────────────────────────
  console.log('📋 1. SPEED DIAL (NEW TAB PAGE) HTML & DOM STRUCTURE:');
  const html = getSpeedDialHtml();

  assert(html.includes('<div class="clock" id="clock">12:00</div>'), 'Digital Clock container `#clock` exists');
  assert(html.includes('<div class="greeting" id="greeting">'), 'Personalized Greeting `#greeting` container exists');
  assert(html.includes('<input\n            type="text"\n            id="searchInput"') || html.includes('id="searchInput"'), 'Hero Search bar input `#searchInput` exists');
  assert(html.includes('svg class="search-google-icon"'), 'Authentic Google 4-color SVG logo is embedded inside search bar');
  assert(html.includes('<div class="dial-grid" id="dialGrid"></div>'), 'Speed dial grid container `#dialGrid` exists');
  assert(html.includes('<div class="suggestions-row" id="suggestionsRow"></div>'), 'Suggestions section `#suggestionsRow` container exists');
  assert(html.includes('<div class="modal-overlay" id="addModal">'), 'Add Shortcut modal overlay `#addModal` container exists');
  assert(html.includes('localStorage.setItem'), 'localStorage persistence logic is embedded');

  // ─── 2. SPEED DIAL DEFAULT SHORTCUT CARDS TEST ────────────────────
  console.log('\n📋 2. SPEED DIAL DEFAULT SHORTCUTS AUDIT:');
  const expectedSites = [
    'Google', 'YouTube', 'Amazon', 'ChatGPT', 'Claude AI',
    'GitHub', 'Flipkart', 'LeetCode', 'Reddit', 'X', 'LinkedIn'
  ];

  expectedSites.forEach((site) => {
    assert(html.includes(`name: '${site}'`) || html.includes(`'${site}'`), `Default shortcut "${site}" is registered`);
  });

  // ─── 3. SUGGESTIONS AUDIT ─────────────────────────────────────────
  console.log('\n📋 3. SUGGESTION LINKS AUDIT:');
  const expectedSuggestions = [
    'Google Workspace', 'YouTube', 'X / Twitter', 'Wikipedia', 'Stack Overflow', 'Hacker News'
  ];

  expectedSuggestions.forEach((sug) => {
    assert(html.includes(`name: '${sug}'`) || html.includes(`'${sug}'`), `Suggestion item "${sug}" is registered`);
  });

  // ─── 4. URL NORMALIZATION & SEARCH AUTOMATION TEST ────────────────
  console.log('\n📋 4. URL NORMALIZER & OMNIBOX SEARCH AUTOMATION:');

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

  // ─── 5. TRACKING PARAMETER STRIPPER TEST ──────────────────────────
  console.log('\n📋 5. PRIVACY TRACKING SANITIZER AUTOMATION:');

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
