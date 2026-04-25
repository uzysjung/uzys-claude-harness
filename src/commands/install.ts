import type { Cli } from "../cli.js";

export type CliMode = "claude" | "codex" | "both";

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

const VALID_CLI_MODES: readonly CliMode[] = ["claude", "codex", "both"];

export function isCliMode(value: unknown): value is CliMode {
  return typeof value === "string" && (VALID_CLI_MODES as readonly string[]).includes(value);
}

export interface RunInstallResult {
  ok: boolean;
  cli: CliMode;
  message: string;
}

/**
 * Install action handler. Extracted from registerInstallCommand for direct testing.
 * Phase C will replace the placeholder body with the actual install pipeline.
 */
export function runInstall(options: InstallOptions): RunInstallResult {
  const cliValue = options.cli ?? "claude";
  if (!isCliMode(cliValue)) {
    return {
      ok: false,
      cli: "claude",
      message: `--cli must be one of ${VALID_CLI_MODES.join("|")} (got: ${cliValue})`,
    };
  }
  return {
    ok: true,
    cli: cliValue,
    message: "Install command (placeholder — Phase C).",
  };
}

export interface InstallActionDeps {
  log?: (msg: string) => void;
  err?: (msg: string) => void;
  exit?: (code: number) => never;
}

/**
 * Pure action handler — easy to test. The cac action callback delegates here.
 */
export function installAction(options: InstallOptions, deps: InstallActionDeps = {}): void {
  const log = deps.log ?? console.log;
  const err = deps.err ?? console.error;
  const exit = deps.exit ?? ((code: number) => process.exit(code) as never);

  const result = runInstall(options);
  if (!result.ok) {
    err(`ERROR: ${result.message}`);
    exit(1);
    return;
  }
  log(result.message);
  log(`CLI: ${result.cli}`);
  log(`Parsed options: ${JSON.stringify(options, null, 2)}`);
}

export function registerInstallCommand(cli: Cli): void {
  cli
    .command("install", "Install harness assets into a project (Phase C)")
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
