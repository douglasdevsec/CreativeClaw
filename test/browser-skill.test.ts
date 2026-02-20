/**
 * browser-skill.test.ts — Unit tests for the browser skill scripts.
 *
 * Tests the session_manager encryption/decryption in isolation
 * (no real browser launched in CI).
 */

import { describe, it, expect } from 'vitest';

// ── Inline encryption logic (mirrors session_manager.js) ──────────────────
// We test the crypto logic directly here to avoid module-level side-effects
// from playwright-core initialization during unit tests.

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT      = Buffer.from('creativeclaw-session-v1');

function deriveKey(passphrase: string): Buffer {
  return scryptSync(passphrase, SALT, 32) as Buffer;
}

function encrypt(plaintext: string, passphrase: string): string {
  const key     = deriveKey(passphrase);
  const iv      = randomBytes(12);
  const cipher  = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((b) => b.toString('base64')).join(':');
}

function decrypt(encoded: string, passphrase: string): string {
  const [ivB64, authTagB64, encryptedB64] = encoded.split(':');
  const key      = deriveKey(passphrase);
  const iv       = Buffer.from(ivB64, 'base64');
  const authTag  = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

// ────────────────────────────────────────────────────────────────────────────

const PASSPHRASE = 'creativeclaw-passphrase-for-testing-32x!';

describe('session_manager — AES-256-GCM encryption', () => {
  it('encrypts to a valid iv:authTag:ciphertext format', () => {
    const encoded = encrypt('test', PASSPHRASE);
    const parts   = encoded.split(':');
    expect(parts).toHaveLength(3);
    // Each part is a non-empty base64 string
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(0);
    }
  });

  it('roundtrip: encrypt then decrypt returns original', () => {
    const original = JSON.stringify({ cookies: [{ name: 'auth', value: 'tok123', domain: '.facebook.com' }] });
    const encoded  = encrypt(original, PASSPHRASE);
    const decoded  = decrypt(encoded, PASSPHRASE);
    expect(decoded).toBe(original);
  });

  it('produces different ciphertext each call (random IV)', () => {
    const msg  = 'hello world';
    const enc1 = encrypt(msg, PASSPHRASE);
    const enc2 = encrypt(msg, PASSPHRASE);
    // IVs differ so the full encoded strings differ
    expect(enc1).not.toBe(enc2);
    // But both decrypt correctly
    expect(decrypt(enc1, PASSPHRASE)).toBe(msg);
    expect(decrypt(enc2, PASSPHRASE)).toBe(msg);
  });

  it('throws with wrong passphrase (GCM auth tag mismatch)', () => {
    const encoded = encrypt('secret', PASSPHRASE);
    expect(() => decrypt(encoded, 'completelywrongpassphrasethatdoes!')).toThrow();
  });

  it('handles large session objects', () => {
    const largeState = {
      cookies: Array.from({ length: 50 }, (_, i) => ({
        name: `cookie_${i}`,
        value: `value_${'x'.repeat(200)}`,
        domain: '.example.com',
      })),
      origins: [],
    };
    const json    = JSON.stringify(largeState);
    const encoded = encrypt(json, PASSPHRASE);
    const decoded = decrypt(encoded, PASSPHRASE);
    expect(JSON.parse(decoded)).toMatchObject({ cookies: expect.any(Array) });
    expect(JSON.parse(decoded).cookies).toHaveLength(50);
  });
});

// ── playwright-core availability ─────────────────────────────────────────

describe('playwright-core', () => {
  it('exports chromium with launch and executablePath', async () => {
    const { chromium } = await import('playwright-core');
    expect(typeof chromium.launch).toBe('function');
    expect(typeof chromium.executablePath).toBe('function');
  });
});
