#!/usr/bin/env node
/**
 * fill_form.js — Fill form fields and optionally submit.
 *
 * Usage:
 *   node skills/browser/scripts/fill_form.js \
 *     --url <url> \
 *     --fields '{"#email": "user@example.com", "#pass": "secret"}' \
 *     [--submit <submit-button-selector>]
 *     [--platform <name>]
 */

import { chromium } from 'playwright-core';
import { parseArgs } from 'node:util';
import { loadSession } from './session_manager.js';

const { values } = parseArgs({
  options: {
    url:      { type: 'string' },
    fields:   { type: 'string' },   // JSON map: { selector: value }
    submit:   { type: 'string' },   // submit button selector (optional)
    platform: { type: 'string' },
    headed:   { type: 'boolean', default: false },
  },
});

if (!values.url || !values.fields) {
  console.error('Error: --url and --fields are required');
  process.exit(1);
}

let fieldMap;
try {
  fieldMap = JSON.parse(values.fields);
} catch {
  console.error('Error: --fields must be valid JSON, e.g. \'{"#email": "me@x.com"}\'');
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

  for (const [selector, val] of Object.entries(fieldMap)) {
    await page.fill(selector, val);
  }

  if (values.submit) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
      page.click(values.submit),
    ]);
  }

  console.log(JSON.stringify({
    success: true,
    filledFields: Object.keys(fieldMap),
    submitted: !!values.submit,
    url: page.url(),
  }));
} catch (err) {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
} finally {
  await browser.close();
}
