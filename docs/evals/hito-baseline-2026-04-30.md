# HITO Baseline — 2026-04-30 (Phase D 종료 판정)

> **Status**: AC3 Pass — Phase D 완료
> **Window**: 2026-04-23 ~ 2026-04-30 (8 days, wall-clock ≥7 충족)
> **SPEC**: `docs/SPEC.md` AC3 + `docs/decisions/ADR-001-phase2-entry-criteria.md` OQ1

## 1. ADR-001 OQ1 종료 기준 판정

**기준 (AND)**: wall-clock ≥ 7일 AND 세션 ≥ 10회 AND feature 분류 ≥ 3종

| # | 조건 | 측정값 | Threshold | Pass/Fail |
|---|------|---|---|---|
| 1 | wall-clock | **8 days** (2026-04-23~30) | ≥ 7 | **PASS** |
| 2 | 누적 카운트 (세션 proxy) | **166 prompts** | ≥ 10 | **PASS** |
| 3 | feature 분류 | **8 features** (§3) | ≥ 3 | **PASS** |

**판정: AC3 PASS — Phase D 종료**

## 2. Daily Breakdown

`bash scripts/hito-aggregate.sh` 결과:

| Date | Prompts | 메모 |
|------|---|---|
| 2026-04-23 | 19 | hito-counter.sh 활성화 시작일 |
| 2026-04-24 | 15 | v0.4.0 ship + Phase 6a 매트릭스 |
| 2026-04-25 | 79 | v0.4.0 ship report + Codex/OpenCode dogfood |
| 2026-04-26 | 15 | karpathy-coder 도입 검토 |
| 2026-04-27 | 4 | 휴식일 (저활동) |
| 2026-04-28 | 15 | v0.7.0 CLI multi-select + Codex slash 통일 |
| 2026-04-29 | 17 | v0.7.1 + v0.8.0 dual BREAKING ship |
| 2026-04-30 | 2 | v0.8.1 SSOT refactor + dependency 평가 + baseline 보고 |
| **합계** | **166** | 평균 21.0/day (window=7) |

## 3. Feature 분류 (≥ 3종 충족)

window 내 ship된 feature 8건 (NORTH_STAR NSM "feature" 단위):

| # | Feature | Version | Commits | 비고 |
|---|---------|---|---|---|
| 1 | External asset 매트릭스 + install 통합 | v0.4.0 | 4 (ef..., e7..., 29..., 22...) | Phase 1-3, 29 자산 |
| 2 | 신규 Track 2개 (PM + Growth Marketing) | v0.5.0 | 3 (cd..., bb..., 41...) | 11 Track 확장 + karpathy-coder asset |
| 3 | karpathy-coder hook auto-wire | v0.6.0 | 1 (f23a857) | opt-in `--with-karpathy-hook` |
| 4 | install 진행상황 streaming + UX | v0.6.1, v0.6.2 | 2 (fb06fa3, f3dc8ea) | Phase 1/2 row 상세화 |
| 5 | CRITICAL/asset fix patches | v0.6.3, v0.6.4, v0.6.5, v0.6.6 | 4 (0f55718, 5580882, 0f3a96e, f0329d7) | Codex skill 경로 / vercel-labs skill / ecc-prune 절대경로 |
| 6 | CLI multi-select + Codex slash 통일 | v0.7.0 | 1 (bdc7281) | BREAKING — 5 mode → 7 combination, `/uzys-spec` slash |
| 7 | `.codex/prompts/` project-scoped pre-positioning | v0.7.1 | 1 (cbe8753) | upstream openai/codex#9848 free upgrade |
| 8 | CLI alias 제거 + `.claude/` 조건부 baseline | v0.8.0, v0.8.1 | 2 (b2a9a90, d5fd378) | BREAKING dual + Track partition SSOT refactor |

**8 distinct features ≥ 3 충족.**

## 4. NSM 측정 — HITO/feature

NORTH_STAR §2 NSM 목표: **≤ 3 prompts per feature** (1차 지표).

| Feature | 추정 HITO (prompts) | NSM ≤ 3 |
|---|---|---|
| External asset matrix (v0.4.0) | ~30 | ✘ (init 대량 분해) |
| 신규 Track 2개 (v0.5.0) | ~25 | ✘ |
| karpathy hook (v0.6.0) | ~20 | ✘ |
| install streaming UX (v0.6.1/2) | ~10 | ✘ |
| asset fix patches (v0.6.3-6) | ~12 | △ (4 patch 평균 3) |
| CLI multi-select (v0.7.0) | ~30 | ✘ |
| `.codex/prompts/` (v0.7.1) | ~10 | △ |
| alias 제거 + baseline 조건부 (v0.8.0/1) | ~20 | ✘ |

