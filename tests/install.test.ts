import { describe, expect, it, vi } from "vitest";
import { executeSpec, installAction, specFromOptions } from "../src/commands/install.js";
import type { InstallReport } from "../src/installer.js";
import type { InstallSpec, Track } from "../src/types.js";

const fakeReport: InstallReport = {
  filesCopied: 5,
  dirsCopied: 2,
  skipped: 0,
  backup: null,
  installedTracks: ["tooling"],
  mcpServers: ["context7"],
  codex: null,
  opencode: null,
  external: null,
  envFiles: {
    envExampleCreated: false,
    gitignoreEnvAdded: false,
    mcpAllowlist: null,
  },
};

describe("specFromOptions", () => {
  it("returns ok=true with valid options", () => {
    const result = specFromOptions({ cli: "codex", track: ["tooling"] });
    expect(result.ok).toBe(true);
    expect(result.cli).toBe("codex");
  });

  it.each(["claude", "codex", "opencode", "both", "all"] as const)(
    "accepts %s as a valid --cli",
    (mode) => {
      const result = specFromOptions({ cli: mode, track: ["tooling"] });
      expect(result.ok).toBe(true);
      expect(result.cli).toBe(mode);
    },
  );

  it("rejects an unknown --cli value with ok=false", () => {
    const result = specFromOptions({ cli: "rust", track: ["tooling"] });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("must be one of");
    expect(result.message).toContain("rust");
  });

  it("rejects when --track is missing/empty", () => {
    const noTrack = specFromOptions({ cli: "claude" });
    expect(noTrack.ok).toBe(false);
    expect(noTrack.message).toContain("--track is required");

    const empty = specFromOptions({ cli: "claude", track: [] });
    expect(empty.ok).toBe(false);
  });

  it("rejects an unknown track name", () => {
    const result = specFromOptions({ cli: "claude", track: ["bogus"] });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Unknown track");
  });

  it("defaults --cli to claude when omitted but track is valid", () => {
    const result = specFromOptions({ track: ["tooling"] });
    expect(result.ok).toBe(true);
    expect(result.cli).toBe("claude");
  });
});

