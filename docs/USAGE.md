# Usage Guide

## Workflow Quickstart

```
/uzys:spec → /uzys:plan → /uzys:build → /uzys:test → /uzys:review → /uzys:ship
```

6개 필수 커맨드만 기억하면 된다. 각 단계에서 관련 스킬, 에이전트, Rules가 자동 활성화된다.

**게이트 강제**: 각 단계는 Hook으로 프로그래밍적 차단. 이전 단계 미완료 시 다음 단계 실행 불가 (exit code 2).

## Command Namespaces

| Prefix | Source | Purpose |
|--------|--------|---------|
| `uzys:` | 자체 워크플로우 | 6개 필수 커맨드 (Define→Ship) |
| `ecc:` | ECC cherry-pick | 보안 스캔, 경험 관리, checkpoint |
| `gsd:` | GSD (선택) | 대형 프로젝트 오케스트레이션 |

Impeccable 스킬은 직접 호출: `/polish`, `/critique`, `/audit`, `/teach` 등.

## Core Commands (uzys:)

### `/uzys:spec` — Define

스펙 작성. agent-skills의 spec-driven-development 스킬을 활성화.

**자동 활성화**: idea-refine (필요 시), change-management rule
**산출물**: `docs/SPEC.md`

### `/uzys:plan` — Plan

작업 분해. Sprint Contract 작성.

**게이트**: SPEC.md가 존재해야 진행 가능
**산출물**: `docs/plan.md`, `docs/todo.md`

### `/uzys:build` — Build

TDD로 점진적 구현. 파일 유형에 따라 스킬 자동 선택.

**게이트**: plan.md/todo.md가 존재해야 진행 가능
**자동 활성화**:
- `.tsx/.jsx/.html` 편집 → frontend-ui-engineering + DESIGN.md 참조
- API 라우트 편집 → api-and-interface-design
- commit-policy.md 적용 (즉시 커밋)

### `/uzys:test` — Verify

테스트 실행 + 커버리지 확인.

**자동 활성화**: test-policy.md (Track별 커버리지 기준), browser-testing (UI 변경 시)

### `/uzys:review` — Review

다중 관점 리뷰. 구현과 검증 분리 (SOD).

**게이트**: 테스트 통과 필수
**자동 활성화**:
- `reviewer` subagent (opus, context: fork)
- `code-reviewer` (ECC, sonnet)
- `security-reviewer` (ECC, sonnet)
**통과 조건**: CRITICAL 이슈 0건

### `/uzys:ship` — Ship

프리런치 체크리스트 + 배포.

**게이트**: Review 통과 필수
**체크리스트** (ship-checklist.md):
- E2E 테스트 PASS
- 커버리지 기준 충족
- `npx ecc-agentshield scan` 통과
- SPEC/PRD 정합성 확인

**Hotfix 단축**: Build → Verify → Ship (긴급 수정 시)

### `/uzys:auto` — 전체 자동 워크플로우 (v26.8.0+)

SPEC 확정 후 나머지 5단계를 자동으로 순차 진행. **Ralph loop**로 SPEC 정합성 검증.

```bash
/uzys:auto                  # Plan부터 Ship까지 전체 자동
/uzys:auto from=build       # Build부터 재개
/uzys:auto from=verify      # SPEC compliance check만 실행
```

**동작 흐름**:
```
/uzys:spec (사용자)
    ↓
/uzys:auto (자동 시작)
    ↓
  Plan → Build → Test → Review
    ↓
  SPEC Compliance Check  ← Ralph Loop
    ↓         ↑
  MISSING?  → Build 재진입 → 수정 → 재검증
    ↓ (100% PASS)
  Ship
```

**SPEC Compliance Check** (Ralph Loop):
- Ship 전 SPEC.md의 모든 Feature가 실제 구현됐는지 자동 검증
- 각 항목: 파일 존재 + 코드 매칭 + 테스트 존재 + 빌드 통과
- PASS / PARTIAL / MISSING 분류
- MISSING 잔존 시 Build로 돌아가 구현 → 재검증 (최대 5회)
- 100% PASS 시에만 Ship 진입

**자동 재시도**: 각 단계 실패 시 최대 3회 재시도 → 3회 초과 시 사용자 escalation
**Circuit Breaker**: SPEC compliance 5회 반복 후에도 MISSING 잔존 → 사용자 escalation (P9)

