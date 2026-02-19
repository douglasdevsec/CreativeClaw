import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { captureEnv } from "../src/test-utils/env.js";

describe("creative gateway", () => {
  let store: typeof import("../src/media/store.js");
  let home = "";
  let envSnapshot: ReturnType<typeof captureEnv>;

  beforeAll(async () => {
    envSnapshot = captureEnv([
      "HOME",
      "USERPROFILE",
      "HOMEDRIVE",
      "HOMEPATH",
      "OPENCLAW_STATE_DIR",
    ]);
    home = await fs.mkdtemp(path.join(os.tmpdir(), "creative-test-home-"));
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    process.env.OPENCLAW_STATE_DIR = path.join(home, ".openclaw");
    
    await fs.mkdir(path.join(home, ".openclaw"), { recursive: true });
    // Dynamic import to pick up the env vars
    store = await import("../src/media/store.js");
  });

  afterAll(async () => {
    envSnapshot.restore();
    try {
      await fs.rm(home, { recursive: true, force: true });
    } catch {}
  });

  it("supports large files (>5MB) via streaming", async () => {
    // Create a 10MB dummy file (exceeds old 5MB limit, well within new 2GB limit)
    const largeFilePath = path.join(home, "large-test.bin");
    const size = 10 * 1024 * 1024;
    const chunk = Buffer.alloc(1024 * 1024, "a"); // 1MB chunk
    
    const token = await fs.open(largeFilePath, "w");
    for (let i = 0; i < 10; i++) {
        await token.write(chunk);
    }
    await token.close();

    const stats = await fs.stat(largeFilePath);
    expect(stats.size).toBe(size);

    // Attempt to save
    const saved = await store.saveMediaSource(largeFilePath);
    
    // Verify
    expect(saved.size).toBe(size);
    const savedStat = await fs.stat(saved.path);
    expect(savedStat.size).toBe(size);
  });
});
