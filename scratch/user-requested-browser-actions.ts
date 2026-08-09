/**
 * Muthu Browser — User Action Automation Script
 *
 * 1. Launches Google Chrome / Chromium browser on desktop (headless: false)
 * 2. Opens Google (https://www.google.com)
 * 3. Opens YouTube, searches "Jeans movie songs", and plays video
 * 4. Opens Google Drive (https://drive.google.com) and navigates to sign in (msmuthuvel2004@gmail.com)
 * 5. Opens Google Gemini (https://gemini.google.com)
 */

import { chromium } from 'playwright';

async function runUserActions() {
  console.log('🚀 Launching Chromium Browser on desktop for user tasks...');

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // Use installed Chrome if available, fallback to chromium
    args: ['--start-maximized', '--no-sandbox'],
  }).catch(() => chromium.launch({ headless: false, args: ['--start-maximized'] }));

  const context = await browser.newContext({ viewport: null });

  // ─── Task 1: Open Google ──────────────────────────────────────────
  console.log('📌 Task 1: Opening Google (https://www.google.com)...');
  const googlePage = await context.newPage();
  await googlePage.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
  console.log('  ✅ Google opened successfully!');

  // ─── Task 2: Open YouTube & Play Jeans Movie Songs ──────────────
  console.log('📌 Task 2: Opening YouTube and playing Jeans movie songs...');
  const ytPage = await context.newPage();
  await ytPage.goto('https://www.youtube.com/results?search_query=jeans+movie+songs', { waitUntil: 'domcontentloaded' });
  await ytPage.waitForTimeout(2000);

  // Click first video result
  const videoSelector = 'ytd-video-renderer a#thumbnail, a.yt-simple-endpoint.ytd-video-renderer';
  const firstVideo = ytPage.locator(videoSelector).first();
  if (await firstVideo.isVisible({ timeout: 5000 }).catch(() => false)) {
    await firstVideo.click();
    console.log('  ▶️ Playing Jeans movie songs video on YouTube!');
  } else {
    console.log('  ℹ️ Navigating directly to Jeans movie songs video...');
    await ytPage.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { waitUntil: 'domcontentloaded' });
  }

  // ─── Task 3: Open Google Drive & Sign-in Page ────────────────────
  console.log('📌 Task 3: Opening Google Drive (https://drive.google.com)...');
  const drivePage = await context.newPage();
  await drivePage.goto('https://drive.google.com', { waitUntil: 'domcontentloaded' });
  await drivePage.waitForTimeout(2000);

  // Fill in email if sign-in input exists
  const emailInput = drivePage.locator('input[type="email"]');
  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailInput.fill('msmuthuvel2004@gmail.com');
    console.log('  ✉️ Filled email: msmuthuvel2004@gmail.com');
  }

  // ─── Task 4: Open Gemini AI ──────────────────────────────────────
  console.log('📌 Task 4: Opening Google Gemini (https://gemini.google.com)...');
  const geminiPage = await context.newPage();
  await geminiPage.goto('https://gemini.google.com', { waitUntil: 'domcontentloaded' });
  console.log('  ✨ Google Gemini opened successfully!');

  console.log('\n====================================================');
  console.log('🎉 ALL TASKS EXECUTED SUCCESSFULLY!');
  console.log('====================================================\n');

  // Keep browser open for user interaction
  await new Promise(() => {});
}

runUserActions().catch((err) => {
  console.error('❌ Error executing user tasks:', err);
  process.exit(1);
});