## ECC Commands (ecc:)

| Command | Description |
|---------|-------------|
| `/ecc:security-scan` | AgentShield 보안 스캔 |
| `/ecc:instinct-status` | 학습된 instinct 표시 |
| `/ecc:instinct-export` | instinct 내보내기 |
| `/ecc:instinct-import` | instinct 가져오기 |
| `/ecc:evolve` | instinct 클러스터링 → 상위 패턴 |
| `/ecc:promote` | 프로젝트 instinct → 글로벌 승격 |
| `/ecc:projects` | 추적 중인 프로젝트 목록 |
| `/ecc:checkpoint` | 진행 상태 스냅샷 (테스트/빌드/커버리지) |
| `/ecc:harness-audit` | 7카테고리 deterministic 점수 (P10 분기 검토용) |
| `/ecc:eval` | Acceptance criteria 기반 평가 실행 |
| `/ecc:e2e` | Playwright E2E 테스트 생성/실행 |

## 공통 도구 (Common Tools)

모든 dev Track에 기본 설치. executive는 `market-research` 중심 서브셋.

| 도구 | 종류 | 용도 | 호출 |
|------|------|------|------|
| `deep-research` | Skill (cherry-pick from ECC) | firecrawl + exa 멀티 소스 조사 + 인용 리포트 | Claude 세션에서 "deep research" 트리거 |
| `market-research` | Skill (executive 한정) | 경쟁사/TAM 분석 | `executive` Track에서 자동 사용 |
| `find-skills` | Skill (vercel-labs, npx) | 필요 시점에 관련 skill 검색/설치 | `/find-skills <keyword>` |
| `agent-browser` | CLI (npm -g) | 브라우저 자동화 (Playwright 래퍼) | 터미널: `agent-browser <url>` |
| `playwright` | CLI (npm -g) | E2E + UI visual review (`ui-visual-review` skill이 사용) | `/uzys:test` 자동 호출 |
| `chrome-devtools` MCP | MCP | DevTools (screenshot / console / network) | `mcp__chrome-devtools__*` |
| `claude-powerline` | statusLine | 세션 상태 표시 | `.claude/settings.json`이 자동 구동 |

### 사용 시나리오 예시

- **경쟁 조사** (executive): `/uzys:spec` 중 "시장 조사 필요" 판단 → `market-research` 자동 호출 → 인용 포함 리포트
- **문헌 조사** (dev): Build Phase에서 "이 라이브러리 최신 API?" → `deep-research` 호출 → firecrawl + exa 병렬 조사
- **UI 회귀** (csr-*/ssr-*): `/uzys:test` Pass 조건 → `ui-visual-review` 호출 → playwright 스크린샷 + chrome-devtools DOM diff

## 프로젝트 설정 파일

### `.mcp.json` (project-scope MCP 서버)

프로젝트별 MCP 서버 목록. `claude-harness install`이 Track에 맞게 동적 생성:

```jsonc
{
  "mcpServers": {
    "context7":       { "type": "stdio", "command": "npx", "args": ["-y", "@upstash/context7-mcp@latest"] },
    "github":         { "type": "stdio", "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"] },
    "chrome-devtools":{ "type": "stdio", "command": "npx", "args": ["-y", "chrome-devtools-mcp@latest"] }
    // Track에 따라 railway / supabase 등 자동 추가
  }
}
```

글로벌 `claude mcp add`는 **사용하지 않음** — 전부 프로젝트 스코프.

### `.claude/settings.json` (statusLine + hooks)

`$CLAUDE_PROJECT_DIR`을 사용해 절대 경로 제거. git-committable.

```jsonc
{
  "statusLine": { "type": "command", "command": "npx -y @owloops/claude-powerline@latest --style=tui" },
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{ "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/protect-files.sh\"" }]
    }]
    // ... session-start, gate-check, agentshield-gate, mcp-pre-exec
  }
}
```

머신 로컬 환경 변수가 필요하면 `.claude/settings.local.json` (gitignored)에 오버라이드.

## Cherry-pick 동기화 (`sync-cherrypicks.sh`)

ECC, agent-skills, claude-powerline 등 외부 출처에서 가져온 파일들의 drift 감지.

