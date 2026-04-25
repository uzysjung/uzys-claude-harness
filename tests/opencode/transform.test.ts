import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runOpencodeTransform } from "../../src/opencode/transform.js";

const HARNESS_ROOT = resolve(__dirname, "../..");

describe("runOpencodeTransform (E2E against templates/)", () => {
  let project: string;

  beforeEach(() => {
    project = mkdtempSync(join(tmpdir(), "ch-opencode-"));
  });

  afterEach(() => {
    rmSync(project, { recursive: true, force: true });
  });

  it("produces AGENTS.md, opencode.json, 6 commands, plugin", () => {
    const report = runOpencodeTransform({ harnessRoot: HARNESS_ROOT, projectDir: project });
    expect(existsSync(report.agentsMdPath)).toBe(true);
    expect(existsSync(report.opencodeJsonPath)).toBe(true);
    expect(report.commandFiles).toHaveLength(6);
    expect(existsSync(report.pluginPath)).toBe(true);

    const agents = readFileSync(report.agentsMdPath, "utf8");
    expect(agents).not.toContain("/uzys:");
    expect(agents).toContain("/uzys-");
    expect(agents).toContain("OpenCode");

    const opencode = JSON.parse(readFileSync(report.opencodeJsonPath, "utf8"));
    expect(opencode.$schema).toBe("https://opencode.ai/config.json");
    expect(opencode.plugin).toContain("./.opencode/plugins/uzys-harness.ts");
    // .mcp.json injects at least one entry into mcp.<name>
    expect(Object.keys(opencode.mcp).length).toBeGreaterThan(0);

    for (const cmd of report.commandFiles) {
      const body = readFileSync(cmd, "utf8");
      expect(body.startsWith("---")).toBe(true);
      expect(body).toMatch(/agent: (build|plan)/);
      expect(body).toMatch(/description:/);
      expect(body).not.toContain("/uzys:");
    }

    const plugin = readFileSync(report.pluginPath, "utf8");
    expect(plugin).toContain("tool.execute.before");
    expect(plugin).toContain("messageCreated");
  });

  it("throws when required template missing", () => {
    expect(() =>
      runOpencodeTransform({ harnessRoot: "/no/such/root", projectDir: project }),
    ).toThrow(/required source missing/);
  });

  it("falls back to bundled command stub when templates/commands/uzys/<phase>.md absent", () => {
    // Create a synthetic harnessRoot with only the OpenCode-specific bits + CLAUDE.md.
    const fakeRoot = mkdtempSync(join(tmpdir(), "ch-opencode-fake-"));
    try {
      // Mirror minimal templates/ (no templates/commands/uzys/, force fallback path).
      const { mkdirSync, copyFileSync: cp, writeFileSync: wf } = require("node:fs");
      mkdirSync(join(fakeRoot, "templates/opencode/.opencode/commands"), { recursive: true });
      mkdirSync(join(fakeRoot, "templates/opencode/.opencode/plugins"), { recursive: true });
      wf(join(fakeRoot, "templates/CLAUDE.md"), "# fake\n## Identity\n\nbody\n");
      cp(
        join(HARNESS_ROOT, "templates/opencode/AGENTS.md.template"),
        join(fakeRoot, "templates/opencode/AGENTS.md.template"),
      );
      cp(
        join(HARNESS_ROOT, "templates/opencode/opencode.json.template"),
        join(fakeRoot, "templates/opencode/opencode.json.template"),
      );
      // Copy the 6 stub commands so fallback path is taken.
      for (const phase of ["spec", "plan", "build", "test", "review", "ship"]) {
        cp(
          join(HARNESS_ROOT, "templates/opencode/.opencode/commands", `uzys-${phase}.md`),
          join(fakeRoot, "templates/opencode/.opencode/commands", `uzys-${phase}.md`),
        );
      }
      cp(
        join(HARNESS_ROOT, "templates/opencode/.opencode/plugins/uzys-harness.ts"),
        join(fakeRoot, "templates/opencode/.opencode/plugins/uzys-harness.ts"),
      );

      const report = runOpencodeTransform({ harnessRoot: fakeRoot, projectDir: project });
      expect(report.commandFiles).toHaveLength(6);
      // No mcp source → top-level mcp empty (template default removed only when source provided)
      const opencode = JSON.parse(readFileSync(report.opencodeJsonPath, "utf8"));
      expect(opencode).toHaveProperty("mcp");
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });

  it("creates plugin stub even when template plugin file missing", () => {
    const fakeRoot = mkdtempSync(join(tmpdir(), "ch-opencode-noplugin-"));
    try {
      const { mkdirSync, copyFileSync: cp, writeFileSync: wf } = require("node:fs");
      mkdirSync(join(fakeRoot, "templates/opencode/.opencode/commands"), { recursive: true });
      // Intentionally NO plugins dir
      wf(join(fakeRoot, "templates/CLAUDE.md"), "# fake\n## Identity\n\nbody\n");
      cp(
        join(HARNESS_ROOT, "templates/opencode/AGENTS.md.template"),
        join(fakeRoot, "templates/opencode/AGENTS.md.template"),
      );
      cp(
        join(HARNESS_ROOT, "templates/opencode/opencode.json.template"),
        join(fakeRoot, "templates/opencode/opencode.json.template"),
      );
      for (const phase of ["spec", "plan", "build", "test", "review", "ship"]) {
        cp(
          join(HARNESS_ROOT, "templates/opencode/.opencode/commands", `uzys-${phase}.md`),
          join(fakeRoot, "templates/opencode/.opencode/commands", `uzys-${phase}.md`),
        );
      }

      const report = runOpencodeTransform({ harnessRoot: fakeRoot, projectDir: project });
      const plugin = readFileSync(report.pluginPath, "utf8");
      expect(plugin).toContain("plugin stub");
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });
});
