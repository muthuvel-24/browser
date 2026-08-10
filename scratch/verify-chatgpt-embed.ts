/**
 * Verify ChatGPT loads in-tab without CSP frame-ancestors errors.
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

  const cspErrors: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (/frame-ancestors|Framing ['"]https?:\/\/chatgpt/i.test(text)) {
      cspErrors.push(text);
    }
  });
  page.on('pageerror', (err) => {
    if (/frame-ancestors/i.test(err.message)) cspErrors.push(err.message);
  });

  console.log('Opening Muthu on http://127.0.0.1:5174 ...');
  await page.goto('http://127.0.0.1:5174', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Navigate via address bar / bookmarks if present
  const urlInput = page.locator('#url-input, input[type="text"]').first();
  if (await urlInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await urlInput.click({ clickCount: 3 });
    await urlInput.fill('https://chatgpt.com');
    await urlInput.press('Enter');
  } else {
    // Fallback: click ChatGPT bookmark
    const bookmark = page.getByText('ChatGPT', { exact: true }).first();
    if (await bookmark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bookmark.click();
    }
  }

  await page.waitForTimeout(4000);

  // Confirm iframe uses proxy path (not raw chatgpt.com)
  const iframeSrc = await page.locator('iframe.chrome-viewport-iframe').getAttribute('src').catch(() => null);
  console.log('iframe src:', iframeSrc);

  // Hit proxy directly and inspect headers
  const proxyRes = await page.request.get('http://127.0.0.1:5174/__muthu_proxy__/https/chatgpt.com/');
  const csp = proxyRes.headers()['content-security-policy'] || '';
  const xfo = proxyRes.headers()['x-frame-options'] || '';
  console.log('proxy status:', proxyRes.status());
  console.log('proxy CSP:', csp || '(none / rewritten)');
  console.log('proxy X-Frame-Options:', xfo || '(stripped)');

  const framingBlocked = /frame-ancestors\s+'self'/i.test(csp) || /deny|sameorigin/i.test(xfo);
  const usedProxy = Boolean(iframeSrc && iframeSrc.includes('/__muthu_proxy__/'));

  console.log('\n=== RESULT ===');
  console.log('Used embed proxy:', usedProxy);
  console.log('CSP console errors:', cspErrors.length ? cspErrors : 'none');
  console.log('Proxy still blocks framing:', framingBlocked);

  if (!usedProxy || framingBlocked || cspErrors.length > 0) {
    console.error('FAIL: ChatGPT embed still blocked');
    await page.waitForTimeout(8000);
    await browser.close();
    process.exit(1);
  }

  console.log('PASS: ChatGPT loads via proxy without frame-ancestors block');
  await page.waitForTimeout(10000);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
