# ADR-002: Codex CLI Hook 호환 전략 (Revised)

- **Status**: Proposed (2026-04-24, revised) — Phase E에서 Accepted 전환 예정
- **Date**: 2026-04-24 (초안), 2026-04-24 (revision)
- **PR**: #3 (초안 merge), #(TBD) (revision)
- **Supersedes**: 없음 (self-revision; 초안 v1은 동일 파일 내 §Appendix-초안 기록)
- **Related**: `docs/specs/codex-compat.md` §3.4 OQ1/OQ5, `docs/research/codex-compat-matrix-2026-04-24.md` §3

## Revision 사유

초안(v1) 작성 시 Context7 리서치는 Codex **0.29/0.75** 문서 기준이었다. 로컬 설치된 Codex CLI **0.124.0** 실측 결과, 초안의 핵심 전제("Codex는 `[notify]` 하나만 지원")가 **틀린 것으로 확인**. Codex 0.124.0은 Claude Code와 거의 1:1 호환되는 풀 hook 시스템을 `codex_hooks` feature(stable, enabled 기본)로 제공한다.

v2 본문은 실측 기반으로 전면 재작성. v1 내용은 §Appendix A에 보존.

## Context

### 팩트 (실측 + 공식 문서)

1. **Codex 0.124.0 `codex_hooks` feature = stable, enabled 기본** (`codex features list`).
2. Hook 설정 위치 2단:
   - 글로벌: `~/.codex/config.toml`
   - 프로젝트: `./.codex/config.toml` (upward search) — 사용자 `config.toml`에 `trust_level` 명시 필요 (`untrusted`는 기본)
3. Plugin 번들 시 3단: `<plugin>/hooks.json` (plugin manifest의 `"hooks": "./hooks.json"` 필드 참조)
4. **이벤트 종류** (stellarlinkco/codex fork `docs/hooks.md`):
   - **Blockable (exit 2 차단 가능)**: `user_prompt_submit`, `pre_tool_use`, `permission_request`, `stop`, `subagent_stop`, `teammate_idle`, `task_completed`, `config_change`
   - **Non-blockable**: `session_start`, `session_end`, `post_tool_use`, `post_tool_use_failure`, `notification`, `subagent_start`, `worktree_create`, `worktree_remove`, `pre_compact`
5. **stdin/stdout JSON 프로토콜** — Claude Code와 거의 동일:
   - stdin 공통: `session_id, transcript_path, cwd, permission_mode, hook_event_name(PascalCase)`
   - stdin 이벤트별: `tool_name, tool_input, tool_use_id, prompt, source, model, ...`
   - stdout: `{systemMessage, additionalContext, updatedInput, decision, reason, continue}`
6. **Exit code 규약 동일**: `0`=성공, `2`=blockable 차단(stderr→reason), 기타=non-blocking error.

### 치명적 제약 (upstream 이슈)

- **Issue #16732** — `pre_tool_use` / `post_tool_use`가 **Bash 툴에만 발화**. ApplyPatchHandler(파일 쓰기)에는 fire 안 함 (2026-04 시점 bug).
- **Issue #17532** — 프로젝트 스코프 `./.codex/config.toml` 훅이 인터랙티브 세션에서 로드 안 되는 bug. 비대화형(`codex exec`)은 정상.

## Decision

**Hook 갭은 사실상 없음. 포맷 변환 + 2가지 제약 명시 + upstream bug 회피 전략**으로 전환한다.

### D1. 설정 포맷 변환 규약 (Claude → Codex)

| Claude | Codex |
|--------|-------|
| `.claude/settings.json` `hooks` 블록 | `~/.codex/config.toml` + 프로젝트 `./.codex/config.toml` |
| Plugin 번들 시 plugin의 `hooks.json` | 동일 — plugin manifest `"hooks": "./hooks.json"` |
| JSON | TOML (또는 plugin hooks.json JSON 유지) |

Transform 예시 — Claude `settings.json`:
```json
{ "hooks": { "PreToolUse": [{ "matcher": "Skill",
    "hooks": [{"type":"command","command":"$CLAUDE_PROJECT_DIR/.claude/hooks/gate-check.sh"}] }] } }
```
→ Codex `./.codex/config.toml`:
```toml
[[hooks.pre_tool_use]]
name = "gate-check"
command = ["${CODEX_PROJECT_DIR}/.codex/hooks/gate-check.sh"]
type = "command"
matcher = "Skill"
timeout = 5
async = false
```

