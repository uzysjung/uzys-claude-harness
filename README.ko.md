# uzys-claude-harness

> Claude Code 에이전트 하네스 — 6-gate 워크플로우 + Ralph 루프 + 9 스택 트랙. Lean by design.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/github/v/tag/uzysjung/uzys-claude-harness?label=version)](https://github.com/uzysjung/uzys-claude-harness/releases)
[![Tests](https://img.shields.io/badge/tests-111%20PASS%20%2F%200%20FAIL-brightgreen)](test-harness.sh)

🇬🇧 **English README**: [README.md](./README.md)

## 이게 뭔가요?

[Claude Code](https://claude.com/claude-code) 위에서 동작하는 **결정론적 하네스**:

- **6-gate 워크플로우** (`Spec → Plan → Build → Test → Review → Ship`) hook으로 강제
- **9 스택 트랙** 지원 (csr-supabase / csr-fastify / csr-fastapi / ssr-htmx / ssr-nextjs / data / executive / tooling / full)
- 트랙별로 **검증된 plugins / skills / MCP servers / agents** 번들 ([Reference.md](./Reference.md))
- **Lean** 유지 — Rule 17 / Hook 자동등록 6. 자명하거나 중복인 것은 제거
- **continuous-learning + Ralph 루프**로 자기 개선 (SPEC 기반 자율 사이클)
- 프로젝트 스코프 전용. **글로벌 `~/.claude/`는 절대 건드리지 않음**

CTO/COO 출신 눈높이의 시니어 엔지니어 / 멀티 역할 사용자(CEO/CTO/CISO/데이터 사이언티스트)가 매우 다른 스택에서 같은 하네스를 쓰고 싶을 때 사용.

## 설치

### Step 1 — Track 선택

| 만들고 있는 스택 | 설치할 Track |
|----------------|------------|
| Python REST API + React 프론트 | `csr-fastapi` |
| TypeScript REST API + React 프론트 | `csr-fastify` |
| 실시간/Auth/PostgreSQL (Supabase) | `csr-supabase` |
| SEO 필요 + React (SSR) | `ssr-nextjs` |
| 최소 JS (서버 렌더 + HTMX) | `ssr-htmx` |
| 데이터 분석/ML/DL/PySide6 desktop | `data` |
| 제안서/PPT/재무모델 (코드 없음) | `executive` |
| Bash/CLI/Markdown 메타 프로젝트 | `tooling` |
| 둘 이상 동시 (예: tooling + Python) | `--track tooling --track csr-fastapi` (다중) 또는 `full` |

### Step 2 — 설치 실행

`<TRACK>` 자리에 위 표에서 고른 값을 넣는다 (예: `csr-fastapi`).

```bash
# 프로젝트 디렉토리에서:
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --track <TRACK> --project-dir .
```

이 한 줄이 하는 일:
1. 하네스를 임시 디렉토리에 shallow-clone
2. 프로젝트에서 `setup-harness.sh --track <TRACK>` 실행
3. 임시 디렉토리 정리

설치 후 카테고리별 `✅` Installation Report가 출력된다.

### Step 3 — Claude Code 시작

```bash
claude
# Claude Code 안에서:
/uzys:spec    # 만들 것을 정의
/uzys:auto    # 그 후 전체 파이프라인 (Plan → Build → Test → Review → Ship) 실행
```

---

## 자주 쓰는 시나리오

### 기존 설치에 Track 추가

이미 `csr-fastapi` 설치했고, `tooling` (하네스의 bash/markdown 작업용)도 추가하고 싶다면:

```bash
bash /path/to/uzys-claude-harness/setup-harness.sh --add-track tooling --project-dir .
```

`--add-track`은 기존 `.claude/*`를 보존하고 새 MCP를 `jq`로 `.mcp.json`에 idempotent merge.

### 기존 설치를 최신 하네스 버전으로 업데이트

새 release가 나오면 ([CHANGELOG.md](./CHANGELOG.md) 확인):

```bash
bash /path/to/uzys-claude-harness/setup-harness.sh --update --project-dir .
```

`--update` 동작:
1. **백업** — 현재 `.claude/`를 `.claude.backup-<timestamp>/`로 스냅샷
2. **덮어쓰기** — `rules/*.md`, `agents/*.md`, `commands/uzys/*.md`, `hooks/*.sh`, `.claude/CLAUDE.md` 중 **이미 존재하는 파일만** 최신 templates로 덮어쓰기 (Track 혼입 방지)
3. **Orphan prune** — `.claude/`에 있지만 templates에는 없는 파일 제거 (예: 폐기된 `ecc-security-common.md`)
4. **Stale hook ref 정리** — 존재하지 않는 hook 파일을 가리키는 `settings.json` PreToolUse/PostToolUse 항목 제거

**보존**: `gate-status.json`, `.mcp.json` (사용자 추가 MCP 유지), `docs/SPEC.md`/`PRD.md`, `.claude/settings.local.json`.

문제 시 rollback:
```bash
rm -rf .claude && mv .claude.backup-<timestamp> .claude
```

### 이 리포 자체에 dogfood 설치

```bash
git clone https://github.com/uzysjung/uzys-claude-harness.git
cd uzys-claude-harness
bash setup-harness.sh --track tooling --project-dir .
```

### 다중 Track 동시 설치 (union)

```bash
bash setup-harness.sh --track tooling --track csr-fastapi --project-dir .
```

처음부터 여러 Track 필요한 걸 알면 이게 가장 빠름 (2회 setup보다 빠름).

### Optional — ECC plugin 프로젝트 스코프 설치

`setup-harness.sh` 종료 후 (대화형 세션만) 묻는다:

```
[ECC] Plugin 프로젝트 스코프 설치 (선택사항)
[ECC] 설치(copy) 진행? [y/N]
[ECC] 불필요 항목 제거(prune)? [y/N]
```

둘 다 `y`면 [Everything-Claude-Code](https://github.com/affaan-m/everything-claude-code)를 `.claude/local-plugins/ecc/`로 복사하고 ~228 항목 prune. 사용:

```bash
claude --plugin-dir .claude/local-plugins/ecc
# 또는 ~/.zshrc:
# alias claude-ecc='claude --plugin-dir .claude/local-plugins/ecc'
```

글로벌 `~/.claude/`는 절대 무영향.

### 기타 옵션

```bash
bash setup-harness.sh --help                 # 전체 옵션 표시
bash setup-harness.sh --gsd ...              # GSD 오케스트레이터 포함 (대형 프로젝트)
```

### 사전 요구사항

- Node.js 22+
- Git
- Claude Code CLI (`claude`)
- jq (권장; bash fallback 있음)

## CLAUDE.md 위치 (canonical 명시)

이 리포지토리에는 4종류 CLAUDE.md가 있음 — 역할 분리:

| 위치 | 역할 | 누가 사용? |
|------|------|----------|
| `/CLAUDE.md` (root) | **이 메타 리포 자체용** (tooling Track) | uzys-claude-harness 개발 시 |
| `/.claude/CLAUDE.md` | **이 메타 리포 적용 글로벌 원칙** (11 Principles + Decision Meta-Rule) | 이 리포에서 작업 시 Claude가 읽음 |
| `/templates/CLAUDE.md` | **신규 프로젝트로 복사되는 원본 템플릿** | `setup-harness.sh`가 신규 프로젝트의 `.claude/CLAUDE.md`로 복사 |
| `/templates/project-claude/<track>.md` | **신규 프로젝트의 root `/CLAUDE.md`로 복사되는 Track별 가이드** | `setup-harness.sh`가 신규 프로젝트 root에 복사 |

**Canonical 원본**: `/templates/CLAUDE.md` 와 `/templates/project-claude/<track>.md`.

## Tracks

| Track | 스택 | 역할 |
|-------|-----|-----|
| `csr-supabase` | React + Supabase | 개발자 |
| `csr-fastify` | TypeScript REST API + React/shadcn/ui | 개발자 |
| `csr-fastapi` | Python REST API + React/shadcn/ui | 개발자 |
| `ssr-htmx` | FastAPI + Jinja2 + HTMX + daisyUI | 개발자 |
| `ssr-nextjs` | Next.js + shadcn/ui | 개발자 |
| `data` | Python + DuckDB + Trino + ML/DL + PySide6 | 데이터 사이언티스트 |
| `executive` | PPT/Excel/Word/PDF + 제안서/DD | CPO/CSO/CTO |
| `tooling` | Bash + Markdown + CLI 도구 (메타 프로젝트) | 도구/하네스 개발자 |
| `full` | 모든 트랙 union | 전체 |

### Track 결정 가이드

| 상황 | 권장 Track |
|------|----------|
| Python REST API + React 프론트 | `csr-fastapi` |
| TypeScript REST API + React 프론트 | `csr-fastify` |
| 실시간/Auth/PostgreSQL 우선 (Supabase) | `csr-supabase` |
| SEO 필요 + React (SSR) | `ssr-nextjs` |
| 최소 JS (서버 렌더 + HTMX) | `ssr-htmx` |
| 데이터 분석/ML/DL/PySide6 desktop | `data` |
| 제안서/PPT/재무모델 (코드 없음) | `executive` |
| Bash/CLI/Markdown 메타 프로젝트 | `tooling` |
| 둘 이상 동시 (예: tooling + Python) | `--track tooling --track csr-fastapi` 또는 `full` |

## 11개 행동 원칙

Karpathy LLM 관찰 + Anthropic Harness Design + 실전 운영 경험에서 추출:

1. **Think Before Acting** — 가정 금지, 모호하면 확인
2. **Simplicity First** — 명시되지 않은 것은 범위 밖
3. **Surgical Changes** — 건드려야 할 것만, DO NOT CHANGE 보호
4. **Goal-Driven Execution** — 검증 가능한 성공 기준
5. **Separate Eval from Gen** — reviewer subagent context fork로 SOD 강제
6. **Long-Running Management** — Phase + 인간 게이트
7. **Fact vs Opinion** — 출처 필수
8. **Sprint Contract** — 작업 전 "완료" 정의
9. **Circuit Breakers** — 3회 실패 → 멈추고 보고
10. **Harness Maintenance** — 단순 시작, 필요 시만 추가, 분기 1회 prune
11. **Perimeter Not Blueprint** — what + why + 경계만 주고 how는 에이전트 결정

추가 **Decision Making 메타 원칙**: 모든 가치 판단은 명시된 검증 가능한 기준에 근거. 추정/감각 금지.

### Design Philosophy

- **HyperAgents**: 메타 개선 가능 (인간 게이트 필수). auto memory + CL-v2 instinct로 경험 축적
- **gitagent SOD**: agent 정의는 git 버전 관리. reviewer ≠ implementor. 메모리는 Git에
- **agent-skills**: 6-gate 워크플로우(Define→Plan→Build→Verify→Review→Ship)가 뼈대

## 동작 구조

```
┌────────────────────────────────────────────────────────────────┐
│  Project (.claude/)                                             │
│  CLAUDE.md  →  11 원칙 + Decision Meta-Rule + Gates             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ commands/   │  │ rules/ (17) │  │ skills/     │             │
│  │ uzys:* (7)  │  │ git-policy  │  │ CL-v2       │             │
│  │ ecc:*  (8)  │  │ test-policy │  │ spec-scaling│             │
│  │             │  │ ship-       │  │ deep-       │             │
│  │             │  │ checklist   │  │ research    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ agents/ (8) │  │ hooks/ (6)  │  │ .mcp.json   │             │
│  │ reviewer    │  │ session     │  │ context7    │             │
│  │ data-       │  │ protect     │  │ github      │             │
│  │ analyst     │  │ gate-check  │  │ chrome-     │             │
│  │ strategist  │  │ agentshield │  │ devtools    │             │
│  │ + 5 ECC     │  │ + 1 utility │  │ + 트랙별    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└────────────────────────────────────────────────────────────────┘
```

6-gate는 `gate-check.sh` PreToolUse hook으로 강제. 게이트 건너뛰기 시 exit 2 + blocker 메시지. `/uzys:auto`가 SPEC 만족까지 Ralph 루프로 자율 실행 (최대 5 iter).

## ECC plugin 통합 (선택)

[Everything-Claude-Code (ECC)](https://github.com/affaan-m/everything-claude-code)는 300+ skills/agents/commands 번들. `setup-harness.sh` 마지막에 2단계 프롬프트:

```
[ECC] Plugin 프로젝트 스코프 설치 (선택사항)
  1. ECC plugin을 프로젝트 스코프로 설치(copy)? [y/N]
  2. ECC에서 불필요 항목을 제거(prune)? [y/N]
  → DELETED/KEPT 파일 목록 화면 표시
```

이후 `claude --plugin-dir .claude/local-plugins/ecc`로 사용. 글로벌 `~/.claude/` 무영향.

## 보안 모델

- **MCP allowlist**: `.mcp-allowlist` 파일이 모든 MCP 호출을 `mcp-pre-exec.sh` hook으로 게이팅
- **D16 보호**: `setup-harness.sh --project-dir`이 `~/.claude/*`, `/etc/*`, 시스템 bins 차단
- **`.env` / credentials 보호**: `protect-files.sh` hook이 보호 경로 Write/Edit 차단
- **Pre-ship 보안 게이트**: `agentshield-gate.sh`가 `/uzys:ship` 전 `npx ecc-agentshield scan` 실행
- 전체 보안 정책: [Reference.md §8](./Reference.md#8-보안--신뢰-정책)

## 프로젝트 발전 방향

3가지 commitment (`templates/CLAUDE.md` 참조):

1. **ECC.tools 의존** — 자체 구현 최소화, ECC 스킬/에이전트를 `/uzys:*`로 orchestrate
2. **Ralph 루프 자율성** — continuous-learning-v2 + `/uzys:auto` SPEC 기반 자율 사이클
3. **Lean by design** — 기능 추가 전 "ECC에 있는가?" 확인 → 분기 1회 P10 재평가

## 문서

| 파일 | 용도 |
|------|------|
| [README.md](./README.md) | 영어 README |
| [USAGE.md](./USAGE.md) | 일상 워크플로우 가이드 (`/uzys:*` 명령, 게이트 흐름) |
| [**Reference.md**](./Reference.md) | **설치되는 모든 자산 카탈로그** (Plugins / Skills / MCP / Agents / Cherry-pick) — 출처 / 신뢰 등급 / 정확한 설치 명령 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 트랙 / Rule / Hook / 명령 추가 방법 |
| [CHANGELOG.md](./CHANGELOG.md) | 릴리즈 히스토리 |

## License

MIT — Copyright (c) 2026 Jay (Uzys Jung). [LICENSE](./LICENSE) 참조.
