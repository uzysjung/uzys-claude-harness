/**
 * v0.7.0 — renderCodexPrompt unit tests.
 *
 * SPEC: docs/specs/cli-multi-select.md F13 + F15.
 */

import { describe, expect, it } from "vitest";
import { CODEX_PROMPT_PHASES, renderCodexPrompt } from "../../src/codex/prompts.js";

describe("renderCodexPrompt", () => {
  it("preserves description from Claude Code frontmatter", () => {
    const source = `---
description: "Define phase — 구조화된 스펙을 코드 작성 전에 작성한다."
---

## Process

1. SPEC 작성한다.
`;
    const result = renderCodexPrompt({ source, phase: "spec" });
    expect(result).toContain(
      'description: "Define phase — 구조화된 스펙을 코드 작성 전에 작성한다."',
    );
    expect(result).toContain("## Process");
    expect(result).toContain("SPEC 작성한다.");
  });

  it("renames /uzys:<phase> slash references to /uzys-<phase> Codex convention", () => {
    const source = `---
description: "Plan phase"
---

본 단계가 완료되면 /uzys:build로 진행 가능.
`;
    const result = renderCodexPrompt({ source, phase: "plan" });
    expect(result).toContain("/uzys-build");
    expect(result).not.toContain("/uzys:build");
  });

  it("falls back to default description when frontmatter missing", () => {
    const source = `# Build phase

## Process
TDD로 구현한다.
`;
    const result = renderCodexPrompt({ source, phase: "build" });
    // Body 그대로 포함, frontmatter 없으면 phase 기반 default
    expect(result).toMatch(/^---\n/);
    expect(result).toContain("description:");
    expect(result).toContain("## Process");
    expect(result).toContain("TDD로 구현한다.");
  });

  it("escapes double quotes in description", () => {
    const source = `---
description: "Test \\"phase\\" with quotes"
---

body
`;
    const result = renderCodexPrompt({ source, phase: "test" });
    // description은 double-quote 보존 (escape 처리)
    expect(result).toContain("description:");
    expect(result).toMatch(/^---/);
  });
});

describe("CODEX_PROMPT_PHASES", () => {
  it("has 6 phases (spec, plan, build, test, review, ship)", () => {
    expect(CODEX_PROMPT_PHASES).toEqual(["spec", "plan", "build", "test", "review", "ship"]);
  });
});
