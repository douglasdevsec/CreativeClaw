#!/usr/bin/env node
/**
 * screenshot.js — Take a full-page screenshot of a URL.
 *
 * Usage:
 *   node skills/browser/scripts/screenshot.js \
 *     --url <url> \
 *     --output <path/to/output.png> \
 *     [--platform <name>]   # reuse saved session cookies
 *     [--full-page]         # default: true
 */

import { chromium } from 'playwright-core';
import { parseArgs } from 'node:util';
import { loadSession } from './session_manager.js';

const { values } = parseArgs({
  options: {
    url:        { type: 'string' },
    output:     { type: 'string' },
    platform:   { type: 'string' },
    'full-page':{ type: 'boolean', default: true },
    headed:     { type: 'boolean', default: false },
  },
});

if (!values.url || !values.output) {
  console.error('Error: --url and --output are required');
  process.exit(1);
}

const executablePath =
  process.env.CREATIVECLAW_BROWSER_PATH ?? chromium.executablePath();

const browser = await chromium.launch({
  headless: !values.headed,
  executablePath,
});

try {
  const savedState = values.platform ? await loadSession(values.platform) : null;
  const context = await browser.newContext(savedState ? { storageState: savedState } : {});
  const page    = await context.newPage();

  await page.goto(values.url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: values.output, fullPage: values['full-page'] });

  console.log(JSON.stringify({
    success: true,
    output: values.output,
    title: await page.title(),
  }));
} catch (err) {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
} finally {
  await browser.close();
}