```bash
# 1. 검증만 (수정 없음)
bash scripts/sync-cherrypicks.sh

# 2. 변경된 unmodified 파일 자동 반영
bash scripts/sync-cherrypicks.sh --apply

# 3. CI용 — drift 있으면 exit 1
bash scripts/sync-cherrypicks.sh --check
```

매니페스트는 `.dev-references/cherrypicks.lock`:

| 필드 | 의미 |
|------|------|
| `sources.<name>.commit` | 외부 repo pin된 커밋 SHA |
| `cherrypicks[].src` / `dst` | 원본 → 프로젝트 내 경로 |
| `cherrypicks[].src_hash` | 마지막 sync 시 해시 |
| `cherrypicks[].modified` | `true`면 로컬 수정 — 자동 덮어쓰기 금지 |

수정 충돌 해결:
- `modified: false` + 상류 변경 → `--apply`로 자동 동기화
- `modified: true` → 수동 merge 후 hash 갱신 (`src_hash` 수동 수정 또는 `--apply` 강제)

## HITO 측정 (NORTH_STAR NSM)

`templates/hooks/hito-counter.sh`가 `UserPromptSubmit`마다 `.claude/evals/hito-YYYY-MM-DD.log`에 타임스탬프 한 줄 추가. 프롬프트 내용은 기록하지 않음 (프라이버시).

### 집계

```bash
# 일별 + 요약
bash scripts/hito-aggregate.sh

# 특정 일자 이후
bash scripts/hito-aggregate.sh --since 2026-04-20

# 요약만 (CI/report용)
bash scripts/hito-aggregate.sh --summary
```

출력: 일별 프롬프트 수 + 총합 + 최근 7일 이동평균.

### NSM 목표 대비 해석

- **단위**: feature 1개 완주(`/uzys:spec` → `/uzys:ship`)에 들어간 **명시적 사용자 개입 횟수**
- **목표** (NORTH_STAR §2): **≤ 3 per feature** (SPEC 정의 1 + Major CR 평균 1 + Ship 승인 1)
- **자동 집계의 한계**: 스크립트는 "프롬프트 수"까지만 집계. "feature 단위 HITO"는 수동 매핑 필요 — 세션 일자별로 다룬 feature 목록을 기록 후 나눠서 계산
- **분류 가이드**:
  - 명시적 지시 (intent 지시): HITO +1
  - 단순 승인/확인 ("예", "진행"): HITO +1
  - 정보 질문 ("이게 뭐야?"): HITO 계산 제외 (수동)

7일+ 연속 데이터 확보 시 `docs/evals/hito-baseline-YYYY-MM-DD.md` 리포트 작성 → Phase 2 진입 조건 3 (NORTH_STAR §4) 충족.

## Security & Quality Hooks (Phase 5.1/5.2)

v26.4.0+부터 추가된 5개 hook은 `.claude/settings.json`을 통해 자동 등록됩니다. 각 hook의 역할과 토글 방법:

### `mcp-pre-exec.sh` (D35, v26.7.0)

- **역할**: `PreToolUse` matcher `mcp__.*` — MCP tool 호출을 **화이트리스트 + 위험 파라미터 패턴**으로 차단
- **활성화**: `.mcp-allowlist` 파일 존재 시 (opt-in). `claude-harness install`이 설치 시 `.mcp.json` 서버 목록에서 자동 생성
- **차단 방식**: 비매칭 서버 또는 `rm -rf` / `curl | sh` / `eval $...` 등 위험 패턴 감지 시 `exit 2`
- **비활성**: `rm .mcp-allowlist` (파일 삭제) → 모든 MCP 호출 통과
- **근거**: CVE-2025-59536, CVE-2026-21852 (hooks/MCP RCE) 대응

### `checkpoint-snapshot.sh` (D25, v26.4.0)

- **역할**: `PostToolUse` async — tool 호출 40회마다 `docs/checkpoints/YYYYMMDD-HHMMSS.md` 스냅샷 저장
- **저장 내용**: git branch/HEAD, 변경 파일 목록, gate-status.json 현황
- **경고 재표시**: 다음 `SessionStart` 에서 `.claude/compact-warning.flag` 감지 후 `/compact` 수동 호출 권장 메시지
- **제약**: 자동 `/compact`는 **Claude Code 구조적 불가** (공식 hook 시스템에서 슬래시 커맨드 호출 불가). 대체 접근
- **조정**: `CHECKPOINT_THRESHOLD=60 claude` 환경 변수로 threshold 조절

