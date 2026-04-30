# Phase 2 Adoption Loop — Backlog

> **Created**: 2026-04-30 (Phase D 종료 직후)
> **Source**: `docs/decisions/ADR-001-phase2-entry-criteria.md` Follow-up #4
> **Phase**: 2 진입 — Adoption Loop

## P2 Tasks (priority order)

### P2-01 — 외부 사용자 첫 설치 성공

**Status**: pending (Phase 2 진입 직후 in_progress)
**Source**: ADR-001 OQ2 (이월 허용 조건)

**성공 기준 (AND)**:
- (a) Clean install 성공 (`npx -y github:uzysjung/uzys-claude-harness` 1-shot)
- (b) 첫 워크플로우 1건 완주 (`/uzys:spec` → `/uzys:ship` 또는 hotfix 단축)
- (c) HITO ≤ 3 prompts/feature (NSM 1차 지표)

**측정**:
- 외부 사용자 환경 hito-counter.sh 로그 수집 (별도 동의 필수)
- 또는 사용자 자가 보고 (작업 시간 + 멘탈 모델 수)

### P2-02 — NSM 자동화 (feature 단위 HITO 추정)

**Status**: pending
**Source**: `docs/evals/hito-baseline-2026-04-30.md` §5 한계

per-feature commit hash 매핑 도구 — 현재 수동 분류를 자동화.

### P2-03 — 세션 경계 정의

**Status**: pending
**Source**: 본 baseline §5 한계 #1

prompt-stream → session 분할 휴리스틱 (timestamp gap ≥ N분). 별 ADR 작성.

### P2-04 — Dependency major bump (4 step)

**Status**: pending (post-v26.38.0)
**Source**: `docs/research/dependency-bump-2026-04-30.md`

Step 1 (low-risk: @types/node + biome) → Step 2 (cac + @clack) → Step 3 (typescript 6) → Step 4 (vitest 4) 순.

## Phase 2 Entry Status

- **AC3 Pass**: `docs/evals/hito-baseline-2026-04-30.md`
- **AC4 7/7 Pass** (1 이월 = P2-01)
- **Phase D 종료**: 2026-04-30
- **다음**: Phase F (review/ship/v26.38.0 태그) → Phase 2 본업 진입
