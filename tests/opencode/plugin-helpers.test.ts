import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  extractFilePath,
  extractSlashCommand,
  type GateStatus,
  gateToCommand,
  isPhaseComplete,
  isSpecPath,
  PHASE_DEPENDENCY,
  readGateStatus,
} from "../../src/opencode/plugin-helpers.js";

describe("plugin-helpers PHASE_DEPENDENCY", () => {
  it("entry point uzys-spec has no prerequisite", () => {
    expect(PHASE_DEPENDENCY["uzys-spec"]).toBeNull();
  });

  it("each subsequent phase requires the prior one", () => {
    expect(PHASE_DEPENDENCY["uzys-plan"]).toBe("define");
    expect(PHASE_DEPENDENCY["uzys-build"]).toBe("plan");
    expect(PHASE_DEPENDENCY["uzys-test"]).toBe("build");
    expect(PHASE_DEPENDENCY["uzys-review"]).toBe("verify");
    expect(PHASE_DEPENDENCY["uzys-ship"]).toBe("review");
  });

  it("unknown commands return undefined (passthrough)", () => {
    expect(PHASE_DEPENDENCY["uzys-bogus"]).toBeUndefined();
  });
});

describe("plugin-helpers readGateStatus", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "ch-plugin-"));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("returns empty object when file absent", () => {
    expect(readGateStatus(projectDir)).toEqual({});
  });

  it("parses valid JSON", () => {
    mkdirSync(join(projectDir, ".claude"), { recursive: true });
    writeFileSync(
      join(projectDir, ".claude/gate-status.json"),
      JSON.stringify({ define: { completed: true }, plan: { completed: false } }),
    );
    const status = readGateStatus(projectDir);
    expect(status.define?.completed).toBe(true);
    expect(status.plan?.completed).toBe(false);
  });

  it("returns empty object on malformed JSON", () => {
    mkdirSync(join(projectDir, ".claude"), { recursive: true });
    writeFileSync(join(projectDir, ".claude/gate-status.json"), "{ not json");
    expect(readGateStatus(projectDir)).toEqual({});
  });
});

describe("plugin-helpers isPhaseComplete", () => {
  it("returns true only when completed === true", () => {
    const status: GateStatus = { define: { completed: true } };
    expect(isPhaseComplete(status, "define")).toBe(true);
    expect(isPhaseComplete(status, "plan")).toBe(false);
  });

  it("returns false when completed missing", () => {
    expect(isPhaseComplete({}, "define")).toBe(false);
  });
});

describe("plugin-helpers gateToCommand", () => {
  it("maps gate name to slash command suffix", () => {
    expect(gateToCommand("define")).toBe("spec");
    expect(gateToCommand("verify")).toBe("test");
    expect(gateToCommand("ship")).toBe("ship");
  });
});

describe("plugin-helpers extractSlashCommand", () => {
  it("extracts from { command: '/uzys-build' }", () => {
    expect(extractSlashCommand({ command: "/uzys-build" })).toBe("uzys-build");
  });

  it("extracts from { command: 'uzys-build' } (no leading slash)", () => {
    expect(extractSlashCommand({ command: "uzys-build" })).toBe("uzys-build");
  });

  it("extracts from { tool: 'uzys-build' }", () => {
    expect(extractSlashCommand({ tool: "uzys-build" })).toBe("uzys-build");
  });

  it("extracts from { args: { command: '/uzys-plan' } }", () => {
    expect(extractSlashCommand({ args: { command: "/uzys-plan" } })).toBe("uzys-plan");
  });

  it("returns null for non-uzys tool", () => {
    expect(extractSlashCommand({ tool: "bash" })).toBeNull();
  });

  it("returns null for null/non-object input", () => {
    expect(extractSlashCommand(null)).toBeNull();
    expect(extractSlashCommand("string")).toBeNull();
    expect(extractSlashCommand(undefined)).toBeNull();
  });
});

describe("plugin-helpers extractFilePath", () => {
  it("extracts from { filePath: '...' }", () => {
    expect(extractFilePath({ filePath: "/x/y" })).toBe("/x/y");
  });

  it("extracts from { args: { filePath: '...' } }", () => {
    expect(extractFilePath({ args: { filePath: "a/b" } })).toBe("a/b");
  });

  it("extracts from { args: { path: '...' } }", () => {
    expect(extractFilePath({ args: { path: "c/d" } })).toBe("c/d");
  });

  it("returns null when no path present", () => {
    expect(extractFilePath({})).toBeNull();
    expect(extractFilePath(null)).toBeNull();
  });
});

describe("plugin-helpers isSpecPath", () => {
  it("matches docs/SPEC.md exactly", () => {
    expect(isSpecPath("docs/SPEC.md")).toBe(true);
    expect(isSpecPath("/abs/path/docs/SPEC.md")).toBe(true);
  });

  it("matches docs/specs/<feature>.md", () => {
    expect(isSpecPath("docs/specs/opencode-compat.md")).toBe(true);
    expect(isSpecPath("/abs/docs/specs/codex-compat.md")).toBe(true);
  });

  it("rejects non-spec paths", () => {
    expect(isSpecPath("README.md")).toBe(false);
    expect(isSpecPath("docs/plan.md")).toBe(false);
    expect(isSpecPath("docs/specs/sub/dir/file.md")).toBe(false);
  });
});
