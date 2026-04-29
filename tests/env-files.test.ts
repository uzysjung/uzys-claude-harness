import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addGitignoreEnv,
  addGitignoreNpxSkillsAgents,
  writeEnvExample,
  writeMcpAllowlist,
} from "../src/env-files.js";
import type { Track } from "../src/types.js";

describe("writeEnvExample", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ch-env-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates .env.example for csr-supabase track", () => {
    const created = writeEnvExample(dir, ["csr-supabase"] as Track[]);
    expect(created).toBe(true);
    const body = readFileSync(join(dir, ".env.example"), "utf8");
    expect(body).toContain("SUPABASE_ACCESS_TOKEN");
    expect(body).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("creates .env.example for full track", () => {
    const created = writeEnvExample(dir, ["full"] as Track[]);
    expect(created).toBe(true);
    expect(existsSync(join(dir, ".env.example"))).toBe(true);
  });

  it("skips for non-supabase tracks (tooling/data/executive)", () => {
    expect(writeEnvExample(dir, ["tooling"] as Track[])).toBe(false);
    expect(writeEnvExample(dir, ["data"] as Track[])).toBe(false);
    expect(writeEnvExample(dir, ["executive"] as Track[])).toBe(false);
    expect(existsSync(join(dir, ".env.example"))).toBe(false);
  });

  it("skips when .env.example already exists (idempotent)", () => {
    writeFileSync(join(dir, ".env.example"), "EXISTING=preserved");
    const created = writeEnvExample(dir, ["csr-supabase"] as Track[]);
    expect(created).toBe(false);
    expect(readFileSync(join(dir, ".env.example"), "utf8")).toBe("EXISTING=preserved");
  });
});

describe("addGitignoreEnv", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ch-gi-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("appends .env when .gitignore exists without it", () => {
    writeFileSync(join(dir, ".gitignore"), "node_modules\ndist\n");
    const added = addGitignoreEnv(dir);
    expect(added).toBe(true);
    const after = readFileSync(join(dir, ".gitignore"), "utf8");
    expect(after).toContain(".env");
    expect(after).toContain("node_modules"); // existing preserved
  });

  it("skips when .gitignore is missing", () => {
    expect(addGitignoreEnv(dir)).toBe(false);
  });

  it("skips when .env line already in .gitignore (exact match)", () => {
    writeFileSync(join(dir, ".gitignore"), "node_modules\n.env\n");
    expect(addGitignoreEnv(dir)).toBe(false);
  });

  it("skips when .env line already in .gitignore (with whitespace)", () => {
    writeFileSync(join(dir, ".gitignore"), ".env  # comment\n");
    expect(addGitignoreEnv(dir)).toBe(false);
  });

  it("does NOT match .env.example or .env.local as 'already present'", () => {
    writeFileSync(join(dir, ".gitignore"), ".env.example\n.env.local\n");
    const added = addGitignoreEnv(dir);
    expect(added).toBe(true);
  });
});

describe("writeMcpAllowlist", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ch-mcpal-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns null when .mcp.json missing", () => {
    expect(writeMcpAllowlist(dir)).toBeNull();
  });

  it("returns null when .mcp-allowlist already exists (idempotent)", () => {
    writeFileSync(join(dir, ".mcp.json"), JSON.stringify({ mcpServers: { x: {} } }));
    writeFileSync(join(dir, ".mcp-allowlist"), "existing");
    expect(writeMcpAllowlist(dir)).toBeNull();
  });

  it("writes server names from .mcp.json keys (sorted)", () => {
    writeFileSync(
      join(dir, ".mcp.json"),
      JSON.stringify({
        mcpServers: {
          github: { command: "x" },
          context7: { command: "y" },
          railway: { command: "z" },
        },
      }),
    );
    const names = writeMcpAllowlist(dir);
    expect(names).toEqual(["context7", "github", "railway"]);
    const body = readFileSync(join(dir, ".mcp-allowlist"), "utf8");
    expect(body).toContain("context7\ngithub\nrailway");
    expect(body).toContain("# MCP Server Allowlist");
  });

  it("returns [] when .mcp.json has no mcpServers", () => {
    writeFileSync(join(dir, ".mcp.json"), JSON.stringify({}));
    const names = writeMcpAllowlist(dir);
    expect(names).toEqual([]);
  });

  it("returns null on malformed .mcp.json", () => {
    writeFileSync(join(dir, ".mcp.json"), "{ not json");
    expect(writeMcpAllowlist(dir)).toBeNull();
  });
});

describe("addGitignoreNpxSkillsAgents (v0.8.0)", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ch-gi-skl-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("no .gitignore → returns []", () => {
    expect(addGitignoreNpxSkillsAgents(dir)).toEqual([]);
  });

  it("empty .gitignore → adds both .factory/ and .goose/", () => {
    writeFileSync(join(dir, ".gitignore"), "");
    const added = addGitignoreNpxSkillsAgents(dir);
    expect(added).toEqual([".factory/", ".goose/"]);
    const content = readFileSync(join(dir, ".gitignore"), "utf8");
    expect(content).toContain(".factory/");
    expect(content).toContain(".goose/");
    expect(content).toContain("npx skills add multi-CLI cache");
  });

  it("idempotent — second call returns []", () => {
    writeFileSync(join(dir, ".gitignore"), "");
    addGitignoreNpxSkillsAgents(dir);
    expect(addGitignoreNpxSkillsAgents(dir)).toEqual([]);
  });

  it("partial — .factory/ already present, only .goose/ added", () => {
    writeFileSync(join(dir, ".gitignore"), ".factory/\n");
    const added = addGitignoreNpxSkillsAgents(dir);
    expect(added).toEqual([".goose/"]);
  });
});
