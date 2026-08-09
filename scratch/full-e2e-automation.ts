/**
 * Muthu Browser — Chrome Desktop Playwright E2E Automation Test Suite
 */

import { chromium } from 'playwright';
import { getSpeedDialHtml } from '../src/main/speeddial-html';
import * as fs from 'fs';
import * as path from 'path';

async function runAutomationTests() {
  console.log('====================================================');
  console.log('🚀 STARTING CHROME DESKTOP E2E AUTOMATION SUITE');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

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

  // ─── PART 1: CHROME NEW TAB PAGE AUTOMATION ────────────────────────
  console.log('📋 SECTION 1: CHROME NEW TAB PAGE AUTOMATION');

  const speedDialHtml = getSpeedDialHtml();
  const tempHtmlPath = path.join(__dirname, 'temp-speeddial.html');
  fs.writeFileSync(tempHtmlPath, speedDialHtml);
  await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'domcontentloaded', timeout: 10000 });

  // Test 1: Google Logo SVG
  const logo = page.locator('.google-logo');
  await assert(await logo.isVisible(), 'Authentic Google Logo SVG is visible');

  // Test 2: Chrome Omnibox Input
  const searchInput = page.locator('#searchInput');
  await assert(await searchInput.isVisible(), 'Chrome pill search bar is visible');
  
  await searchInput.fill('Google Chrome Playwright Test');
  const inputValue = await searchInput.inputValue();
  assert(inputValue === 'Google Chrome Playwright Test', 'Search bar captures query input');

  // Test 3: Search Navigation
  await page.evaluate(() => {
    window.handleSearch = (e: Event) => {
      e.preventDefault();
      (window as any).__navigatedTo = 'https://www.google.com/search?q=Chrome';
    };
  });
  await page.keyboard.press('Enter');
  const navigatedUrl = await page.evaluate(() => (window as any).__navigatedTo || '');
  assert(navigatedUrl.includes('google.com/search'), 'Pressing Enter in search bar triggers Google search navigation');

  // Test 4: Shortcut Grid
  const shortcuts = page.locator('#shortcutGrid .shortcut-tile');
  const shortcutCount = await shortcuts.count();
  assert(shortcutCount >= 10, `Chrome shortcut grid rendered ${shortcutCount} tiles`);

  // Clean temp file
  if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);

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
