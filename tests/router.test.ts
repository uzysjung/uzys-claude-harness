import { describe, expect, it } from "vitest";
import { buildRouterChoices, summarizeState } from "../src/router.js";
import type { DetectedInstall } from "../src/state.js";

const newState: DetectedInstall = {
  state: "new",
  tracks: [],
  source: "none",
  hasClaudeDir: false,
};

const existingState: DetectedInstall = {
  state: "existing",
  tracks: ["tooling", "csr-fastapi"],
  source: "metafile",
  hasClaudeDir: true,
};

const legacyState: DetectedInstall = {
  state: "existing",
  tracks: [],
  source: "legacy",
  hasClaudeDir: true,
};

describe("buildRouterChoices", () => {
  it("returns 5 choices in stable order", () => {
    const choices = buildRouterChoices(existingState);
    expect(choices.map((c) => c.value)).toEqual(["add", "update", "remove", "reinstall", "exit"]);
  });

  it("disables only the remove action", () => {
    const choices = buildRouterChoices(existingState);
    const disabled = choices.filter((c) => !c.enabled).map((c) => c.value);
    expect(disabled).toEqual(["remove"]);
  });

  it("includes detected tracks in the add hint", () => {
    const choices = buildRouterChoices(existingState);
    const add = choices.find((c) => c.value === "add");
    expect(add?.hint).toContain("tooling");
    expect(add?.hint).toContain("csr-fastapi");
  });

  it("falls back to '(none detected)' when tracks empty", () => {
    const choices = buildRouterChoices(legacyState);
    const add = choices.find((c) => c.value === "add");
    expect(add?.hint).toContain("none detected");
  });
});

describe("summarizeState", () => {
  it("describes a new install", () => {
    expect(summarizeState(newState)).toContain("new install");
  });

  it("describes an existing metafile install with track list", () => {
    expect(summarizeState(existingState)).toContain(".claude/.installed-tracks");
    expect(summarizeState(existingState)).toContain("tooling");
  });

  it("describes a legacy heuristic install", () => {
    expect(summarizeState(legacyState)).toContain("legacy rules");
  });

  it("notes when no tracks resolved", () => {
    expect(summarizeState(legacyState)).toContain("no tracks resolved");
  });

  it("describes a none-source existing install path", () => {
    const noneState: DetectedInstall = {
      state: "existing",
      tracks: ["data"],
      source: "none",
      hasClaudeDir: true,
    };
    expect(summarizeState(noneState)).toContain("via no source");
  });
});
