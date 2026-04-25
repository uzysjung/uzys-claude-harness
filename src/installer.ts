import { chmodSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { type CodexOptInReport, runCodexOptIn } from "./codex/opt-in.js";
import { type CodexTransformReport, runCodexTransform } from "./codex/transform.js";
import { addGitignoreEnv, writeEnvExample, writeMcpAllowlist } from "./env-files.js";
import {
  type ExternalInstallReport,
  type ExternalInstallerDeps,
  runExternalInstall,
} from "./external-installer.js";
import { backupDir, copyBackupDir, copyDir, copyFile, ensureProjectSkeleton } from "./fs-ops.js";
import { buildManifest } from "./manifest.js";
import { composeMcpJson, writeMcpJson } from "./mcp-merge.js";
import { type OpencodeTransformReport, runOpencodeTransform } from "./opencode/transform.js";
import type { InstallSpec, OptionFlags, Track } from "./types.js";
import { type UpdateModeReport, runUpdateMode } from "./update-mode.js";

/**
 * Install mode — Router action 매핑.
 *   - "fresh"     : 첫 설치 (기본값)
 *   - "add"       : 기존 위에 Track union 추가 (backup 없음)
 *   - "update"    : 정책 파일만 templates로 갱신 (backup + orphan prune + stale hook)
 *   - "reinstall" : 기존 .claude/ backup 후 처음부터 (backup 강제)
 */
export type InstallMode = "fresh" | "add" | "update" | "reinstall";

export interface InstallContext {
  /** Path to the harness repo (where `templates/` lives). */
  harnessRoot: string;
  /** Target project directory. */
  projectDir: string;
  spec: InstallSpec;
  /**
   * Router action mode. Defaults to "fresh".
   * - "add"/"update"/"reinstall" trigger different install paths.
   * - reinstall + update force backup=true.
   */
  mode?: InstallMode;
  /**
   * When true, an existing .claude/ is renamed to a timestamped backup before install.
   * Auto-true when mode ∈ {update, reinstall}.
   */
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
  /** Present when Codex transform ran AND user opted-in to global skills/trust. null when no Codex or both flags off. */
  codexOptIn: CodexOptInReport | null;
  /** Present when CLI ∈ {opencode, all}. */
  opencode: OpencodeTransformReport | null;
  /** External install report (claude plugin / npm -g / npx skills). null when disabled or empty. */
  external: ExternalInstallReport | null;
  /** Update-mode report (rules/agents/commands/hooks 갱신 + orphan prune + stale hook). null when not update mode. */
  updateMode: UpdateModeReport | null;
  /** Install mode dispatched (echo of ctx.mode, default "fresh"). */
  mode: InstallMode;
  /** Environment file generation results (always present). */
  envFiles: {
    /** true if .env.example was created (csr-supabase/full only). */
    envExampleCreated: boolean;
    /** true if .gitignore got `.env` line appended. */
    gitignoreEnvAdded: boolean;
    /** Server names written to .mcp-allowlist; null if skipped. */
    mcpAllowlist: string[] | null;
  };
}

/**
 * Run the installation pipeline. Pure function modulo filesystem side effects.
 */
export function runInstall(ctx: InstallContext): InstallReport {
  const { harnessRoot, projectDir, spec } = ctx;
  const mode: InstallMode = ctx.mode ?? "fresh";
  const templatesDir = join(harnessRoot, "templates");

  if (!existsSync(templatesDir)) {
    throw new Error(`Templates dir not found: ${templatesDir}`);
  }

  const claudeDir = join(projectDir, ".claude");

  // Update mode pre-flight: existing .claude/ 필수. backup 전에 검증.
  if (mode === "update" && !existsSync(claudeDir)) {
    throw new Error(`Update mode requires existing .claude/ at ${claudeDir}`);
  }

  // Backup auto-on for update + reinstall (sourced from router action).
  // Update: copy backup (preserve original .claude/ for in-place update).
  // Reinstall + others: rename backup (move .claude/ aside, then full install).
  const wantBackup = ctx.backup ?? (mode === "update" || mode === "reinstall");
  const backupPath = wantBackup
    ? mode === "update"
      ? copyBackupDir(claudeDir)
      : backupDir(claudeDir)
    : null;

  // Update mode 단축 — 정책 파일만 갱신하고 종료 (manifest copy / external 모두 skip)
  if (mode === "update") {
    const updateReport = runUpdateMode(projectDir, templatesDir);
    return {
      filesCopied: 0,
      dirsCopied: 0,
      skipped: 0,
      backup: backupPath,
      installedTracks: [...spec.tracks].sort(),
      mcpServers: [],
      codex: null,
      codexOptIn: null,
      opencode: null,
      external: null,
      updateMode: updateReport,
      mode,
      envFiles: {
        envExampleCreated: false,
        gitignoreEnvAdded: false,
        mcpAllowlist: null,
      },
    };
  }

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

  // Environment files (F7/F8 — bash setup-harness.sh L880~890 + L954~996 등가)
  const envFiles = {
    envExampleCreated: writeEnvExample(projectDir, spec.tracks),
    gitignoreEnvAdded: addGitignoreEnv(projectDir),
    mcpAllowlist: writeMcpAllowlist(projectDir),
  };

  // Codex transform when --cli ∈ {codex, both, all}
  let codex: CodexTransformReport | null = null;
  let codexOptIn: CodexOptInReport | null = null;
  if (spec.cli === "codex" || spec.cli === "both" || spec.cli === "all") {
    codex = runCodexTransform({ harnessRoot, projectDir });
    // Codex global opt-in (D16): only when user explicitly enabled at least one flag
    if (spec.options.withCodexSkills || spec.options.withCodexTrust) {
      codexOptIn = runCodexOptIn({
        projectDir,
        withCodexSkills: spec.options.withCodexSkills,
        withCodexTrust: spec.options.withCodexTrust,
      });
    }
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
    codexOptIn,
    opencode,
    external,
    updateMode: null,
    mode,
    envFiles,
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
