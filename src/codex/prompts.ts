/**
 * Codex prompts render — v0.7.0 Major CR.
 *
 * SPEC: docs/specs/cli-multi-select.md F13 (Codex slash 통일).
 *
 * Source: `templates/commands/uzys/<phase>.md` (Claude Code uzys command)
 * Target: `~/.codex/prompts/uzys-<phase>.md` (Codex custom prompt)
 *
 * 변환:
 * - frontmatter `name: uzys-<phase>` + `description` 보장
 * - body의 `/uzys:<phase>` slash 참조 → `/uzys-<phase>` Codex 컨벤션 (slash rename)
 * - 코드 자체는 동일 (의미 보존)
 *
 * Codex prompts directory에 markdown 파일 두면 Codex 시작 시 `/uzys-<phase>` slash 등록됨.
 * 참조: https://developers.openai.com/codex/cli/slash-commands
 */

import { renameSlashes } from "./agents-md.js";

export interface RenderCodexPromptParams {
  /** Original uzys command markdown (frontmatter optional). */
  source: string;
  /** Phase identifier (spec, plan, build, test, review, ship). */
  phase: string;
}

export function renderCodexPrompt(params: RenderCodexPromptParams): string {
  const { description, body } = parseSource(params.source);
  const finalDescription = description || `uzys-${params.phase} phase`;
  const escapedDesc = finalDescription.replace(/"/g, '\\"');
  const renamedBody = renameSlashes(body).trimEnd();

  // Codex custom prompt frontmatter
  return ["---", `description: "${escapedDesc}"`, "---", "", renamedBody, ""].join("\n");
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
      const m = line.match(/^description:\s*"?(.+?)"?\s*$/);
      if (m?.[1]) descMatch = m[1];
    }
    if (secondDelimAt >= 0) {
      return {
        description: descMatch,
        body: lines
          .slice(secondDelimAt + 1)
          .join("\n")
          .replace(/^\n+/, ""),
      };
    }
    // Malformed frontmatter (no closing `---`) — 첫 라인 `---` 자체를 description으로 쓰지 않음.
    // body는 첫 라인 제외하고 그대로 (renderSkill 동일 패턴).
    return {
      description: "",
      body: lines.slice(1).join("\n"),
    };
  }
  // Frontmatter 부재 — 첫 비공백 라인을 description으로 + body는 첫 라인 제외 (중복 방지).
  // Reviewer HIGH-1 fix: 이전엔 body=source 그대로 → description 라인 중복.
  const firstLine = lines[0] ?? "";
  const description = firstLine.replace(/^#+\s*/, "").slice(0, 200);
  const body = lines.slice(1).join("\n").replace(/^\n+/, "");
  return { description, body };
}

export const CODEX_PROMPT_PHASES = ["spec", "plan", "build", "test", "review", "ship"] as const;
