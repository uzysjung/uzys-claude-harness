SPEC 확정 후 나머지 5단계(Plan → Build → Test → Review → Ship)를 자동으로 순차 진행하고, **SPEC 정합성이 충족될 때까지 Ralph loop로 반복 검증**한다.

## 사전 조건

1. `docs/SPEC.md` 존재 확인. 없으면 "/uzys:spec을 먼저 실행하세요" 안내 후 **중단**.
2. `.claude/gate-status.json`의 `define.completed` = true 확인. false면 **중단**.

## 실행 순서

각 단계를 **순차 실행**. 각 단계 완료 시 gate-status.json을 자동 업데이트하고 다음 단계로 진행한다.

### 1. Plan
- `docs/plan.md` + `docs/todo.md` 생성
- plan-checker agent로 Goal-backward 검증 (Revision Gate, 최대 3회)
- 완료 시: `jq '.plan.completed = true | .plan.timestamp = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))' .claude/gate-status.json > /tmp/gate-tmp.json && mv /tmp/gate-tmp.json .claude/gate-status.json`

### 2. Build
- `docs/todo.md`에서 미완료 task를 순차 선택
- 각 task에 TDD 사이클 적용 (RED → GREEN → REFACTOR)
- 각 task 완료 시 **즉시 커밋** (commit-policy 준수)
- todo.md 체크박스 업데이트
- 모든 task 완료 시: gate-status build.completed = true

### 3. Test
- 전체 테스트 스위트 실행
- test-policy.md 커버리지 기준 확인 (UI 60%, API 80%, 로직 90%)
- 미달 시 추가 테스트 작성 시도 (최대 3회)
- 통과 시: gate-status verify.completed = true

### 4. Review
- reviewer subagent (context: fork) 호출
- 5축 리뷰: correctness, readability, architecture, security, performance
- CRITICAL 이슈 발견 시 즉시 수정 시도 (최대 3회)
- CRITICAL 0건 시: gate-status review.completed = true

### 5. SPEC Compliance Check (Ralph Loop) ← 핵심

**Ship 전에 반드시 실행**. SPEC.md에 정의된 모든 요구사항이 실제로 구현됐는지 확인하고, 미달이면 Build로 돌아가 수정한다.

#### 5.1 SPEC 파싱

`docs/SPEC.md`에서 다음을 자동 추출:
- **Objective** 섹션의 핵심 목표
- **Features** 섹션의 각 기능 항목 (체크리스트 또는 표)
- **Acceptance Criteria** (있으면)
- **Boundaries > DO NOT CHANGE** 영역
- **Non-Goals** 목록

#### 5.2 구현 검증 (자동)

추출된 각 항목에 대해:

1. **파일 존재 확인**: 해당 기능이 구현된 파일이 프로젝트에 존재하는가? (Glob/Grep)
2. **코드 매칭**: 기능 키워드가 소스 코드에 등장하는가? (Grep)
3. **테스트 존재**: 해당 기능에 대한 테스트 파일이 있는가?
4. **빌드 통과**: 프로젝트 빌드/타입체크가 PASS인가?
5. **DO NOT CHANGE 미침범**: 보호 영역이 수정되지 않았는가?
6. **Non-Goals 미침범**: Non-Goals에 해당하는 구현이 추가되지 않았는가?

#### 5.3 결과 분류

각 항목을 다음 3가지로 분류:
- **PASS**: 구현 확인됨
- **PARTIAL**: 파일은 있지만 불완전 (예: stub, TODO, 빈 함수)
- **MISSING**: 구현 없음

#### 5.4 Ralph Loop (반복 수정)

```
iteration = 0
MAX_ITERATIONS = 5

while MISSING 또는 PARTIAL 항목 존재:
    iteration += 1
    if iteration > MAX_ITERATIONS:
        → Escalation Gate: 사용자에게 "5회 시도 후에도 미달 항목 N건" 보고
        → 사용자 결정 대기 (계속 / 중단 / 수동 수정)
        break

    1. MISSING/PARTIAL 항목 목록 출력
    2. 각 항목에 대해:
       - 구현 코드 작성 (Build 단계 로직 재사용)
       - 해당 기능의 테스트 작성
       - 즉시 커밋
    3. 전체 빌드/테스트 재실행
    4. SPEC Compliance 재검증 (5.2 반복)
    5. 결과 출력: "Iteration {iteration}: PASS {n}, PARTIAL {m}, MISSING {k}"

if 모든 항목 PASS:
    → "SPEC 정합성 100% 달성" 출력
    → gate-status verify.completed = true (이미 안 되어있으면)
```

