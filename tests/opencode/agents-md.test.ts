import { describe, expect, it } from "vitest";
import { extractSection, renameSlashes, renderAgentsMd } from "../../src/opencode/agents-md.js";

const SAMPLE_CLAUDE_MD = `# Project

## Identity

OpenCode-flavored harness.

## Project Direction (중장기)

Direction body.

## Core Principles

P1.
P2.

## Workflow Gates

ignored
`;

describe("opencode/agents-md extractSection", () => {
  it("extracts a section's body until the next ## heading", () => {
    expect(extractSection(SAMPLE_CLAUDE_MD, "Identity")).toBe("\nOpenCode-flavored harness.\n");
  });

  it("returns empty string when section not found", () => {
    expect(extractSection(SAMPLE_CLAUDE_MD, "Nonexistent")).toBe("");
  });
});

describe("opencode/agents-md renameSlashes", () => {
  it("rewrites all /uzys: to /uzys-", () => {
    expect(renameSlashes("/uzys:spec + /uzys:plan")).toBe("/uzys-spec + /uzys-plan");
  });

  it("leaves unrelated text alone", () => {
    expect(renameSlashes("colon :elsewhere")).toBe("colon :elsewhere");
  });
});

describe("opencode/agents-md renderAgentsMd", () => {
  const TEMPLATE = `# {PROJECT_NAME}

## Identity
{IDENTITY_SECTION}

## Project Direction
{PROJECT_DIRECTION_SECTION}

## Core Principles
{CORE_PRINCIPLES_SECTION}

Run /uzys:spec to start.
`;

  it("substitutes placeholders + renames slashes", () => {
    const out = renderAgentsMd({
      template: TEMPLATE,
      claudeMd: SAMPLE_CLAUDE_MD,
      projectName: "demo",
    });
    expect(out).toContain("# demo");
    expect(out).toContain("OpenCode-flavored harness.");
    expect(out).toContain("/uzys-spec");
    expect(out).not.toContain("/uzys:");
    expect(out).not.toContain("{IDENTITY_SECTION}");
  });
});
