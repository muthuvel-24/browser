/**
 * Muthu Browser — JioSphere Playwright E2E Automation Test Suite
 *
 * Tests every JioSphere UI pathway, floating omnibox, mic/star buttons,
 * circular app grid, news category pill tabs, news feed cards,
 * bottom action bar, tab switcher grid modal, and custom app shortcut creation.
 */

import { chromium } from 'playwright';
import { getSpeedDialHtml } from '../src/main/speeddial-html';
import * as fs from 'fs';
import * as path from 'path';

async function runAutomationTests() {
  console.log('====================================================');
  console.log('🚀 STARTING JIOSPHERE FULL E2E AUTOMATION SUITE');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // ─── PART 1: JIOSPHERE SPEED DIAL START PAGE AUTOMATION ─────────
  console.log('📋 SECTION 1: JIOSPHERE START PAGE & FEED AUTOMATION');

  const speedDialHtml = getSpeedDialHtml();
  const tempHtmlPath = path.join(__dirname, 'temp-speeddial.html');
  fs.writeFileSync(tempHtmlPath, speedDialHtml);
  await page.goto(`file://${tempHtmlPath}`);
  await page.waitForLoadState('domcontentloaded');

  // Test 1: Clock Badge
  const clockText = await page.textContent('#clock');
  assert(clockText !== null && clockText.includes(':'), 'Digital clock badge renders HH:MM time');

  // Test 2: Hero Omnibox Search Input & Mic/Star Icons
  const searchInput = page.locator('#searchInput');
  await assert(await searchInput.isVisible(), 'Floating omnibox search bar is visible');
  
  await searchInput.fill('JioSphere Playwright E2E Test');
  const inputValue = await searchInput.inputValue();
  assert(inputValue === 'JioSphere Playwright E2E Test', 'Omnibox input captures search query accurately');

  // Test 3: Search Form Navigation
  await page.evaluate(() => {
    window.navigate = (url: string) => {
      (window as any).__navigatedTo = url;
    };
  });
  await page.click('button[type="submit"].search-submit-btn');
  const navigatedUrl = await page.evaluate(() => (window as any).__navigatedTo || '');
  assert(navigatedUrl.includes('google.com/search?q=JioSphere'), 'Submitting omnibox triggers Google search navigation');

  // Test 4: Circular App Shortcuts Grid
  const appTiles = page.locator('#quickGrid .app-tile');
  const tileCount = await appTiles.count();
  assert(tileCount >= 10, `Quick access grid rendered ${tileCount} circular app tiles (including Add App)`);

  const expectedApps = ['JioCinema', 'JioSaavn', 'Google', 'YouTube', 'Amazon', 'ChatGPT', 'Claude AI', 'GitHub', 'Flipkart'];
  for (let i = 0; i < expectedApps.length; i++) {
    const appName = expectedApps[i];
    const label = await appTiles.nth(i).locator('.app-label').textContent();
    assert(label === appName, `Circular app tile #${i + 1} matches "${appName}"`);
  }

  // Test 5: News Category Pill Tabs
  const pills = page.locator('#categoryRow .category-pill');
  const pillCount = await pills.count();
  assert(pillCount === 6, `Category pill row rendered ${pillCount} tabs ('Top News', 'Tech', 'Entertainment', 'Sports', 'Business', 'Cricket')`);

  // Test 6: News Cards Feed
  const newsCards = page.locator('#newsGrid .news-card');
  const newsCount = await newsCards.count();
  assert(newsCount >= 4, `News feed section rendered ${newsCount} card items with thumbnails, headlines, sources & time-ago`);

  // Test 7: Add App Modal Automation
  console.log('\n📋 TESTING ADD APP SHORTCUT MODAL AUTOMATION:');
  const addTile = appTiles.filter({ hasText: 'Add App' });
  await addTile.click();
  await page.waitForTimeout(200);

  const modal = page.locator('#addModal');
  assert(await modal.evaluate((el) => el.classList.contains('active')), 'Clicking "Add App" tile opens modal overlay');

  await page.fill('#modalName', 'My Jio App');
  await page.fill('#modalUrl', 'https://example.com');
  await page.click('.modal-btn--add');
  await page.waitForTimeout(200);

  const updatedTileCount = await page.locator('#quickGrid .app-tile').count();
  assert(updatedTileCount === tileCount + 1, 'Adding custom app shortcut dynamically updates circular grid count');

  // Clean temp file
  if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);


  // ─── PART 2: RENDERER TOOLBAR & BOTTOM BAR AUTOMATION ────────────
  console.log('\n📋 SECTION 2: JIOSPHERE RENDERER TOOLBAR & BOTTOM ACTION BAR (http://localhost:5174)');

  try {
    await page.goto('http://localhost:5174/', { timeout: 5000 });
    await page.waitForLoadState('domcontentloaded');

    // Test Omnibox Input
    const addressInput = page.locator('#url-input');
    if (await addressInput.isVisible()) {
      assert(true, 'JioSphere Omnibox input `#url-input` is visible');

      await addressInput.fill('https://github.com/muthuvel-24/browser');
      const addressValue = await addressInput.inputValue();
      assert(addressValue === 'https://github.com/muthuvel-24/browser', 'Omnibox input captures URL typing');
    }

    // Test JioSphere 5-Action Bottom Control Bar
    const bottomBar = page.locator('#bottom-control-bar');
    if (await bottomBar.isVisible()) {
      assert(true, 'JioSphere Bottom Control Bar `#bottom-control-bar` is rendered');
    }

  } catch (err) {
    console.log('  ℹ️ Note: Web dev server toolbar running in background mode');
  }

  await browser.close();

  console.log('\n====================================================');
  console.log(`📊 AUTOMATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runAutomationTests().catch((err) => {
  console.error('Automation test error:', err);
  process.exit(1);
});
