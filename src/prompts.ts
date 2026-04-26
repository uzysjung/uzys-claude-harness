// prompts.ts is a thin adapter over @clack/prompts. It deliberately contains
// no transformation logic — interactive.ts owns the business rules. This file
// is excluded from coverage in vitest.config.ts (justification at exclude line).

import { cancel, confirm, intro, isCancel, multiselect, outro, select } from "@clack/prompts";
import { type RouterAction, buildRouterChoices, summarizeState } from "./router.js";
import type { DetectedInstall } from "./state.js";
import { type CliMode, type OptionFlags, TRACKS, type Track } from "./types.js";

export interface Prompts {
  intro: (msg: string) => void;
  outro: (msg: string) => void;
  cancel: (msg: string) => void;

  selectTracks: (initial?: Track[]) => Promise<Track[] | null>;
  selectOptionKeys: (
    initial?: ReadonlyArray<keyof OptionFlags>,
  ) => Promise<Array<keyof OptionFlags> | null>;
  selectCli: (initial?: CliMode) => Promise<CliMode | null>;
  selectAction: (state: DetectedInstall) => Promise<RouterAction | null>;
  confirmInstall: (summary: string) => Promise<boolean | null>;
}

const TRACK_LABELS: Record<Track, string> = {
  tooling: "tooling — Bash + Markdown meta-project",
  "csr-supabase": "csr-supabase — Vite + React + Supabase",
  "csr-fastify": "csr-fastify — Vite + React + Fastify",
  "csr-fastapi": "csr-fastapi — Vite + React + FastAPI",
  "ssr-htmx": "ssr-htmx — htmx + FastAPI",
  "ssr-nextjs": "ssr-nextjs — Next.js (App Router)",
  data: "data — Python data / DuckDB / PySide6",
  executive: "executive — proposals / DD / pitch (no agent-skills)",
  full: "full — all dev capabilities",
  "project-management": "project-management — PM / Scrum / Jira / Confluence",
  "growth-marketing": "growth-marketing — Growth / Marketing / Content",
};

const OPTION_DEFS: ReadonlyArray<{ key: keyof OptionFlags; label: string; hint: string }> = [
  { key: "withTauri", label: "Tauri desktop rule", hint: "CSR / full tracks" },
  { key: "withGsd", label: "GSD orchestrator", hint: "Large-project agent coordination" },
  { key: "withEcc", label: "ECC plugin (project-scoped)", hint: "everything-claude-code" },
  { key: "withPrune", label: "Prune ECC items beyond curated 89", hint: "Implies ECC" },
  { key: "withTob", label: "Trail of Bits security plugin", hint: "CodeQL + Semgrep" },
  {
    key: "withKarpathyHook",
    label: "karpathy-coder pre-commit hook (opt-in)",
    hint: "Claude Code Write|Edit gate · Python 3 권장 · 비차단 (warn-only)",
  },
];

export const defaultPrompts: Prompts = {
  intro: (msg) => intro(msg),
  outro: (msg) => outro(msg),
  cancel: (msg) => cancel(msg),

  selectTracks: async (initial) => {
    const result = await multiselect({
      message: "Select Track(s) (Space to toggle, Enter to confirm):",
      options: TRACKS.map((t) => ({ value: t, label: TRACK_LABELS[t] })),
      ...(initial ? { initialValues: initial } : {}),
      required: true,
    });
    return isCancel(result) ? null : (result as Track[]);
  },

  selectOptionKeys: async (initial) => {
    const result = await multiselect({
      message: "Optional features (Space to toggle, Enter to skip):",
      options: OPTION_DEFS.map((o) => ({ value: o.key, label: o.label, hint: o.hint })),
      ...(initial ? { initialValues: [...initial] } : {}),
      required: false,
    });
    return isCancel(result) ? null : (result as Array<keyof OptionFlags>);
  },

  selectCli: async (initial) => {
    const result = await select({
      message: "Target CLI:",
      options: [
        { value: "claude" as const, label: "Claude Code (default)" },
        { value: "codex" as const, label: "Codex (OpenAI)" },
        { value: "opencode" as const, label: "OpenCode (anomalyco)" },
        { value: "both" as const, label: "Claude + Codex" },
        { value: "all" as const, label: "All (Claude + Codex + OpenCode)" },
      ],
      initialValue: initial ?? "claude",
    });
    return isCancel(result) ? null : result;
  },

  selectAction: async (state) => {
    const result = await select({
      message: summarizeState(state),
      options: buildRouterChoices(state).map((c) => {
        const label = c.enabled ? c.label : `${c.label} [disabled]`;
        return c.hint ? { value: c.value, label, hint: c.hint } : { value: c.value, label };
      }),
    });
    return isCancel(result) ? null : (result as RouterAction);
  },

  confirmInstall: async (summary) => {
    const result = await confirm({
      message: `${summary}\n\nProceed?`,
      initialValue: true,
    });
    return isCancel(result) ? null : result;
  },
};
