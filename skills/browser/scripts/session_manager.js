#!/usr/bin/env node
/**
 * session_manager.js — Encrypted Playwright session (storageState) persistence.
 *
 * Encryption: AES-256-GCM.
 * Key source:  CREATIVECLAW_SESSION_KEY env var (min 32 chars).
 *
 * If CREATIVECLAW_SESSION_KEY is not set, sessions are saved as plaintext
 * (development mode only — a warning is printed).
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SESSIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../sessions',
);
const ALGORITHM = 'aes-256-gcm';
const SALT      = Buffer.from('creativeclaw-session-v1');

/** Derive a 32-byte key from the env var passphrase. */
function deriveKey(passphrase) {
  return scryptSync(passphrase, SALT, 32);
}

/**
 * Encrypt `plaintext` string → base64-encoded `iv:authTag:ciphertext`.
 * @param {string} plaintext
 * @param {string} passphrase
 * @returns {string}
 */
export function encrypt(plaintext, passphrase) {
  const key    = deriveKey(passphrase);
  const iv     = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((b) => b.toString('base64')).join(':');
}

/**
 * Decrypt a base64-encoded `iv:authTag:ciphertext` string.
 * @param {string} encoded
 * @param {string} passphrase
 * @returns {string}
 */
export function decrypt(encoded, passphrase) {
  const [ivB64, authTagB64, encryptedB64] = encoded.split(':');
  const key      = deriveKey(passphrase);
  const iv       = Buffer.from(ivB64, 'base64');
  const authTag  = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

/**
 * Save Playwright storageState for a platform.
 * @param {string} platform  e.g. 'facebook', 'instagram'
 * @param {object} state     Playwright storageState object
 */
export async function saveSession(platform, state) {
  await mkdir(SESSIONS_DIR, { recursive: true });
  const json = JSON.stringify(state, null, 2);
  const key  = process.env.CREATIVECLAW_SESSION_KEY;

  if (!key) {
    console.warn('[session_manager] WARNING: CREATIVECLAW_SESSION_KEY not set — saving plaintext session (dev only).');
    await writeFile(path.join(SESSIONS_DIR, `${platform}.json`), json, 'utf8');
    return;
  }

  const encoded = encrypt(json, key);
  await writeFile(path.join(SESSIONS_DIR, `${platform}.enc`), encoded, 'utf8');
}

/**
 * Load Playwright storageState for a platform.
 * @param {string} platform
 * @returns {object|null}
 */
export async function loadSession(platform) {
  const key        = process.env.CREATIVECLAW_SESSION_KEY;
  const encPath    = path.join(SESSIONS_DIR, `${platform}.enc`);
  const plainPath  = path.join(SESSIONS_DIR, `${platform}.json`);

  if (key && existsSync(encPath)) {
    const encoded = await readFile(encPath, 'utf8');
    return JSON.parse(decrypt(encoded, key));
  }

  if (existsSync(plainPath)) {
    console.warn('[session_manager] WARNING: loading plaintext session (dev only).');
    const raw = await readFile(plainPath, 'utf8');
    return JSON.parse(raw);
  }

  return null;
}
