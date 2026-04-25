import { resolve } from "node:path";
import type { Cli } from "../cli.js";
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
    err(`ERROR: ${validated.message}`);
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

  let report: InstallReport;
  try {
    report = runPipeline(spec, resolveHarnessRoot());
  } catch (e: unknown) {
    err(`ERROR: install failed — ${e instanceof Error ? e.message : String(e)}`);
    exit(1);
    return;
  }

  log("Install complete:");
  log(`  Tracks:        ${report.installedTracks.join(", ")}`);
  log(`  Files copied:  ${report.filesCopied}`);
  log(`  Dirs copied:   ${report.dirsCopied}`);
  log(`  Skipped:       ${report.skipped}`);
  if (report.backup) {
    log(`  Backup:        ${report.backup}`);
  }
  log(`  MCP servers:   ${report.mcpServers.join(", ") || "(none)"}`);
}

function defaultRunPipeline(spec: InstallSpec, harnessRoot: string): InstallReport {
  return runInstallPipeline({ harnessRoot, projectDir: spec.projectDir, spec, backup: false });
}

function defaultHarnessRoot(): string {
  // The bundled CLI lives at <root>/dist/index.js. import.meta.url + ../ resolves to <root>.
  return resolve(new URL(".", import.meta.url).pathname, "..");
}

export function registerInstallCommand(cli: Cli): void {
  cli
    .command("install", "Install harness assets into a project")
    .option("--track <name>", "Track to install (repeatable)", { type: [String] })
    .option("--cli <mode>", "Target CLI: claude | codex | both", { default: "claude" })
    .option("--project-dir <path>", "Target project directory", { default: process.cwd() })
    .option("--with-tauri", "Include tauri.md rule")
    .option("--with-gsd", "Include GSD orchestrator")
    .option("--with-ecc", "Install ECC plugin (project-scoped)")
    .option("--with-prune", "Prune ECC items beyond curated 89 (implies --with-ecc)")
    .option("--with-tob", "Install Trail of Bits security plugin")
    .action((options: InstallOptions) => installAction(options));
}
