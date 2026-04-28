/**
 * CLI targets parser — v0.7.0 multi-select.
 *
 * SPEC: docs/specs/cli-multi-select.md F2 (parseCliTargets).
 *
 * Input shapes:
 *   - undefined / null / "" / [] → ["claude"] (default)
 *   - "claude" / "codex" / "opencode" → single-element array
 *   - ["claude", "codex"] (cac repeatable) → sorted array
 *   - "both" (deprecated alias) → ["claude", "codex"] + warning
 *   - "all" (deprecated alias) → ["claude", "codex", "opencode"] + warning
 *   - "invalid" → throw error
 *
 * Output:
 *   - targets: sorted ReadonlyArray<CliBase> (claude → codex → opencode 순)
 *   - warnings: array of deprecation messages (alias 사용 시)
 */

import { CLI_BASES, type CliBase, type CliTargets, isCliBase } from "./types.js";

const ALIAS_BOTH: ReadonlyArray<CliBase> = ["claude", "codex"];
const ALIAS_ALL: ReadonlyArray<CliBase> = ["claude", "codex", "opencode"];

/** SSOT — claude → codex → opencode 정렬 순서. prompts.ts에서 import. */
export const CLI_BASE_SORT_ORDER: Record<CliBase, number> = {
  claude: 0,
  codex: 1,
  opencode: 2,
};

export interface ParseCliTargetsResult {
  ok: boolean;
  targets: CliTargets;
  warnings: ReadonlyArray<string>;
  /** ok=false 시 reject 사유. */
  error?: string;
}

/**
 * `--cli` 입력을 sorted CliTargets로 정규화.
 *
 * Default `["claude"]` (비어있거나 undefined일 때).
 * Alias `both`/`all`은 warning + 변환.
 * Invalid 모드는 reject (ok=false).
 */
export function parseCliTargets(input: string | string[] | undefined): ParseCliTargetsResult {
  const items = normalizeInput(input);
  if (items.length === 0) {
    return { ok: true, targets: ["claude"], warnings: [] };
  }

  const collected = new Set<CliBase>();
  const warnings: string[] = [];

  for (const item of items) {
    if (item === "both") {
      warnings.push(
        "--cli both is deprecated. Use --cli claude --cli codex (will be removed in v0.8+)",
      );
      for (const base of ALIAS_BOTH) collected.add(base);
      continue;
    }
    if (item === "all") {
      warnings.push(
        "--cli all is deprecated. Use --cli claude --cli codex --cli opencode (will be removed in v0.8+)",
      );
      for (const base of ALIAS_ALL) collected.add(base);
      continue;
    }
    if (!isCliBase(item)) {
      // v0.7.1 — comma-separated 입력 힌트 (사용자 흔한 실수)
      const hint = item.includes(",")
        ? "\n         Tip: comma-separated 값은 미지원. 여러 CLI는 --cli A --cli B 형식으로."
        : "";
      return {
        ok: false,
        targets: ["claude"],
        warnings,
        error: `Invalid --cli value: ${item}. Must be one of: ${CLI_BASES.join(" | ")} (or legacy alias: both | all)${hint}`,
      };
    }
    collected.add(item);
  }

  const targets = [...collected].sort((a, b) => CLI_BASE_SORT_ORDER[a] - CLI_BASE_SORT_ORDER[b]);
  return { ok: true, targets, warnings };
}

function normalizeInput(input: string | string[] | undefined): string[] {
  if (input === undefined || input === null) return [];
  if (typeof input === "string") {
    const trimmed = input.trim();
    return trimmed === "" ? [] : [trimmed];
  }
  return input.filter((s) => typeof s === "string" && s.trim() !== "").map((s) => s.trim());
}

/** Targets에 특정 base 포함 여부. has() 패턴. */
export function targetsInclude(targets: CliTargets, base: CliBase): boolean {
  return targets.includes(base);
}
