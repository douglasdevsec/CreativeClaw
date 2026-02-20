#!/usr/bin/env node
/**
 * instagram_post.js — Post an image to Instagram.
 *
 * Requires a saved 'instagram' session (run login.js --platform instagram first).
 *
 * Usage:
 *   node skills/browser/scripts/instagram_post.js \
 *     --image /path/to/image.jpg \
 *     --caption "Caption text #hashtag"
 *
 * NOTE: Instagram heavily guards against automation. This script uses the
 * Creator Studio route (creators.instagram.com) which is more stable.
 */

import { chromium } from 'playwright-core';
import { parseArgs } from 'node:util';
import { loadSession } from './session_manager.js';
import path from 'node:path';
import { existsSync } from 'node:fs';

const { values } = parseArgs({
  options: {
    image:   { type: 'string' },
    caption: { type: 'string', default: '' },
    headed:  { type: 'boolean', default: false },
  },
});

if (!values.image) {
  console.error('Error: --image is required');
  process.exit(1);
}

const absImage = path.resolve(values.image);
if (!existsSync(absImage)) {
  console.error(`Error: image file not found: ${absImage}`);
  process.exit(1);
}

const session = await loadSession('instagram');
if (!session) {
  console.error('Error: No saved Instagram session. Run login.js --platform instagram first.');
  process.exit(1);
}

const executablePath =
  process.env.CREATIVECLAW_BROWSER_PATH ?? chromium.executablePath();

const browser = await chromium.launch({
  headless: !values.headed,
  executablePath,
  args: ['--lang=en-US'],
});

try {
  const context = await browser.newContext({
    storageState: session,
    locale: 'en-US',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Navigate to Creator Studio for more stable upload flow
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click the "+" (new post) button
  const newPostBtn = page.getByRole('link', { name: /new post/i })
    .or(page.locator('[aria-label="New post"]'))
    .or(page.getByRole('button', { name: /create/i }))
    .first();
  await newPostBtn.waitFor({ timeout: 10000 });
  await newPostBtn.click();
  await page.waitForTimeout(1000);

  // Upload image via file input
  const fileInput = page.locator('input[type="file"][accept*="image"]').first();
  await fileInput.waitFor({ timeout: 8000 });
  await fileInput.setInputFiles(absImage);
  await page.waitForTimeout(4000); // wait for image processing

  // Advance through "Crop" → "Filters" → "Caption" dialogs
  for (let i = 0; i < 2; i++) {
    const nextBtn = page
      .getByRole('button', { name: /next/i })
      .or(page.getByText(/next/i))
      .first();
    await nextBtn.waitFor({ timeout: 8000 });
    await nextBtn.click();
    await page.waitForTimeout(1500);
  }

  // Fill caption
  if (values.caption) {
    const captionBox = page
      .getByPlaceholder(/write a caption/i)
      .or(page.locator('[aria-label*="caption" i]'))
      .first();
    await captionBox.waitFor({ timeout: 8000 });
    await captionBox.click();
    await captionBox.fill(values.caption);
  }

  // Share
  const shareBtn = page.getByRole('button', { name: /share/i }).first();
  await shareBtn.waitFor({ timeout: 10000 });
  await shareBtn.click();
  await page.waitForTimeout(4000);

  console.log(JSON.stringify({
    success: true,
    image: absImage,
    caption: values.caption,
    platform: 'instagram',
  }));
} catch (err) {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
} finally {
  await browser.close();
}
