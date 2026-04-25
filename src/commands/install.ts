import { resolve } from "node:path";
import type { Cli } from "../cli.js";
import { assetRow, c, infoRow, phaseHeader, sectionHeader, status } from "../design.js";
import { type InstallReport, runInstall as runInstallPipeline } from "../installer.js";
import {
  CLI_MODES,
  type CliMode,
  type InstallSpec,
  type Track,
  isCliMode,
  isTrack,
} from "../types.js";

export interface InstallOptions {
  track?: string[];
  cli?: string;
  projectDir?: string;
  withTauri?: boolean;
  withGsd?: boolean;
  withEcc?: boolean;
  withPrune?: boolean;
  withTob?: boolean;
}

export type CliMode_ = CliMode;
export { isCliMode };

export interface RunInstallResult {
  ok: boolean;
  cli: CliMode;
  message: string;
  report?: InstallReport;
}

/**
 * Lift raw flag options to a typed InstallSpec.
 * Returns a Result-shaped value so callers can render errors uniformly.
 */
export function specFromOptions(options: InstallOptions): RunInstallResult {
  const cliRaw = options.cli ?? "claude";
  if (!isCliMode(cliRaw)) {
    return {
      ok: false,
      cli: "claude",
      message: `--cli must be one of ${CLI_MODES.join("|")} (got: ${cliRaw})`,
    };
  }
  const trackInputs = options.track ?? [];
  if (trackInputs.length === 0) {
    return {
      ok: false,
      cli: cliRaw,
      message: "At least one --track is required (e.g. --track tooling)",
    };
  }
  const tracks: Track[] = [];
  for (const t of trackInputs) {
    if (!isTrack(t)) {
      return {
        ok: false,
        cli: cliRaw,
        message: `Unknown track: ${t}`,
      };
    }
    tracks.push(t);
  }
  return {
    ok: true,
    cli: cliRaw,
    message: "spec valid",
  };
}

export interface InstallActionDeps {
  log?: (msg: string) => void;
  err?: (msg: string) => void;
  exit?: (code: number) => never;
  /** Override the install pipeline (used by tests to avoid real fs side effects). */
  runPipeline?: (spec: InstallSpec, harnessRoot: string) => InstallReport;
  /** Override the harness root resolver (defaults to a path relative to this file). */
  resolveHarnessRoot?: () => string;
}

export function installAction(options: InstallOptions, deps: InstallActionDeps = {}): void {
  const log = deps.log ?? console.log;
  const err = deps.err ?? console.error;
  const exit = deps.exit ?? ((code: number) => process.exit(code) as never);
  const runPipeline = deps.runPipeline ?? defaultRunPipeline;
  const resolveHarnessRoot = deps.resolveHarnessRoot ?? defaultHarnessRoot;

  const validated = specFromOptions(options);
  if (!validated.ok) {
    err(status.failure(c.red(`ERROR: ${validated.message}`)));
    exit(1);
    return;
  }

  const spec: InstallSpec = {
    tracks: (options.track as Track[]) ?? [],
    options: {
      withTauri: options.withTauri === true,
      withGsd: options.withGsd === true,
      withEcc: options.withEcc === true || options.withPrune === true,
      withPrune: options.withPrune === true,
      withTob: options.withTob === true,
    },
    cli: validated.cli,
    projectDir: resolve(options.projectDir ?? process.cwd()),
  };

  executeSpec(spec, { log, err, exit, runPipeline, resolveHarnessRoot });
}

export interface ExecuteSpecDeps {
  log?: (msg: string) => void;
  err?: (msg: string) => void;
  exit?: (code: number) => never;
  runPipeline?: (spec: InstallSpec, harnessRoot: string) => InstallReport;
  resolveHarnessRoot?: () => string;
}

/**
 * Run the install pipeline for a fully-validated InstallSpec and render the
 * report. Shared by the `install` flag-mode command and the default
 * (interactive) action so both have identical post-install output.
 */
