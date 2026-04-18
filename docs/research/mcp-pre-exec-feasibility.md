# P1-9: MCP Pre-Execution Blocking — 기술 타당성 조사

> **Status**: 조사 완료, 기술적 가능 확인. 구현은 Phase 5.2로 이월.
> **Date**: 2026-04-15 · **Trigger**: harness-engineering-audit-2026-04 §9 GD4 후속 (P1-9 Backlog 이월 항목 조사 요청)
>
> **입력**: [Claude Code 공식 문서 — Hooks](https://code.claude.com/docs/en/hooks) (WebFetch 2026-04-15)

---

## 조사 배경

리서치 문서 §9 Gap-D (빠진 업계 패턴)에서 P1-9 **MCP pre-execution blocking** 을 Backlog로 이월했다. 이유는 "Claude Code의 MCP hook 지원 여부 불확실". 이번 조사는 그 불확실성을 해소한다.

**해결해야 할 3가지 질문**:
1. `PreToolUse` matcher로 MCP tool 호출을 매치할 수 있는가?
2. `mcp__<server>__<tool>` 형식이 matcher 문법에서 지원되는가?
3. exit 2가 MCP tool 호출을 실제로 차단하는가?

---

## 조사 결과 — 모두 YES

### Q1. PreToolUse가 MCP tool 호출을 잡는가?

**확인됨**. 공식 문서 인용:

> "MCP tools follow the naming pattern `mcp__<server>__<tool>`, for example:
> * `mcp__memory__create_entities`: Memory server's create entities tool
> * `mcp__filesystem__read_file`: Filesystem server's read file tool
> * `mcp__github__search_repositories`: GitHub server's search tool"

MCP tool 호출은 일반 tool과 동일한 `PreToolUse` 이벤트에서 포착된다.

### Q2. Matcher 문법 — `mcp__*` 가능한가?

**확인됨**. 공식 문서 예제:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__memory__.*",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Memory operation initiated' >> ~/mcp-operations.log"
          }
        ]
      }
    ]
  }
}
```

**중요 제약**: 공식 문서는 regex matcher에서 `.*` 를 **반드시 명시**해야 한다고 경고한다.

> "To match every tool from a server, append `.*` to the server prefix. The `.*` is required: a matcher like `mcp__memory` contains only letters and underscores, so it is compared as an exact string and matches no tool."

즉:
- ❌ `"matcher": "mcp__memory"` — 정확 문자열 매치, 어떤 tool도 잡지 못함
- ✅ `"matcher": "mcp__memory__.*"` — memory 서버의 모든 tool 매치
- ✅ `"matcher": "mcp__.*__write.*"` — 모든 서버의 `write*` tool

### Q3. exit 2가 차단하는가?

**확인됨, 공식 contract**:

> "Exit 2 means a blocking error. Claude Code ignores stdout and any JSON in it. Instead, stderr text is fed back to Claude as an error message. The effect depends on the event: PreToolUse blocks the tool call..."

> "**Warning**: For most hook events, only exit code 2 blocks the action. Claude Code treats exit code 1 as a non-blocking error and proceeds with the action, even though 1 is the conventional Unix failure code. If your hook is meant to enforce a policy, use `exit 2`."

즉 PreToolUse에서 exit 2 → tool 호출 **완전 차단**. stderr 내용이 Claude에게 에러 메시지로 전달됨.

---

## 추가 발견 — 더 많은 MCP 관련 이벤트

조사 중 예상 밖의 공식 이벤트 2개 발견:

| 이벤트 | 설명 | 활용 가능성 |
|--------|------|----------|
| `Elicitation` | MCP 서버가 사용자 입력을 요청할 때 fire | MCP의 prompt injection 공격 감지 가능 |
| `ElicitationResult` | 사용자가 MCP elicitation에 응답한 후 fire | 응답 내용 감사 |
| `PreCompact` / `PostCompact` | compact 전/후 | P0-3 (checkpoint-snapshot)와 연계 가능 |
| `InstructionsLoaded` | CLAUDE.md 또는 rules 로드 후 | 어떤 rule이 로드됐는지 감사 |
| `TaskCreated` / `TaskCompleted` | TaskCreate/Update 발생 시 | 작업 감사 |
| `PermissionRequest` / `PermissionDenied` | 권한 요청/거부 시 | 보안 감사 |

이들은 이 프로젝트에서 **아직 활용 안 됨**. Phase 5.2+ 추가 작업 후보.

---

## stdin JSON 구조 (설계 근거)

PreToolUse 공통 필드:

```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "mcp__github__search_repositories",
  "tool_input": {
    "query": "...",
    "owner": "..."
  }
}
```

구현 시 활용할 수 있는 필드:
- `tool_name` — 정확한 MCP tool 식별
- `tool_input` — 파라미터 내용 (위험 패턴 검사)
- `cwd` — 프로젝트별 화이트리스트 적용 기준
- `permission_mode` — 이미 `dangerously-skip-permissions` 상태면 추가 방어 필요

---

## 권장 구현 경로 (Phase 5.2 — 이 세션 범위 밖)

### 1. `templates/hooks/mcp-pre-exec.sh` 신규

```bash
#!/bin/bash
# mcp-pre-exec.sh — PreToolUse matcher: mcp__.*
# 화이트리스트 기반 MCP 서버 차단 + 파라미터 위험 패턴 감지
set -u

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)

