# PRD Lifecycle & Change Management

PRD를 정적 문서가 아닌 **살아있는 프로젝트 기준점**으로 운영하기 위한 워크플로우.
인간-AI 협업 환경에서 PRD의 생성·실행·변경관리 전 과정을 정의한다.

> **전제**: 이 워크플로우는 AGENT-GUIDELINES.md의 원칙 6(Persistent Anchor), 원칙 8(Sprint Contract), 원칙 11(Perimeter not Blueprint, Self-Audit)을 실행 레벨로 구체화한 것이다.

---

## 1. PRD 라이프사이클

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────────┐    ┌──────────┐
│  Draft   │───▶│  Review  │───▶│ Approved │───▶│ In Progress │───▶│ Complete │
└─────────┘    └──────────┘    └──────────┘    └─────────────┘    └──────────┘
     │              │                                  │                │
     │              ▼                                  ▼                ▼
     │         Rejected →                      Change Request →   Retrospective →
     │         Draft로 복귀                     Change Log 기록     Lessons Learned
     │                                         (섹션 12)           (섹션 13)
     └──────────────────────────────────────────────────────────────────┘
                            어느 단계에서든 Abandoned 가능
```

### 상태 정의

| 상태 | 의미 | PRD 수정 가능 여부 | 에이전트 행동 |
|------|------|-------------------|--------------|
| **Draft** | 작성 중. 모든 섹션 수정 가능 | 자유 | 에이전트가 PRD 작성을 보조할 수 있음 (초안 생성, 구조 제안) |
| **Review** | 이해관계자 검토 중 | 리뷰어 피드백 반영만 | 에이전트는 리뷰 관점에서 일관성·완성도 점검 가능 |
| **Approved** | 합의 완료. 구현 시작 가능 | Change Request 필요 | 에이전트는 PRD를 **읽기 전용 기준점**으로 취급 |
| **In Progress** | 구현 진행 중 | Change Request → Change Log | 에이전트는 매 Phase/세션 시작 시 PRD를 재참조 |
| **Complete** | 모든 Phase 완료 + 검증 통과 | 동결 | Retrospective 작성 |
| **Abandoned** | 중단 | 동결 | 중단 사유 기록 |

---

## 2. 단계별 워크플로우

### 2.1 Draft 단계

**목적**: 문제 정의 → 솔루션 방향 → 기술 경계 → 구현 계획 수립

**인간의 역할**:
- Section 2 (Problem Statement)는 인간이 작성한다. AI가 문제를 "만들어내면" 안 된다.
- 핵심 의사결정 (기술 스택, 우선순위, Non-Goals)은 인간이 판단한다.

**에이전트 보조 가능 범위**:
- 경쟁 분석, 시장 데이터 수집 (Section 2.2 Evidence)
- 기술 제약 조사 (Section 6)
- Phase 분해 초안 (Section 7) — 인간이 검토·확정
- Acceptance Criteria 초안 (Section 8) — Given-When-Then 형식으로 구체화

**Draft → Review 전환 조건**:
- [ ] Section 1-4 (Problem 영역) 완성
- [ ] Section 5 (Solution) 방향 결정
- [ ] Section 6.2 (DO NOT CHANGE) 식별 완료
- [ ] Section 7 (Phases) 최소 1개 Phase 정의
- [ ] Section 8 (Acceptance Criteria) 핵심 기능 커버

### 2.2 Review 단계

**목적**: 이해관계자 합의

**리뷰 체크리스트**:
- [ ] Problem Statement에 동의하는가?
- [ ] Non-Goals가 충분히 명시되었는가?
- [ ] DO NOT CHANGE 영역이 정확한가?
- [ ] Phase 순서와 의존성이 합리적인가?
- [ ] Acceptance Criteria가 검증 가능한가?
- [ ] Appetite (투자 상한)에 동의하는가?

**에이전트 보조**: 리뷰어 관점에서 내부 일관성 점검 가능.
- "Section 5의 기능 A가 Section 4.2 Non-Goals와 충돌합니다."
- "Section 7 Phase 2가 Phase 1의 산출물에 의존하지만, Phase 1 Done Criteria에 해당 산출물이 없습니다."

### 2.3 Approved → In Progress 전환

**전환 시 수행**:
1. PRD 상태를 `In Progress`로 변경
2. Change Log (Section 12) 초기화
3. Decision Log (Section 12.2) 초기화
4. 첫 Phase의 Sprint Contract 작성 (AGENT-GUIDELINES 원칙 8 참조)

### 2.4 In Progress 단계

이 단계가 가장 복잡하다. 아래 Section 3 (변경관리)에서 상세히 다룬다.

### 2.5 Complete 단계

**전환 조건**:
- [ ] 모든 Phase의 Done Criteria 충족
- [ ] 전체 Acceptance Criteria 통과 (Section 8)
- [ ] Self-Audit 통과 (AGENT-GUIDELINES 원칙 11)
- [ ] 인간의 최종 승인

**완료 시 수행**:
1. PRD 상태를 `Complete`로 변경
2. Retrospective (Section 13) 작성
3. 변경 로그 최종 확정

---

## 3. 변경관리 (Change Management)

### 3.1 변경이 필요한 상황

구현 중 PRD 변경이 필요한 경우는 3가지로 분류한다:

| 유형 | 예시 | 처리 방식 |
|------|------|-----------|
| **Clarification** (명확화) | "Section 5의 '빠르게'가 100ms 이하를 의미하는 것으로 확인" | 에이전트가 즉시 반영 + Change Log 기록 |
| **Minor Change** (경미한 변경) | Acceptance Criteria 세부 조건 조정, Phase 내부 작업 순서 변경 | 에이전트가 제안 → 인간 승인 → Change Log 기록 |
| **Major Change** (중대한 변경) | Phase 추가/삭제, Non-Goals 변경, DO NOT CHANGE 영역 수정, 기술 스택 변경 | **반드시 인간 결정** → Change Log + 영향 분석 기록 |

### 3.2 변경 판단 기준

에이전트가 변경 유형을 판단하는 규칙:

```
IF 변경이 기존 Acceptance Criteria의 Pass/Fail에 영향 → Major
IF 변경이 다른 Phase의 입력/산출물에 영향 → Major  
IF 변경이 DO NOT CHANGE 영역에 영향 → Major
IF 변경이 Non-Goals 경계에 영향 → Major
IF 변경이 현재 Phase 내부에 국한 → Minor
IF 변경이 이미 합의된 내용의 구체화 → Clarification
```

### 3.3 에이전트의 변경 요청 형식

에이전트가 PRD 변경을 제안할 때 사용하는 형식:

```
## Change Request: [CR-번호]

