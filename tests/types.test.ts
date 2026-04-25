import { describe, expect, it } from "vitest";
import { CLI_MODES, TRACKS, isCliMode, isTrack } from "../src/types.js";

describe("isTrack", () => {
  it.each(TRACKS)("accepts known track %s", (t) => {
    expect(isTrack(t)).toBe(true);
  });

  it.each([null, undefined, "", "unknown", 1, true, {}])("rejects %s", (value) => {
    expect(isTrack(value)).toBe(false);
  });
});

describe("isCliMode", () => {
  it.each(CLI_MODES)("accepts %s", (m) => {
    expect(isCliMode(m)).toBe(true);
  });

  it("rejects an unknown CLI", () => {
    expect(isCliMode("rust")).toBe(false);
  });
});

describe("TRACKS array", () => {
  it("has 11 tracks (v0.5.0 — added project-management, growth-marketing)", () => {
    expect(TRACKS).toHaveLength(11);
  });

  it("includes the two v0.5.0 tracks", () => {
    expect(TRACKS).toContain("project-management");
    expect(TRACKS).toContain("growth-marketing");
  });
});
