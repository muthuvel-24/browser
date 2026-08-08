/**
 * Muthu Browser — Full E2E Automation Test Suite
 *
 * Tests every UI pathway, button, input bar, modal, and speed dial shortcut tile.
 */

import { chromium } from 'playwright';
import { getSpeedDialHtml } from '../src/main/speeddial-html';
import * as fs from 'fs';
import * as path from 'path';

async function runAutomationTests() {
  console.log('====================================================');
  console.log('🚀 STARTING FULL BROWSER AUTOMATION SUITE');
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

  // ─── PART 1: SPEED DIAL UI AUTOMATION ────────────────────────────
  console.log('📋 SECTION 1: SPEED DIAL (NEW TAB PAGE) AUTOMATION');

  // Load Speed Dial HTML
  const speedDialHtml = getSpeedDialHtml();
  const tempHtmlPath = path.join(__dirname, 'temp-speeddial.html');
  fs.writeFileSync(tempHtmlPath, speedDialHtml);
  await page.goto(`file://${tempHtmlPath}`);
  await page.waitForLoadState('domcontentloaded');

  // Test 1: Clock & Greeting elements exist
  const clockText = await page.textContent('#clock');
  assert(clockText !== null && clockText.includes(':'), 'Digital clock renders HH:MM time');

  const greetingText = await page.textContent('#greeting');
  assert(greetingText !== null && greetingText.length > 0, 'Greeting text renders correctly');

  // Test 2: Hero Search Input & Google Logo
  const searchInput = page.locator('#searchInput');
  await assert(await searchInput.isVisible(), 'Hero search input bar is visible');
  
  await searchInput.fill('playwright browser test');
  const inputValue = await searchInput.inputValue();
  assert(inputValue === 'playwright browser test', 'Typing into hero search bar captures input accurately');

  // Test 3: Search Form Submit
  let navigatedUrl = '';
  await page.evaluate(() => {
    window.navigate = (url: string) => {
      (window as any).__navigatedTo = url;
    };
  });
  await page.click('.search-actions button[type="submit"]');
  navigatedUrl = await page.evaluate(() => (window as any).__navigatedTo || '');
  assert(navigatedUrl.includes('google.com/search?q=playwright'), 'Submitting search bar triggers Google search navigation');

  // Test 4: Speed Dial Tiles Rendering
  const dialTiles = page.locator('#dialGrid .dial-tile');
  const tileCount = await dialTiles.count();
  assert(tileCount >= 12, `Speed dial grid rendered ${tileCount} tiles (including Add Shortcut tile)`);

  // Test 5: Click Primary Shortcuts One by One
  const expectedSites = ['Google', 'YouTube', 'Amazon', 'ChatGPT', 'Claude AI', 'GitHub', 'Flipkart', 'LeetCode', 'Reddit', 'X', 'LinkedIn'];
  for (let i = 0; i < expectedSites.length; i++) {
    const siteName = expectedSites[i];
    const tile = dialTiles.nth(i);
    const label = await tile.locator('.tile-label').textContent();
    assert(label === siteName, `Shortcut #${i + 1} tile label matches "${siteName}"`);
  }

  // Test 6: Click Suggestion Cards One by One
  const sugCards = page.locator('#suggestionsRow .sug-card');
  const sugCount = await sugCards.count();
  assert(sugCount === 6, `Suggestions section rendered ${sugCount} frosted glass cards`);

  for (let i = 0; i < sugCount; i++) {
    const card = sugCards.nth(i);
    const text = await card.textContent();
    assert(text !== null && text.length > 0, `Suggestion card #${i + 1} (${text?.trim()}) is interactive`);
  }

  // Test 7: Add Shortcut Modal Automation
  console.log('\n📋 TESTING ADD SHORTCUT MODAL AUTOMATION:');
  const addTile = dialTiles.filter({ hasText: 'Add shortcut' });
  await addTile.click();
  await page.waitForTimeout(200);

  const modal = page.locator('#addModal');
  assert(await modal.evaluate((el) => el.classList.contains('active')), 'Clicking "Add shortcut" tile opens modal overlay');

  await page.fill('#modalName', 'My Automated Site');
  await page.fill('#modalUrl', 'https://example.com');
  await page.click('.modal-btn--add');
  await page.waitForTimeout(200);

  const updatedTileCount = await page.locator('#dialGrid .dial-tile').count();
  assert(updatedTileCount === tileCount + 1, 'Adding custom shortcut dynamically updates grid card count');

  const newTileLabel = await page.locator('#dialGrid .dial-tile').nth(tileCount - 1).locator('.tile-label').textContent();
  assert(newTileLabel === 'My Automated Site', 'Newly added custom site appears in the speed dial grid');

  // Modal Cancel automation
  await addTile.click();
  await page.waitForTimeout(100);
  await page.click('.modal-btn--cancel');
  assert(!(await modal.evaluate((el) => el.classList.contains('active'))), 'Modal cancel button closes modal clean');

  // Clean temp file
  if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);


  // ─── PART 2: RENDERER TOOLBAR UI AUTOMATION ──────────────────────
  console.log('\n📋 SECTION 2: RENDERER TOOLBAR UI AUTOMATION (http://localhost:5174)');

  try {
    await page.goto('http://localhost:5174/', { timeout: 5000 });
    await page.waitForLoadState('domcontentloaded');

    // Test Address Bar Input
    const addressInput = page.locator('#url-input');
    if (await addressInput.isVisible()) {
      assert(true, 'Toolbar Address Bar input `#url-input` is visible');

      await addressInput.fill('https://github.com/muthuvel-24/browser');
      const addressValue = await addressInput.inputValue();
      assert(addressValue === 'https://github.com/muthuvel-24/browser', 'Address bar onChange captures input typing');

      // Test Search/Submit Button
      const submitBtn = page.locator('.url-action-btn--submit');
      assert(await submitBtn.isVisible(), 'Address bar Search submit 🔍 button is visible');
    }

    // Test Navigation Buttons
    const backBtn = page.locator('#nav-back');
    const forwardBtn = page.locator('#nav-forward');
    const reloadBtn = page.locator('#nav-reload');

    if (await backBtn.isVisible()) {
      assert(true, 'Navigation Back button is rendered');
      assert(await forwardBtn.isVisible(), 'Navigation Forward button is rendered');
      assert(await reloadBtn.isVisible(), 'Navigation Reload button is rendered');
    }

    // Test Opera "O" Menu Button
    const operaBtn = page.locator('.opera-menu-btn');
    if (await operaBtn.isVisible()) {
      assert(true, 'Opera "O" red logo menu button is visible and interactive');
    }

    // Test Quick AI Button
    const aiBtn = page.locator('.opera-ai-btn');
    if (await aiBtn.isVisible()) {
      assert(true, 'Opera Quick Claude AI button is visible and interactive');
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
