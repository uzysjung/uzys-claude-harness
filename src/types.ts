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
 * CLI target.
 * - claude — baseline only (default)
 * - codex — baseline + Codex transform (templates/codex/)
 * - opencode — baseline + OpenCode transform (templates/opencode/)
 * - both — baseline + Codex (Codex 1차 호환 유지)
 * - all — baseline + Codex + OpenCode
 */
export const CLI_MODES = ["claude", "codex", "opencode", "both", "all"] as const;
export type CliMode = (typeof CLI_MODES)[number];

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
}

export const DEFAULT_OPTIONS: OptionFlags = {
  withTauri: false,
  withGsd: false,
  withEcc: false,
  withPrune: false,
  withTob: false,
  withCodexSkills: false,
  withCodexTrust: false,
};

/** Aggregate result of interactive flow — the spec the install pipeline consumes. */
export interface InstallSpec {
  tracks: Track[];
  options: OptionFlags;
  cli: CliMode;
  projectDir: string;
}
