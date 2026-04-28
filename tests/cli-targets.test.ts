/**
 * v0.7.0 — parseCliTargets unit tests.
 *
 * SPEC: docs/specs/cli-multi-select.md AC3, F2, OQ4.
 */

import { describe, expect, it } from "vitest";
import { parseCliTargets, targetsInclude } from "../src/cli-targets.js";

describe("parseCliTargets — default + single", () => {
  it("undefined input → default [claude]", () => {
    const r = parseCliTargets(undefined);
    expect(r.ok).toBe(true);
    expect(r.targets).toEqual(["claude"]);
    expect(r.warnings).toHaveLength(0);
  });

  it("empty string → default [claude]", () => {
    const r = parseCliTargets("");
    expect(r.ok).toBe(true);
    expect(r.targets).toEqual(["claude"]);
  });

  it("empty array → default [claude]", () => {
    const r = parseCliTargets([]);
    expect(r.ok).toBe(true);
    expect(r.targets).toEqual(["claude"]);
  });

  it("single string 'claude' → [claude]", () => {
    const r = parseCliTargets("claude");
    expect(r.ok).toBe(true);
    expect(r.targets).toEqual(["claude"]);
  });

  it("single string 'codex' → [codex]", () => {
    const r = parseCliTargets("codex");
    expect(r.targets).toEqual(["codex"]);
  });

  it("single string 'opencode' → [opencode]", () => {
    const r = parseCliTargets("opencode");
    expect(r.targets).toEqual(["opencode"]);
  });
});

describe("parseCliTargets — multi-select (repeatable)", () => {
  it("[claude, codex] → sorted [claude, codex]", () => {
    const r = parseCliTargets(["claude", "codex"]);
    expect(r.targets).toEqual(["claude", "codex"]);
  });

  it("[codex, claude] → re-sorted [claude, codex]", () => {
    const r = parseCliTargets(["codex", "claude"]);
    expect(r.targets).toEqual(["claude", "codex"]);
  });

  it("[opencode, claude] → sorted [claude, opencode] (Claude+OpenCode 신규 조합)", () => {
    const r = parseCliTargets(["opencode", "claude"]);
    expect(r.targets).toEqual(["claude", "opencode"]);
  });

  it("[codex, opencode] → sorted [codex, opencode] (Codex+OpenCode 신규 조합)", () => {
    const r = parseCliTargets(["codex", "opencode"]);
    expect(r.targets).toEqual(["codex", "opencode"]);
  });

  it("[claude, codex, opencode] all 3 → sorted", () => {
    const r = parseCliTargets(["opencode", "codex", "claude"]);
    expect(r.targets).toEqual(["claude", "codex", "opencode"]);
  });

  it("duplicates [claude, claude] → unique [claude]", () => {
    const r = parseCliTargets(["claude", "claude"]);
    expect(r.targets).toEqual(["claude"]);
  });
});

describe("parseCliTargets — alias deprecation", () => {
  it("'both' alias → [claude, codex] + warning", () => {
    const r = parseCliTargets("both");
    expect(r.ok).toBe(true);
    expect(r.targets).toEqual(["claude", "codex"]);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain("deprecated");
    expect(r.warnings[0]).toContain("--cli claude --cli codex");
  });

  it("'all' alias → [claude, codex, opencode] + warning", () => {
    const r = parseCliTargets("all");
    expect(r.ok).toBe(true);
    expect(r.targets).toEqual(["claude", "codex", "opencode"]);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain("deprecated");
    expect(r.warnings[0]).toContain("--cli claude --cli codex --cli opencode");
  });

  it("alias + base mixed [both, opencode] → all 3 + 1 warning", () => {
    const r = parseCliTargets(["both", "opencode"]);
    expect(r.targets).toEqual(["claude", "codex", "opencode"]);
    expect(r.warnings).toHaveLength(1);
  });
});

describe("parseCliTargets — invalid reject", () => {
  it("invalid mode 'rust' → ok=false + error", () => {
    const r = parseCliTargets("rust");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Invalid --cli value");
    expect(r.error).toContain("claude");
  });

  it("typo 'claud' → ok=false", () => {
    const r = parseCliTargets("claud");
    expect(r.ok).toBe(false);
  });

  it("array with one invalid → ok=false", () => {
    const r = parseCliTargets(["claude", "rust"]);
    expect(r.ok).toBe(false);
  });
});

describe("targetsInclude", () => {
  it("[claude, codex].includes(codex) = true", () => {
    expect(targetsInclude(["claude", "codex"], "codex")).toBe(true);
  });
  it("[claude].includes(codex) = false", () => {
    expect(targetsInclude(["claude"], "codex")).toBe(false);
  });
});