### D2. Event name 매핑 (PascalCase ↔ snake_case)

| Claude hook name | Codex event key | 비고 |
|------------------|-----------------|------|
| `SessionStart` | `session_start` | stdin `hook_event_name`은 PascalCase 공통 |
| `UserPromptSubmit` | `user_prompt_submit` | blockable 동일 |
| `PreToolUse` | `pre_tool_use` | **Bash 한정 발화 주의 (Issue #16732)** |
| `PostToolUse` | `post_tool_use` / `post_tool_use_failure` | 분할됨 (failure 전용) |
| `Stop` | `stop` | blockable 동일 |
| 없음 (Claude에 없음) | `permission_request`, `pre_compact`, `teammate_idle`, `task_completed`, `worktree_*` | Codex 추가 이벤트 |

변환 스크립트(`scripts/claude-to-codex.sh`)가 event name 자동 변환. `hook_event_name` 값이 stdin payload에서 PascalCase로 유지되므로 hook 스크립트 본체는 **동일 코드 재사용 가능** (Claude Code 기존 hook shell 스크립트가 Codex에서도 작동).

### D3. ApplyPatch 예외 — Sandbox로 이관 (Issue #16732 회피)

Claude Code `protect-files.sh` (PreToolUse matcher="Write")는 Codex `pre_tool_use`로 변환 시 **ApplyPatchHandler에 발화 안 함**. Bash tool만 보호됨.

**결정**: 파일 쓰기 보호를 hook이 아니라 **Codex 네이티브 sandbox + approval_policy**로 이관. 더 강력한 보호.

`~/.codex/config.toml` 기본값:
```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
# .env, credentials 등 민감 경로는 writable_roots에서 제외하여 차단
```

추가로 `AGENTS.md`에 민감 경로 명시 (LLM 보조 방어):
```markdown
## Protected Files (DO NOT EDIT)
- `.env*`, `**/credentials.json`, `*.lock`
```

**ApplyPatch 제약이 upstream 수정되면**(Issue #16732 close), hook 기반 보호로 복귀 검토. 그 전까지는 sandbox가 SSOT.

### D4. 프로젝트 스코프 trust entry 자동화

`./.codex/config.toml` 은 사용자 `~/.codex/config.toml`에 trust 등록이 없으면 무시됨 (기본 `untrusted`). `setup-harness.sh --cli=codex --project-dir X` 실행 시:

1. 프로젝트 `.codex/config.toml` 생성
2. `~/.codex/config.toml`에 trust 블록 **사용자 확인 후** append:
   ```toml
   [projects."/abs/path/to/X"]
   trust_level = "trusted"
   ```
3. 확인 거부 시 프로젝트 훅 무시 (사용자에게 경고 + 수동 등록 방법 안내)

**D16 정신 유지** — 글로벌 `~/.codex/` 수정은 명시적 opt-in. 자동 반영 금지.

**Issue #17532 (인터랙티브 세션 bug)** — 영향: 현재 버전에서 프로젝트 hook이 `codex` 대화형에서 안 먹힐 수 있음. **`codex exec` 비대화형은 정상**. Phase F dogfood 시 실측 확인 + upstream 패치 확인.

### D5. stdin/stdout JSON 스키마 재사용

Claude Code용 `.claude/hooks/*.sh` 스크립트는 stdin에서 `session_id`, `cwd`, `tool_name`, `tool_input`, `hook_event_name` 등 공통 필드를 읽는다. Codex도 동일 필드를 PascalCase `hook_event_name`으로 제공하므로 **스크립트 본체 재사용 가능**.

단, Claude 고유 필드(`permission_mode` 등)의 값 도메인 차이 가능. Phase C transform 스크립트가 차이 문서화 + 필요 시 wrapper 추가.

### D6. Plugin 번들 옵션 (선택)

"uzys-harness plugin" 패키지화. `.codex-plugin/plugin.json`:
```json
{
  "name": "uzys-harness",
  "version": "v27.19.0",
  "skills": "./skills/",
  "hooks": "./hooks.json",
  "mcpServers": "./.mcp.json"
}
```

`hooks.json`(plugin scope)은 TOML 아닌 JSON. plugin-creator 샘플 포맷 참조. Plugin 배포 경로는 `~/.agents/plugins/` 또는 marketplace.

**본 SPEC 범위**: plugin 번들 **포맷 이해만**. 실제 plugin 배포는 Non-Goals (F9 README 언급 선). Phase B에서 config.toml 경로를 1차 채택.

## Consequences

### Positive

- **Claude Code와 거의 동등한 결정론적 hook 커버리지** — gate-check, hito-counter, session-start, uncommitted-check 모두 1:1 이식 가능.
- **Shell 스크립트 재사용** — stdin JSON 스키마 호환으로 `.claude/hooks/*.sh` 본체 대부분 그대로.
- **Sandbox 강화 부수 효과** — ApplyPatch protect-files를 sandbox로 이관하면서 Bash + 파일 쓰기 **모든 경로** 보호. Claude Code 대비 **강한 방어**.
- **Phase E 스코프 축소** — hook 우회 구현 → 변환 규약 검증만.

### Negative

- **Bash 한정 pre/post_tool_use (Issue #16732)** — 초기엔 ApplyPatch 기반 감사 로깅/락 불가. sandbox가 1차 방어, upstream 수정 대기.
- **프로젝트 스코프 trust 필요** — 사용자 옵트인 플로우가 설치 UX에 1단 추가.
- **인터랙티브 세션 hook bug (Issue #17532)** — 현 버전 영향 가능. Phase F 실측으로 판정.

### Neutral

- Event name 변환은 mechanical — 유지 부담 거의 없음.

## Alternatives

### A. v1 초안 유지 — 갭 수용 + LLM 지시

**기각 사유**: 실측 사실과 배치됨. 결정론 보호를 포기할 이유 없음.

### B. Plugin 번들 1차 채택

Plugin scope로 배포하면 `~/.codex/config.toml` 수정 불필요.

**기각 사유**: plugin marketplace/배포 파이프라인은 본 SPEC 범위 밖. Phase B config.toml 1차 후 plugin 번들은 F9에서 선택지.

### C. Bash wrapper로 ApplyPatch 간접 가로채기

ApplyPatchHandler가 내부적으로 어떤 bash 호출을 하는지 파악해서 pre_tool_use matcher로 잡기.

**기각 사유**: fragile. Codex upstream 변경에 쉽게 깨짐. Issue #16732 upstream 수정 대기가 정답.

## Follow-up Actions

1. Phase B에서 본 ADR 대응 `templates/codex/config.toml` + `templates/codex/hooks/*.sh` 기본 템플릿 작성.
2. Phase C transform 스크립트:
   - `.claude/settings.json hooks` → `./.codex/config.toml [[hooks.*]]`
   - Event name PascalCase → snake_case
   - 스크립트 본체(`gate-check.sh` 등) 경로 재맵핑만.
3. Phase D `setup-harness.sh --cli=codex` 에 trust 등록 확인 프롬프트 추가 (D4).
4. Phase F dogfood 시 실측 확인:
   - Issue #17532 영향 재확인 (현재 버전에서 해결?)
   - `pre_tool_use` matcher="Skill" 이 실제 발화하는지
   - `sandbox_mode` 보호가 의도대로 작동하는지
5. Phase E 완료 시 본 ADR Status: Proposed → Accepted.

---

## Appendix A — 초안(v1) 전제 기록 (실측 전)

> v1은 Context7의 Codex 0.29/0.75 문서 기준 작성. 아래는 폐기된 전제다.
>
> - **폐기 전제**: "Codex는 `[notify]`(agent 완료) 하나만 지원."
> - **폐기 결정**: D1 protect-files → sandbox / D2 uncommitted → `[notify]` / D3 hito → shell wrapper / D4 session-start → AGENTS.md LLM-DEP / D5 gate-check → skill 본문 LLM-DEP.
> - **폐기 사유**: Codex 0.124.0 `codex_hooks=stable` 실측. 위 폐기 결정 중 D1(sandbox)만 v2에서 D3로 승계됨. 나머지는 hook 네이티브 지원으로 결정론 복귀.
