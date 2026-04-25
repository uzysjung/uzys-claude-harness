/**
 * External asset matrix — bash setup-harness.sh L791~1067 등가 데이터.
 *
 * SPEC: docs/specs/cli-rewrite-completeness.md F3
 * Source: setup-harness.sh@911c246~1 (v27.18 직전, bash cutover 전)
 *
 * Track 또는 옵션 조건이 충족되면 install pipeline에서 method를 호출.
 * 실패는 "warn-skip" — 종료 시 누락 자산 보고 (OQ1 결정).
 */

import type { OptionFlags, Track } from "./types.js";

export type ExternalAssetMethod =
  /** `npx skills add <source>[ --skill <name>] --yes` */
  | { kind: "skill"; source: string; skill?: string }
  /** `claude plugin marketplace add <marketplace>` + `claude plugin install <pluginId>` */
  | { kind: "plugin"; marketplace: string; pluginId: string }
  /** `npm install -g <pkg>` */
  | { kind: "npm-global"; pkg: string }
  /** `npx <cmd>` — fire-and-forget 실행 (예: GSD orchestrator) */
  | { kind: "npx-run"; cmd: string; args?: string[] }
  /** `bash <script> <args...>` — 로컬 스크립트 (예: prune-ecc.sh) */
  | { kind: "shell-script"; script: string; args: string[] };

export type ExternalAssetCondition =
  /** Track 중 1개 이상이 set와 일치 */
  | { kind: "any-track"; tracks: Track[] }
  /** dev track (executive 외 모두) */
  | { kind: "has-dev-track" }
  /** OptionFlags 의 특정 플래그 true */
  | { kind: "option"; flag: keyof OptionFlags };

export interface ExternalAsset {
  /** 안정 식별자 — 로깅 + 누락 보고 + 테스트에서 사용 */
  id: string;
  /** 사람이 읽는 라벨 (한 줄) */
  description: string;
  condition: ExternalAssetCondition;
  method: ExternalAssetMethod;
  /** 실패 시 동작 — 기본 warn-skip. abort는 vibe killer라 신중히 사용 */
  failureMode?: "abort" | "warn-skip";
}

const ALL_CSR_SSR_FULL: Track[] = [
  "csr-supabase",
  "csr-fastify",
  "csr-fastapi",
  "ssr-htmx",
  "ssr-nextjs",
  "full",
];

/** csr-*|ssr-nextjs|full per bash setup-harness.sh L1041 (ssr-htmx 제외 — htmx는 React 미사용). */
const CSR_SSR_NEXTJS_FULL: Track[] = [
  "csr-supabase",
  "csr-fastify",
  "csr-fastapi",
  "ssr-nextjs",
  "full",
];

const RAILWAY_TRACKS: Track[] = ["csr-fastify", "csr-fastapi", "ssr-htmx", "ssr-nextjs", "full"];

/**
 * 32 외부 자산 매트릭스. bash setup-harness.sh@911c246~1 L791~1067 + 1320~1370 동등.
 *
 * 호출 순서: data → dev-baseline → railway → supabase-cli → impeccable → dev-tools →
 * supabase-skills → react/ui → next → executive → GSD → ToB → ECC.
 */
