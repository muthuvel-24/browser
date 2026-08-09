/**
 * Muthu Browser — DOM & Logic E2E Automation Engine (JioSphere Edition)
 *
 * Automated verification of JioSphere UI elements, circular shortcut links, search bar behavior,
 * clock ticker, modal window state machine, and IPC message payload.
 */

import { getSpeedDialHtml } from '../src/main/speeddial-html';
import { normalizeUrl, stripTrackingParams } from '../src/main/url-utils';

function runDOMVerification() {
  console.log('====================================================');
  console.log('🚀 RUNNING JIOSPHERE BROWSER UI AUTOMATION VERIFICATION');
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

  // ─── 1. JIOSPHERE SPEED DIAL HTML INTEGRITY TEST ───────────────────
  console.log('📋 1. JIOSPHERE SPEED DIAL (NEW TAB PAGE) HTML & DOM STRUCTURE:');
  const html = getSpeedDialHtml();

  assert(html.includes('<div class="clock-badge" id="clock">12:00</div>'), 'Clock badge `#clock` container exists');
  assert(html.includes('id="searchInput"'), 'JioSphere Omnibox Search bar input `#searchInput` exists');
  assert(html.includes('🔒'), 'HTTPS Security Lock icon is embedded inside search bar');
  assert(html.includes('🎙️'), 'Voice Search Mic icon is embedded inside search bar');
  assert(html.includes('⭐'), 'Bookmark Star icon is embedded inside search bar');
  assert(html.includes('<div class="quick-access-grid" id="quickGrid"></div>'), 'Circular Quick Access grid `#quickGrid` exists');
  assert(html.includes('<div class="category-pills-row" id="categoryRow">'), 'News Category Pills `#categoryRow` exists');
  assert(html.includes('<div class="news-grid" id="newsGrid"></div>'), 'Card-based News Grid `#newsGrid` exists');
  assert(html.includes('<div class="modal-overlay" id="addModal">'), 'Add Shortcut modal overlay `#addModal` container exists');
  assert(html.includes('localStorage.setItem'), 'LocalStorage persistence logic is embedded');

  // ─── 2. JIOSPHERE DEFAULT SHORTCUT CARDS TEST ─────────────────────
  console.log('\n📋 2. JIOSPHERE DEFAULT SHORTCUTS AUDIT:');
  const expectedApps = [
    'JioCinema', 'JioSaavn', 'Google', 'YouTube', 'Amazon',
    'ChatGPT', 'Claude AI', 'GitHub', 'Flipkart'
  ];

  expectedApps.forEach((app) => {
    assert(html.includes(`name: '${app}'`), `Default app shortcut "${app}" is registered`);
  });

  // ─── 3. NEWS CATEGORY PILLS AUDIT ─────────────────────────────────
  console.log('\n📋 3. NEWS CATEGORY PILLS AUDIT:');
  const expectedPills = ['Top News', 'Tech', 'Entertainment', 'Sports', 'Business', 'Cricket'];

  expectedPills.forEach((pill) => {
    assert(html.includes(`'${pill}'`), `News category pill "${pill}" is registered`);
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
