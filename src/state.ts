import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isTrack, type Track } from "./types.js";

export type InstallState = "new" | "existing";

export interface DetectedInstall {
  state: InstallState;
  tracks: Track[];
  /** Source of the detected tracks: "metafile" (v27.17+), "legacy" (rules/*.md heuristic), or "none". */
  source: "metafile" | "legacy" | "none";
  hasClaudeDir: boolean;
}

const META_FILE = ".claude/.installed-tracks";

interface LegacySignature {
  rule: string;
  track: Track;
}

const LEGACY_SIGNATURES: readonly LegacySignature[] = [
  { rule: "htmx.md", track: "ssr-htmx" },
  { rule: "nextjs.md", track: "ssr-nextjs" },
  { rule: "data-analysis.md", track: "data" },
  { rule: "pyside6.md", track: "data" },
  { rule: "cli-development.md", track: "tooling" },
];

/**
 * Detect what was previously installed in the given project directory.
 * Mirrors the v27.17 detect_install_state shell function (setup-harness.sh:191).
 */
export function detectInstallState(projectDir: string): DetectedInstall {
  const claudeDir = join(projectDir, ".claude");
  const hasClaudeDir = existsSync(claudeDir);

  if (!hasClaudeDir) {
    return { state: "new", tracks: [], source: "none", hasClaudeDir: false };
  }

  const metaPath = join(projectDir, META_FILE);
  if (existsSync(metaPath)) {
    const tracks = readMetafile(metaPath);
    return { state: "existing", tracks, source: "metafile", hasClaudeDir: true };
  }

  const tracks = inferFromLegacySignatures(projectDir);
  return { state: "existing", tracks, source: "legacy", hasClaudeDir: true };
}

function readMetafile(path: string): Track[] {
  const raw = readFileSync(path, "utf8");
  const seen = new Set<Track>();
  for (const line of raw.split(/\s+/)) {
    const trimmed = line.trim();
    if (isTrack(trimmed)) {
      seen.add(trimmed);
    }
  }
  return [...seen].sort();
}

function inferFromLegacySignatures(projectDir: string): Track[] {
  const rulesDir = join(projectDir, ".claude/rules");
  if (!existsSync(rulesDir)) {
    return [];
  }
  const found = new Set<Track>();
  for (const sig of LEGACY_SIGNATURES) {
    if (existsSync(join(rulesDir, sig.rule))) {
      found.add(sig.track);
    }
  }
  return [...found].sort();
}
