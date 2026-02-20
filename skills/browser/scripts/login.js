#!/usr/bin/env node
/**
 * login.js — Log into a website and save the session (cookies + localStorage).
 *
 * Usage:
 *   node skills/browser/scripts/login.js \
 *     --url <login-page-url> \
 *     --email-selector <css> \
 *     --password-selector <css> \
 *     --email <email> \
 *     --password <password> \
 *     --platform <name>
 *
 * On success, saves the Playwright storageState via session_manager.
 */

import { chromium } from 'playwright-core';
import { parseArgs } from 'node:util';
import { saveSession } from './session_manager.js';

const { values } = parseArgs({
  options: {
    url:               { type: 'string' },
    'email-selector':  { type: 'string', default: 'input[type="email"]' },
    'password-selector':{ type: 'string', default: 'input[type="password"]' },
    email:             { type: 'string' },
    password:          { type: 'string' },
    platform:          { type: 'string', default: 'default' },
    headed:            { type: 'boolean', default: false },
  },
});

if (!values.url || !values.email || !values.password) {
  console.error('Error: --url, --email, and --password are required');
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

  await page.goto(values.url, { waitUntil: 'domcontentloaded' });

  // Fill credentials
  await page.fill(values['email-selector'],    values.email);
  await page.fill(values['password-selector'], values.password);

  // Submit (try Enter key, fallback to button click)
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
    page.keyboard.press('Enter'),
  ]);

  // Save session
  const state = await context.storageState();
  await saveSession(values.platform, state);

  console.log(JSON.stringify({
    success: true,
    platform: values.platform,
    url: page.url(),
    title: await page.title(),
  }));
} catch (err) {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
} finally {
  await browser.close();
}
