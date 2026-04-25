import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hasTrustEntry, registerTrustEntry } from "../../src/codex/trust-entry.js";

describe("hasTrustEntry", () => {
  it("detects an existing project block", () => {
    const cfg = `[other]\n[projects."/path/a"]\ntrust_level = "trusted"\n`;
    expect(hasTrustEntry(cfg, "/path/a")).toBe(true);
  });
  it("returns false when project missing", () => {
    expect(hasTrustEntry("", "/path/a")).toBe(false);
  });
});

describe("registerTrustEntry", () => {
  let dir: string;
  let configPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ch-trust-"));
    configPath = join(dir, "config.toml");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates the config file + appends a block when none exists", () => {
    const result = registerTrustEntry({ configPath, projectDir: "/proj" });
    expect(result.status).toBe("registered");
    const content = readFileSync(configPath, "utf8");
    expect(content).toContain('[projects."/proj"]');
    expect(content).toContain('trust_level = "trusted"');
  });

  it("is idempotent (already-present)", () => {
    registerTrustEntry({ configPath, projectDir: "/proj" });
    const second = registerTrustEntry({ configPath, projectDir: "/proj" });
    expect(second.status).toBe("already-present");
    const occurrences = readFileSync(configPath, "utf8").match(/\[projects\."\/proj"\]/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });

  it("appends a separate block for a different project dir", () => {
    registerTrustEntry({ configPath, projectDir: "/a" });
    registerTrustEntry({ configPath, projectDir: "/b" });
    const content = readFileSync(configPath, "utf8");
    expect(content).toContain('[projects."/a"]');
    expect(content).toContain('[projects."/b"]');
  });
});
