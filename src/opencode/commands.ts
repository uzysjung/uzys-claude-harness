/**
 * Claude `.claude/commands/uzys/<phase>.md` → OpenCode `.opencode/commands/uzys-<phase>.md`.
 *
 * 차이 (Codex skills.ts와):
 *   - OpenCode 파일명 = 슬래시 커맨드명 → `uzys-<phase>.md` 형식
 *   - Frontmatter: `description` + `agent` (build/plan), `name` 필드 없음 (filename 자체)
 */
import { renameSlashes } from "./agents-md.js";

export interface RenderCommandParams {
  /** Original uzys command markdown (frontmatter optional). */
  source: string;
  /** Phase identifier (spec, plan, build, test, review, ship). */
  phase: string;
}

const AGENT_BY_PHASE: Record<string, string> = {
  spec: "plan",
  plan: "plan",
  build: "build",
  test: "build",
  review: "plan",
  ship: "build",
};

/**
 * Render an OpenCode `.opencode/commands/uzys-<phase>.md` from a Claude
 * `.claude/commands/uzys/<phase>.md` source. Slash references are renamed.
 */
export function renderCommand(params: RenderCommandParams): string {
  const { description, body } = parseSource(params.source);
  const finalDescription = description || `uzys-${params.phase} phase command (OpenCode 포팅)`;
  const escapedDesc = finalDescription.replace(/"/g, '\\"');
  const agent = AGENT_BY_PHASE[params.phase] ?? "build";
  const renamedBody = renameSlashes(body).trimEnd();

  return [
    "---",
    `description: "${escapedDesc}"`,
    `agent: ${agent}`,
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
