import { describe, expect, it } from "vitest";
import { extractSection, renameSlashes, renderAgentsMd } from "../../src/codex/agents-md.js";

const SAMPLE_CLAUDE_MD = `# Project

## Identity

A meta-project.
Multi-line.

## Project Direction (중장기)

Direction body.

## Core Principles

P1.
P2.

## Workflow Gates

ignored
`;

describe("extractSection", () => {
  it("extracts a section's body until the next ## heading", () => {
    expect(extractSection(SAMPLE_CLAUDE_MD, "Identity")).toBe("\nA meta-project.\nMulti-line.\n");
  });

  it("handles trailing parens in heading (Project Direction)", () => {
    expect(extractSection(SAMPLE_CLAUDE_MD, "Project Direction")).toContain("Direction body");
  });

  it("returns empty string when section not found", () => {
    expect(extractSection(SAMPLE_CLAUDE_MD, "Nonexistent")).toBe("");
  });

  it("does not bleed into the following section", () => {
    const result = extractSection(SAMPLE_CLAUDE_MD, "Core Principles");
    expect(result).not.toContain("ignored");
    expect(result).toContain("P1");
  });
});

describe("renameSlashes", () => {
  it("rewrites all /uzys: occurrences to /uzys-", () => {
    expect(renameSlashes("/uzys:plan + /uzys:build")).toBe("/uzys-plan + /uzys-build");
  });

  it("does not touch unrelated text", () => {
    expect(renameSlashes("hello :world")).toBe("hello :world");
  });
});

describe("renderAgentsMd", () => {
  const TEMPLATE = `# {PROJECT_NAME}

## Identity
{IDENTITY_SECTION}

## Project Direction
{PROJECT_DIRECTION_SECTION}

## Core Principles
{CORE_PRINCIPLES_SECTION}

Use /uzys:spec to start.
`;

  it("substitutes placeholders + renames slashes", () => {
    const out = renderAgentsMd({
      template: TEMPLATE,
      claudeMd: SAMPLE_CLAUDE_MD,
      projectName: "demo",
    });
    expect(out).toContain("# demo");
    expect(out).toContain("A meta-project.");
    expect(out).toContain("Direction body.");
    expect(out).toContain("P1");
    expect(out).toContain("/uzys-spec");
    expect(out).not.toContain("/uzys:");
    expect(out).not.toContain("{IDENTITY_SECTION}");
  });
});
