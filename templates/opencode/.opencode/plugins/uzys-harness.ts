// uzys-harness — OpenCode plugin (1차 stub, Phase E1에서 본문 작성)
//
// SPEC: docs/specs/opencode-compat.md AC5
// ADR: docs/decisions/ADR-004-opencode-plugin-mapping.md
//
// Hook 매핑 (ADR-004 v1):
//   - PreToolUse        → tool.execute.before
//   - PostToolUse       → tool.execute.after
//   - UserPromptSubmit  → messageCreated filter role==="user"
//
// Phase E1 작업 항목:
//   - L1 Plugin runtime (Bun vs Node) 실측 후 import 경로 확정
//   - L2 tool.execute.before 인자 시그니처 실측
//   - L3 messageCreated user-only 필터 검증
//   - L4 throw 시 graceful 차단/crash 동작 확인

import type { Plugin } from "@opencode-ai/plugin";

const UzysHarness: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // PreToolUse equivalent — gate-check
    "tool.execute.before": async (input, output) => {
      // Phase E1 구현: gate-status.json 검사 + 단계 위반 시 throw
    },

    // PostToolUse equivalent — spec-drift-check
    "tool.execute.after": async (input, output) => {
      // Phase E1 구현: 산출물 SPEC 정합성 검사
    },

    // UserPromptSubmit equivalent — HITO 카운터
    messageCreated: async (message, output) => {
      if (message.role !== "user") return;
      // Phase E1 구현: .claude/evals/hito-YYYY-MM-DD.log 카운트
    },
  };
};

export default UzysHarness;
