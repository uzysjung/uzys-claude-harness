# ADR-002: Codex CLI Hook 시스템 갭 대응 전략

- **Status**: Proposed (2026-04-24) — Phase E에서 Accepted 전환 예정
- **Date**: 2026-04-24
- **PR**: #3
- **Supersedes**: 없음
- **Related**: `docs/specs/codex-compat.md` §3.4 OQ5, `docs/research/codex-compat-matrix-2026-04-24.md` §3

## Context

Claude Code는 5종 hook(SessionStart, PreToolUse, PostToolUse, UserPromptSubmit, Stop)을 결정론적으로 강제 실행한다. 본 하네스는 이 중 4종을 사용:

| Hook | 파일 | 목적 |
|------|------|------|
| SessionStart | `.claude/hooks/session-start.sh` | `git pull --rebase`, SPEC 재참조 안내 |
| PreToolUse (Skill matcher) | `.claude/hooks/gate-check.sh` | Phase 순서 강제, exit 2로 차단 |
| PreToolUse (Write matcher) | `.claude/hooks/protect-files.sh` | `.env`, lock, credentials 차단 |
| PostToolUse (Edit matcher) | `.claude/hooks/uncommitted-check.sh` | 미커밋 파일 경고 |
| UserPromptSubmit | `.claude/hooks/hito-counter.sh` | HITO(Human-In-The-Loop Interrupts) 카운트 |

OpenAI Codex CLI는 이 중 `[notify]`(agent 완료 후) 1종만 직접 지원. 나머지 4종은 네이티브 대응이 없다. `docs/specs/codex-compat.md` AC5가 본 ADR 생성을 요구.

## Decision

**Hook 1:1 재현을 포기하고, 각 Hook의 목적을 Codex 네이티브 기능 또는 LLM-지시 + shell wrapper로 우회한다.** 해소가 아니라 갭 **명시화 + 수용 가능한 대체 수단 문서화**다.

### Hook별 대응

| Claude Hook | Codex 대응 | 결정론성 | 비고 |
|-------------|-----------|---------|------|
| SessionStart (`session-start.sh`) | `AGENTS.md` 본문 + 사용자 수동 `git pull` | **LLM-DEP** | 세션 시작 시 사용자가 pull. AGENTS.md에 "SPEC.md first (Persistent Anchor)" 명시로 LLM 재참조 유도 |
| PreToolUse (`gate-check.sh`) | 각 `uzys-*` skill 본문의 phase 가드 | **LLM-DEP** | 예: `uzys-build/SKILL.md` 상단에 "직전 phase는 plan. todo.md에 Plan 완료 체크 없으면 중단" 문장. LLM이 읽고 준수 |
| PreToolUse (`protect-files.sh`) | Codex `approval_policy` + sandbox policy | **결정론적** | Codex 네이티브 — `.env` 등을 `approval_policy = "on-request"`로 걸면 사용자 승인 필요. `sandbox_mode = "workspace-write"`로 영역 제한 |
| PostToolUse (`uncommitted-check.sh`) | `[notify]` command | **결정론적** (완료 후만) | Codex agent 완료 시 shell script 실행. 중간 검증 불가, 완료 후 "미커밋 파일 X개" 알림 가능 |
| UserPromptSubmit (`hito-counter.sh`) | Shell wrapper (`codex` 명령을 래핑하는 zsh/bash function) 또는 stdout 파싱 | **외부-결정론적** | 사용자 shell 환경에 함수 추가: `codex() { command codex "$@" \| tee -a ~/.codex/hito-$(date +%F).log }`. 세션 prompt 수를 간접 측정 |

### 우회 구현 세부

#### D1. `protect-files.sh` → Codex 네이티브 sandbox

`~/.codex/config.toml` 기본값을 다음과 같이 설정:

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
```

추가로 민감 경로는 `AGENTS.md`에 명시:
```
## Protected Files
- `.env*`, `**/credentials.json`, `*.lock` — DO NOT EDIT
```

LLM이 이 지시를 준수 + Codex가 approval 요구로 이중 방어.

#### D2. `uncommitted-check.sh` → `[notify]`

`~/.codex/config.toml`:
```toml
[notify]
command = "/Users/uzysjung/.codex/hooks/notify-uncommitted.sh"
```

`notify-uncommitted.sh` (예시):
```bash
#!/usr/bin/env bash
# agent 완료 후 호출. CWD는 세션 시작 시 디렉토리.
set -e
cd "${1:-$PWD}" 2>/dev/null || exit 0
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "⚠ 미커밋 파일 있음:" >&2
  git status --short >&2
