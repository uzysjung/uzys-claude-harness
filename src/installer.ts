import { chmodSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { type CodexTransformReport, runCodexTransform } from "./codex/transform.js";
import {
  type ExternalInstallReport,
  type ExternalInstallerDeps,
  runExternalInstall,
} from "./external-installer.js";
import { backupDir, copyDir, copyFile, ensureProjectSkeleton } from "./fs-ops.js";
import { buildManifest } from "./manifest.js";
import { composeMcpJson, writeMcpJson } from "./mcp-merge.js";
import { type OpencodeTransformReport, runOpencodeTransform } from "./opencode/transform.js";
import type { InstallSpec, OptionFlags, Track } from "./types.js";

export interface InstallContext {
  /** Path to the harness repo (where `templates/` lives). */
  harnessRoot: string;
  /** Target project directory. */
  projectDir: string;
  spec: InstallSpec;
  /** When true, an existing .claude/ is renamed to a timestamped backup before install. */
  backup?: boolean;
  /**
   * External install (claude plugin / npm -g / npx skills) injection point.
   * Default: real `runExternalInstall`. Tests inject mock to avoid real spawn.
   * Pass `null` to disable external install entirely.
   */
  runExternal?:
    | ((
        ctx: { tracks: ReadonlyArray<Track>; options: OptionFlags },
        deps: ExternalInstallerDeps,
      ) => ExternalInstallReport)
    | null;
}

export interface InstallReport {
  filesCopied: number;
  dirsCopied: number;
  skipped: number;
  backup: string | null;
  installedTracks: string[];
  mcpServers: string[];
  /** Present when CLI ∈ {codex, both, all}. */
  codex: CodexTransformReport | null;
  /** Present when CLI ∈ {opencode, all}. */
  opencode: OpencodeTransformReport | null;
  /** External install report (claude plugin / npm -g / npx skills). null when disabled or empty. */
  external: ExternalInstallReport | null;
}

/**
 * Run the installation pipeline. Pure function modulo filesystem side effects.
 */
export function runInstall(ctx: InstallContext): InstallReport {
  const { harnessRoot, projectDir, spec, backup = false } = ctx;
  const templatesDir = join(harnessRoot, "templates");

  if (!existsSync(templatesDir)) {
    throw new Error(`Templates dir not found: ${templatesDir}`);
  }

  const claudeDir = join(projectDir, ".claude");
  const backupPath = backup ? backupDir(claudeDir) : null;
  ensureProjectSkeleton(projectDir);

  const manifest = buildManifest({
    tracks: spec.tracks,
    withTauri: spec.options.withTauri,
  });

  let filesCopied = 0;
  let dirsCopied = 0;
  let skipped = 0;
  for (const entry of manifest) {
    if (!entry.applies({ tracks: spec.tracks, withTauri: spec.options.withTauri })) {
      continue;
    }
    const source = join(templatesDir, entry.source);
    const target = join(projectDir, entry.target);
    if (!existsSync(source)) {
      skipped += 1;
      continue;
    }
    if (entry.type === "file") {
      copyFile(source, target);
      filesCopied += 1;
    } else {
      copyDir(source, target);
      dirsCopied += 1;
    }
  }

  // chmod +x on hook scripts (cp does not preserve exec bit when source is non-exec)
  const hookDir = join(projectDir, ".claude/hooks");
  if (existsSync(hookDir)) {
    chmodHooksSync(hookDir);
  }

  // Compose .mcp.json from template + track-mcp-map.tsv
  const mcpResult = composeAndWriteMcp(harnessRoot, projectDir, spec);
  // Write metadata file used by detect_install_state on next run
  writeInstalledTracks(projectDir, spec.tracks);

  // Codex transform when --cli ∈ {codex, both, all}
  let codex: CodexTransformReport | null = null;
  if (spec.cli === "codex" || spec.cli === "both" || spec.cli === "all") {
    codex = runCodexTransform({ harnessRoot, projectDir });
  }

  // OpenCode transform when --cli ∈ {opencode, all}
  let opencode: OpencodeTransformReport | null = null;
  if (spec.cli === "opencode" || spec.cli === "all") {
    opencode = runOpencodeTransform({ harnessRoot, projectDir });
  }

  // External assets (claude plugin / npm -g / npx skills) — runs when not explicitly disabled.
  // Default = real runExternalInstall. Tests inject mock or `null` to skip.
  // log/warn are silenced here — executeSpec renders the report rows after-the-fact (no interleave).
  let external: ExternalInstallReport | null = null;
  if (ctx.runExternal !== null) {
    const runExt = ctx.runExternal ?? runExternalInstall;
    external = runExt(
      { tracks: spec.tracks, options: spec.options },
      {
        harnessRoot,
        log: () => {},
        warn: () => {},
      },
    );
  }

  return {
    filesCopied,
    dirsCopied,
    skipped,
    backup: backupPath,
    installedTracks: [...spec.tracks].sort(),
    mcpServers: Object.keys(mcpResult.mcpServers).sort(),
    codex,
    opencode,
    external,
  };
}

function composeAndWriteMcp(
  harnessRoot: string,
  projectDir: string,
  spec: InstallSpec,
): { mcpServers: Record<string, unknown> } {
  const mcpPath = join(projectDir, ".mcp.json");
  const composed = composeMcpJson({
    templateMcpPath: join(harnessRoot, "templates/mcp.json"),
    trackMapPath: join(harnessRoot, "templates/track-mcp-map.tsv"),
    existingPath: mcpPath,
    tracks: spec.tracks,
  });
  writeMcpJson(mcpPath, composed);
  return composed;
}

function writeInstalledTracks(projectDir: string, tracks: ReadonlyArray<string>): void {
  const path = join(projectDir, ".claude/.installed-tracks");
  mkdirSync(dirname(path), { recursive: true });
  const sorted = [...new Set(tracks)].sort().join("\n");
  writeFileSync(path, `${sorted}\n`);
}

function chmodHooksSync(hookDir: string): void {
  for (const file of listHookFiles(hookDir)) {
    try {
      chmodSync(file, 0o755);
    } catch {
      // Best-effort; many platforms (Windows in particular) ignore mode bits.
    }
  }
}

function listHookFiles(hookDir: string): string[] {
  // Hooks are flat shell scripts — avoid pulling glob deps.
  return readdirSync(hookDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".sh"))
    .map((e) => resolve(hookDir, e.name));
}
