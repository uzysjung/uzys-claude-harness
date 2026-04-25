# ADR-004: OpenCode Plugin Lifecycle 매핑 (Claude Hook → OpenCode Plugin Hook)

- **Status**: Proposed
- **Date**: 2026-04-25
- **PR**: TBD (Phase A 종료 시 작성)
- **Supersedes**: 없음
- **Related**: ADR-002 (Codex Hook 갭), `docs/specs/opencode-compat.md`

---

## Context

Claude Code SSOT의 Hook 3종(HITO `UserPromptSubmit`, gate-check `PreToolUse`, spec-drift `PostToolUse`)을 OpenCode CLI에서 동등하게 작동시켜야 한다. Codex 1차(ADR-002)에서는 단일 `[notify]` 후크 + shell wrapper 우회로 해결했으나, OpenCode는 plugin lifecycle API가 풍부하여 **직접 1:1 매핑**이 가능하다.

본 ADR은 매핑 규약 + 인자 변환 + 한계를 고정한다.

## Decision

OpenCode plugin (`uzys-harness-opencode-plugin`, JS/TS)을 작성하고 다음 매핑을 채택:

### 매핑 표

| Claude Hook | OpenCode 매핑 | 트리거 시점 | 인자 변환 |
|-------------|---------------|-------------|----------|
| `PreToolUse` | `"tool.execute.before"(input, output)` | tool 실행 직전 | `input.tool` → Claude `tool_name`. `output.args` ↔ Claude `tool_input`. 예외 throw 시 차단 |
| `PostToolUse` | `"tool.execute.after"(input, output)` | tool 실행 직후 | `input.tool` → Claude `tool_name`. `output.result` 검사 — spec-drift 검출 |
| `UserPromptSubmit` | `messageCreated(message, output)` filter `message.role === "user"` | 사용자 메시지 생성 시 | `message.content` → Claude `prompt`. 사용자 prompt만 카운트 (HITO) |

### Plugin 골격

```typescript
import type { Plugin } from "@opencode-ai/plugin"

const UzysHarness: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // PreToolUse — gate-check
    "tool.execute.before": async (input, output) => {
      // input.tool === "bash" 등 검사 → 게이트 위반 시 throw
      // output.args 변형 가능 (예: 위험 명령 필터)
    },

    // PostToolUse — spec-drift-check
    "tool.execute.after": async (input, output) => {
      // output.result 검사 → SPEC drift 의심 시 stderr/log
    },

    // UserPromptSubmit — HITO counter
    messageCreated: async (message, output) => {
      if (message.role !== "user") return
      // .claude/evals/hito-YYYY-MM-DD.log 카운트 추가 ($ shell 사용)
      const date = new Date().toISOString().slice(0, 10)
      await $`mkdir -p ${directory}/.claude/evals && echo ${message.content?.slice(0, 80) ?? ""} >> ${directory}/.claude/evals/hito-${date}.log`
    },
  }
}

export default UzysHarness
```

### Plugin 로드

`opencode.json`:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["./.opencode/plugin/uzys-harness.ts"]
}
```

전제: 프로젝트 스코프만 (D16). `OPENCODE_CONFIG_DIR/plugins/`(글로벌) 미수정.

## Alternatives

### A. Shell wrapper (Codex 1차 패턴 답습) — **기각**

근거:
- OpenCode plugin API가 직접 매핑 가능 → wrapper는 추가 indirection
- 인자 변환이 plugin 내부에서 이루어지면 SSOT 일관 유지 단순
- 사용자 보고 — Codex 1차의 shell wrapper는 디버깅 어려움

### B. Bus event 단독 사용 (`event(({event})=>{})` 만으로) — **기각**

근거:
- `event`는 read-only stream — `tool.execute.before`처럼 throw로 차단 불가
- gate-check는 차단 권한 필요 → before/after 후크 필수

### C. Custom tool로 우회 (`tool: { gate_check: tool({...}) }`) — **기각**

근거:
- LLM이 호출 시점에만 발동 → 모든 tool 실행에 끼어들 수 없음
- 자동 매핑 보장 못함

## Consequences

### 긍정

- Codex 1차의 shell wrapper 우회 패턴 폐기 → **유지 비용 감소**
- 인자 변환이 TypeScript로 표현되어 **타입 안정성** 확보
- Plugin export `default Plugin` 한 함수 → 단순 deploy
- D16 정신 유지 — 글로벌 미수정

### 부정

- OpenCode plugin runtime이 Bun 의존 (npm/Node 호환 미확인) — Phase E1 실측 필요
- `tool.execute.before/after` 인자 시그니처가 Claude 형식과 정확히 일치 안 할 수 있음 → 변환 함수 필요
- `messageCreated`가 user prompt 외도 fire 시 HITO 오집계 — 필터 명시 필수
- Plugin 로드 실패 시 fallback 없음 — Phase E2에서 smoke test로 보호

### 한계 (실측 후 ADR-004 v2 갱신)

- [ ] **L1** OpenCode plugin이 Node 런타임 또는 Bun 어느 쪽 보장하는지 — Phase E1
- [ ] **L2** `tool.execute.before` 인자 정확한 시그니처 (현재 `input`, `output` 외 필드 미확정) — Phase E1
- [ ] **L3** `messageCreated` filter — `message.type` 추가 검증 필요 여부 — Phase E1
- [ ] **L4** Plugin throw 시 OpenCode가 graceful 차단인지 crash인지 — Phase E2 smoke
- [ ] **L5** Slash 커맨드 namespace (`uzys:` 콜론) OpenCode 허용 — Phase B2 실측

## Status 흐름

```
Proposed (현재) → Accepted (Phase E2 smoke 통과 + 사용자 승인 후)
```

후속:
- Phase E1: plugin 작성 + L1~L4 실측 → ADR-004 본문에 측정값 기록
- Phase E2: smoke test 통과
- Phase E3: Status: Accepted (PR에 측정 evidence + 사용자 승인 명시)

---

## Changelog

- 2026-04-25: v1 초안. Phase A3 산출. Status: Proposed.