### `codebase-map.sh` (D26, v26.4.0)

- **역할**: `SessionStart` — 프로젝트 top-level symbol 인덱스를 `.claude/codebase-map.json`에 저장
- **대상 언어**: Python (`def`/`class`), TypeScript/JavaScript (`function`/`class`/`export`), Rust (`fn`/`struct`/`impl`), Go (`func`/`type`), Shell (`function`)
- **방식**: bash regex 기반 (Tree-sitter 불필요). 최대 500 파일
- **TTL**: 10분 (stale 체크 후 자동 갱신)
- **강제 갱신**: `bash .claude/hooks/codebase-map.sh --force`

### `agentshield-gate.sh` (D27, v26.4.0)

- **역할**: `PreToolUse` matcher `Skill` — `/uzys:ship` Skill 호출 전 `npx ecc-agentshield scan` 자동 실행
- **차단**: CRITICAL finding + `.agentshield-ignore` 정규식 비매칭 시 `exit 2`
- **False-positive 예외**: `.agentshield-ignore` 파일에 정규식 추가 (예: `git-policy.md`의 `--no-verify` 금지 명시 문장)
- **비활성**: 파일 자체가 미존재이므로 unregister는 `.claude/settings.json`의 Skill matcher에서 해당 hook 제거

### `model-routing.md` rule (D24, v26.4.0) — opt-in

- **역할**: 6-gate × Haiku/Sonnet/Opus 매핑 가이드 Rule
- **활성화**: `claude-harness install --track <track> --model-routing on` (기본 `off`)
- **효과**: `.claude/rules/model-routing.md` 생성. 각 `/uzys:*` 단계에서 권장 모델 참조 가이드
- **제약**: `/model` 자동 전환 **불가** (Claude Code 구조적). 사용자 수동 전환
- **비활성**: `rm .claude/rules/model-routing.md` (파일 삭제) 또는 설치 시 플래그 미지정

## Impeccable (직접 호출)

Impeccable 스킬은 네임스페이스 없이 직접 호출:

| Command | Description |
|---------|-------------|
| `/teach` | 브랜드/청중/톤 설정 → `.impeccable.md` 생성 |
| `/shape` | UX/UI 계획 (코드 전 설계) |
| `/impeccable` | 프로덕션 수준 인터페이스 생성 |
| `/polish` | 최종 품질 패스 |
| `/critique` | UX 관점 평가 |
| `/audit` | 접근성/성능/반응형 체크 |
| `/adapt` | 반응형 디자인 적응 |
| `/animate` | 모션/마이크로 인터랙션 |
| `/bolder` `/quieter` | 디자인 강도 조절 |
| `/clarify` | UX 카피/에러 메시지 개선 |
| `/colorize` `/distill` | 색상 추가 / 복잡성 제거 |
| `/layout` `/typeset` | 레이아웃 / 타이포그래피 개선 |
| `/delight` `/overdrive` | 개성 추가 / 기술적 야심 |
| `/optimize` | UI 성능 최적화 |

## Multi-Track 설치 (v26.11.0+)

여러 Track의 union 설치가 필요할 때 (예: tooling + Python API).

### 동시 다중 Track (인터랙티브)

```bash
npx -y github:uzysjung/uzys-claude-harness
# → Track 프롬프트에서 <space>로 여러 개 선택 (예: tooling + csr-fastapi)
```

CI / 비대화형은 flag 형식:
```bash
npx -y github:uzysjung/uzys-claude-harness install --track tooling --track csr-fastapi
```

- Rules/Skills/Plugins/MCP 모두 union 설치
- 검증 테이블의 `Status`는 `—` 표시 (다중 시 expected 카운트 검증 skip)

### 사후 Track 추가

기존 설치에 Track 추가는 인터랙티브 5-메뉴로:

```bash
npx -y github:uzysjung/uzys-claude-harness
# → 기존 설치 감지 → 5-메뉴 → "1) 새 Track 추가" 선택
```

