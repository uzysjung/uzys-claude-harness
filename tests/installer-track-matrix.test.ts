/**
 * Track 매트릭스 검증 — 9 Track × external asset 매핑.
 *
 * SPEC: docs/specs/cli-rewrite-completeness.md F4, AC2
 *
 * 각 Track에 대해 runExternalInstall이 정확히 어떤 자산 ID들을 호출하는지 검증.
 * 실제 spawn은 mock으로 차단 (no real `claude plugin install`).
 *
 * 매핑 출처: src/external-assets.ts (bash setup-harness.sh@911c246~1 등가).
 */
import type { SpawnSyncReturns } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { EXTERNAL_ASSETS } from "../src/external-assets.js";
import { type ExternalInstallerDeps, runExternalInstall } from "../src/external-installer.js";
import { DEFAULT_OPTIONS, type OptionFlags, type Track } from "../src/types.js";

type SpawnFn = NonNullable<ExternalInstallerDeps["spawn"]>;

function ok(): SpawnSyncReturns<string> {
  return { pid: 0, output: [], stdout: "", stderr: "", status: 0, signal: null };
}

function makeMockSpawn(): SpawnFn & { mock: { calls: Array<Parameters<SpawnFn>> } } {
  return vi.fn(() => ok()) as unknown as SpawnFn & {
    mock: { calls: Array<Parameters<SpawnFn>> };
  };
}

function runForTrack(
  tracks: Track[],
  options: Partial<OptionFlags> = {},
): { ids: string[]; spawnCallCount: number } {
  const spawn = makeMockSpawn();
  const report = runExternalInstall(
    { tracks, options: { ...DEFAULT_OPTIONS, ...options } },
    { spawn, log: () => {}, warn: () => {}, assets: EXTERNAL_ASSETS },
  );
  return {
    ids: report.attempted.map((r) => r.asset.id),
    spawnCallCount: spawn.mock.calls.length,
  };
}

