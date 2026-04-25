import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCodexTransform } from "../../src/codex/transform.js";

const HARNESS_ROOT = resolve(__dirname, "../..");

describe("runCodexTransform (E2E against templates/)", () => {
  let project: string;

  beforeEach(() => {
    project = mkdtempSync(join(tmpdir(), "ch-codex-"));
  });

  afterEach(() => {
    rmSync(project, { recursive: true, force: true });
  });

  it("produces AGENTS.md, .codex/config.toml, hooks, skills", () => {
    const report = runCodexTransform({ harnessRoot: HARNESS_ROOT, projectDir: project });
    expect(existsSync(report.agentsMdPath)).toBe(true);
    expect(existsSync(report.configTomlPath)).toBe(true);
    expect(report.hookFiles).toHaveLength(3);
    expect(report.skillFiles).toHaveLength(6);

    const agents = readFileSync(report.agentsMdPath, "utf8");
    expect(agents).not.toContain("/uzys:");
    expect(agents).toContain("/uzys-");

    const config = readFileSync(report.configTomlPath, "utf8");
    expect(config).toContain("[features]");
    expect(config).toContain("[mcp_servers."); // .mcp.json injected at least 1 server

    for (const hook of report.hookFiles) {
      expect(readFileSync(hook, "utf8")).not.toContain("CLAUDE_PROJECT_DIR");
    }

    for (const skill of report.skillFiles) {
      const body = readFileSync(skill, "utf8");
      expect(body.startsWith("---")).toBe(true);
      expect(body).toMatch(/name: uzys-(spec|plan|build|test|review|ship)/);
    }
  });

  it("throws when required template missing", () => {
    expect(() => runCodexTransform({ harnessRoot: "/no/such/root", projectDir: project })).toThrow(
      /required source missing/,
    );
  });
});
