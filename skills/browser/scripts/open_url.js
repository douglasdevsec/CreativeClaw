#!/usr/bin/env node
/**
 * open_url.js — Open a URL in Chromium and return the page title.
 *
 * Usage:
 *   node skills/browser/scripts/open_url.js --url <url> [--headed] [--timeout <ms>]
 */

import { chromium } from 'playwright-core';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    url:     { type: 'string' },
    headed:  { type: 'boolean', default: false },
    timeout: { type: 'string',  default: '30000' },
  },
});

if (!values.url) {
  console.error('Error: --url is required');
  process.exit(1);
}

const executablePath =
  process.env.CREATIVECLAW_BROWSER_PATH ?? chromium.executablePath();

const browser = await chromium.launch({
  headless: !values.headed,
  executablePath,
});

try {
  const context = await browser.newContext();
  const page    = await context.newPage();

  page.setDefaultTimeout(Number(values.timeout));
  await page.goto(values.url, { waitUntil: 'domcontentloaded' });

  const title = await page.title();
  console.log(JSON.stringify({ url: values.url, title }));
} finally {
  await browser.close();
}