export function executeSpec(spec: InstallSpec, deps: ExecuteSpecDeps = {}): void {
  const log = deps.log ?? console.log;
  const err = deps.err ?? console.error;
  const exit = deps.exit ?? ((code: number) => process.exit(code) as never);
  const runPipeline = deps.runPipeline ?? defaultRunPipeline;
  const resolveHarnessRoot = deps.resolveHarnessRoot ?? defaultHarnessRoot;

  // ━━━ TARGET ━━━ pre-flight info block ━━━
  log("");
  log(sectionHeader("uzys-claude-harness · install"));
  log("");
  log(infoRow("TARGET", shortenPath(spec.projectDir)));
  log(infoRow("TRACKS", spec.tracks.join(", ")));
  log(infoRow("CLI", spec.cli));
  log(infoRow("OPTIONS", formatOptions(spec)));
  log("");

  // ━━━ Phase 1 — Templates ━━━
  log(phaseHeader(1, "Templates"));
  log("");

  let report: InstallReport;
  try {
    report = runPipeline(spec, resolveHarnessRoot());
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : String(e);
    log("");
    err(status.failure(c.red(`install failed — ${detail}`)));
    exit(1);
    return;
  }

  log(assetRow("success", "rules + hooks + commands + agents", `${report.filesCopied} files`));
  log(assetRow("success", "skeleton + project-claude/<track>.md", `${report.dirsCopied} dirs`));
  if (report.skipped > 0) {
    log(assetRow("skip", "manifest entries (applies → false)", `${report.skipped} skipped`));
  }
  if (report.backup) {
    log(assetRow("success", "backup", shortenPath(report.backup)));
  }
  const mcpList = report.mcpServers.join(", ") || "(none)";
  log(assetRow("success", ".mcp.json", mcpList));
  log("");

  // ━━━ Phase 2 — External Assets (skills / plugins / npm-global) ━━━
  if (report.external && report.external.attempted.length > 0) {
    log(phaseHeader(2, "External Assets"));
    log("");
    for (const r of report.external.attempted) {
      const meta = r.ok ? formatAssetMeta(r.asset) : (r.message ?? "failed");
      log(assetRow(r.ok ? "success" : "skip", r.asset.id, meta));
    }
    log("");
  }

  // ━━━ Phase 3 — Codex / OpenCode (CLI-specific) ━━━
  if ((report.codex || report.opencode) && spec.cli !== "claude") {
    const phaseN = report.external && report.external.attempted.length > 0 ? 3 : 2;
    log(phaseHeader(phaseN, formatCliPhaseTitle(spec.cli)));
    log("");
    // AGENTS.md is shared across Codex/OpenCode — render once with shared note
    if (report.codex && report.opencode) {
      log(assetRow("success", "AGENTS.md", "shared (Codex + OpenCode)"));
    } else if (report.codex || report.opencode) {
      log(assetRow("success", "AGENTS.md", "from .claude/CLAUDE.md"));
    }
    if (report.codex) {
      log(assetRow("success", ".codex/config.toml", "settings + [mcp_servers.*]"));
      log(assetRow("success", ".codex/hooks/", `${report.codex.hookFiles.length} files`));
      log(
        assetRow(
          "success",
          ".codex-skills/uzys-*/SKILL.md",
          `${report.codex.skillFiles.length} skills`,
        ),
      );
    }
    if (report.opencode) {
      log(assetRow("success", "opencode.json", "$schema + 5 keys"));
      log(
        assetRow("success", ".opencode/commands/", `${report.opencode.commandFiles.length} files`),
      );
      log(assetRow("success", ".opencode/plugins/uzys-harness.ts", "self-contained plugin"));
    }
    log("");
  }

  // ━━━ Summary ━━━
  log(sectionHeader("Summary"));
  log("");
  log(infoRow("STATUS", c.green("Install complete")));
  log(infoRow("TRACKS", report.installedTracks.join(", ")));
  if (report.codex && report.opencode) {
    log(infoRow("CLIs", "Claude · Codex · OpenCode"));
  } else if (report.codex) {
    log(infoRow("CLIs", "Claude · Codex"));
  } else if (report.opencode) {
    log(infoRow("CLIs", "Claude · OpenCode"));
  } else {
    log(infoRow("CLIs", "Claude"));
  }
  if (report.external && report.external.skipped > 0) {
    log("");
    log(
      infoRow(
        "WARN",
        c.yellow(
          `${report.external.skipped} external asset${report.external.skipped > 1 ? "s" : ""} skipped (see Phase 2 above)`,
        ),
      ),
    );
  }
  log("");
  log(infoRow("NEXT", `${c.bold("claude")}  →  ${c.cyan("/uzys:spec")}`));
  log("");
}

