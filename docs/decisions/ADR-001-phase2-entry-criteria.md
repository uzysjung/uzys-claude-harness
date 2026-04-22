# ADR-001: Phase 2 진입 조건 확정 (OQ1-3 결정)

- **Status**: Accepted
- **Date**: 2026-04-23
- **PR**: (single-maintainer, 사용자 직접 승인)
- **Supersedes**: 없음
- **Related**: `docs/SPEC.md` §3.4 OQ1-3, §5 Phase 2 Entry Checklist

## Context

`docs/SPEC.md` §3.4에서 Phase 2 진입 조건 확정에 필요한 3개의 열린 질문(OQ1-3)이 제기되었다. 각 OQ 미해결 상태에서는:

- **OQ1 미해결** → Phase D(HITO baseline) 종료 시점을 판정 불가 → v28.0.0 태그 불가
- **OQ2 미해결** → AC4 Phase 2 체크리스트 #5 Pass/Fail 판정 불가 → AC4 차단
- **OQ3 미해결** → AC2 dogfood 시나리오 범위 확정 불가 (실제로는 Phase B에서 3종 실행 완료)

Phase E1 판정(todo.md:80)에서 "부분 충족 4/7"로 멈춰있어 본 ADR로 차단 해제가 필요하다.

## Decision

### OQ1: HITO baseline 종료 기준

**7일 wall-clock AND 세션 ≥ 10회 AND feature 분류 ≥ 3종** (AND 조건)

- Phase D는 세 조건 **모두 충족** 시점에 종료로 판정.
- 측정 방법:
  - wall-clock: `.claude/evals/hito-*.log` 파일의 날짜 범위가 7일 이상
  - 세션 수: `bash scripts/hito-aggregate.sh --summary` 누적 카운트
  - feature 분류: baseline 리포트에 수동 분류한 feature 종류 수
- 미충족 시: `docs/evals/hito-baseline-*.md`에 현재치 기록 + Phase D 연장 또는 별도 ADR로 기준 완화.

### OQ2: Phase 2 체크리스트 #5 "외부 사용자 첫 설치" 이월 가부

**이월 허용**. 단 v28.0.0 Ship 시 Phase 2 백로그 최상단에 명시적 task로 등재.

- AC4 Phase 2 체크리스트 #5는 **Pass (이월)**로 판정.
- 이월 조건:
  - `docs/todo.md` 또는 `docs/phase-2-backlog.md`에 "P2-01: 외부 사용자 1명 설치 성공" task 등재
  - 성공 기준: (a) clean install 성공 (b) 첫 워크플로우 1건 완주 (c) HITO ≤ 3 (NSM 목표)
  - Phase 2 첫 세션에 이 task를 in_progress로 승격.

### OQ3: v27.17 interactive 라우터 dogfood 시나리오 범위

**3개(Install / Update / Add)로 확정**. 현재 Phase B 결과로 AC2 종결.

- Phase B에서 이미 3종 실행 + PASS (todo.md B2).
- 추가 시나리오 확장은 Phase 2 adoption 중 신규 이슈 발견 시에 한해 별도 CR로 진행.

## Alternatives

### OQ1 대안 (기각)

| 대안 | 기각 사유 |
|------|----------|
| 7일 wall-clock만 | 세션 드물면 표본 부족. NSM "≤3 HITO/feature" 측정 불가 |
| 세션 ≥ 10회만 | 하루에 몰아서 할 경우 생활 패턴 반영 못함 |
| 14일로 연장 | 단독 사용자(주 3~4회)엔 과도. v28.0.0 태그 지연 |

### OQ2 대안 (기각)

| 대안 | 기각 사유 |
|------|----------|
| 이월 불허 — Phase 1 진입 전 외부 사용자 영입 | SPEC §3.2 Non-Goals와 모순 (외부 early adopter 영입 제외 명시). 진입 조건 = Phase 2 본업이 되는 순환 논리 |
| 조건 자체 삭제 | NSM 2차 지표(9 Track clean install 성공률)의 외부 검증점을 잃음 |

### OQ3 대안 (기각)

| 대안 | 기각 사유 |
|------|----------|
| Install/Update/Add/Remove/Reinstall 등 5+개 | 현재 시나리오에서 CRITICAL/HIGH=0 확인됨. 추가 작업은 과잉 (P2 Simplicity) |

## Consequences

### Positive

- **AC4 Pass 처리 촉진**: #5 즉시 Pass (이월), #3 종료 기준 명확 (Phase D 완료 판정 가능).
- **Phase 2 백로그 시드 확보**: P2-01 외부 사용자 설치 task가 SPEC 밖에서 유실되지 않음.
- **NSM 측정 견고성**: OQ1 AND 조건이 baseline 대표성 보장.

### Negative

- **Phase D 기간 연장 가능성**: 세션 빈도 낮을 경우 세션≥10 미충족으로 7일 초과 가능. 2026-04-30 예상 종료일 연기 리스크.
  - 완화: `hito-aggregate.sh --summary`로 주 2회 점검, 미달 시 조기 알림.
- **P2-01 task가 Phase 2 본업과 중복 느낌**: 백로그 등재로 추적은 가능하나 우선순위 관리 필요.

### Neutral

- AC2는 본 ADR 이전에 이미 Pass (commit 92982c5). OQ3 결정은 사후 확정 성격.

## Follow-up Actions

1. `docs/todo.md` E3 체크박스 완료 표시.
2. `docs/todo.md` E1 #5 항목 **Pass (이월 - ADR-001)** 로 업데이트 → E1 판정 5/7 Pass + 2 pending.
3. Phase D 완료 시 본 ADR OQ1 기준으로 판정 + baseline 리포트 작성.
4. v28.0.0 Ship 직전 Phase 2 백로그 파일 생성 및 P2-01 등재.
