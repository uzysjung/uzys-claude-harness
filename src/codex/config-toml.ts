/**
 * config.toml transform — fill placeholders + append [mcp_servers.X] from .mcp.json.
 * Mirrors `claude-to-codex.sh` steps 2 + 5.
 */

import type { McpJson } from "../mcp-merge.js";

export interface RenderConfigTomlParams {
  template: string;
  projectName: string;
  projectDir: string;
  /** Source `.mcp.json` (parsed). When provided, [mcp_servers.X] blocks replace defaults. */
  mcp?: McpJson | null;
}

const DEFAULT_MCP_BLOCK_RE = /\n# =+\n# MCP Servers — .*?\n# =+[\s\S]*$/;

/**
 * Substitute placeholders + replace the MCP servers section with blocks
 * derived from the supplied `.mcp.json` (or leave the template default).
 */
export function renderConfigToml(params: RenderConfigTomlParams): string {
  const substituted = params.template
    .replaceAll("{PROJECT_NAME}", params.projectName)
    .replaceAll("{PROJECT_DIR}", params.projectDir)
    .replaceAll("{GITHUB_TOKEN}", "${GITHUB_TOKEN}");

  if (!params.mcp) {
    return substituted;
  }

  const stripped = stripExistingMcpSection(substituted);
  const fresh = renderMcpServers(params.mcp);
  return `${stripped.trimEnd()}\n${fresh}\n`;
}

function stripExistingMcpSection(toml: string): string {
  // Drop default [mcp_servers.X] blocks shipped in the template (we replace from .mcp.json)
  const lines = toml.split(/\r?\n/);
  const out: string[] = [];
  let skipping = false;
  for (const line of lines) {
    if (line.startsWith("[mcp_servers.")) {
      skipping = true;
      continue;
    }
    if (skipping && line.startsWith("[") && !line.startsWith("[mcp_servers.")) {
      skipping = false;
    }
    if (skipping) {
      continue;
    }
    if (
      /^# .*MCP Servers/.test(line) ||
      /^# Railway MCP/.test(line) ||
      /^# github MCP/.test(line)
    ) {
      continue;
    }
    out.push(line);
  }
  return out.join("\n").replace(DEFAULT_MCP_BLOCK_RE, "");
}

function renderMcpServers(mcp: McpJson): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const header = [
    "# ============================================================",
    `# MCP Servers — generated from .mcp.json (${stamp})`,
    "# ============================================================",
  ].join("\n");

  const blocks = Object.entries(mcp.mcpServers).map(([name, cfg]) => {
    const lines = [`[mcp_servers.${quoteIfNeeded(name)}]`];
    lines.push(`command = ${jsonString(cfg.command)}`);
    lines.push(`args = ${JSON.stringify(cfg.args)}`);
    if (cfg.env && Object.keys(cfg.env).length > 0) {
      const envBody = Object.entries(cfg.env)
        .map(([k, v]) => `${k} = ${jsonString(v)}`)
        .join(", ");
      lines.push(`env = { ${envBody} }`);
    }
    return lines.join("\n");
  });

  return [header, "", ...blocks].join("\n");
}

function jsonString(s: string): string {
  return JSON.stringify(s);
}

function quoteIfNeeded(name: string): string {
  return /^[A-Za-z0-9_-]+$/.test(name) ? name : `"${name}"`;
}