function formatAssetMeta(asset: import("../external-assets.js").ExternalAsset): string {
  const m = asset.method;
  switch (m.kind) {
    case "skill":
      return m.skill ? `${m.source} · ${m.skill}` : m.source;
    case "plugin":
      return m.pluginId;
    case "npm-global":
      return `npm install -g ${m.pkg}`;
    case "npx-run":
      return `npx ${m.cmd}`;
    case "shell-script":
      return `bash ${m.script}`;
  }
}

function formatOptions(spec: InstallSpec): string {
  const flags: string[] = [];
  if (spec.options.withTauri) flags.push("tauri");
  if (spec.options.withGsd) flags.push("gsd");
  if (spec.options.withEcc) flags.push("ecc");
  if (spec.options.withPrune) flags.push("prune");
  if (spec.options.withTob) flags.push("tob");
  return flags.length > 0 ? flags.join(", ") : c.dim("(defaults only)");
}

/**
 * Shorten an absolute path for display:
 *   /Users/foo/bar     → ~/bar (HOME relative)
 *   /private/tmp/x.X   → /tmp/x.X
 *   /a/very/long/path  → …/long/path (≥3 segs from end if > 50 chars)
 */
function shortenPath(p: string): string {
  if (p.length <= 50) return p;
  const home = process.env.HOME ?? "";
  if (home && p.startsWith(home)) {
    const rel = p.slice(home.length);
    return `~${rel.startsWith("/") ? "" : "/"}${rel}`;
  }
  // private/tmp prefix on macOS — drop /private
  if (p.startsWith("/private/tmp/")) {
    return p.slice("/private".length);
  }
  // Last 3 segments
  const segs = p.split("/").filter(Boolean);
  if (segs.length > 3) {
    return `…/${segs.slice(-3).join("/")}`;
  }
  return p;
}

/**
 * 'claude' mode never reaches here (phase 2/3 is gated on codex || opencode in executeSpec).
 * The remaining 4 modes map to phase titles.
 */
function formatCliPhaseTitle(cli: Exclude<CliMode, "claude">): string {
  switch (cli) {
    case "codex":
      return "Codex artifacts";
    case "opencode":
      return "OpenCode artifacts";
    case "both":
      return "Codex artifacts";
    case "all":
      return "Codex + OpenCode artifacts";
  }
}

function defaultRunPipeline(spec: InstallSpec, harnessRoot: string): InstallReport {
  return runInstallPipeline({ harnessRoot, projectDir: spec.projectDir, spec, backup: false });
}

function defaultHarnessRoot(): string {
  // The bundled CLI lives at <root>/dist/index.js. import.meta.url + ../ resolves to <root>.
  return resolve(new URL(".", import.meta.url).pathname, "..");
}

export { defaultHarnessRoot };

export function registerInstallCommand(cli: Cli): void {
  cli
    .command("install", "Install harness assets into a project")
    .option("--track <name>", "Track to install (repeatable)", { type: [String] })
    .option("--cli <mode>", "Target CLI: claude | codex | opencode | both | all", {
      default: "claude",
    })
    .option("--project-dir <path>", "Target project directory", { default: process.cwd() })
    .option("--with-tauri", "Include tauri.md rule")
    .option("--with-gsd", "Include GSD orchestrator")
    .option("--with-ecc", "Install ECC plugin (project-scoped)")
    .option("--with-prune", "Prune ECC items beyond curated 89 (implies --with-ecc)")
    .option("--with-tob", "Install Trail of Bits security plugin")
    .action((options: InstallOptions) => installAction(options));
}
