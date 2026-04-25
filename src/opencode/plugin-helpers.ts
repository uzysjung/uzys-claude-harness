/**
 * Plugin helper logic — duplicated in templates/opencode/.opencode/plugins/uzys-harness.ts
 * (self-contained user-facing template).
 *
 * Tests target this module. Template plugin file is shipped verbatim and tested
 * statically (string match) by tests/opencode/install.test.ts.
 *
 * SPEC: docs/specs/opencode-compat.md AC5
 * ADR: docs/decisions/ADR-004-opencode-plugin-mapping.md
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface GateStatus {
  define?: { completed?: boolean };
  plan?: { completed?: boolean };
  build?: { completed?: boolean };
  verify?: { completed?: boolean };
  review?: { completed?: boolean };
  ship?: { completed?: boolean };
  hotfix?: boolean;
}

export const PHASE_ORDER = ["define", "plan", "build", "verify", "review", "ship"] as const;
export type Phase = (typeof PHASE_ORDER)[number];

/** Map slash command name to required prior gate. null = entry point. */
export const PHASE_DEPENDENCY: Record<string, Phase | null> = {
  "uzys-spec": null,
  "uzys-plan": "define",
  "uzys-build": "plan",
  "uzys-test": "build",
  "uzys-review": "verify",
  "uzys-ship": "review",
};

const PHASE_TO_COMMAND: Record<Phase, string> = {
  define: "spec",
  plan: "plan",
  build: "build",
  verify: "test",
  review: "review",
  ship: "ship",
};

export function readGateStatus(projectDir: string): GateStatus {
  const path = join(projectDir, ".claude/gate-status.json");
  if (!existsSync(path)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as GateStatus;
  } catch {
    return {};
  }
}

export function isPhaseComplete(status: GateStatus, phase: Phase): boolean {
  return status[phase]?.completed === true;
}

export function gateToCommand(phase: Phase): string {
  return PHASE_TO_COMMAND[phase];
}

export function extractSlashCommand(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as { command?: unknown; tool?: unknown; args?: { command?: unknown } };
  if (typeof candidate.command === "string") return stripSlash(candidate.command);
  if (typeof candidate.tool === "string" && candidate.tool.startsWith("uzys-")) {
    return candidate.tool;
  }
  if (
    candidate.args &&
    typeof candidate.args === "object" &&
    typeof candidate.args.command === "string"
  ) {
    return stripSlash(candidate.args.command);
  }
  return null;
}

function stripSlash(s: string): string {
  return s.startsWith("/") ? s.slice(1) : s;
}

export function extractFilePath(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as {
    filePath?: unknown;
    args?: { filePath?: unknown; path?: unknown };
  };
  if (typeof candidate.filePath === "string") return candidate.filePath;
  if (candidate.args && typeof candidate.args === "object") {
    if (typeof candidate.args.filePath === "string") return candidate.args.filePath;
    if (typeof candidate.args.path === "string") return candidate.args.path;
  }
  return null;
}

const SPEC_PATH_RE = /docs\/SPEC\.md$|docs\/specs\/[^/]+\.md$/;

export function isSpecPath(filePath: string): boolean {
  return SPEC_PATH_RE.test(filePath);
}
