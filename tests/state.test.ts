import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectInstallState } from "../src/state.js";

describe("detectInstallState", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ch-state-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns state=new when .claude/ does not exist", () => {
    const result = detectInstallState(dir);
    expect(result.state).toBe("new");
    expect(result.tracks).toEqual([]);
    expect(result.source).toBe("none");
    expect(result.hasClaudeDir).toBe(false);
  });

  it("reads .claude/.installed-tracks when present (metafile source)", () => {
    mkdirSync(join(dir, ".claude"), { recursive: true });
    writeFileSync(join(dir, ".claude/.installed-tracks"), "tooling\ncsr-fastapi\n");
    const result = detectInstallState(dir);
    expect(result.state).toBe("existing");
    expect(result.source).toBe("metafile");
    expect(result.tracks).toEqual(["csr-fastapi", "tooling"]);
  });

  it("dedupes + sorts tracks from metafile", () => {
    mkdirSync(join(dir, ".claude"), { recursive: true });
    writeFileSync(join(dir, ".claude/.installed-tracks"), "tooling tooling\ndata\ntooling\n");
    const result = detectInstallState(dir);
    expect(result.tracks).toEqual(["data", "tooling"]);
  });

  it("ignores unknown tokens in metafile", () => {
    mkdirSync(join(dir, ".claude"), { recursive: true });
    writeFileSync(join(dir, ".claude/.installed-tracks"), "tooling unknown\nbogus\n");
    const result = detectInstallState(dir);
    expect(result.tracks).toEqual(["tooling"]);
  });

  it("falls back to legacy rules/*.md heuristic when metafile missing", () => {
    mkdirSync(join(dir, ".claude/rules"), { recursive: true });
    writeFileSync(join(dir, ".claude/rules/htmx.md"), "");
    writeFileSync(join(dir, ".claude/rules/cli-development.md"), "");
    const result = detectInstallState(dir);
    expect(result.source).toBe("legacy");
    expect(result.tracks).toEqual(["ssr-htmx", "tooling"]);
  });

  it("legacy: pyside6.md OR data-analysis.md both map to data (deduped)", () => {
    mkdirSync(join(dir, ".claude/rules"), { recursive: true });
    writeFileSync(join(dir, ".claude/rules/pyside6.md"), "");
    writeFileSync(join(dir, ".claude/rules/data-analysis.md"), "");
    const result = detectInstallState(dir);
    expect(result.tracks).toEqual(["data"]);
  });

  it("legacy: returns empty tracks when rules/ missing entirely", () => {
    mkdirSync(join(dir, ".claude"), { recursive: true });
    const result = detectInstallState(dir);
    expect(result.state).toBe("existing");
    expect(result.source).toBe("legacy");
    expect(result.tracks).toEqual([]);
  });

  it("legacy: returns existing-but-empty when rules dir present but no signatures match", () => {
    mkdirSync(join(dir, ".claude/rules"), { recursive: true });
    writeFileSync(join(dir, ".claude/rules/random.md"), "");
    const result = detectInstallState(dir);
    expect(result.state).toBe("existing");
    expect(result.source).toBe("legacy");
    expect(result.tracks).toEqual([]);
  });
});
