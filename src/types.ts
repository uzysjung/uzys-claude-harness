/** Available installation tracks. v0.5.0 — 11 Track (PM/Growth Marketing 추가). */
export const TRACKS = [
  "tooling",
  "csr-supabase",
  "csr-fastify",
  "csr-fastapi",
  "ssr-htmx",
  "ssr-nextjs",
  "data",
  "executive",
  "full",
  "project-management",
  "growth-marketing",
] as const;
export type Track = (typeof TRACKS)[number];

export function isTrack(value: unknown): value is Track {
  return typeof value === "string" && (TRACKS as readonly string[]).includes(value);
}

/**
 * CLI target. v0.7.0 BREAKING — single enum (5 mode) → multi-select base × combination.
 *
 * Base CLI: claude / codex / opencode (3 base).
 * 7 combinations possible (2^3 - 1, empty 제외).
 *
 * 기존 v0.6.x 5 mode (`claude/codex/opencode/both/all`)은 1 release deprecation alias로 유지:
 *   - both → ["claude", "codex"]
 *   - all  → ["claude", "codex", "opencode"]
 * v0.8+에서 alias 제거.
 *
 * `CliMode` (legacy union) + `isCliMode` (legacy guard)는 backwards compat 위해 유지.
 */
export const CLI_BASES = ["claude", "codex", "opencode"] as const;
export type CliBase = (typeof CLI_BASES)[number];

export function isCliBase(value: unknown): value is CliBase {
  return typeof value === "string" && (CLI_BASES as readonly string[]).includes(value);
}

/** Sorted readonly array of CliBase. install pipeline의 분기 input. */
export type CliTargets = ReadonlyArray<CliBase>;

/**
 * @deprecated v0.7.0 — Use `CliBase` + `CliTargets`. v0.8.0에서 제거 예정.
 * Legacy 5 mode union — alias 변환 + matrix test 호환 위해 유지.
 */
export const CLI_MODES = ["claude", "codex", "opencode", "both", "all"] as const;
/** @deprecated v0.7.0 — Use `CliBase` + `CliTargets`. v0.8.0에서 제거 예정. */
export type CliMode = (typeof CLI_MODES)[number];

/** @deprecated v0.7.0 — Use `isCliBase`. v0.8.0에서 제거 예정. */
export function isCliMode(value: unknown): value is CliMode {
  return typeof value === "string" && (CLI_MODES as readonly string[]).includes(value);
}

/** Optional opt-in feature flags collected interactively. */
export interface OptionFlags {
  withTauri: boolean;
  withGsd: boolean;
  withEcc: boolean;
  withPrune: boolean;
  withTob: boolean;
  /** Codex global opt-in: ~/.codex/skills/uzys-* 복사. D16 — 사용자 명시 동의 필수. */
  withCodexSkills: boolean;
  /** Codex global opt-in: ~/.codex/config.toml [projects."..."] trust entry. D16 동일. */
  withCodexTrust: boolean;
  /**
   * v0.6.0 — karpathy-coder pre-commit hook auto-wire (A 경로).
   * `.claude/settings.json` PreToolUse `Write|Edit` matcher에 hook entry 등록.
   * 활성화는 karpathy-coder plugin install 성공 후 + 사용자 명시 opt-in 시에만.
   * upstream `enforcement-patterns.md` "manual configuration" 권장과 정합 — opt-in 강제.
   */
  withKarpathyHook: boolean;
  /**
   * v0.7.0 — Codex slash 통일 opt-in.
   * `~/.codex/prompts/uzys-{spec,plan,build,test,review,ship}.md` 6 markdown prompt 글로벌 복사.
   * 활성화 시 Codex에서 `/uzys-spec` 등 Claude Code 컨벤션 slash 작동.
   * D16 보호 — 글로벌 영역 침범이라 opt-in 강제.
   * 기존 .agents/skills/uzys-(phase) 디렉토리의 SKILL.md ($name mention 형식)도 병존.
   */
  withCodexPrompts: boolean;
}

export const DEFAULT_OPTIONS: OptionFlags = {
  withTauri: false,
  withGsd: false,
  withEcc: false,
  withPrune: false,
  withTob: false,
  withCodexSkills: false,
  withCodexTrust: false,
  withKarpathyHook: false,
  withCodexPrompts: false,
};

/** Aggregate result of interactive flow — the spec the install pipeline consumes. */
export interface InstallSpec {
  tracks: Track[];
  options: OptionFlags;
  /** v0.7.0 — sorted readonly array of CliBase (이전: single CliMode). */
  cli: CliTargets;
  projectDir: string;
}
