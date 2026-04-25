import { describe, expect, it, vi } from "vitest";
import { executeSpec, installAction, specFromOptions } from "../src/commands/install.js";
import type { InstallReport } from "../src/installer.js";
import type { InstallSpec } from "../src/types.js";

const fakeReport: InstallReport = {
  filesCopied: 5,
  dirsCopied: 2,
  skipped: 0,
  backup: null,
  installedTracks: ["tooling"],
  mcpServers: ["context7"],
  codex: null,
  opencode: null,
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