#### 5.5 검증 보고서

각 iteration 후 보고:

```
## SPEC Compliance Report — Iteration {N}/{MAX}

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 1 | 노트 CRUD | PASS | src/services/note.ts:15 + tests/note.test.ts |
| 2 | 카테고리 트리 | PARTIAL | src/components/Sidebar.tsx 있지만 중첩 미구현 |
| 3 | FTS 검색 | MISSING | 검색 관련 파일 없음 |

PASS: X / PARTIAL: Y / MISSING: Z
Next: {Y+Z}건 수정 후 재검증
```

### 6. Ship (SPEC 100% 달성 후)
- agentshield-gate 자동 실행 (CRITICAL 차단)
- spec-drift-check ship 모드 실행
- 전부 통과 시: gate-status ship.completed = true
- 최종 커밋 + 태그 제안

### 7. Post-Ship: CLAUDE.md 리뷰 (자동)
Ship 완료 후 CLAUDE.md를 자동 검토한다:

1. **instinct 확인**: `/ecc:instinct-status` 실행 → confidence ≥ 0.8인 instinct를 CLAUDE.md 또는 `.claude/rules/` 반영 후보로 제안
2. **패턴 체크**: 이번 세션에서 반복된 교정/실수 패턴이 있으면 CLAUDE.md에 추가 제안
3. **모순 검출**: 기존 CLAUDE.md 지시와 이번 세션 행동이 충돌한 부분 보고
4. **rules-distill**: ECC `rules-distill` 스킬로 현재 스킬에서 cross-cutting 원칙 추출 가능성 확인

**제약**: 제안만. 직접 수정 금지 (인간 승인 필수). 변경 제안을 사용자에게 목록으로 출력.

**예시 출력**:
```
## CLAUDE.md 개선 제안 (Post-Ship Review)

1. [instinct] "Rust 에러는 Result<T, E> 반환 강제" (confidence 0.85) → error-handling rule 보강 후보
2. [반복 교정] 사용자가 3회 "커밋 먼저 해" 교정 → commit-policy 강조 필요
3. [모순 없음]
4. [rules-distill] 해당 없음

승인 시 적용할 항목 번호를 알려주세요 (또는 "skip"):
```

## 자동 재시도 (Revision Gate 패턴)

각 단계에서 실패 시:
1. 원인 분석 + 즉시 수정 시도
2. 최대 **3회** 재시도 (단계별)
3. SPEC Compliance Loop는 **최대 5회** (전체 루프)
4. 초과 시 **사용자에게 escalation** (Escalation Gate)
5. 사용자 응답 대기

## 중단 조건 (Abort Gate)

- SPEC.md 300줄 초과 → spec-scaling 제안 + 중단
- 동일 이슈 3회 연속 미해결 → escalation
- SPEC Compliance 5회 반복 후 MISSING 잔존 → escalation
- 사용자 Ctrl+C → 현재 상태 보존

## Arguments

```
/uzys:auto                  # Plan부터 시작 (기본)
/uzys:auto from=build       # Build부터 (Plan 이미 완료 시)
/uzys:auto from=test        # Test부터
/uzys:auto from=review      # Review부터
/uzys:auto from=ship        # Ship부터 (SPEC compliance 포함)
/uzys:auto from=verify      # SPEC compliance check만 실행
```

## Ralph Loop 동작 요약

```
/uzys:spec (사용자)
    ↓
/uzys:auto (자동 시작)
    ↓
  Plan → Build → Test → Review
    ↓
  SPEC Compliance Check ← Ralph Loop 진입
    ↓         ↑
  MISSING?  → Build로 돌아가 수정 → Test → 재검증
    ↓ (PASS)
  Ship
```

**핵심**: Ship은 SPEC.md의 **모든 Feature가 PASS일 때만** 진입 가능. 한 건이라도 MISSING이면 Build로 돌아가 구현. 이 루프가 "될 때까지 계속 돈다".

## 참조

- gate-check.sh는 `/uzys:auto`를 게이트 체크 대상에서 **제외**. auto 커맨드가 내부에서 gate-status를 직접 관리.
- 각 단계의 상세 동작은 개별 `/uzys:plan`, `/uzys:build` 등의 커맨드 정의를 따른다.
- gates-taxonomy.md의 4유형 게이트 (Pre-flight/Revision/Escalation/Abort) 적용.
- verification-loop 스킬 (ECC): Build→Type→Lint→Test→Security→Diff 6단계 검증 사이클. SPEC compliance check 내에서 활용.
- P9 Circuit Breakers: 5회 반복 상한. 무한 루프 방지.
