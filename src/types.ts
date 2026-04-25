/** Available installation tracks (parity with setup-harness.sh:580 TRACKS array). */
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
] as const;
export type Track = (typeof TRACKS)[number];

export function isTrack(value: unknown): value is Track {
  return typeof value === "string" && (TRACKS as readonly string[]).includes(value);
}

/** CLI target — claude (default), codex, or both. */
export const CLI_MODES = ["claude", "codex", "both"] as const;
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
}

export const DEFAULT_OPTIONS: OptionFlags = {
  withTauri: false,
  withGsd: false,
  withEcc: false,
  withPrune: false,
  withTob: false,
};

/** Aggregate result of interactive flow — the spec the install pipeline consumes. */
export interface InstallSpec {
  tracks: Track[];
  options: OptionFlags;
  cli: CliMode;
  projectDir: string;
}
