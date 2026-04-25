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
  it("has the documented 9 tracks", () => {
    expect(TRACKS).toHaveLength(9);
  });
});
