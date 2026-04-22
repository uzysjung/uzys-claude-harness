# Todo: Phase 1 Finalization & Phase 2 Entry

> **Linked plan**: `docs/plan.md`
> **Linked SPEC**: `docs/SPEC.md`

---

## Phase A — Docs Finalization ✅

- [x] **A1** README.md 보강 (commit b9d47ef)
  - [x] "Common tools" 섹션 (7종 표)
  - [x] "Updating cherry-picked content" 섹션
- [x] **A2** USAGE.md 보강 (commit b9d47ef)
  - [x] 공통 도구 + 사용 시나리오
  - [x] `.mcp.json` / `.claude/settings.json` 구조
  - [x] Cherry-pick 동기화 (`sync-cherrypicks.sh`)
- [x] **A3** CONTRIBUTING.md sync 절차 (commit b9d47ef)
  - [x] Sync workflow + Adding + Bumping + Do NOT

### A-이월 (Phase A 범위 밖 판단)

- [ ] **A4** README.ko.md 동기화 — 영문 A1 변경분 한국어 반영 (사용자 결정 대기)

---

## Phase B — Dogfood v27.17

- [ ] **B1** 기존 16 시나리오 재실행 (Phase 1~5)
- [ ] **B2** interactive 라우터 신규 시나리오
  - [ ] 신규 디렉토리 Install 분기
  - [ ] 기존 설치 Update 분기
  - [ ] Multi-track Add 분기
- [ ] **B3** v27.16 gh-issue-workflow skill 설치 검증
- [ ] **B4** 리포트 `docs/dogfood/cli-dogfood-2026-04-XX.md` 작성
  - [ ] CRITICAL/HIGH = 0 확인

---

## Phase C — HITO Infrastructure

- [ ] **C1** `scripts/hito-aggregate.sh` 작성
  - [ ] `.claude/evals/hito-*.log` glob + wc -l
  - [ ] 일일 카운트 + 주간 이동 평균
  - [ ] bash 3.2 호환 / jq 폴백
- [ ] **C2** HITO 측정 가이드 (USAGE.md 섹션 또는 `docs/HITO.md`)
  - [ ] NSM 정의 인용 + NORTH_STAR 링크
  - [ ] 해석 방법 (explicit vs 승인 vs 확인)
- [ ] **C3** 3케이스 테스트 (빈 / 1일 / 복수일)

---

## Phase D — HITO Measurement (경과 시간 필요)

- [ ] **D1** 7일+ 로그 수집 (A/B/C 병행)
- [ ] **D2** 집계 실행 + 수치 기록
- [ ] **D3** 분석 리포트 `docs/evals/hito-baseline-YYYY-MM-DD.md`
  - [ ] 일일/주간 추세
  - [ ] feature 완주 카운트
  - [ ] NSM 목표(≤ 3/feature) 대비 현재치

---

## Phase E — Phase 2 Readiness

- [ ] **E1** Phase 2 Entry Checklist 실행 (SPEC §5)
  - [ ] 1. 9 Track clean install 성공률 ≥ 95%
  - [ ] 2. test-harness 147/147
  - [ ] 3. HITO baseline 수집 완료
  - [ ] 4. 글로벌 미수정 확인
  - [ ] 5. 외부 사용자 첫 설치 (Pass 또는 이월 CR)
  - [ ] 6. Phase 4b D1/D2/D4 이월 소화
  - [ ] 7. v27.17 dogfood CRITICAL/HIGH = 0
- [ ] **E2** requirements-trace.md 확장 — Part 3: v27.x Post-audit Trace
  - [ ] v27.0~v27.17 각 feat 커밋의 Source → 4-gate → Evidence
- [ ] **E3** ADR 생성 — `docs/decisions/ADR-001-phase2-entry-criteria.md`
  - [ ] OQ1 (baseline 기준) 결정
  - [ ] OQ2 (외부 사용자 조건 이월 가부) 결정
  - [ ] OQ3 (dogfood interactive 시나리오 범위) 결정

---

## Phase F — Review & Ship

- [ ] **F1** `/uzys:review` — 5축 리뷰 CRITICAL = 0
- [ ] **F2** ship-checklist 통과 확인
- [ ] **F3** CLAUDE.md 개선 후보 검토 (Ship 후 리뷰 프로세스)
- [ ] **F4** Self-Audit 5항목 기록
- [ ] **F5** v28.0.0 태그 + push (Foundation 완료 선언)

---

## 완료 조건

- [ ] SPEC AC1-AC5 모두 Pass
- [ ] Phase A-F 체크박스 완료
- [ ] Phase 2 진입 체크리스트 7항목 판정 기록
- [ ] v28.0.0 태그 push