- Type: Clarification | Minor | Major
- Section: [영향받는 PRD 섹션]
- Current: [현재 내용]
- Proposed: [제안 내용]
- Reason: [변경이 필요한 이유]
- Impact: [다른 섹션/Phase에 미치는 영향]
- Status: Proposed | Approved | Rejected
```

### 3.4 PRD 내 변경 기록 위치

PRD에 Section 12, 13을 추가한다 (기존 템플릿의 Section 10 이후):

---

## 4. PRD 템플릿 추가 섹션

기존 PRD 템플릿(Section 1-10)에 아래를 추가한다:

### Section 11: Status Tracker

```markdown
## 11. Status Tracker

| 항목 | 내용 |
|------|------|
| **Status** | Draft / Review / Approved / In Progress / Complete / Abandoned |
| **Current Phase** | Phase [N] of [Total] |
| **Last Updated** | [날짜] |
| **Next Milestone** | [다음 Phase 또는 리뷰 일정] |
| **Blockers** | [있으면 기술, 없으면 "None"] |
```

### Section 12: Change Log & Decision Log

```markdown
## 12. Change Log & Decision Log

### 12.1 Change Log

| CR# | 날짜 | 유형 | 섹션 | 변경 내용 | 승인자 |
|-----|------|------|------|-----------|--------|
| CR-001 | | Clarification | | | Auto |
| CR-002 | | Minor | | | [이름] |

### 12.2 Decision Log

구현 중 PRD에 명시되지 않았던 의사결정을 기록한다.
이 결정들은 다음 세션/Phase에서 참조되어야 한다.

| D# | 날짜 | 결정 사항 | 근거 | 대안(검토 후 기각) | 영향 범위 |
|----|------|-----------|------|-------------------|-----------|
| D-001 | | | | | |
```

### Section 13: Retrospective

```markdown
## 13. Retrospective (Complete 시 작성)

### 13.1 결과 vs. 목표
| 메트릭 | 목표 값 | 실제 값 | 차이 분석 |
|--------|---------|---------|-----------|
| | | | |

### 13.2 Lessons Learned
- **잘된 것**: 
- **개선할 것**: 
- **다음에 시도할 것**: 

