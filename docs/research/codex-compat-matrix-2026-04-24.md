# Claude Code ↔ Codex CLI 호환 매트릭스

> **Date**: 2026-04-24
> **Source**: Context7 — `/openai/codex` (official), `/luohaothu/everything-codex` (community harness), `/anomalyco/opencode` (2차 타깃 참조), `/websites/opencode_ai_plugins` (hook 참조)
> **Linked SPEC**: `docs/specs/codex-compat.md`

---

## 1. Codex CLI 네이티브 구조

| 영역 | 경로 / 포맷 | 비고 |
|------|------------|------|
| 설정 | `~/.codex/config.toml` (글로벌) | TOML. model, sandbox, approval_policy, MCP, notify, features |
| Context 앵커 | `AGENTS.md` (프로젝트 루트) + `~/.codex/AGENTS.md` | `child_agents_md` feature 활성 시 디렉토리 계층 merge |
| MCP | `[mcp_servers.X] command= args=` TOML | Claude의 `.mcp.json`과 다른 포맷 |
| Hooks | `[notify] command=` (agent 완료 후) | **PreToolUse/PostToolUse/UserPromptSubmit 부재** |
| Skills | `$CODEX_HOME/skills/<name>/SKILL.md` | Claude Code와 **동일 YAML frontmatter 포맷** 가능 |
| Subagents | forward-test용 child agent | `context: fork` 수준 SOD 문서 미확인 (OQ6) |
| Slash | `/<command>` (namespace prefix 없음) | `/uzys:spec` → `/uzys-spec` rename 필요 |
| Sandbox | `sandbox_mode = "workspace-write"` 등 | `[sandbox_workspace_write] network_access=true` |
| Approval | `approval_policy = "on-request" / "never" / "untrusted"` | Claude의 bypassPermissions와 유사 |

## 2. Claude Code 자산 → Codex 대응표

| Claude Code | Codex | 난이도 | 비고 |
|-------------|-------|--------|------|
| `.claude/CLAUDE.md` (프로젝트) | `AGENTS.md` (프로젝트 루트) | 저 | 파일명 변경 + 일부 표현 일반화 |
| `~/.claude/CLAUDE.md` (글로벌, D16 보호) | `~/.codex/AGENTS.md` | 저 | 단, Codex도 글로벌 건드리지 않는 규약 필요 (OQ2) |
| `.claude/rules/*.md` | `~/.codex/<area>/AGENTS.md` 계층 | **중** | 구조 재편. `child_agents_md` 활성 필요 (OQ1) |
| `.claude/commands/uzys/*.md` | `$CODEX_HOME/skills/uzys-*/SKILL.md` + slash | **중** | prefix rename (`uzys:` → `uzys-`), SKILL 포맷 재사용 |
| `.claude/agents/*.md` (`context: fork`) | Codex subagent (child_agents_md) | 중~고 | SOD 보장 불확실 (OQ6) |
| `.claude/skills/*/SKILL.md` | `$CODEX_HOME/skills/*/SKILL.md` | **저** | 동일 포맷 |
| `.mcp.json` | `~/.codex/config.toml [mcp_servers.X]` | 저 | JSON→TOML 변환. 필드명 매핑 |
| `.claude/settings.json` (permissions, hooks) | `config.toml` + `[notify]` | **고** | Hook 부분 치명적 갭 (§3) |
| `.claude/hooks/session-start.sh` | 없음 | 갭 | 우회: skill 내부 sanity check |
| `.claude/hooks/gate-check.sh` (PreToolUse Skill matcher) | 없음 | 갭 | 우회: uzys workflow 내부 phase 가드 |
| `.claude/hooks/hito-counter.sh` (UserPromptSubmit) | 없음 | 갭 | 우회: shell wrapper 또는 notify 후방 카운트 |
| `.claude/hooks/protect-files.sh` (PreToolUse) | `approval_policy` + sandbox | 부분 | Codex 네이티브 sandbox 사용 |
| `.claude/hooks/uncommitted-check.sh` (PostToolUse) | `[notify]` 후방 | 부분 | 완료 후만 가능, 중간 검증 불가 |
| `.claude/hooks/spec-drift-check.sh` | 없음 | 갭 | 우회: ship skill 내부 호출 |
| `.github/` (workflows) | 동일 | 저 | 변경 없음 |

## 3. 핵심 갭 — Hook 시스템

Claude Code가 제공하는 5종 hook 중 Codex는 1종 (`[notify]`, agent 완료 후)만 직접 지원.

