import { describe, expect, it } from "vitest";
import { renderCommand } from "../../src/opencode/commands.js";

const SOURCE_WITH_FRONTMATTER = `---
description: "Define phase — 구조화된 스펙"
---

본문 — /uzys:plan 으로 진행.
`;

const SOURCE_WITHOUT_FRONTMATTER = `Define phase summary

Body line.
Use /uzys:build next.
`;

describe("opencode/commands renderCommand", () => {
  it("emits frontmatter with description + agent + body slash-renamed", () => {
    const out = renderCommand({ source: SOURCE_WITH_FRONTMATTER, phase: "spec" });
    expect(out).toContain('description: "Define phase — 구조화된 스펙"');
    expect(out).toContain("agent: plan");
    expect(out).toContain("/uzys-plan");
    expect(out).not.toContain("/uzys:plan");
    // No `name:` line — OpenCode uses filename as command name
    expect(out).not.toMatch(/^name:/m);
  });

  it("uses default description when source has none", () => {
    const out = renderCommand({ source: "", phase: "build" });
    expect(out).toContain("uzys-build phase command");
    expect(out).toContain("agent: build");
  });

  it("falls back to first non-empty line when no frontmatter present", () => {
    const out = renderCommand({ source: SOURCE_WITHOUT_FRONTMATTER, phase: "test" });
    expect(out).toContain("Define phase summary");
    expect(out).toContain("agent: build");
    expect(out).toContain("/uzys-build");
  });

  it("maps phase to correct agent (plan/build pairing)", () => {
    expect(renderCommand({ source: "", phase: "spec" })).toContain("agent: plan");
    expect(renderCommand({ source: "", phase: "plan" })).toContain("agent: plan");
    expect(renderCommand({ source: "", phase: "build" })).toContain("agent: build");
    expect(renderCommand({ source: "", phase: "test" })).toContain("agent: build");
    expect(renderCommand({ source: "", phase: "review" })).toContain("agent: plan");
    expect(renderCommand({ source: "", phase: "ship" })).toContain("agent: build");
  });

  it("escapes double-quotes in description", () => {
    const out = renderCommand({
      source: `---\ndescription: "He said \\"hi\\""\n---\n\nbody\n`,
      phase: "spec",
    });
    expect(out).toMatch(/description: ".*\\".*\\"/);
  });

  it("handles unknown phase by defaulting agent to build", () => {
    const out = renderCommand({ source: "", phase: "unknown" });
    expect(out).toContain("agent: build");
  });

  it("handles description without surrounding quotes (frontmatter without quoting)", () => {
    const out = renderCommand({
      source: "---\ndescription: bare description text\n---\n\nbody\n",
      phase: "spec",
    });
    expect(out).toContain('description: "bare description text"');
  });

  it("handles frontmatter without closing delimiter (treats whole as body)", () => {
    const out = renderCommand({
      source: "---\ndescription: never closed\n\nbody continues\n",
      phase: "spec",
    });
    expect(out).toContain('description: "never closed"');
  });
});