bash 시절 `--add-track` 플래그는 v0.2.0에서 폐기 — 인터랙티브 라우터로 통합.

차이점:
- 첫 설치는 baseline 자산 + 선택 Track 자산 union
- Add Track 액션은 기존 `.claude/*` 보존 + 새 Track의 MCP를 `.mcp.json`에 idempotent merge

## ECC Plugin 선별 prune (v26.10.0+)

ECC plugin 156 skills + 48 agents + 79 commands가 컨텍스트 부담일 때 사용자 정의 89개만 유지:

```bash
# 1. ECC plugin 설치 (글로벌 user scope cache)
claude plugin install everything-claude-code@everything-claude-code

# 2. dry-run으로 prune 시뮬레이션
bash scripts/prune-ecc.sh

# 3. 실제 적용 (project local 복사 + KEEP 89건 유지, 228건 prune)
bash scripts/prune-ecc.sh --apply --force

# 4. 사용
claude --plugin-dir .claude/local-plugins/ecc
```

특징:
- **D16 안전**: 글로벌 `~/.claude/plugins/cache/`는 read-only
- **이 프로젝트만**: `.claude/local-plugins/ecc/`. 다른 프로젝트 영향 없음
- **idempotent**: 두 번 실행 안전. ECC plugin 업데이트 시 재실행

옵션:
- `--apply`: 실제 적용 (기본 dry-run)
- `--force`: 확인 prompt 생략
- `--dest <path>`: 복사 위치 변경
- `--keep-existing`: dest 있으면 재복사 안 함

KEEP 89개는 `scripts/prune-ecc.sh`의 `KEEP_ITEMS` 변수에 정의. 수정 가능.

## Track Scenarios

### CSR Project (csr-fastapi)

```bash
# 1. 프로젝트 초기화 (인터랙티브에서 csr-fastapi 선택)
npx -y github:uzysjung/uzys-claude-harness

# 2. Claude Code 시작
claude

# 3. 워크플로우
/uzys:spec       # API + React 앱 스펙 작성
/uzys:plan       # Phase 분해, Sprint Contract
/uzys:build      # FastAPI 백엔드 → React 프론트엔드 → 연동
/uzys:test       # pytest + Vitest + Playwright E2E
/uzys:review     # 코드 + 보안 리뷰
/uzys:ship       # Railway 배포
```

### Executive PPT

```bash
# 1. 프로젝트 초기화 (인터랙티브에서 executive 선택)
npx -y github:uzysjung/uzys-claude-harness

# 2. Claude Code 시작 → 자연어로 요청
"Q3 실적 보고 PPT 만들어줘. TAM/SAM/SOM 분석 포함."
# → strategist agent + document-skills:pptx 자동 활성화
```

### Tooling / Meta Project (Bash + Markdown + CLI)

```bash
# 1. 프로젝트 초기화 (인터랙티브에서 tooling 선택, 글로벌 영향 없음 — 프로젝트 스코프만)
npx -y github:uzysjung/uzys-claude-harness

# 2. 활성화되는 rules (10개):
#    - common: git-policy, change-management
#    - dev: test-policy, commit-policy, ship-checklist, code-style, error-handling
#    - ECC: ecc-git-workflow, ecc-testing
#    - track: cli-development (Bash 표준, cross-platform, hook 컨벤션)

# 3. 워크플로우는 다른 dev track과 동일
/uzys:spec → /uzys:plan → /uzys:build → /uzys:test → /uzys:review → /uzys:ship

# 4. 디자인/프레임워크 rules는 설치 안 됨 (tauri/htmx/nextjs/shadcn 등)
```

## OpenCode 시나리오

### Install (단독 OpenCode)

```bash
# 1. 프로젝트 초기화 (인터랙티브 — Track + CLI: OpenCode 선택)
npx -y github:uzysjung/uzys-claude-harness
# 또는 flag 모드:
# npx -y github:uzysjung/uzys-claude-harness install --track tooling --cli opencode

# 2. 생성 자산
#    - AGENTS.md            (CLAUDE.md → slash rename)
#    - opencode.json        ($schema + mcp + agent + plugin)
#    - .opencode/commands/  (uzys-{spec,plan,build,test,review,ship}.md)
#    - .opencode/plugins/   (uzys-harness.ts — 3 hook plugin)

# 3. OpenCode 실행
opencode
# / 입력 → 6 slash 인식 (uzys-spec, uzys-plan, ..., uzys-ship)
```