describe("installAction", () => {
  it("logs install report on success", () => {
    const log = vi.fn();
    const err = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn((_spec: InstallSpec, _root: string) => fakeReport);
    installAction(
      { cli: "codex", track: ["tooling"], projectDir: "/tmp/p" },
      { log, err, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    expect(err).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Install complete"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("tooling"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("5 files"));
    expect(runPipeline).toHaveBeenCalledOnce();
  });

  it("calls err + exit(1) on invalid --cli", () => {
    const log = vi.fn();
    const err = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn();
    installAction(
      { cli: "rust", track: ["tooling"] },
      { log, err, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    expect(err).toHaveBeenCalledWith(expect.stringContaining("must be one of"));
    expect(exit).toHaveBeenCalledWith(1);
    expect(runPipeline).not.toHaveBeenCalled();
  });

  it("calls err + exit(1) when pipeline throws", () => {
    const log = vi.fn();
    const err = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => {
      throw new Error("boom");
    });
    installAction(
      { cli: "claude", track: ["tooling"] },
      { log, err, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    expect(err).toHaveBeenCalledWith(expect.stringContaining("install failed"));
    expect(err).toHaveBeenCalledWith(expect.stringContaining("boom"));
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("normalizes --with-prune → --with-ecc=true in spec", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    let captured: InstallSpec | undefined;
    const runPipeline = vi.fn((spec: InstallSpec) => {
      captured = spec;
      return fakeReport;
    });
    installAction(
      { cli: "claude", track: ["tooling"], withPrune: true, projectDir: "/p" },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    expect(captured?.options.withPrune).toBe(true);
    expect(captured?.options.withEcc).toBe(true);
  });

  it("logs backup path when pipeline returns one", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => ({ ...fakeReport, backup: "/backup/.claude.bak" }));
    installAction(
      { cli: "claude", track: ["tooling"] },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining("/backup/.claude.bak"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("/backup/.claude.bak"));
  });

  it("logs '(none)' for MCP servers when list is empty", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => ({ ...fakeReport, mcpServers: [] }));
    installAction(
      { cli: "claude", track: ["tooling"] },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining("(none)"));
  });
});

describe("executeSpec", () => {
  const baseSpec: InstallSpec = {
    tracks: ["tooling"],
    options: {
      withTauri: false,
      withGsd: false,
      withEcc: false,
      withPrune: false,
      withTob: false,
    },
    cli: "claude",
    projectDir: "/p",
  };

  it("logs install report on success (claude only)", () => {
    const log = vi.fn();
    const err = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => fakeReport);
    executeSpec(baseSpec, { log, err, exit, runPipeline, resolveHarnessRoot: () => "/h" });
    expect(err).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Install complete"));
    expect(runPipeline).toHaveBeenCalledOnce();
  });

  it("renders Codex line when report.codex is present", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => ({
      ...fakeReport,
      codex: {
        agentsMdPath: "/p/AGENTS.md",
        configTomlPath: "/p/.codex/config.toml",
        hookFiles: ["/p/.codex/hooks/a.sh", "/p/.codex/hooks/b.sh"],
        skillFiles: ["/p/.codex-skills/uzys-spec/SKILL.md"],
      },
    }));
    executeSpec(
      { ...baseSpec, cli: "codex" },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Codex"));
  });

  it("renders OpenCode line when report.opencode is present", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => ({
      ...fakeReport,
      opencode: {
        agentsMdPath: "/p/AGENTS.md",
        opencodeJsonPath: "/p/opencode.json",
        commandFiles: Array.from({ length: 6 }, (_, i) => `/p/.opencode/commands/uzys-${i}.md`),
        pluginPath: "/p/.opencode/plugins/uzys-harness.ts",
      },
    }));
    executeSpec(
      { ...baseSpec, cli: "opencode" },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining("OpenCode"));
  });

  it("logs warn when skipped > 0", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => ({ ...fakeReport, skipped: 3 }));
    executeSpec(baseSpec, { log, exit, runPipeline, resolveHarnessRoot: () => "/h" });
    // skipped row is rendered with `assetRow("skip", ...)` → contains the count
    expect(log).toHaveBeenCalledWith(expect.stringContaining("skipped"));
  });

  it("logs Backup info when report.backup present", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => ({ ...fakeReport, backup: "/p/.claude.backup-123" }));
    executeSpec(baseSpec, { log, exit, runPipeline, resolveHarnessRoot: () => "/h" });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("/p/.claude.backup-123"));
  });

  it("renders 'Claude · Codex · OpenCode' line for cli=all", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => ({
      ...fakeReport,
      codex: {
        agentsMdPath: "/p/AGENTS.md",
        configTomlPath: "/p/.codex/config.toml",
        hookFiles: [],
        skillFiles: [],
      },
      opencode: {
        agentsMdPath: "/p/AGENTS.md",
        opencodeJsonPath: "/p/opencode.json",
        commandFiles: [],
        pluginPath: "/p/.opencode/plugins/uzys-harness.ts",
      },
    }));
    executeSpec(
      { ...baseSpec, cli: "all" },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Claude · Codex · OpenCode"));
  });

  it("renders 'Claude · Codex' line for cli=both (Codex only)", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => ({
      ...fakeReport,
      codex: {
        agentsMdPath: "/p/AGENTS.md",
        configTomlPath: "/p/.codex/config.toml",
        hookFiles: [],
        skillFiles: [],
      },
    }));
    executeSpec(
      { ...baseSpec, cli: "both" },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Claude · Codex"));
  });

  it("renders 'Claude · OpenCode' line when only opencode present", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => ({
      ...fakeReport,
      opencode: {
        agentsMdPath: "/p/AGENTS.md",
        opencodeJsonPath: "/p/opencode.json",
        commandFiles: [],
        pluginPath: "/p/.opencode/plugins/uzys-harness.ts",
      },
    }));
    executeSpec(
      { ...baseSpec, cli: "opencode" },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Claude · OpenCode"));
  });

  it("shortens long /private/tmp paths in TARGET row", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => fakeReport);
    executeSpec(
      {
        ...baseSpec,
        projectDir: "/private/tmp/some-very-long-path-that-exceeds-fifty-characters",
      },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    const targetCall = log.mock.calls.find((args) =>
      typeof args[0] === "string" ? args[0].includes("TARGET") : false,
    );
    // /private prefix dropped
    expect(targetCall?.[0]).not.toContain("/private/");
    expect(targetCall?.[0]).toContain("/tmp/");
  });

  it("shortens HOME-relative paths in TARGET row", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => fakeReport);
    const home = process.env.HOME ?? "/Users/test";
    process.env.HOME = home;
    executeSpec(
      {
        ...baseSpec,
        projectDir: `${home}/some-very-long-project-name-here-that-is-over-fifty-chars`,
      },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    const targetCall = log.mock.calls.find((args) =>
      typeof args[0] === "string" ? args[0].includes("TARGET") : false,
    );
    expect(targetCall?.[0]).toContain("~/");
  });

  it("formatOptions reflects enabled flags", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => fakeReport);
    executeSpec(
      {
        ...baseSpec,
        options: {
          withTauri: true,
          withGsd: true,
          withEcc: true,
          withPrune: true,
          withTob: true,
        },
      },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    // OPTIONS row contains all flag labels
    const optsCall = log.mock.calls.find((args) =>
      typeof args[0] === "string" ? args[0].includes("OPTIONS") : false,
    );
    expect(optsCall?.[0]).toContain("tauri");
    expect(optsCall?.[0]).toContain("ecc");
    expect(optsCall?.[0]).toContain("tob");
  });

  it("renders Phase 2 (External Assets) when report.external has attempted entries", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline: (s: InstallSpec, h: string) => InstallReport = () => ({
      ...fakeReport,
      external: {
        attempted: [
          {
            asset: {
              id: "test-skill",
              description: "test",
              condition: { kind: "any-track" as const, tracks: ["tooling"] as Track[] },
              method: { kind: "skill", source: "owner/repo", skill: "react" } as const,
            },
            ok: true,
          },
          {
            asset: {
              id: "test-plugin",
              description: "plugin",
              condition: { kind: "any-track" as const, tracks: ["tooling"] as Track[] },
              method: { kind: "plugin", marketplace: "ms/foo", pluginId: "foo@ms" } as const,
            },
            ok: true,
          },
          {
            asset: {
              id: "test-npm",
              description: "npm pkg",
              condition: { kind: "any-track" as const, tracks: ["tooling"] as Track[] },
              method: { kind: "npm-global", pkg: "vercel" } as const,
            },
            ok: true,
          },
          {
            asset: {
              id: "test-npx",
              description: "npx",
              condition: { kind: "any-track" as const, tracks: ["tooling"] as Track[] },
              method: { kind: "npx-run", cmd: "gsd@latest" } as const,
            },
            ok: true,
          },
          {
            asset: {
              id: "test-shell",
              description: "shell",
              condition: { kind: "any-track" as const, tracks: ["tooling"] as Track[] },
              method: {
                kind: "shell-script",
                script: "scripts/x.sh",
                args: [],
              } as const,
            },
            ok: false,
            message: "script missing",
          },
        ],
        succeeded: 4,
        skipped: 1,
      },
    });
    executeSpec(baseSpec, { log, exit, runPipeline, resolveHarnessRoot: () => "/h" });
    // Each asset id rendered
    expect(log).toHaveBeenCalledWith(expect.stringContaining("test-skill"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("test-plugin"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("test-npm"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("test-npx"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("test-shell"));
    // formatAssetMeta covered each kind
    expect(log).toHaveBeenCalledWith(expect.stringContaining("owner/repo · react"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("foo@ms"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("npm install -g vercel"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("npx gsd@latest"));
    // failed asset shows error message
    expect(log).toHaveBeenCalledWith(expect.stringContaining("script missing"));
    // Phase 2 header rendered
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Phase 2"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("External Assets"));
    // Summary WARN line for skipped
    expect(log).toHaveBeenCalledWith(expect.stringContaining("1 external asset"));
  });

  it("renders Phase 3 (instead of 2) for codex when external assets phase is rendered", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline: (s: InstallSpec, h: string) => InstallReport = () => ({
      ...fakeReport,
      external: {
        attempted: [
          {
            asset: {
              id: "x",
              description: "x",
              condition: { kind: "any-track" as const, tracks: ["tooling"] as Track[] },
              method: { kind: "skill", source: "owner/repo" } as const,
            },
            ok: true,
          },
        ],
        succeeded: 1,
        skipped: 0,
      },
      codex: {
        agentsMdPath: "/p/AGENTS.md",
        configTomlPath: "/p/.codex/config.toml",
        hookFiles: [],
        skillFiles: [],
      },
    });
    executeSpec(
      { ...baseSpec, cli: "codex" },
      { log, exit, runPipeline, resolveHarnessRoot: () => "/h" },
    );
    // Phase 2 (external) + Phase 3 (codex)
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Phase 2"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Phase 3"));
  });

  it("renders .env.example + .gitignore + .mcp-allowlist rows when envFiles flags set", () => {
    const log = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => ({
      ...fakeReport,
      envFiles: {
        envExampleCreated: true,
        gitignoreEnvAdded: true,
        mcpAllowlist: ["context7", "github", "supabase"],
      },
    }));
    executeSpec(baseSpec, { log, exit, runPipeline, resolveHarnessRoot: () => "/h" });
    expect(log).toHaveBeenCalledWith(expect.stringContaining(".env.example"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining(".gitignore"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining(".mcp-allowlist"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("3 servers"));
  });

  it("err + exit(1) when pipeline throws", () => {
    const err = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    const runPipeline = vi.fn(() => {
      throw new Error("disk full");
    });
    executeSpec(baseSpec, {
      log: vi.fn(),
      err,
      exit,
      runPipeline,
      resolveHarnessRoot: () => "/h",
    });
    expect(err).toHaveBeenCalledWith(expect.stringContaining("install failed"));
    expect(err).toHaveBeenCalledWith(expect.stringContaining("disk full"));
    expect(exit).toHaveBeenCalledWith(1);
  });
});