### 13.3 변경 통계
- 총 Change Request: [N]건
- Major: [N] / Minor: [N] / Clarification: [N]
- Phase 추가/삭제: [있었으면 기술]
```

---

## 5. 에이전트 세션 프로토콜

### 5.1 세션 시작 시 (Every Session Start)

에이전트는 작업 시작 전 다음을 수행한다:

```
1. PRD.md 읽기 → Status, Current Phase, Blockers 확인
2. Change Log 최신 항목 확인 → 이전 세션의 변경 반영 여부
3. Decision Log 확인 → 현재 Phase에 영향을 주는 결정 확인
4. 현재 Phase의 Sprint Contract 확인 → 완료 기준 재인식
5. DO NOT CHANGE 영역 재확인
```

이 프로토콜은 AGENT-GUIDELINES 원칙 6의 **Persistent Anchor**를 구현한 것이다.

### 5.2 Phase 전환 시

```
1. Self-Audit 실행 (AGENT-GUIDELINES 원칙 11)
2. Phase Done Criteria 충족 여부 보고
3. 인간 검증 대기 (에이전트가 임의로 다음 Phase 시작 금지)
4. 인간 승인 후:
   a. PRD Status Tracker 업데이트 (Current Phase 변경)
   b. 다음 Phase의 Sprint Contract 작성/확인
   c. 이전 Phase에서 발생한 Decision 중 다음 Phase에 영향 주는 것 명시
```

### 5.3 예기치 않은 상황 발생 시

```
IF 구현 중 PRD와 현실의 불일치 발견:
  → 멈춘다
  → Change Request 작성 (유형 판단)
  → Clarification이면 기록 후 진행
  → Minor/Major면 인간에게 보고 후 대기

IF Phase 간 의존성 이슈 발견:
  → 현재 Phase 작업 중단
  → 의존성 이슈와 해결 옵션 보고
  → 인간 결정 후 진행

IF DO NOT CHANGE 영역 수정이 불가피:
  → 절대 수정하지 않는다
  → Major Change Request 작성
  → 인간 결정 대기
```

---

## 6. 파일 구조 (프로젝트 내 배치)

```
project-root/
├── docs/
│   ├── PRD.md                    # 살아있는 PRD (Status, Change Log 포함)
│   ├── PRD-TEMPLATE.md           # 빈 템플릿 (새 프로젝트용)
│   └── sprint-contracts/
│       ├── phase-1-contract.md   # Phase별 Sprint Contract
│       ├── phase-2-contract.md
│       └── ...
├── CLAUDE.md                     # 에이전트 행동 규칙 (→ PRD.md 참조 지시 포함)
└── AGENT-GUIDELINES.md           # 범용 행동 원칙
```

### CLAUDE.md에 추가할 PRD 참조 지시

```markdown
## Project Context

- **PRD**: `docs/PRD.md` — 프로젝트의 source of truth. 매 세션 시작 시 반드시 읽는다.
- **Current Phase**: PRD Section 11 참조.
- **Sprint Contract**: `docs/sprint-contracts/phase-{N}-contract.md` 참조.
- PRD의 Section 6.2 (DO NOT CHANGE) 영역은 절대 수정하지 않는다.
- PRD에 명시되지 않은 기능은 범위 밖으로 간주한다 (AGENT-GUIDELINES 원칙 2).
- 구현 중 PRD와 불일치 발생 시 Change Request를 작성한다 (PRD Lifecycle Section 3 참조).
```

---

## 7. 워크플로우 요약 다이어그램

```
인간                              에이전트
─────                             ──────
Problem 정의 (S2)          ◀────  데이터 수집 보조
Solution 방향 결정 (S5)    ◀────  기술 제약 조사
DO NOT CHANGE 식별 (S6.2)  ◀────  기존 시스템 분석 보조
Phase 분해 검토 (S7)       ◀────  Phase 초안 생성
                                  
  ┌── Review ──┐                  
  │ 합의       │           ◀────  일관성 점검 보조
  └── Approve ─┘                  
                                  
  Phase 1 시작 승인         ────▶  Sprint Contract 작성
                                  Phase 1 구현
                                  Self-Audit 실행
                            ◀────  완료 보고 + Change Log
  Phase 1 검증              
  Phase 2 시작 승인         ────▶  Sprint Contract 작성
                                  Phase 2 구현
                                  ...반복...
                                  
  최종 승인                 ◀────  전체 Self-Audit
                                  Retrospective 초안
  Retrospective 확정               PRD Status → Complete
```

---

## 부록: PRD 복잡도별 적용 가이드

| 복잡도 | 예시 | 적용 범위 |
|--------|------|-----------|
| **경량** (반나절~1일) | 단일 API 엔드포인트, 슬라이드 10장 | Section 1, 2.1, 4.2, 5.2, 6.2, 8만. Change Log 생략 가능. Sprint Contract 불필요. |
| **중간** (1~2주) | 기능 모듈, 제안서 30p, 경쟁 분석 | 전체 섹션 사용. Phase 2-3개. Change Log 운영. |
| **대형** (1개월+) | 신규 서비스, 대규모 리팩터링 | 전체 섹션 + 별도 Tech Spec + AGENTS.md + Sprint Contracts 분리. Decision Log 필수. |
