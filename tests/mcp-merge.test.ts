import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type McpJson,
  type TrackMcpRow,
  composeMcpJson,
  mergeMcpServers,
  parseTrackMcpMap,
  writeMcpJson,
} from "../src/mcp-merge.js";

const SAMPLE_MAP = `# header
railway-mcp-server\tcsr-*|ssr-*|full\tnpx\t["-y", "@railway/mcp-server"]
supabase\tcsr-supabase|full\tnpx\t["-y", "@supabase/mcp-server"]
# trailing comment
`;

const BASE: McpJson = {
  _comment: "template",
  mcpServers: {
    context7: { command: "npx", args: ["-y", "@upstash/context7-mcp"] },
  },
};

describe("parseTrackMcpMap", () => {
  it("ignores comments + blank lines", () => {
    const rows = parseTrackMcpMap(SAMPLE_MAP);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.name).toBe("railway-mcp-server");
    expect(rows[1]?.pattern).toBe("csr-supabase|full");
  });

  it("rejects rows with missing fields", () => {
    expect(parseTrackMcpMap("name\tpattern")).toEqual([]);
  });

  it("rejects rows with non-string args", () => {
    const bad = "name\tpattern\tnpx\t[1, 2]";
    expect(parseTrackMcpMap(bad)).toEqual([]);
  });

  it("rejects rows with malformed JSON args", () => {
    const bad = "name\tpattern\tnpx\t[not json]";
    expect(parseTrackMcpMap(bad)).toEqual([]);
  });
});

describe("mergeMcpServers", () => {
  const rows: TrackMcpRow[] = [
    { name: "railway-mcp-server", pattern: "csr-*|full", command: "npx", args: ["-y", "x"] },
    { name: "supabase", pattern: "csr-supabase", command: "npx", args: ["-y", "y"] },
  ];

  it("adds servers whose pattern matches selected tracks", () => {
    const out = mergeMcpServers(BASE, rows, ["csr-supabase"]);
    expect(Object.keys(out.mcpServers).sort()).toEqual([
      "context7",
      "railway-mcp-server",
      "supabase",
    ]);
  });

  it("does not add servers when no track matches", () => {
    const out = mergeMcpServers(BASE, rows, ["executive"]);
    expect(Object.keys(out.mcpServers)).toEqual(["context7"]);
  });

  it("preserves existing custom servers (no overwrite)", () => {
    const customized: McpJson = {
      mcpServers: {
        ...BASE.mcpServers,
        railway: { command: "user", args: ["custom"] },
        "railway-mcp-server": { command: "kept", args: [] },
      },
    };
    const out = mergeMcpServers(customized, rows, ["full"]);
    expect(out.mcpServers["railway-mcp-server"]?.command).toBe("kept");
  });

  it("strips _comment marker", () => {
    const out = mergeMcpServers(BASE, [], ["tooling"]);
    expect(out._comment).toBeUndefined();
  });
});

describe("composeMcpJson", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ch-mcp-"));
    writeFileSync(
      join(dir, "mcp.json"),
      JSON.stringify({ _comment: "tpl", mcpServers: { context7: { command: "npx", args: [] } } }),
    );
    writeFileSync(join(dir, "track-mcp-map.tsv"), SAMPLE_MAP);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("composes from template + map (no existing user file)", () => {
    const out = composeMcpJson({
      templateMcpPath: join(dir, "mcp.json"),
      trackMapPath: join(dir, "track-mcp-map.tsv"),
      tracks: ["full"],
    });
    expect(Object.keys(out.mcpServers).sort()).toEqual([
      "context7",
      "railway-mcp-server",
      "supabase",
    ]);
  });

  it("preserves user-defined servers from existing file", () => {
    const userPath = join(dir, "user.mcp.json");
    writeFileSync(
      userPath,
      JSON.stringify({ mcpServers: { custom: { command: "u", args: ["x"] } } }),
    );
    const out = composeMcpJson({
      templateMcpPath: join(dir, "mcp.json"),
      trackMapPath: join(dir, "track-mcp-map.tsv"),
      existingPath: userPath,
      tracks: ["tooling"],
    });
    expect(out.mcpServers.custom?.command).toBe("u");
  });

  it("survives a malformed existing user file (falls back to template only)", () => {
    const userPath = join(dir, "user.mcp.json");
    writeFileSync(userPath, "{ not json }");
    const out = composeMcpJson({
      templateMcpPath: join(dir, "mcp.json"),
      trackMapPath: join(dir, "track-mcp-map.tsv"),
      existingPath: userPath,
      tracks: ["tooling"],
    });
    expect(out.mcpServers.context7).toBeDefined();
  });

  it("works when track-mcp-map.tsv is missing", () => {
    const out = composeMcpJson({
      templateMcpPath: join(dir, "mcp.json"),
      trackMapPath: join(dir, "no-such.tsv"),
      tracks: ["full"],
    });
    expect(Object.keys(out.mcpServers)).toEqual(["context7"]);
  });
});

describe("writeMcpJson", () => {
  it("writes JSON with trailing newline", () => {
    const dir = mkdtempSync(join(tmpdir(), "ch-mcp-write-"));
    const path = join(dir, "out.json");
    writeMcpJson(path, { mcpServers: {} });
    const raw = readFileSync(path, "utf8");
    expect(raw.endsWith("\n")).toBe(true);
    expect(JSON.parse(raw)).toEqual({ mcpServers: {} });
    rmSync(dir, { recursive: true, force: true });
  });
});
