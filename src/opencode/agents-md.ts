/**
 * AGENTS.md transform — CLAUDE.md → AGENTS.md (OpenCode flavor).
 *
 * Mirrors `src/codex/agents-md.ts` logic (Codex와 OpenCode 둘 다 콜론 namespace
 * 미사용으로 slash rename 동일). 별도 파일로 유지 — 모듈 독립성.
 */

/** Extract a `## Heading` section's body (everything until the next `## ` or EOF). */
export function extractSection(source: string, heading: string): string {
  const lines = source.split(/\r?\n/);
  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\b`);
  let inSection = false;
  const out: string[] = [];
  for (const line of lines) {
    if (!inSection) {
      if (headingPattern.test(line)) {
        inSection = true;
      }
      continue;
    }
    if (/^##\s/.test(line)) {
      break;
    }
    out.push(line);
  }
  return out.join("\n");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Rename Claude slash conventions (`/uzys:foo`) to OpenCode (`/uzys-foo`). */
export function renameSlashes(text: string): string {
  return text.replaceAll("/uzys:", "/uzys-");
}

export interface AgentsMdParams {
  template: string;
  claudeMd: string;
  projectName: string;
}

/**
 * Render the OpenCode AGENTS.md output.
 *
 * Placeholders supported (matches templates/opencode/AGENTS.md.template):
 *   - {PROJECT_NAME}
 *   - {IDENTITY_SECTION}
 *   - {PROJECT_DIRECTION_SECTION}
 *   - {CORE_PRINCIPLES_SECTION}
 */
export function renderAgentsMd(params: AgentsMdParams): string {
  const identity = extractSection(params.claudeMd, "Identity");
  const direction = extractSection(params.claudeMd, "Project Direction");
  const principles = extractSection(params.claudeMd, "Core Principles");

  const replaced = params.template
    .replaceAll("{PROJECT_NAME}", params.projectName)
    .replaceAll("{IDENTITY_SECTION}", identity)
    .replaceAll("{PROJECT_DIRECTION_SECTION}", direction)
    .replaceAll("{CORE_PRINCIPLES_SECTION}", principles);

  return renameSlashes(replaced);
}
