/**
 * opencode.json transform — fill template + merge mcp.<name> from .mcp.json.
 *
 * Output: opencode.json (top-level `mcp.<name>` map; OpenCode 1:1 매핑).
 *
 * Codex `[mcp_servers.X]` TOML과 다르게 OpenCode는 JSON이라 Object spread
 * 만으로 충분 (TOML 직렬화 없음).
 */

import type { McpJson, McpServerConfig } from "../mcp-merge.js";

export interface RenderOpencodeJsonParams {
  /** Template content (templates/opencode/opencode.json.template). */
  template: string;
  /** Source `.mcp.json` (parsed). When provided, top-level `mcp.<name>` is replaced. */
  mcp?: McpJson | null;
}

interface OpencodeConfig {
  $schema?: string;
  instructions?: string[];
  mcp?: Record<string, McpServerConfig>;
  command?: Record<string, unknown>;
  agent?: Record<string, unknown>;
  plugin?: string[];
  permission?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Substitute `mcp` in the template with entries from `.mcp.json`.
 * Other keys (`agent`, `command`, `plugin`, `permission`, `instructions`,
 * `$schema`) are preserved from the template.
 */
export function renderOpencodeJson(params: RenderOpencodeJsonParams): string {
  const config = parseTemplate(params.template);

  if (params.mcp) {
    config.mcp = { ...params.mcp.mcpServers };
  }

  return `${JSON.stringify(config, null, 2)}\n`;
}

function parseTemplate(template: string): OpencodeConfig {
  try {
    return JSON.parse(template) as OpencodeConfig;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`opencode.json template invalid JSON: ${message}`);
  }
}
