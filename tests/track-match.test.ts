import { describe, expect, it } from "vitest";
import { anyTrack, hasDevTrack, hasUiTrack, matchTrack } from "../src/track-match.js";
import type { Track } from "../src/types.js";

describe("matchTrack", () => {
  it.each([
    ["csr-supabase", "csr-*", true],
    ["csr-supabase", "csr-fastapi", false],
    ["full", "csr-*|full", true],
    ["data", "csr-*|full", false],
    ["tooling", "*", true],
    ["executive", "csr-*|ssr-*", false],
  ] as const)("matchTrack(%s, %s) = %s", (track, pattern, expected) => {
    expect(matchTrack(track as Track, pattern)).toBe(expected);
  });
});

describe("anyTrack", () => {
  it("returns true when at least one track matches", () => {
    expect(anyTrack(["data", "csr-fastapi"], "csr-*")).toBe(true);
  });
  it("returns false when none match", () => {
    expect(anyTrack(["executive"], "csr-*|ssr-*")).toBe(false);
  });
});

describe("hasDevTrack", () => {
  it.each([
    [["tooling"], true],
    [["csr-supabase"], true],
    [["ssr-htmx"], true],
    [["data"], true],
    [["full"], true],
    [["executive"], false],
    // v0.5.0 — executive-style baselines (regression guard, MEDIUM-2 reviewer feedback).
    [["project-management"], false],
    [["growth-marketing"], false],
  ] as const)("hasDevTrack(%j) = %s", (tracks, expected) => {
    expect(hasDevTrack(tracks as readonly Track[])).toBe(expected);
  });
});

describe("hasUiTrack", () => {
  it.each([
    [["tooling"], false],
    [["data"], false],
    [["executive"], false],
    [["csr-supabase"], true],
    [["ssr-nextjs"], true],
    [["full"], true],
    // v0.5.0 — non-UI executive-style tracks.
    [["project-management"], false],
    [["growth-marketing"], false],
  ] as const)("hasUiTrack(%j) = %s", (tracks, expected) => {
    expect(hasUiTrack(tracks as readonly Track[])).toBe(expected);
  });
});