### Install (Claude + Codex + OpenCode 동시)

```bash
npx -y github:uzysjung/uzys-claude-harness
# → CLI 프롬프트에서 "All (Claude + Codex + OpenCode)" 선택
# 결과: .claude/ + .codex/ + .opencode/ 모두 생성
# 한 프로젝트에서 3 CLI 어느 쪽으로든 같은 워크플로우 사용 가능
```

### Plugin 디버깅

OpenCode plugin이 의도대로 동작하는지 확인:

```bash
# HITO 카운터 — prompt 입력 후 로그 1줄 추가 확인
ls .claude/evals/hito-$(date +%Y-%m-%d).log
wc -l .claude/evals/hito-*.log

# spec-drift 로그 — docs/SPEC.md 편집 후 1줄 기록 확인
ls .claude/evals/spec-drift-*.log

# 게이트 위반 시 throw — /uzys-build 호출 (plan 미완료) → throw 메시지 확인
```

Plugin 본문은 `.opencode/plugins/uzys-harness.ts` (110줄, self-contained). 로직 수정 시 직접 편집 가능 (templates에서 재생성하면 덮어써짐).

## Rules Reference

| Rule | Tracks | What It Enforces |
|------|--------|-----------------|
| git-policy | ALL | 즉시 커밋, main 금지, feature branch |
| change-management | ALL | CR 분류(Clarification/Minor/Major), Decision Log |
| test-policy | Dev | Track별 커버리지(UI 60%, API 80%, 로직 90%) |
| commit-policy | Dev | Conventional Commits, 배치 금지 |
| ship-checklist | Dev | E2E/커버리지/보안/PRD 정합성 |
| code-style | Dev | ruff/prettier, 불변성, 파일 400줄 |
| error-handling | Dev | Exception handler, ErrorBoundary |
| design-workflow | UI | DESIGN.md + Impeccable 연동 |
| tauri | CSR | IPC, capability, 빌드 |
| shadcn | CSR/Next.js | CLI-only, ui/ 읽기전용, 접근성 |
| api-contract | CSR | Pydantic SSOT → OpenAPI → TS |
| database | CSR (fast*) | SQLModel, Alembic, N+1 방지 |
| htmx | ssr-htmx | partial response, Alpine 경계, CSRF |
| seo | SSR | 메타태그, CWV, 구조화 데이터 |
| nextjs | ssr-nextjs | App Router, RSC, Server Actions |
| pyside6 | data | 시그널/슬롯, QThread, Model/View |
| data-analysis | data | DuckDB/Trino/polars 패턴, ML pipeline |
| ecc-git-workflow | Dev | Conventional Commits, PR 워크플로우 (ECC) |
| ecc-testing | Dev | 80% 커버리지, TDD, AAA 패턴 (ECC) |
| cli-development | tooling | Bash 표준, cross-platform, jq 폴백, hook 컨벤션 |

## Change Management

### CR Workflow

1. 구현 중 SPEC 변경이 필요하면 CR 유형을 판단:
   - **Clarification**: 합의 내용 구체화 → 에이전트가 즉시 반영
   - **Minor**: 현재 Phase 내부 → 인간 승인 후 반영
   - **Major**: AC/Phase/Non-Goals 영향 → 인간 결정 필수

2. Major CR 전에는 savepoint 생성.
3. 결정사항은 `docs/decisions/`에 ADR로 기록.

## Concurrent Sessions

- 같은 프로젝트에서 여러 Claude Code 세션 → 세션별 feature branch
- SessionStart hook이 자동으로 `git pull --rebase`
- main 직접 커밋 금지

## Experience Accumulation

```
세션 중 자동 교정 → auto memory
                    ↓
반복 패턴 감지 → CL-v2 instinct (confidence 0.3-0.9)
                    ↓
high-confidence (≥0.8) → /ecc:promote → Rule 승격 제안
                    ↓
프로젝트 완료 시 → /ecc:instinct-export → knowledge-base 이관
```

- `/ecc:instinct-status` — 현재 instinct 확인
- `/ecc:evolve` — 관련 instinct 클러스터링
- `/ecc:instinct-export` — knowledge-base로 이관