**HITO/feature 평균 ≈ 20** — NSM 목표 대비 **6.7×** 초과. baseline 측정 단계라 **개선 여지 명시**:

- 상위 instinct/skill 추출(continuous-learning-v2 활용)로 반복 작업 자동화
- SPEC 분해 단위를 더 작게 (현재 BREAKING dual 한 SPEC에 묶음)
- 라이브 dogfood 부재 → 사용자 환경 보고 #2/#3 같은 후기 발견 비용 큼

NSM 개선은 Phase 2 본업.

## 5. 측정 방법론 / 한계

### 측정 방법

- `templates/hooks/hito-counter.sh` — `UserPromptSubmit` hook이 매 prompt 카운트
- `.claude/evals/hito-YYYY-MM-DD.log` — 일자별 누적
- `scripts/hito-aggregate.sh --summary` — 합계 + 일평균
- 본 보고서는 raw 카운트 + git log 매핑으로 feature 단위 추정

### 한계

1. **prompt ≠ session** (해결 — ADR-008 + nsm-aggregate.sh): ADR-008 Decision (gap ≥ 60분 = 새 session)으로 명확화. `bash scripts/nsm-aggregate.sh --since 2026-04-23 --until 2026-04-30` 실행 결과 **16 sessions** (≥ 10 충족, AC3 #2 PASS). 본 보고서의 "166 prompts proxy" 가정은 보수적이었고, 자동 분할 적용 시 보다 정확한 baseline. P2-02 도구 활용으로 향후 baseline 재계산 가능.
2. **HITO/feature 추정**: 자동 분류 미구현. 본 보고서는 git log + window 내 commit 분포로 수동 추정 — Phase 2 NSM 자동화 시점에 재검증.
3. **단독 사용자 dogfood**: 표본 1명. 외부 사용자 도입 시 NSM 분포가 달라질 가능성 — Phase 2 P2-01 task로 검증.
4. **Phase D 측정 중 ship 다수**: 측정 window 내 v0.4.0~v0.8.1까지 ship. baseline은 "현재 상태" snapshot이 아닌 "성장 중" snapshot.

## 6. AC4 Phase 2 Entry Checklist 영향

| # | 조건 | 측정 방법 | Pass/Fail |
|---|------|---|---|
| 1 | 9→11 Track clean install 성공률 | tests/installer-cli-matrix 77 시나리오 + 5 invariant | **PASS** (521 vitest) |
| 2 | test-harness PASS | `bash tests/test-harness.sh` (구 bash) → vitest 521 | **PASS** (CI green) |
| 3 | HITO baseline 수집 | 본 보고서 | **PASS** (이 문서) |
| 4 | 글로벌 미수정 | D16 보호 (`~/.claude/` opt-in 외 0 mutation) | **PASS** |
| 5 | 외부 사용자 첫 설치 | ADR-001 OQ2 — 이월 허용 | **PASS (이월)** P2-01 |
| 6 | Phase 4b D1/D2/D4 이월 소화 | git log v27.0~ | **PASS** (이미 처리됨) |
| 7 | v27.17 dogfood CRITICAL/HIGH | `docs/evals/track-install-2026-04-23.md` | **PASS** (CRITICAL/HIGH 0) |

**AC4 7/7 Pass (#5 이월 포함) — Phase 2 진입 가능.**

## 7. Decision

- **AC3 Pass**: HITO baseline ≥ 7일 + ≥ 10 prompts + ≥ 3 features 모두 충족.
- **Phase D 종료** (시작 2026-04-23, 종료 2026-04-30, 8일).
- **AC4 충족**: 7/7 (1 이월).
- **Phase F 진입 가능** — review/ship/v26.38.0 태그.

## 8. Follow-up (Phase 2)

- **P2-01**: 외부 사용자 1명 clean install 성공 + 첫 워크플로우 1건 완주 (HITO ≤ 3) — `docs/phase-2-backlog.md` 또는 `docs/todo.md` 등재 (ADR-001 OQ2)
- **NSM 자동화**: feature 단위 HITO 추정을 수동 → 자동 (per-feature commit hash 매핑 도구)
- **세션 경계 정의**: prompt-stream → session 분할 휴리스틱 (timestamp gap 기반) — 별 ADR 검토

---

**Generated**: 2026-04-30 (post v0.8.1 ship)
**SPEC AC3 status**: **PASS**
**Phase D status**: **COMPLETE**
