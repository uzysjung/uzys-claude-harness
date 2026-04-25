/**
 * Codex trust entry — `~/.codex/config.toml [projects."<dir>"]` (parity with
 * setup-harness.sh L1404-1422).
 *
 * SAFETY: never modify the global `~/.codex/config.toml` without an explicit
 * opt-in (D16 / ADR-002 v2 D4). Callers must verify user consent first.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface RegisterTrustResult {
  status: "registered" | "already-present" | "error";
  message?: string;
}

const TRUST_BLOCK_REGEX = /\[projects\."([^"]+)"\]/g;

/** Append a `[projects."<projectDir>"]` block to the user `config.toml` (idempotent). */
export function registerTrustEntry(opts: {
  configPath: string;
  projectDir: string;
}): RegisterTrustResult {
  const { configPath, projectDir } = opts;
  try {
    mkdirSync(dirname(configPath), { recursive: true });
    const existing = existsSync(configPath) ? readFileSync(configPath, "utf8") : "";
    if (hasTrustEntry(existing, projectDir)) {
      return { status: "already-present" };
    }
    const block = `\n[projects."${projectDir}"]\ntrust_level = "trusted"\n`;
    writeFileSync(configPath, existing + block);
    return { status: "registered" };
  } catch (e: unknown) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export function hasTrustEntry(configContent: string, projectDir: string): boolean {
  const matches = [...configContent.matchAll(TRUST_BLOCK_REGEX)].map((m) => m[1]);
  return matches.includes(projectDir);
}
