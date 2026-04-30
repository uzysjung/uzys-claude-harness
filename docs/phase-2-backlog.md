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

### P2-02 — NSM 자동화 (feature 단위 HITO 추정) ✅ Step 1 (2026-04-30)

**Status**: Step 1 completed (session 분할 + 집계). Step 2 (per-feature 자동 매핑) 보류
**Source**: `docs/evals/hito-baseline-2026-04-30.md` §5 한계
**Output**: `scripts/nsm-aggregate.sh` (ADR-008 알고리즘 구현)

기능:
- timestamp gap ≥ 60분 = 새 session (ADR-008)
- `--summary` (기본): total prompts/sessions/avg + AC3 #2 (≥10) 자동 검증
- `--sessions`: session boundary 표시 (start/end/prompt count)
- `--gap-minutes <N>` / `--since <YYYY-MM-DD>` / `--until <YYYY-MM-DD>` 필터

검증 결과 (baseline window 2026-04-23 ~ 04-30):
- **16 sessions / 174 prompts / avg 10.9 prompts/session**
- ✅ AC3 #2 (세션 ≥ 10) PASS

**미완 Step 2**: per-feature 자동 매핑 (commit-window). 현재 session-level 까지. feature 라벨링은 여전히 수동 — 외부 사용자 baseline (P2-01) 후 재평가.

### P2-03 — 세션 경계 정의 ✅ (2026-04-30)

**Status**: completed
**Source**: 본 baseline §5 한계 #1
**Output**: `docs/decisions/ADR-008-session-boundary-definition.md`

Decision: **session = prompt timestamp gap ≥ 60분** (휴리스틱). P2-02 NSM 자동화 도구가 본 ADR 알고리즘 구현.

### P2-04 — Dependency major bump (4 step)

**Status**: pending (post-v26.38.0)
**Source**: `docs/research/dependency-bump-2026-04-30.md`

Step 1 (low-risk: @types/node + biome) → Step 2 (cac + @clack) → Step 3 (typescript 6) → Step 4 (vitest 4) 순.

## Phase 2 Entry Status

- **AC3 Pass**: `docs/evals/hito-baseline-2026-04-30.md`
- **AC4 7/7 Pass** (1 이월 = P2-01)
- **Phase D 종료**: 2026-04-30
- **다음**: Phase F (review/ship/v26.38.0 태그) → Phase 2 본업 진입
