// uzys-harness — OpenCode plugin (Phase E1 본문)
//
// SPEC: docs/specs/opencode-compat.md AC5
// ADR: docs/decisions/ADR-004-opencode-plugin-mapping.md
//
// Hook 매핑 (ADR-004 v1):
//   - PreToolUse        → tool.execute.before (gate-check 등가)
//   - PostToolUse       → tool.execute.after  (spec-drift-check 등가)
//   - UserPromptSubmit  → messageCreated filter role==="user" (HITO 카운터)
//
// Reference: templates/hooks/{hito-counter,gate-check,spec-drift-check}.sh
//
// 본 파일은 사용자 프로젝트에 그대로 복사되는 self-contained template.
// 핵심 로직은 src/opencode/plugin-helpers.ts에서도 동일하게 유지(테스트용 미러).
//
// Phase E2 실측 항목 (한계 L1~L4):
//   L1 Plugin runtime (Bun vs Node) — OpenCode CLI 실측 필요
//   L2 tool.execute.before 인자 정확한 시그니처
//   L3 messageCreated user-only 필터 충분 여부
//   L4 throw 시 graceful 차단/crash 동작

import type { Plugin } from "@opencode-ai/plugin";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type GateStatus = {
  define?: { completed?: boolean };
  plan?: { completed?: boolean };
  build?: { completed?: boolean };
  verify?: { completed?: boolean };
  review?: { completed?: boolean };
  ship?: { completed?: boolean };
};

type Phase = "define" | "plan" | "build" | "verify" | "review" | "ship";

const PHASE_DEPENDENCY: Record<string, Phase | null> = {
  "uzys-spec": null,
  "uzys-plan": "define",
  "uzys-build": "plan",
  "uzys-test": "build",
  "uzys-review": "verify",
  "uzys-ship": "review",
};

const PHASE_TO_COMMAND: Record<Phase, string> = {
  define: "spec",
  plan: "plan",
  build: "build",
  verify: "test",
  review: "review",
  ship: "ship",
};

const SPEC_PATH_RE = /docs\/SPEC\.md$|docs\/specs\/[^/]+\.md$/;

const UzysHarness: Plugin = async ({ directory }) => {
  return {
    "tool.execute.before": async (input, _output) => {
      const command = extractSlashCommand(input);
      if (!command) return;

      const required = PHASE_DEPENDENCY[command];
      if (required === undefined) return;
      if (required === null) return;

      const status = readGateStatus(directory);
      if (status[required]?.completed !== true) {
        throw new Error(
          `[uzys-harness] /${command} requires ${required} gate completion. ` +
            `Run /uzys-${PHASE_TO_COMMAND[required]} first.`,
        );
      }
    },

    "tool.execute.after": async (input, _output) => {
      const filePath = extractFilePath(input);
      if (!filePath || !SPEC_PATH_RE.test(filePath)) return;

      const date = new Date().toISOString().slice(0, 10);
      const logDir = join(directory, ".claude/evals");
      try {
        mkdirSync(logDir, { recursive: true });
        const stamp = new Date().toISOString();
        writeFileSync(join(logDir, `spec-drift-${date}.log`), `${stamp} edited ${filePath}\n`, {
          flag: "a",
        });
      } catch {
        // Best-effort logging — never block tool execution.
      }
    },

    messageCreated: async (message, _output) => {
      if (message.role !== "user") return;

      const date = new Date().toISOString().slice(0, 10);
      const logDir = join(directory, ".claude/evals");
      try {
        mkdirSync(logDir, { recursive: true });
        const stamp = new Date().toISOString();
        writeFileSync(join(logDir, `hito-${date}.log`), `${stamp} prompt_submit\n`, {
          flag: "a",
        });
      } catch {
        // Privacy: prompt body never logged. Best-effort.
      }
    },
  };
};

export default UzysHarness;

function readGateStatus(projectDir: string): GateStatus {
  const path = join(projectDir, ".claude/gate-status.json");
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as GateStatus;
  } catch {
    return {};
  }
}

function extractSlashCommand(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const c = input as { command?: unknown; tool?: unknown; args?: { command?: unknown } };
  if (typeof c.command === "string") return c.command.startsWith("/") ? c.command.slice(1) : c.command;
  if (typeof c.tool === "string" && c.tool.startsWith("uzys-")) return c.tool;
  if (c.args && typeof c.args === "object" && typeof c.args.command === "string") {
    return c.args.command.startsWith("/") ? c.args.command.slice(1) : c.args.command;
  }
  return null;
}

function extractFilePath(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const c = input as {
    filePath?: unknown;
    args?: { filePath?: unknown; path?: unknown };
  };
  if (typeof c.filePath === "string") return c.filePath;
  if (c.args && typeof c.args === "object") {
    if (typeof c.args.filePath === "string") return c.args.filePath;
    if (typeof c.args.path === "string") return c.args.path;
  }
  return null;
}
