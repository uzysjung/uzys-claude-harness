import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runInstall } from "../../src/installer.js";

const HARNESS_ROOT = resolve(__dirname, "../..");

describe("OpenCode install pipeline (integration)", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "ch-opencode-install-"));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("tooling + --cli=opencode: writes baseline + AGENTS.md + opencode.json + .opencode/{commands,plugins}", () => {
    const report = runInstall({
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: {
        tracks: ["tooling"],
        options: {
          withTauri: false,
          withGsd: false,
          withEcc: false,
          withPrune: false,
          withTob: false,
        },
        cli: "opencode",
        projectDir,
      },
    });

    expect(report.opencode).not.toBeNull();
    expect(report.codex).toBeNull();

    // Baseline still installed
    expect(existsSync(join(projectDir, ".claude/CLAUDE.md"))).toBe(true);
    expect(existsSync(join(projectDir, ".mcp.json"))).toBe(true);

    // OpenCode artifacts
    expect(existsSync(join(projectDir, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(projectDir, "opencode.json"))).toBe(true);
    expect(existsSync(join(projectDir, ".opencode/plugins/uzys-harness.ts"))).toBe(true);

    for (const phase of ["spec", "plan", "build", "test", "review", "ship"]) {
      expect(existsSync(join(projectDir, ".opencode/commands", `uzys-${phase}.md`))).toBe(true);
    }

    // opencode.json structure
    const opencode = JSON.parse(readFileSync(join(projectDir, "opencode.json"), "utf8"));
    expect(opencode.$schema).toBe("https://opencode.ai/config.json");
    expect(opencode.plugin).toContain("./.opencode/plugins/uzys-harness.ts");
    // mcp populated from .mcp.json
    expect(Object.keys(opencode.mcp).length).toBeGreaterThan(0);
    expect(opencode.mcp.context7).toBeDefined();

    // AGENTS.md slash-renamed
    const agents = readFileSync(join(projectDir, "AGENTS.md"), "utf8");
    expect(agents).not.toContain("/uzys:");
    expect(agents).toContain("/uzys-");
  });

  it("tooling + --cli=all: writes Claude + Codex + OpenCode all 3", () => {
    const report = runInstall({
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: {
        tracks: ["tooling"],
        options: {
          withTauri: false,
          withGsd: false,
          withEcc: false,
          withPrune: false,
          withTob: false,
        },
        cli: "all",
        projectDir,
      },
    });

    expect(report.codex).not.toBeNull();
    expect(report.opencode).not.toBeNull();

    // Baseline
    expect(existsSync(join(projectDir, ".claude/CLAUDE.md"))).toBe(true);
    // Codex
    expect(existsSync(join(projectDir, ".codex/config.toml"))).toBe(true);
    // OpenCode
    expect(existsSync(join(projectDir, "opencode.json"))).toBe(true);
    expect(existsSync(join(projectDir, ".opencode/plugins/uzys-harness.ts"))).toBe(true);
  });

  it("--cli=claude does NOT generate OpenCode artifacts", () => {
    const report = runInstall({
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: {
        tracks: ["tooling"],
        options: {
          withTauri: false,
          withGsd: false,
          withEcc: false,
          withPrune: false,
          withTob: false,
        },
        cli: "claude",
        projectDir,
      },
    });

    expect(report.opencode).toBeNull();
    expect(existsSync(join(projectDir, "opencode.json"))).toBe(false);
    expect(existsSync(join(projectDir, ".opencode"))).toBe(false);
  });

  it("--cli=both (Codex 1차 호환) does NOT generate OpenCode", () => {
    const report = runInstall({
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: {
        tracks: ["tooling"],
        options: {
          withTauri: false,
          withGsd: false,
          withEcc: false,
          withPrune: false,
          withTob: false,
        },
        cli: "both",
        projectDir,
      },
    });

    expect(report.codex).not.toBeNull();
    expect(report.opencode).toBeNull();
    expect(existsSync(join(projectDir, ".codex/config.toml"))).toBe(true);
    expect(existsSync(join(projectDir, ".opencode"))).toBe(false);
  });
});
