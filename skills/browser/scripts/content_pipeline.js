#!/usr/bin/env node
/**
 * content_pipeline.js — Full pipeline: Prompt → AI Image → Social Media Post.
 *
 * Usage:
 *   node skills/browser/scripts/content_pipeline.js \
 *     --prompt "A vibrant sunset over the ocean" \
 *     --message "Good evening! 🌅" \
 *     --platforms facebook,instagram \
 *     [--image-script skills/openai-image-gen/scripts/generate.js]
 *
 * Steps:
 *   1. Calls the image generation script with --prompt.
 *   2. For each platform in --platforms, calls the appropriate post script.
 */

import { parseArgs } from 'node:util';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const { values } = parseArgs({
  options: {
    prompt:         { type: 'string' },
    message:        { type: 'string', default: '' },
    platforms:      { type: 'string', default: 'facebook' },
    'image-script': { type: 'string', default: 'skills/openai-image-gen/scripts/generate.js' },
    'image':        { type: 'string' }, // skip generation if provided
    headed:         { type: 'boolean', default: false },
  },
});

if (!values.prompt && !values.image) {
  console.error('Error: --prompt or --image is required');
  process.exit(1);
}

const platforms = values.platforms.split(',').map((p) => p.trim().toLowerCase());
const headedFlag = values.headed ? '--headed' : '';

// ── Step 1: Generate image ──────────────────────────────────────────────────

let imagePath = values.image;

if (!imagePath) {
  const imageScript = path.resolve(values['image-script']);
  if (!existsSync(imageScript)) {
    console.error(`Error: image-script not found: ${imageScript}`);
    console.error('Install the openai-image-gen skill or pass --image <path>');
    process.exit(1);
  }

  const outputPath = path.join(os.tmpdir(), `creativeclaw-pipeline-${Date.now()}.png`);
  console.log(`[pipeline] Generating image for prompt: "${values.prompt}"`);

  try {
    const result = execSync(
      `node ${JSON.stringify(imageScript)} --prompt ${JSON.stringify(values.prompt)} --output ${JSON.stringify(outputPath)}`,
      { encoding: 'utf8', stdio: 'pipe' },
    );
    const parsed = JSON.parse(result.trim());
    imagePath = parsed.output ?? outputPath;
    console.log(`[pipeline] Image generated: ${imagePath}`);
  } catch (err) {
    console.error(`[pipeline] Image generation failed: ${err.message}`);
    process.exit(1);
  }
}

// ── Step 2: Post to each platform ──────────────────────────────────────────

const scriptsDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''));
const results = [];

for (const platform of platforms) {
  const postScript = path.resolve(scriptsDir, `${platform}_post.js`);
  if (!existsSync(postScript)) {
    console.warn(`[pipeline] No post script found for platform: ${platform} (${postScript})`);
    results.push({ platform, success: false, error: 'No post script' });
    continue;
  }

  console.log(`[pipeline] Posting to ${platform}…`);
  try {
    const args = [
      `--image ${JSON.stringify(imagePath)}`,
      values.message ? `--message ${JSON.stringify(values.message)}` : '',
      values.message ? `--caption ${JSON.stringify(values.message)}` : '',
      headedFlag,
    ].filter(Boolean).join(' ');

    const result = execSync(`node ${JSON.stringify(postScript)} ${args}`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    const parsed = JSON.parse(result.trim());
    console.log(`[pipeline] ${platform}: ${parsed.success ? 'SUCCESS' : 'FAILED'}`);
    results.push({ platform, ...parsed });
  } catch (err) {
    console.error(`[pipeline] ${platform} failed: ${err.message}`);
    results.push({ platform, success: false, error: err.message });
  }
}

console.log(JSON.stringify({ pipeline: 'complete', results }, null, 2));
