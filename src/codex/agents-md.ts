/**
 * AGENTS.md transform — CLAUDE.md → AGENTS.md.
 * Mirrors the bash `claude-to-codex.sh` step 1 (lines 78-118).
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

/** Rename Claude slash conventions (`/uzys:foo`) to Codex (`/uzys-foo`). */
export function renameSlashes(text: string): string {
  return text.replaceAll("/uzys:", "/uzys-");
}

export interface AgentsMdParams {
  template: string;
  claudeMd: string;
  projectName: string;
}

/**
 * Render the AGENTS.md output by substituting placeholders in the template
 * with extracted CLAUDE.md sections, then renaming slash conventions.
 *
 * Placeholders supported:
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
