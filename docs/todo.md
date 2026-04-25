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

- [x] **A4** README.ko.md 동기화 — 영문 A1 변경분 한국어 반영 (commit 3e5af9a, 2026-04-23)

---

## Phase B — Dogfood v27.17 ✅ (재검증 후)

- [x] **B1** 기존 16 시나리오 재실행 (Phase 1~5) — 19/19 PASS (full 실행 제외 16/17 Rule 표기 오차 → H1 fix)
- [x] **B2** interactive 라우터 3종 시나리오 — 전부 PASS
- [x] **B3** v27.16 gh-issue-workflow skill 설치 — 확인됨
- [x] **B4** 리포트 `docs/dogfood/cli-dogfood-2026-04-23.md` 작성
  - [x] H1 fix 완료 (setup-harness.sh:1202 tauri opt-in 반영)
  - [x] H2 false positive 취소
  - [x] 최종 CRITICAL=0 HIGH=0 (H1 수정 후)

---

## Phase C — HITO Infrastructure ✅

- [x] **C1** `scripts/hito-aggregate.sh` 작성
  - [x] `.claude/evals/hito-*.log` glob + wc -l
  - [x] 일일 카운트 + 7일 이동평균
  - [x] bash 3.2 호환 (mapfile 회피, shellcheck disable 주석)
  - [x] `--dir` / `--since` / `--summary` 옵션
- [x] **C2** USAGE.md "HITO 측정" 섹션 추가
  - [x] NSM 정의 + NORTH_STAR 링크
  - [x] 해석 가이드 (explicit / 승인 / 질문 분류)
- [x] **C3** 4케이스 테스트 통과 (빈 / 1일 / 복수일 / --since 필터)

---

## Phase D — HITO Measurement (경과 시간 필요)

- [ ] **D1** 7일+ 로그 수집 (A/B/C 병행)
- [ ] **D2** 집계 실행 + 수치 기록
- [ ] **D3** 분석 리포트 `docs/evals/hito-baseline-YYYY-MM-DD.md`
  - [ ] 일일/주간 추세
  - [ ] feature 완주 카운트
  - [ ] NSM 목표(≤ 3/feature) 대비 현재치

---

## Phase E — Phase 2 Readiness (부분 진행)

- [ ] **E1** Phase 2 Entry Checklist 실행 (SPEC §5)
  - [x] 1. 9 Track clean install 성공률 ≥ 95% — **9/9 PASS (100%)** ✅ `docs/evals/track-install-2026-04-23.md` (Phase B 3종 + 2026-04-23 세션 6종)
  - [x] 2. test-harness PASS — 2026-04-23 실측 **149 total / Pass 144 / Fail 0 / Skip 5** ✅
  - [ ] 3. HITO baseline 수집 완료 — Phase D 경과 필요
  - [x] 4. 글로벌 미수정 — setup-harness.sh D16 보호(L73-84) + 본 세션 `--update` 시 에러 없음. ~/.claude/ mtime은 Claude Code 자체 업데이트 (본 프로젝트 무관) ✅
  - [x] 5. 외부 사용자 첫 설치 — **Pass (이월)** per ADR-001 OQ2. v28.0.0 Ship 시 Phase 2 백로그 P2-01로 등재
  - [x] 6. Phase 4b D1/D2/D4 이월 소화 — commit b9d47ef + 3e5af9a ✅
  - [x] 7. v27.17 dogfood CRITICAL/HIGH = 0 — H1 fix 후 최종 판정 ✅ (commit 92982c5)
- [x] **E2** requirements-trace.md 확장 — Part 6: v27.x Post-audit Trace ✅ (2026-04-23)
  - [x] v27.0~v27.17 18개 커밋 Source → 4-gate → Evidence 확정 (전부 4/4 Pass)
  - [x] 중복 "Part 3" 헤딩 → Part 6로 교정 (기존 Part 3 Decisions와 충돌 해소)
- [x] **E3** ADR 생성 — `docs/decisions/ADR-001-phase2-entry-criteria.md` ✅ (2026-04-23)
  - [x] OQ1 (baseline 기준) — 7일 AND 세션≥10 AND feature≥3
  - [x] OQ2 (외부 사용자 조건 이월 가부) — 이월 허용, Phase 2 백로그 P2-01 등재
  - [x] OQ3 (dogfood interactive 시나리오 범위) — 3개(Install/Update/Add) 확정

### E1 현재 판정 요약 (2026-04-23, Track 9/9 검증 완료)

- **충족**: 1 (9/9 PASS), 2, 4, 5 (이월), 6, 7 (**6/7**)
- **Pending**: 3 (Phase D 7일 경과 필요 — ADR-001 OQ1 기준: 7일 AND 세션≥10 AND feature≥3)

---

## Phase F — Review & Ship

- [ ] **F1** `/uzys:review` — 5축 리뷰 CRITICAL = 0
- [ ] **F2** ship-checklist 통과 확인
- [ ] **F3** CLAUDE.md 개선 후보 검토 (Ship 후 리뷰 프로세스)
- [ ] **F4** Self-Audit 5항목 기록
- [ ] **F5** v28.0.0 태그 + push (Foundation 완료 선언)

---

## 병행 SPEC 진행 상태 (참고)

- `docs/specs/codex-compat.md` — **Codex 호환 1차 완료** (2026-04-25, v27.19.0). Phase A~G 7단계 모두 완료. ADR-001과 별도 스펙. 본 todo는 Phase 1 Finalization 전용. Codex 후속(OQ7/OQ8/OpenCode 2차)은 `docs/dev/session-2026-04-25-handoff.md` 참조.

## 다음 세션 가이드

현 세션 2026-04-23 완료 범위: **#2 현행화 + Phase A + A4 + C + Phase D 측정 시작 준비**.

이후 세션에서 진행:

1. **Phase B — dogfood v27.17** (예상 30~60분 단독 세션)
   - 전용 approach: `/dogfood` 스킬 또는 `agent-skills:test-engineer` subagent 스폰
   - 임시 디렉토리 fresh install → 16 기존 시나리오 + 3 interactive 시나리오
   - 리포트: `docs/dogfood/cli-dogfood-2026-04-XX.md`
   - 주의: setup-harness.sh의 `--update`는 신규 hook(이번 hito-counter.sh 사례)을 배포 안 함 — 버그 후보
2. **Phase D — HITO 측정 경과** (2026-04-30 이후)
   - 본 세션에서 hito-counter.sh 설치 + 동작 확인 완료 (`.claude/evals/hito-2026-04-23.log` 생성)
   - 매일 Claude Code 세션 사용 시 자동 축적
   - 집계: `bash scripts/hito-aggregate.sh` 실행 후 baseline 리포트 작성
3. **Phase E — Readiness** (D 완료 후)
   - E1 체크리스트 7항목 판정
   - E2 requirements-trace v27.x Part 3 개별 증거 확정
   - E3 ADR-001 OQ1-3 결정
4. **Phase F — Review & Ship** (E 완료 후 v28.0.0 태그)

## 이번 세션 발견 이슈 (추후 해결 대상)

> **2026-04-25 업데이트**: bash `setup-harness.sh` 폐기 (v0.2.0 CLI rewrite, ADR-003 Accepted). 아래 두 이슈는 모두 bash 시절 잔재이며 TypeScript CLI는 인터랙티브 모드로 통합되어 무효 처리.

## 완료 조건

- [ ] SPEC AC1-AC5 모두 Pass
- [ ] Phase A-F 체크박스 완료
- [ ] Phase 2 진입 체크리스트 7항목 판정 기록
- [ ] v28.0.0 태그 push