fi
exit 0
```

#### D3. `hito-counter.sh` → Shell wrapper

Claude Code의 UserPromptSubmit은 **모든 프롬프트**에서 실행되어 결정론적. Codex는 이 훅이 없음.

대안 1 — Shell function (권장):
```bash
# ~/.zshrc 또는 ~/.bashrc에 추가 (사용자 수동 설치)
codex() {
  local date=$(date +%F)
  local log="$HOME/.codex/evals/hito-$date.log"
  mkdir -p "$(dirname "$log")"
  echo "$(date -Iseconds) prompt=$*" >> "$log"
  command codex "$@"
}
```

대안 2 — `[notify]` 안에서 세션 prompt 수 추정 (덜 정확).

본 ADR은 **대안 1 채택**. `setup-harness.sh --cli=codex` 실행 시 사용자에게 shell function 설치 여부를 묻고, 수락 시 rc 파일에 append. **글로벌 환경 변경**이므로 D16과 유사한 confirm 필수.

#### D4. `session-start.sh` → AGENTS.md 본문

결정론 포기. 다음 문구를 `AGENTS.md` 상단에 추가:

```markdown
## Session Start

매 세션 시작 시 아래를 수행하라:
1. `git pull --rebase` 실행
2. `docs/SPEC.md` 및 `docs/specs/*.md` 재참조 (Persistent Anchor)
3. `docs/todo.md` 현재 Phase 확인
```

LLM이 해석 + 사용자가 보조.

#### D5. `gate-check.sh` → Skill 내부 가드

`uzys-spec/SKILL.md`, `uzys-plan/SKILL.md` 등 각 skill 본문 상단에 guard 섹션 추가:

```markdown
## Pre-flight

이 skill을 호출하기 전, 아래 조건 확인:
- 직전 phase(예: uzys-plan이면 uzys-spec)의 산출물이 `docs/`에 존재
- `docs/todo.md`에 Phase X 완료 체크 없으면 **호출 거부하고 사용자에게 알림**
```

LLM이 읽고 준수. 결정론적 차단은 불가하나 워크플로우 일관성은 유지.

## Consequences

### Positive

- **Codex에서 6-gate 워크플로우 작동 가능** — 완벽 재현 아니어도 대부분 기능 커버.
- **결정론적 부분은 Codex 네이티브로 이양** — `protect-files` 기능은 오히려 sandbox로 더 강력해짐.
- **Claude Code SSOT 유지** — 본 ADR은 Codex 파생물만 영향. Claude Code 현행 hook은 변경 없음.

### Negative

- **HITO 측정 정확도 하락** — shell wrapper는 사용자 shell 밖(다른 터미널, GUI 등)에서 호출 시 누락. Claude Code 대비 과소 측정 가능성.
  - 완화: Codex + Claude Code HITO 로그를 별도 네임스페이스(`~/.claude/evals/hito-*.log` vs `~/.codex/evals/hito-*.log`)로 분리 집계. Phase D(HITO baseline) 해석 시 CLI별 구분.
- **Phase 순서 강제가 약화됨** — LLM이 skill 가드를 무시하면 차단 없음.
  - 완화: `uzys-ship/SKILL.md`에 "최종 게이트 — 사용자에게 명시적 Pass 요구" 추가. 결정론 대신 인간 게이트 강화.
- **Shell function 설치 = 글로벌 환경 수정** — D16 정신에 어긋나는 면. 사용자 confirm + opt-out 옵션 필요.
  - 완화: `setup-harness.sh --cli=codex` 진행 시 "shell function 설치?(y/N)" 명시 프롬프트. 거절해도 나머지 설치 완료. 설치 결정은 `~/.codex/.setup-log`에 기록.

### Neutral

- `[notify]`는 Codex가 agent 완료 후만 호출 — 중간 진단은 불가하나 본래 `uncommitted-check`도 PostToolUse라 기능 대등.

## Alternatives

### A. OpenCode로 2차 타깃 조정

OpenCode는 풍부한 plugin API(`tool.execute.before`, `shell.env`, `chat.message`)를 제공. Hook 1:1 재현 가능.

**기각 사유**: 사용자 1차 타깃은 Codex. OpenCode는 2차 이월. 풍부한 hook이 필요하면 본 SPEC 완료 후 OpenCode용 별도 SPEC에서 해결.

### B. 독자 hook 데몬 구현

별도 백그라운드 프로세스가 Codex stdout/stderr를 파싱해 유사 hook 실행.

**기각 사유**: 복잡도 대비 가치 낮음. P2(Simplicity First) 위배. 유지 비용 ↑↑. 본 SPEC Non-Goals 명시.

### C. Hook 포기, 순수 LLM 지시만

AGENTS.md + skill 본문 지시 전용. shell wrapper도 불설치.

**기각 사유**: HITO 측정 완전 상실. NSM 2차 지표 이탈. 최소한의 외부 계측은 유지.

## Follow-up Actions

1. Phase B 구조 설계 시 본 ADR 5종 대응을 `templates/codex/config.toml` 기본값 + `templates/codex/hooks/notify-uncommitted.sh` + `templates/codex/shell-wrapper.sh`로 템플릿화.
2. Phase C transform 스크립트에 `hito-counter.sh → shell-wrapper.sh` 변환 로직 포함.
3. Phase E 완료 시 본 ADR Status: Proposed → Accepted.
4. Phase F dogfood에서 5종 대응 모두 실측 확인. 미달 항목 발견 시 ADR revision.