# mcp__*__* 가 아니면 통과
case "$TOOL_NAME" in
  mcp__*__*) ;;
  *) exit 0 ;;
esac

# 서버 이름 추출 (mcp__<server>__<tool>)
SERVER_NAME=$(echo "$TOOL_NAME" | cut -d__ -f2)

# 화이트리스트 대조 (.mcp-allowlist)
ALLOWLIST="$CLAUDE_PROJECT_DIR/.mcp-allowlist"
if [ -f "$ALLOWLIST" ]; then
  if ! grep -qE "^${SERVER_NAME}$" "$ALLOWLIST"; then
    echo "[mcp-pre-exec] BLOCKED: MCP server '$SERVER_NAME' not in allowlist" >&2
    echo "Add '$SERVER_NAME' to .mcp-allowlist to permit." >&2
    exit 2
  fi
fi

# 위험 파라미터 패턴 (간단 예시)
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty')
if echo "$TOOL_INPUT" | grep -qE "rm -rf|curl.*\| *sh|wget.*\| *bash"; then
  echo "[mcp-pre-exec] BLOCKED: suspicious parameter pattern" >&2
  exit 2
fi

exit 0
```

### 2. `.mcp-allowlist` 신규 (프로젝트 루트)

```
# MCP server allowlist — 한 줄에 하나의 서버 이름
# 이 프로젝트 .mcp.json의 서버 목록에서 추출
context7
github
chrome-devtools
# 추가 서버는 보안 검토 후 등록
```

### 3. `templates/settings.json` 매처 등록

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__.*",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/mcp-pre-exec.sh\""
          }
        ]
      }
    ]
  }
}
```

### 4. setup-harness.sh safe_copy 추가

기존 hook 설치 블록에 한 줄 추가.

### 5. test-harness.sh T3에 unit test 추가

mock stdin JSON으로 화이트리스트 매칭/비매칭 시나리오 검증.

---

## 결정 (D34)

**기술적 타당성 확인 완료**. 구현 경로 명확. 그러나 이 세션에서는 구현 안 한다:

1. **사용자 명시 지시**: "4. 조사만 해. 동의" (2026-04-15)
2. **범위 경계**: Phase 5.1의 작업 량이 이미 상당 (A14, B1 plan-checker, B9b, E2, P1-9 조사)
3. **별도 plan 필요**: 구현 시 `.mcp-allowlist` 정책 결정, 위험 패턴 카탈로그, test 케이스 등 별도 plan 설계 필요

**후속 작업**: Phase 5.2 또는 Phase 6 별도 plan으로 착수. 이 조사 문서가 입력 근거.

---

## 변경된 위험 분류

리서치 문서 §9 GD4의 P1 (`⚠ → P1`)은 이 조사로 **P0-승급 가능**:

| 기준 | 이전 판정 | 조사 후 판정 |
|------|---------|------------|
| ① 요구사항 | ✅ | ✅ (CVE-2025-59536, CVE-2026-21852 대응) |
| ② 결정론 | ⚠ (구현 불확실) | ✅ (bash + regex + exit 2) |
| ③ 대체 불가 | ✅ | ✅ |
| ④ 워크플로우 | ⚠ (hook 지원 확인 필요) | ✅ (공식 matcher `mcp__.*` 지원) |
| ⑤ 비용 효율 | ❌ | ❌ (변경 없음) |
| ⑥ 보안 | ✅ | ✅ |
| ⑦ 관측성 | ✅ | ✅ |

**재판정**: P1 → **P0** 승급 자격 있음. 사용자 승인 시 Phase 5.2 실행.

---

## References

- [Claude Code Hooks 공식 문서](https://code.claude.com/docs/en/hooks) *(WebFetch 2026-04-15)*
- 리서치 문서: `Docs/research/harness-engineering-audit-2026-04.md` §9 GD4 + §11.4 P1-9
- PRD D29 (Backlog 이월 결정, v26.5.0) — 이 조사로 부분 해소
- CVE-2025-59536, CVE-2026-21852 *(Phase 1 리서치 에이전트 보고, 본 조사에서 재검증 안 됨)*
