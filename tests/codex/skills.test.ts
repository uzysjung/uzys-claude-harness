import { describe, expect, it } from "vitest";
import { renderSkill } from "../../src/codex/skills.js";

describe("renderSkill", () => {
  it("uses the first non-empty line as description when no frontmatter", () => {
    const source = "Define phase — write SPEC first.\n\n## Process\n\n1. step\n";
    const out = renderSkill({ source, phase: "spec" });
    expect(out).toContain("name: uzys-spec");
    expect(out).toContain('description: "Define phase — write SPEC first."');
    expect(out).toContain("## Process");
    expect(out).toContain("1. step");
  });

  it("extracts description from YAML frontmatter when present", () => {
    const source = `---\nname: build\ndescription: "Build phase — TDD."\n---\n\n## Goal\n\nbody\n`;
    const out = renderSkill({ source, phase: "build" });
    expect(out).toContain("name: uzys-build");
    expect(out).toContain('description: "Build phase — TDD."');
    expect(out).not.toMatch(/^---\nname: build\n/);
    expect(out).toContain("## Goal");
  });

  it("renames /uzys: → /uzys- in body only", () => {
    const source = "spec.\n\nrun /uzys:plan after this.";
    const out = renderSkill({ source, phase: "spec" });
    expect(out).toContain("/uzys-plan");
    expect(out).not.toContain("/uzys:plan");
  });

  it("falls back to a synthetic description when source is empty", () => {
    const out = renderSkill({ source: "", phase: "ship" });
    expect(out).toContain('description: "uzys-ship phase skill (Codex 포팅)"');
  });

  it("escapes embedded quotes in the description", () => {
    const out = renderSkill({ source: 'A "quoted" desc', phase: "review" });
    expect(out).toContain('description: "A \\"quoted\\" desc"');
  });
});
