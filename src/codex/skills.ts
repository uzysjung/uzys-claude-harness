/**
 * uzys command → uzys-* SKILL.md transform.
 * Mirrors `claude-to-codex.sh` step 4 (lines 167-205).
 */
import { renameSlashes } from "./agents-md.js";

export interface RenderSkillParams {
  /** Original uzys command markdown (frontmatter optional — first line = description if absent). */
  source: string;
  /** Phase identifier (spec, plan, build, test, review, ship). */
  phase: string;
}

/**
 * Render a Codex SKILL.md from a Claude `.claude/commands/uzys/<phase>.md` source.
 * Slash references inside the body are renamed to the Codex (`uzys-`) form.
 */
export function renderSkill(params: RenderSkillParams): string {
  const { description, body } = parseSource(params.source);
  const finalDescription = description || `uzys-${params.phase} phase skill (Codex 포팅)`;
  const escapedDesc = finalDescription.replace(/"/g, '\\"');
  const renamedBody = renameSlashes(body).trimEnd();

  return [
    "---",
    `name: uzys-${params.phase}`,
    `description: "${escapedDesc}"`,
    "---",
    "",
    renamedBody,
    "",
  ].join("\n");
}

interface ParsedSource {
  description: string;
  body: string;
}

function parseSource(source: string): ParsedSource {
  const lines = source.split(/\r?\n/);
  if (lines[0] === "---") {
    // YAML frontmatter present
    let descMatch = "";
    let secondDelimAt = -1;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (line === "---") {
        secondDelimAt = i;
        break;
      }
      const match = line.match(/^description:\s*(.*)$/);
      if (match) {
        descMatch = stripQuotes(match[1] ?? "");
      }
    }
    const body = secondDelimAt >= 0 ? lines.slice(secondDelimAt + 1).join("\n") : source;
    return { description: descMatch, body: body.replace(/^\n+/, "") };
  }
  // No frontmatter: first non-empty line = description, rest = body
  const firstLine = lines[0] ?? "";
  const body = lines.slice(1).join("\n");
  return { description: firstLine.trim(), body };
}

function stripQuotes(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