| Hook | Claude | Codex 대응 | 본 SPEC 전략 |
|------|--------|-----------|-------------|
| SessionStart | `session-start.sh` (git pull, SPEC 로드 안내) | `AGENTS.md` 자체 로드 | SPEC 재참조는 AGENTS.md 본문에 명시. pull은 사용자 습관 |
| PreToolUse (Skill matcher) | `gate-check.sh` (exit 2 차단) | 없음 | 각 uzys skill 본문에서 직전 phase 완료 확인 (LLM-DEP) |
| PreToolUse (Write matcher) | `protect-files.sh` (.env 등 차단) | `approval_policy` + sandbox policy | Codex 네이티브 권한 체계 사용 |
| PostToolUse | `uncommitted-check.sh` | `[notify]` | 완료 후 1회 알림. 중간 경고 불가 |
| UserPromptSubmit | `hito-counter.sh` (HITO 카운트) | 없음 | shell wrapper (zsh/bash alias) 또는 Codex stdout 파싱 |

**결론**: 결정론적 hook 강제는 Claude Code 대비 현저히 약화. 본 SPEC AC5 = ADR-002로 갭을 명시하고 우회 전략 기록. 해소가 아니라 문서화.

## 4. SSOT 전략

| 옵션 | 설명 | 비용 | 채택 |
|------|------|------|------|
| (a) Generator 기반 | Claude Code(`.claude/`, `templates/`) = SSOT. `scripts/claude-to-codex.sh`가 Codex 자산 생성 | 초기 중 / 유지 저 | **★ 채택** |
| (b) Hand-maintained | 각 CLI 디렉토리 독립 | 유지 고 (drift 위험) | 거부 |
| (c) Hybrid | 공통 base 공유 + CLI 오버레이 | 중 | 후속 고려 (유연성 필요 시) |

채택 근거:
- **유지 비용 최소화** — CLAUDE.md P10(Harness Maintenance)
- **Claude Code 주사용 보장** — 사용자 본인이 SSOT를 Claude Code에서 편집. Codex는 파생물
- **Codex 사용자 경험 포기하지 않음** — Transform 결과는 네이티브 Codex 관례를 따름 (AGENTS.md 계층, `[mcp_servers]`, slash `-` 구분)

## 5. 참조 구현 (학습용)

- **`/luohaothu/everything-codex`** — 60+ skills + rules + workflows + AGENTS.md templates. ECC의 Codex 버전. 설치 구조, 언어별 AGENTS.md 계층 아이디어 참조.
- **`/shanraisshan/codex-cli-best-practice`** — 프로젝트 스코프 설정 패턴 참조.
- **`/yeachan-heo/oh-my-codex`** — multi-agent orchestration 레퍼런스 (subagent 활용법).

본 SPEC은 위 3종 중 구조는 참조하되 **cherry-pick 하지 않는다** (현재 Claude Code 하네스 구조가 SSOT이며, Codex 쪽은 transform으로 생성).

## 6. 결정 필요 (SPEC OQ 연결)

- OQ1 `child_agents_md` 기본 활성 여부 → Phase B 실측
- OQ2 글로벌 vs 프로젝트 스코프 → Phase B 결정
- OQ3 slash prefix 호환성 → Phase B 결정 (현재 후보: `uzys-spec` 형식)
- OQ4 `~/.codex/skills` vs `~/.agents/skills` → 공식 경로 채택 (Phase B 실측)
- OQ5 Hook 우회 범위 → ADR-002
- OQ6 subagent SOD 보장 → Phase B 검증 + ADR-002 동반

---

## Appendix A — 예시 변환

### A.1 CLAUDE.md → AGENTS.md (스켈레톤)

```markdown
# Project Agent Guide

## Identity
[기존 CLAUDE.md Identity 섹션 그대로]

## Core Principles
[P1~P11 그대로. "Claude Code" 표현만 일반화]

## Workflow Gates
[/uzys-spec → /uzys-plan → ... 로 rename]
```

### A.2 .mcp.json → config.toml (예시)

```jsonc
// .mcp.json (Claude)
{
  "mcpServers": {
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp"] }
  }
}
```

```toml
# ~/.codex/config.toml (Codex)
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]
```

### A.3 uzys command → skill (예시)

```markdown
# .claude/commands/uzys/spec.md  (Claude 원본)
---
description: Define phase — 구조화된 스펙을 작성한다
---
...
```

```markdown
# ~/.codex/skills/uzys-spec/SKILL.md  (Codex 생성물)
---
name: uzys-spec
description: "Define phase — 구조화된 스펙을 작성한다"
---
...
```
