/**
 * Codex transform orchestrator — wraps the 5-step pipeline.
 *
 * Replaces `scripts/claude-to-codex.sh` (Phase D, OQ4 = TS port).
 *
 * Inputs:
 *   - harnessRoot:  repository root (templates/ + .mcp.json)
 *   - projectDir:   target project to receive AGENTS.md + .codex/ + .codex-skills/
 *
 * Outputs (under projectDir):
 *   - AGENTS.md
 *   - .codex/config.toml
 *   - .codex/hooks/*.sh                      (3 hooks ported from templates/hooks/)
 *   - .codex-skills/uzys-{phase}/SKILL.md    (6 skills, slash-renamed)
 */

import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { ensureDir } from "../fs-ops.js";
import type { McpJson } from "../mcp-merge.js";
import { renderAgentsMd } from "./agents-md.js";
import { renderConfigToml } from "./config-toml.js";
import { renderSkill } from "./skills.js";

export interface CodexTransformParams {
  harnessRoot: string;
  projectDir: string;
}

export interface CodexTransformReport {
  agentsMdPath: string;
  configTomlPath: string;
  hookFiles: string[];
  skillFiles: string[];
}

const PHASES = ["spec", "plan", "build", "test", "review", "ship"];
const HOOK_NAMES = ["session-start", "hito-counter", "gate-check"];

const ENV_VAR_RENAME = /CLAUDE_PROJECT_DIR/g;

export function runCodexTransform(params: CodexTransformParams): CodexTransformReport {
  const { harnessRoot, projectDir } = params;

  const claudeMd = readRequired(join(harnessRoot, "templates/CLAUDE.md"));
  const agentsTemplate = readRequired(join(harnessRoot, "templates/codex/AGENTS.md.template"));
  const configTemplate = readRequired(join(harnessRoot, "templates/codex/config.toml.template"));
  const projectName = basename(projectDir);
  const mcp = readOptionalJson(join(harnessRoot, ".mcp.json"));

  // 1. AGENTS.md
  const agentsMdPath = join(projectDir, "AGENTS.md");
  ensureDir(projectDir);
  writeFileSync(agentsMdPath, renderAgentsMd({ template: agentsTemplate, claudeMd, projectName }));

  // 2. .codex/config.toml
  const configTomlPath = join(projectDir, ".codex/config.toml");
  ensureDir(join(projectDir, ".codex"));
  writeFileSync(
    configTomlPath,
    renderConfigToml({
      template: configTemplate,
      projectName,
      projectDir,
      mcp,
    }),
  );

  // 3. .codex/hooks/{session-start,hito-counter,gate-check}.sh
  const hookDir = join(projectDir, ".codex/hooks");
  ensureDir(hookDir);
  const hookFiles: string[] = [];
  for (const hook of HOOK_NAMES) {
    const src = join(harnessRoot, "templates/hooks", `${hook}.sh`);
    if (!existsSync(src)) {
      continue;
    }
    const ported = readFileSync(src, "utf8").replace(ENV_VAR_RENAME, "CODEX_PROJECT_DIR");
    const target = join(hookDir, `${hook}.sh`);
    writeFileSync(target, ported);
    chmodSync(target, 0o755);
    hookFiles.push(target);
  }

  // 4. .codex-skills/uzys-{phase}/SKILL.md
  const skillFiles: string[] = [];
  for (const phase of PHASES) {
    const skillDir = join(projectDir, ".codex-skills", `uzys-${phase}`);
    ensureDir(skillDir);
    const cmdSrc = join(harnessRoot, "templates/commands/uzys", `${phase}.md`);
    let source = "";
    if (existsSync(cmdSrc)) {
      source = readFileSync(cmdSrc, "utf8");
    } else {
      // Fallback: bundled stub from templates/codex/skills/<phase>/SKILL.md
      const fallback = join(harnessRoot, "templates/codex/skills", `uzys-${phase}/SKILL.md`);
      if (existsSync(fallback)) {
        source = readFileSync(fallback, "utf8");
      }
    }
    const target = join(skillDir, "SKILL.md");
    writeFileSync(target, renderSkill({ source, phase }));
    skillFiles.push(target);
  }

  return { agentsMdPath, configTomlPath, hookFiles, skillFiles };
}

function readRequired(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`Codex transform: required source missing: ${path}`);
  }
  return readFileSync(path, "utf8");
}

function readOptionalJson(path: string): McpJson | null {
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as McpJson;
  } catch {
    return null;
  }
}
