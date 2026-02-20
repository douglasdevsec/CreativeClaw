#!/usr/bin/env node
/**
 * facebook_post.js — Create a post on Facebook.
 *
 * Requires a saved 'facebook' session (run login.js --platform facebook first).
 *
 * Usage:
 *   node skills/browser/scripts/facebook_post.js \
 *     --message "Hello world!" \
 *     [--image /path/to/image.jpg] \
 *     [--group-url https://www.facebook.com/groups/yourgroup]
 *
 * NOTE: Facebook's UI is dynamic. Selectors may break with UI updates.
 * This script targets the mobile/basic layout for greater stability.
 */

import { chromium } from 'playwright-core';
import { parseArgs } from 'node:util';
import { loadSession } from './session_manager.js';

const { values } = parseArgs({
  options: {
    message:    { type: 'string' },
    image:      { type: 'string' },
    'group-url':{ type: 'string' },
    headed:     { type: 'boolean', default: false },
  },
});

if (!values.message) {
  console.error('Error: --message is required');
  process.exit(1);
}

const session = await loadSession('facebook');
if (!session) {
  console.error('Error: No saved Facebook session. Run login.js --platform facebook first.');
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
  // Use mobile viewport for FB mobile layout (more stable selectors)
  const context = await browser.newContext({
    storageState: session,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  // Navigate to FB or group
  const targetUrl = values['group-url'] ?? 'https://m.facebook.com/?locale=en_US';
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Find and click the "What's on your mind?" composer
  const composerSelector = '[data-testid="status-attachment-mentions-input"], textarea[placeholder], [role="textbox"]';
  await page.waitForSelector(composerSelector, { timeout: 10000 });
  await page.click(composerSelector);
  await page.waitForTimeout(500);
  await page.keyboard.type(values.message, { delay: 30 });

  // Attach image if provided
  if (values.image) {
    // Look for photo/video attachment button
    const fileInput = page.locator('input[type="file"][accept*="image"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(values.image);
      await page.waitForTimeout(3000); // wait for upload
    } else {
      console.warn('[facebook_post] Could not find file input for image upload.');
    }
  }

  // Click Post button
  const postBtn = page.getByRole('button', { name: /^post$/i }).first();
  await postBtn.waitFor({ timeout: 10000 });
  await postBtn.click();

  // Wait for confirmation
  await page.waitForTimeout(3000);

  console.log(JSON.stringify({
    success: true,
    message: values.message,
    platform: 'facebook',
    url: page.url(),
  }));
} catch (err) {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
} finally {
  await browser.close();
}
