import { copyFileSync, cpSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";

/** Ensure a directory exists, creating parents as needed. Idempotent. */
export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export interface CopyResult {
  copied: number;
  skipped: number;
}

/** Copy a single file, creating parent dirs as needed. Idempotent. */
export function copyFile(source: string, target: string): void {
  if (!existsSync(source)) {
    throw new Error(`Source not found: ${source}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}

/** Copy a directory recursively. Creates target if missing. */
export function copyDir(source: string, target: string): void {
  if (!existsSync(source)) {
    throw new Error(`Source dir not found: ${source}`);
  }
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
}

/**
 * Move an existing directory to a timestamped backup sibling.
 * Returns the backup path, or null when nothing to back up.
 */
export function backupDir(target: string, now: Date = new Date()): string | null {
  if (!existsSync(target)) {
    return null;
  }
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z")
    .slice(0, 15);
  const backup = `${target}.backup-${stamp}`;
  renameSync(target, backup);
  return backup;
}

/** Create a project skeleton: <project>/.claude/{commands/{uzys,ecc},rules,skills,agents,hooks}. */
export function ensureProjectSkeleton(projectDir: string): void {
  const dirs = [
    ".claude/commands/uzys",
    ".claude/commands/ecc",
    ".claude/rules",
    ".claude/skills",
    ".claude/agents",
    ".claude/hooks",
    "docs/decisions",
  ];
  for (const d of dirs) {
    mkdirSync(join(projectDir, d), { recursive: true });
  }
}
