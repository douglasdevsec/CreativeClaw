#!/usr/bin/env node
/**
 * click.js — Click an element on a page by CSS selector or visible text.
 *
 * Usage:
 *   node skills/browser/scripts/click.js \
 *     --url <url> \
 *     --selector <css>          # OR
 *     --text <visible-text>
 *     [--platform <name>]
 *     [--wait-for <css>]        # wait for this element after click
 */

import { chromium } from 'playwright-core';
import { parseArgs } from 'node:util';
import { loadSession } from './session_manager.js';

const { values } = parseArgs({
  options: {
    url:       { type: 'string' },
    selector:  { type: 'string' },
    text:      { type: 'string' },
    platform:  { type: 'string' },
    'wait-for':{ type: 'string' },
    headed:    { type: 'boolean', default: false },
  },
});

if (!values.url || (!values.selector && !values.text)) {
  console.error('Error: --url and (--selector or --text) are required');
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

  await page.goto(values.url, { waitUntil: 'domcontentloaded' });

  if (values.selector) {
    await page.click(values.selector);
  } else {
    // Click by visible text
    await page.getByText(values.text, { exact: false }).first().click();
  }

  if (values['wait-for']) {
    await page.waitForSelector(values['wait-for'], { timeout: 10000 });
  }

  console.log(JSON.stringify({
    success: true,
    clicked: values.selector ?? values.text,
    url: page.url(),
  }));
} catch (err) {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
} finally {
  await browser.close();
}
