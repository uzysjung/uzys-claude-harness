/**
 * 55 시나리오 매트릭스 — 11 Track × 5 CLI mode E2E install (v0.5.0).
 *
 * SPEC: docs/specs/new-tracks-pm-growth.md AC4 (이전 docs/specs/cli-rewrite-completeness.md F12, AC6).
 *
 * v0.5.0: 9 Track × 5 = 45 → 11 Track × 5 = 55 (+ project-management, growth-marketing).
 *
 * 검증 항목 (per scenario):
 *   1. runInstall 예외 없음 (exit 0)
 *   2. .claude/CLAUDE.md + skeleton 생성
 *   3. .mcp.json 생성 + Track별 MCP 포함
 *   4. CLI mode별 추가 산출물:
 *      - claude: .claude/만
 *      - codex/both: + AGENTS.md + .codex/{config.toml, hooks/, } + .codex-skills/
 *      - opencode: + AGENTS.md + opencode.json + .opencode/{commands/, plugins/}
 *      - all: 위 모두 동시
 *   5. installedTracks 정합성
 *
 * 실제 spawn은 mock (runExternal=null) — 외부 자산 호출 차단.
 */
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runInstall } from "../src/installer.js";
import {
  CLI_MODES,
  type CliMode,
  DEFAULT_OPTIONS,
  type InstallSpec,
  TRACKS,
  type Track,
} from "../src/types.js";

const HARNESS_ROOT = resolve(__dirname, "..");

function spec(track: Track, cli: CliMode, projectDir: string): InstallSpec {
  return {
    tracks: [track],
    options: { ...DEFAULT_OPTIONS },
    cli,
    projectDir,
  };
}

interface ExpectedArtifacts {
  agentsMd: boolean;
  codexConfig: boolean;
  opencodeJson: boolean;
}

function expectedFor(cli: CliMode): ExpectedArtifacts {
  switch (cli) {
    case "claude":
      return { agentsMd: false, codexConfig: false, opencodeJson: false };
    case "codex":
    case "both":
      return { agentsMd: true, codexConfig: true, opencodeJson: false };
    case "opencode":
      return { agentsMd: true, codexConfig: false, opencodeJson: true };
    case "all":
      return { agentsMd: true, codexConfig: true, opencodeJson: true };
  }
}

describe("11 Track × 5 CLI mode matrix (55 scenarios) — E2E install", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "ch-mtx-"));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  for (const track of TRACKS) {
    for (const cli of CLI_MODES) {
      it(`track=${track} × cli=${cli}: install completes + correct artifacts`, () => {
        const report = runInstall({
          runExternal: null,
          harnessRoot: HARNESS_ROOT,
          projectDir,
          spec: spec(track, cli, projectDir),
        });

        // 1. baseline: .claude/CLAUDE.md + .mcp.json
        expect(existsSync(join(projectDir, ".claude/CLAUDE.md"))).toBe(true);
        expect(existsSync(join(projectDir, ".claude/settings.json"))).toBe(true);
        expect(existsSync(join(projectDir, ".mcp.json"))).toBe(true);

        // 2. installed-tracks meta
        expect(report.installedTracks).toEqual([track]);

        // 3. .mcp.json includes context7 (always)
        expect(report.mcpServers).toContain("context7");

        // 4. CLI artifacts per mode
        const exp = expectedFor(cli);
        expect(existsSync(join(projectDir, "AGENTS.md"))).toBe(exp.agentsMd);
        expect(existsSync(join(projectDir, ".codex/config.toml"))).toBe(exp.codexConfig);
        expect(existsSync(join(projectDir, "opencode.json"))).toBe(exp.opencodeJson);

        // 5. mode default fresh
        expect(report.mode).toBe("fresh");

        // 6. external skipped (runExternal=null)
        expect(report.external).toBeNull();

        // 7. envFiles always present (even null mcpAllowlist when no .mcp.json yet — but here generated)
        expect(report.envFiles).toBeDefined();
        // .mcp-allowlist generated since .mcp.json was just composed
        expect(report.envFiles.mcpAllowlist).not.toBeNull();
      });
    }
  }
});

describe("Matrix invariants — cross-cutting", () => {
  let projectDir: string;
  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "ch-inv-"));
  });
  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("count check: TRACKS.length=11 × CLI_MODES.length=5 = 55 scenarios (v0.5.0)", () => {
    expect(TRACKS.length).toBe(11);
    expect(CLI_MODES.length).toBe(5);
    expect(TRACKS.length * CLI_MODES.length).toBe(55);
  });

  it("csr-supabase + claude: .env.example generated (csr-supabase Track 한정)", () => {
    const report = runInstall({
      runExternal: null,
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: spec("csr-supabase", "claude", projectDir),
    });
    expect(report.envFiles.envExampleCreated).toBe(true);
    expect(existsSync(join(projectDir, ".env.example"))).toBe(true);
  });

  it("tooling + claude: .env.example NOT generated (non-supabase Track)", () => {
    const report = runInstall({
      runExternal: null,
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: spec("tooling", "claude", projectDir),
    });
    expect(report.envFiles.envExampleCreated).toBe(false);
    expect(existsSync(join(projectDir, ".env.example"))).toBe(false);
  });

  it("any track + cli=opencode: opencode.json plugin key + commands dir present", () => {
    runInstall({
      runExternal: null,
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: spec("tooling", "opencode", projectDir),
    });
    expect(existsSync(join(projectDir, "opencode.json"))).toBe(true);
    expect(existsSync(join(projectDir, ".opencode/commands"))).toBe(true);
    expect(existsSync(join(projectDir, ".opencode/plugins/uzys-harness.ts"))).toBe(true);
  });

  it("any track + cli=all: 3 CLI artifacts side-by-side", () => {
    runInstall({
      runExternal: null,
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: spec("tooling", "all", projectDir),
    });
    // Claude
    expect(existsSync(join(projectDir, ".claude/CLAUDE.md"))).toBe(true);
    // Codex
    expect(existsSync(join(projectDir, ".codex/config.toml"))).toBe(true);
    expect(existsSync(join(projectDir, "AGENTS.md"))).toBe(true);
    // OpenCode
    expect(existsSync(join(projectDir, "opencode.json"))).toBe(true);
  });

  it("Codex global opt-in stays OFF when withCodexSkills/withCodexTrust=false (D16)", () => {
    const report = runInstall({
      runExternal: null,
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: spec("tooling", "codex", projectDir),
    });
    // codexOptIn null when both flags false
    expect(report.codexOptIn).toBeNull();
  });
});