describe("Track matrix — assets called per track", () => {
  it("tooling: dev baseline + dev-tools (no Track-specific assets)", () => {
    const { ids } = runForTrack(["tooling"]);
    expect(ids).toEqual([
      "addy-agent-skills",
      "playwright-skill",
      "find-skills",
      "agent-browser",
      "architecture-decision-record",
    ]);
  });

  it("data: 5 data-specific + dev baseline + dev-tools", () => {
    const { ids } = runForTrack(["data"]);
    expect(ids).toEqual([
      "polars-K-Dense",
      "dask-K-Dense",
      "python-resource-management",
      "python-performance-optimization",
      "anthropic-data-plugin",
      "addy-agent-skills",
      "playwright-skill",
      "find-skills",
      "agent-browser",
      "architecture-decision-record",
    ]);
  });

  it("csr-fastapi: dev baseline + Railway 2종 + UI(react+shadcn+web-design) + impeccable", () => {
    const { ids } = runForTrack(["csr-fastapi"]);
    expect(ids).toContain("railway-plugin");
    expect(ids).toContain("railway-skills");
    expect(ids).toContain("addy-agent-skills");
    expect(ids).toContain("impeccable");
    // csr-* matches CSR_SSR_NEXTJS_FULL set → react/shadcn/web-design applies
    expect(ids).toContain("react-best-practices");
    expect(ids).toContain("shadcn-ui");
    expect(ids).toContain("web-design-guidelines");
    expect(ids).not.toContain("vercel-cli"); // csr-supabase only
    expect(ids).not.toContain("next-skills"); // ssr-nextjs only
    expect(ids).not.toContain("polars-K-Dense"); // data only
  });

  it("csr-supabase: Vercel/Netlify/Supabase CLI + supabase-skills + UI", () => {
    const { ids } = runForTrack(["csr-supabase"]);
    expect(ids).toEqual(
      expect.arrayContaining([
        "vercel-cli",
        "netlify-cli",
        "supabase-cli",
        "supabase-agent-skills",
        "postgres-best-practices",
        "react-best-practices",
        "shadcn-ui",
        "web-design-guidelines",
        "impeccable",
      ]),
    );
    expect(ids).not.toContain("railway-plugin"); // not in csr-supabase per matrix
    expect(ids).not.toContain("next-skills"); // ssr-nextjs only
  });

  it("ssr-nextjs: Railway + React/Next stack", () => {
    const { ids } = runForTrack(["ssr-nextjs"]);
    expect(ids).toEqual(
      expect.arrayContaining([
        "railway-plugin",
        "railway-skills",
        "react-best-practices",
        "shadcn-ui",
        "web-design-guidelines",
        "next-skills",
        "impeccable",
      ]),
    );
  });

  it("ssr-htmx: Railway only (no React stack)", () => {
    const { ids } = runForTrack(["ssr-htmx"]);
    expect(ids).toContain("railway-plugin");
    expect(ids).toContain("impeccable");
    expect(ids).not.toContain("react-best-practices");
    expect(ids).not.toContain("next-skills");
  });

  it("executive: only Anthropic + finance/c-level (no dev tools)", () => {
    const { ids } = runForTrack(["executive"]);
    expect(ids).toEqual([
      "anthropic-document-skills",
      "c-level-skills",
      "business-growth-skills",
      "finance-skills",
    ]);
    // No dev-track assets
    expect(ids).not.toContain("addy-agent-skills");
    expect(ids).not.toContain("polars-K-Dense");
    expect(ids).not.toContain("railway-plugin");
  });

  it("full: all Track-conditional assets active", () => {
    const { ids } = runForTrack(["full"]);
    // data + csr-supabase + railway + ui + react + next + executive + dev baseline
    expect(ids).toEqual(
      expect.arrayContaining([
        "polars-K-Dense",
        "addy-agent-skills",
        "railway-plugin",
        "vercel-cli",
        "impeccable",
        "supabase-agent-skills",
        "react-best-practices",
        "next-skills",
        "anthropic-document-skills",
        "c-level-skills",
        "business-growth-skills",
        "finance-skills",
      ]),
    );
  });

  it("--with-ecc adds ecc-plugin to attempt list (option-gated)", () => {
    const { ids } = runForTrack(["tooling"], { withEcc: true });
    expect(ids).toContain("ecc-plugin");
    expect(ids).not.toContain("ecc-prune"); // separate flag
  });

  it("--with-prune adds ecc-prune (option-gated, independent of withEcc)", () => {
    const { ids } = runForTrack(["tooling"], { withPrune: true });
    expect(ids).toContain("ecc-prune");
  });

  it("--with-tob adds Trail of Bits (any track)", () => {
    const { ids } = runForTrack(["tooling"], { withTob: true });
    expect(ids).toContain("trailofbits-skills");
    const { ids: idsExec } = runForTrack(["executive"], { withTob: true });
    expect(idsExec).toContain("trailofbits-skills");
  });

  it("--with-gsd adds GSD orchestrator", () => {
    const { ids } = runForTrack(["executive"], { withGsd: true });
    expect(ids).toContain("gsd-orchestrator");
  });
});

describe("Track matrix — spawn call counts", () => {
  it("tooling: 6 spawn calls (1 plugin × 2 + 3 skills + 1 npm)", () => {
    // addy(plugin=2) + playwright(skill=1) + find-skills(1) + agent-browser(npm=1) + ADR(1) = 6
    const { spawnCallCount } = runForTrack(["tooling"]);
    expect(spawnCallCount).toBe(6);
  });

  it("data: tooling baseline 6 + data 6 (4 skills + 1 plugin × 2) = 12", () => {
    const { spawnCallCount } = runForTrack(["data"]);
    expect(spawnCallCount).toBe(12);
  });

  it("--with-gsd alone (executive base) adds 1 npx call", () => {
    const baseExec = runForTrack(["executive"]).spawnCallCount;
    const withGsd = runForTrack(["executive"], { withGsd: true }).spawnCallCount;
    expect(withGsd - baseExec).toBe(1);
  });
});