## FAQ

**Q: agent-skills의 `/spec`과 `/uzys:spec` 차이?**
A: `/uzys:spec`은 `/spec`을 래핑하여 PRD 템플릿 참조, change-management 적용, spec-scaling 트리거 등을 추가. `/uzys:spec` 사용을 권장.

**Q: full track에서 htmx.md + nextjs.md 충돌은?**
A: 모든 rule이 설치되지만, 에이전트가 현재 편집 중인 파일의 확장자/프레임워크로 관련 rule을 자동 판단.

**Q: executive track에 `/uzys:spec` 없는 이유?**
A: executive는 개발 워크플로우 불필요. 자연어로 요청하면 strategist agent + document-skills가 자동 활성화.

**Q: GSD와 agent-skills 충돌?**
A: 네임스페이스로 분리 (`uzys:` vs `gsd:`). 동시 사용 가능하지만 대형 프로젝트에서 GSD의 오케스트레이션이 더 강력.

**Q: CL-v2 observer 활성화 방법?**
A: `.claude/skills/continuous-learning-v2/config.json`에서 `"observer.enabled": true`로 변경. Haiku 모델로 5분마다 분석 실행 (토큰 비용 발생).

**Q: 게이트를 건너뛰려면?**
A: `.claude/gate-status.json`에서 `"hotfix": true`로 설정. Build→Verify→Ship 단축 경로만 허용. Verify는 건너뛸 수 없음.

**Q: Impeccable 커맨드는 어떻게 실행?**
A: 네임스페이스 없이 직접 호출. `/polish`, `/critique`, `/audit`, `/teach` 등. Impeccable이 설치되어 있으면 Claude Code가 자동 인식.

## Troubleshooting

| 증상 | 원인 | 해결 |
|------|------|------|
| `claude: command not found` | Claude Code CLI 미설치 | https://claude.ai/code 에서 설치 |
| `jq: command not found` 경고 | jq 없음 (선택) | macOS: `brew install jq` / Linux: `apt install jq`. 없어도 grep 폴백으로 동작 (느림) |
| `claude plugin install` 실패 | 네트워크 또는 marketplace 변경 | v26.11.2 retry 래퍼가 1회 재시도. 재실행 시 idempotent. 계속 실패 시 marketplace URL 확인 |
| `BLOCKED: Define 단계가 완료되지 않았습니다` | 게이트 순서 위반 (`/uzys:plan` 호출 시 SPEC 없음) | `/uzys:spec` 먼저. 또는 `.claude/gate-status.json` 확인 |
| `[Fact-Forcing Gate]` 차단 | gateguard hook이 destructive 명령 차단 | 사실 4개 (호출자/함수/데이터 파일/사용자 instruction) 제시 후 재시도 |
| `ERROR: Unknown track 'X'` | v26.11.2부터 Track 이름 검증 | Valid: csr-supabase / csr-fastify / csr-fastapi / ssr-htmx / ssr-nextjs / data / executive / tooling / full |
| `ERROR: --project-dir은 글로벌 ~/.claude/...` | D16 보호 (글로벌 영역 차단) | `--project-dir` 없이 또는 프로젝트 디렉토리 절대 경로 사용 |
| `scripts/prune-ecc.sh` dry-run만 실행되고 끝남 | `--apply` 누락 (기본 dry-run) | `bash scripts/prune-ecc.sh --apply --force` 추가 |
| `claude --plugin-dir` 매번 입력 부담 | shell alias 미설정 | `~/.zshrc`에 `alias claude-ecc='claude --plugin-dir .claude/local-plugins/ecc'` |
| `.mcp.json` 손상 후 `--add-track` | invalid JSON 상태에서 union | v26.11.2부터 자동 백업 (`.mcp.json.invalid.<ts>.bak`) + 템플릿 재생성 |
| Multi-Track 검증 테이블 Status `—` | 다중 Track 시 expected 검증 skip (의도) | Found 카운트만 검증. union 정확성은 T13 회귀 테스트 |
| `.claude/local-plugins/ecc` 안 보임 | `.gitignore`에 등록되어 git ls-files에 안 나옴 (의도) | 직접 `ls .claude/local-plugins/` |
