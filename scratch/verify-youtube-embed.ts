/**
 * Verify YouTube in-tab embed plays (not "Video unavailable").
 */
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--start-maximized'],
  }).catch(() => chromium.launch({ headless: false, args: ['--start-maximized'] }));

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  console.log('Opening http://127.0.0.1:5174 ...');
  await page.goto('http://127.0.0.1:5174', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Switch to YouTube tab if present
  const ytTab = page.getByText('YouTube', { exact: false }).first();
  if (await ytTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ytTab.click();
    await page.waitForTimeout(1000);
  } else {
    const urlInput = page.locator('#url-input');
    await urlInput.click({ clickCount: 3 });
    await urlInput.fill('https://www.youtube.com/results?search_query=jeans+movie+songs');
    await urlInput.press('Enter');
    await page.waitForTimeout(1500);
  }

  const iframe = page.locator('iframe.chrome-viewport-iframe');
  await iframe.waitFor({ state: 'attached', timeout: 10000 });
  const src = await iframe.getAttribute('src');
  console.log('iframe src:', src);

  if (!src || !src.includes('youtube.com/embed/wu3MIa9fuLo')) {
    console.error('FAIL: expected jeans video embed wu3MIa9fuLo');
    await page.waitForTimeout(5000);
    await browser.close();
    process.exit(1);
  }

  // Click Poovukkul preset to force reload
  const preset = page.getByRole('button', { name: /Poovukkul/i });
  if (await preset.isVisible().catch(() => false)) {
    await preset.click();
    await page.waitForTimeout(2000);
  }

  const frame = page.frameLocator('iframe.chrome-viewport-iframe');
  // YouTube shows this text when embed is broken
  const unavailable = frame.getByText(/video unavailable/i);
  const hasUnavailable = await unavailable.isVisible({ timeout: 8000 }).catch(() => false);

  console.log('Video unavailable visible:', hasUnavailable);
  if (hasUnavailable) {
    console.error('FAIL: YouTube still shows Video unavailable');
    await page.waitForTimeout(8000);
    await browser.close();
    process.exit(1);
  }

  console.log('PASS: YouTube embed loaded without Video unavailable');
  await page.waitForTimeout(8000);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