export const EXTERNAL_ASSETS: ReadonlyArray<ExternalAsset> = [
  // === data Track ===
  {
    id: "polars-K-Dense",
    description: "polars (K-Dense scientific-skills)",
    condition: { kind: "any-track", tracks: ["data", "full"] },
    method: { kind: "skill", source: "K-Dense-AI/scientific-agent-skills", skill: "polars" },
  },
  {
    id: "dask-K-Dense",
    description: "dask (K-Dense, 분산처리)",
    condition: { kind: "any-track", tracks: ["data", "full"] },
    method: { kind: "skill", source: "K-Dense-AI/scientific-agent-skills", skill: "dask" },
  },
  {
    id: "python-resource-management",
    description: "python-resource-management (wshobson)",
    condition: { kind: "any-track", tracks: ["data", "full"] },
    method: {
      kind: "skill",
      source: "https://github.com/wshobson/agents",
      skill: "python-resource-management",
    },
  },
  {
    id: "python-performance-optimization",
    description: "python-performance-optimization (wshobson)",
    condition: { kind: "any-track", tracks: ["data", "full"] },
    method: {
      kind: "skill",
      source: "https://github.com/wshobson/agents",
      skill: "python-performance-optimization",
    },
  },
  {
    id: "anthropic-data-plugin",
    description: "Anthropic data plugin (visualization, SQL exploration)",
    condition: { kind: "any-track", tracks: ["data", "full"] },
    method: {
      kind: "plugin",
      marketplace: "anthropics/knowledge-work-plugins",
      pluginId: "data@knowledge-work-plugins",
    },
  },

  // === dev baseline (모든 dev track) ===
  {
    id: "addy-agent-skills",
    description: "addy agent-skills (general dev)",
    condition: { kind: "has-dev-track" },
    method: {
      kind: "plugin",
      marketplace: "addyosmani/agent-skills",
      pluginId: "agent-skills@addy-agent-skills",
    },
  },

  // === Railway (csr-fastify|csr-fastapi|ssr-*|full) ===
  {
    id: "railway-plugin",
    description: "Railway plugin (deploy commands)",
    condition: { kind: "any-track", tracks: RAILWAY_TRACKS },
    method: {
      kind: "plugin",
      marketplace: "railwayapp/railway-plugin",
      pluginId: "railway-plugin@railway-plugin",
    },
  },
  {
    id: "railway-skills",
    description: "Railway agent-skills",
    condition: { kind: "any-track", tracks: RAILWAY_TRACKS },
    method: {
      kind: "plugin",
      marketplace: "railwayapp/railway-skills",
      pluginId: "railway@railway-skills",
    },
  },

  // === csr-supabase|full CLI ===
  {
    id: "vercel-cli",
    description: "Vercel CLI (npm -g)",
    condition: { kind: "any-track", tracks: ["csr-supabase", "full"] },
    method: { kind: "npm-global", pkg: "vercel" },
  },
  {
    id: "netlify-cli",
    description: "Netlify CLI (npm -g)",
    condition: { kind: "any-track", tracks: ["csr-supabase", "full"] },
    method: { kind: "npm-global", pkg: "netlify-cli" },
  },
  {
    id: "supabase-cli",
    description: "Supabase CLI (npm -g) — 'supabase login' 첫 실행 후 OAuth 필요",
    condition: { kind: "any-track", tracks: ["csr-supabase", "full"] },
    method: { kind: "npm-global", pkg: "supabase" },
  },

  // === UI tracks (csr-*|ssr-*|full) ===
  {
    id: "impeccable",
    description: "Impeccable UI design skill (pbakaus)",
    condition: { kind: "any-track", tracks: ALL_CSR_SSR_FULL },
    method: { kind: "skill", source: "pbakaus/impeccable" },
  },

  // === dev tools (has_dev_track) ===
  {
    id: "playwright-skill",
    description: "Playwright skill (testdino-hq)",
    condition: { kind: "has-dev-track" },
    method: { kind: "skill", source: "testdino-hq/playwright-skill" },
  },
  {
    id: "find-skills",
    description: "find-skills (vercel-labs) — Skill 검색",
    condition: { kind: "has-dev-track" },
    method: { kind: "skill", source: "vercel-labs/skills", skill: "find-skills" },
  },
  {
    id: "agent-browser",
    description: "agent-browser (npm -g) — Playwright 래퍼",
    condition: { kind: "has-dev-track" },
    method: { kind: "npm-global", pkg: "agent-browser" },
  },
  {
    id: "architecture-decision-record",
    description: "ADR skill (orchestkit)",
    condition: { kind: "has-dev-track" },
    method: {
      kind: "skill",
      source: "yonatangross/orchestkit",
      skill: "architecture-decision-record",
    },
  },

  // === Supabase agent-skills (csr-supabase|full) ===
  {
    id: "supabase-agent-skills",
    description: "Supabase agent-skills",
    condition: { kind: "any-track", tracks: ["csr-supabase", "full"] },
    method: {
      kind: "plugin",
      marketplace: "supabase/agent-skills",
      pluginId: "supabase@supabase-agent-skills",
    },
  },
  {
    id: "postgres-best-practices",
    description: "postgres-best-practices (Supabase 마켓 plugin)",
    condition: { kind: "any-track", tracks: ["csr-supabase", "full"] },
    method: {
      kind: "plugin",
      marketplace: "supabase/agent-skills",
      pluginId: "postgres-best-practices@supabase-agent-skills",
    },
  },

  // === React + Next UI tracks ===
  {
    id: "react-best-practices",
    description: "react-best-practices (vercel-labs)",
    condition: { kind: "any-track", tracks: CSR_SSR_NEXTJS_FULL },
    method: {
      kind: "skill",
      source: "vercel-labs/agent-skills",
      skill: "react-best-practices",
    },
  },
  {
    id: "shadcn-ui",
    description: "shadcn/ui skill",
    condition: { kind: "any-track", tracks: CSR_SSR_NEXTJS_FULL },
    method: { kind: "skill", source: "shadcn/ui" },
  },
  {
    id: "web-design-guidelines",
    description: "web-design-guidelines (vercel-labs)",
    condition: { kind: "any-track", tracks: CSR_SSR_NEXTJS_FULL },
    method: {
      kind: "skill",
      source: "vercel-labs/agent-skills",
      skill: "web-design-guidelines",
    },
  },
  {
    id: "next-skills",
    description: "next-skills (vercel-labs)",
    condition: { kind: "any-track", tracks: ["ssr-nextjs", "full"] },
    method: { kind: "skill", source: "vercel-labs/next-skills" },
  },

  // === Executive tracks ===
  {
    id: "anthropic-document-skills",
    description: "Anthropic document-skills (pptx/docx/xlsx/pdf)",
    condition: { kind: "any-track", tracks: ["executive", "full"] },
    method: {
      kind: "plugin",
      marketplace: "anthropics/skills",
      pluginId: "document-skills@anthropic-agent-skills",
    },
  },
  {
    id: "c-level-skills",
    description: "c-level-skills (alirezarezvani)",
    condition: { kind: "any-track", tracks: ["executive", "full"] },
    method: {
      kind: "plugin",
      marketplace: "alirezarezvani/c-level-skills",
      pluginId: "c-level-skills@c-level-skills",
    },
  },
  {
    id: "finance-skills",
    description: "finance-skills (alirezarezvani)",
    condition: { kind: "any-track", tracks: ["executive", "full"] },
    method: {
      kind: "plugin",
      marketplace: "alirezarezvani/finance-skills",
      pluginId: "finance-skills@finance-skills",
    },
  },

  // === Option-gated ===
  {
    id: "gsd-orchestrator",
    description: "GSD orchestrator (npx get-shit-done-cc@latest)",
    condition: { kind: "option", flag: "withGsd" },
    method: { kind: "npx-run", cmd: "get-shit-done-cc@latest" },
  },
  {
    id: "trailofbits-skills",
    description: "Trail of Bits security plugin",
    condition: { kind: "option", flag: "withTob" },
    method: {
      kind: "plugin",
      marketplace: "trailofbits/skills",
      pluginId: "trailofbits-skills@trailofbits-skills",
    },
  },
  {
    id: "ecc-plugin",
    description: "ECC (everything-claude-code) 마켓플레이스 + plugin install",
    condition: { kind: "option", flag: "withEcc" },
    method: {
      kind: "plugin",
      marketplace: "affaan-m/everything-claude-code",
      pluginId: "everything-claude-code@everything-claude-code",
    },
  },
  {
    id: "ecc-prune",
    description: "ECC prune (89 KEEP 외 제거 → .claude/local-plugins/ecc/로 복사)",
    condition: { kind: "option", flag: "withPrune" },
    method: {
      kind: "shell-script",
      script: "scripts/prune-ecc.sh",
      args: ["--apply", "--force"],
    },
  },
];

/**
 * 조건 평가 — 주어진 spec(tracks + options)에서 자산이 설치 대상인지 판정.
 */
export function shouldInstallAsset(
  asset: ExternalAsset,
  ctx: { tracks: ReadonlyArray<Track>; options: OptionFlags },
): boolean {
  const cond = asset.condition;
  switch (cond.kind) {
    case "any-track":
      return ctx.tracks.some((t) => cond.tracks.includes(t));
    case "has-dev-track":
      return ctx.tracks.some((t) => t !== "executive");
    case "option":
      return ctx.options[cond.flag] === true;
  }
}

/**
 * spec에 적용 가능한 자산 필터.
 */
export function filterApplicableAssets(
  assets: ReadonlyArray<ExternalAsset>,
  ctx: { tracks: ReadonlyArray<Track>; options: OptionFlags },
): ReadonlyArray<ExternalAsset> {
  return assets.filter((a) => shouldInstallAsset(a, ctx));
}
