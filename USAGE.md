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

## Security & Quality Hooks (Phase 5.1/5.2)

v26.4.0+부터 추가된 5개 hook은 `.claude/settings.json`을 통해 자동 등록됩니다. 각 hook의 역할과 토글 방법:

### `mcp-pre-exec.sh` (D35, v26.7.0)

- **역할**: `PreToolUse` matcher `mcp__.*` — MCP tool 호출을 **화이트리스트 + 위험 파라미터 패턴**으로 차단
- **활성화**: `.mcp-allowlist` 파일 존재 시 (opt-in). `setup-harness.sh`가 설치 시 `.mcp.json` 서버 목록에서 자동 생성
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
- **활성화**: `bash setup-harness.sh --track <track> --model-routing on` (기본 `off`)
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

## Track Scenarios

### CSR Project (csr-fastapi)

```bash
# 1. 프로젝트 초기화
bash setup-harness.sh --track csr-fastapi

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
# 1. 프로젝트 초기화
bash setup-harness.sh --track executive

# 2. Claude Code 시작 → 자연어로 요청
"Q3 실적 보고 PPT 만들어줘. TAM/SAM/SOM 분석 포함."
# → strategist agent + document-skills:pptx 자동 활성화
```

### Tooling / Meta Project (Bash + Markdown + CLI)

```bash
# 1. 프로젝트 초기화 (글로벌 영향 없이 프로젝트 스코프만)
bash setup-harness.sh --track tooling

# 2. 활성화되는 rules (10개):
#    - common: git-policy, change-management
#    - dev: test-policy, commit-policy, ship-checklist, code-style, error-handling
#    - ECC: ecc-git-workflow, ecc-testing
#    - track: cli-development (Bash 표준, cross-platform, hook 컨벤션)

# 3. 워크플로우는 다른 dev track과 동일
/uzys:spec → /uzys:plan → /uzys:build → /uzys:test → /uzys:review → /uzys:ship

# 4. 디자인/프레임워크 rules는 설치 안 됨 (tauri/htmx/nextjs/shadcn 등)
```

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
