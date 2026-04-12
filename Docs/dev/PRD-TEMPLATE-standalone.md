# PRD: [프로젝트명]

> **Status**: Draft | Review | Approved | In Progress | Complete | Abandoned
> **Owner**: [이름]
> **Last Updated**: [날짜]
> **Stakeholders**: [역할: 이름]

---

## 1. Executive Summary

[한 단락. 무엇을, 왜, 성공 기준.]

---

## 2. Problem Statement

### 2.1 Problem Description
[문제를 plain language로 기술.]

### 2.2 Evidence
- **정량 근거**: [데이터, 메트릭, 수치]
- **정성 근거**: [사용자 인터뷰, 피드백, 지원 티켓 등]

### 2.3 Impact (풀지 않았을 때의 비용)
[현재 상태가 지속될 경우 발생하는 비즈니스/사용자 영향]

---

## 3. Target Users

| 사용자 유형 | 핵심 니즈 | 현재 대안(workaround) |
|---|---|---|
| | | |

### Key Job Stories
1. When ______, I want to ______, so I can ______.
2. When ______, I want to ______, so I can ______.

---

## 4. Goals & Success Metrics

### 4.1 Goals
[측정 가능한 목표.]

### 4.2 Non-Goals (명시적 범위 제외)

> ⚠️ AI agent는 "생략 = 범위 내"로 해석할 수 있다. 하지 않을 것을 반드시 명시한다.

- [ ] [이번에 의도적으로 하지 않는 것 1]
- [ ] [이번에 의도적으로 하지 않는 것 2]

### 4.3 Success Metrics

| 메트릭 | 현재 값 | 목표 값 | 측정 방법 |
|---|---|---|---|
| | | | |

---

## 5. Solution Outline

### 5.1 Approach
[솔루션의 핵심 아이디어. 경계(perimeter)만 그린다. 구현 디테일이 아닌 전략적 방향.]

### 5.2 Key Features / Capabilities

| 기능 | 우선순위 (Must/Should/Could) | 설명 |
|---|---|---|
| | | |

### 5.3 User Flow (핵심 시나리오)
[사용자가 이 기능을 경험하는 주요 흐름.]

---

## 6. Technical Boundaries

### 6.1 Constraints (변경 불가능한 제약)
[기술 스택, 예산, 일정, 규제, 기존 시스템 호환 등]

### 6.2 DO NOT CHANGE (보호 영역)

> ⚠️ 이 영역은 어떤 Phase에서도 수정 금지. 수정이 불가피한 경우 Major Change Request 필수.

```
DO NOT CHANGE:
- [보호 대상 1: 이유]
- [보호 대상 2: 이유]
- [보호 대상 3: 이유]
```

### 6.3 Tech Stack & Architecture Decisions

| 영역 | 결정 사항 | 근거 |
|---|---|---|
| | | |

### 6.4 Assumptions

| 가정 | 틀렸을 때 영향 | 검증 방법 |
|---|---|---|
| | | |

### 6.5 Dependencies
[외부 팀, 서비스, API, 승인 등]

### 6.6 Risks & Mitigations

| 리스크 | 발생 확률 | 영향도 | 완화 방안 |
|---|---|---|---|
| | | | |

---

## 7. Implementation Phases

### 7.1 Appetite
[이 문제에 투자할 시간/리소스의 상한. 추정치가 아닌 제약 조건.]

### 7.2 Phases

**Phase 1: [이름]**
- Scope: [이 Phase에서 구현하는 것]
- Depends on: [없음 / Phase N]
- Deliverable: [검증 가능한 산출물]
- Done Criteria: [완료 판단 기준]

**Phase 2: [이름]**
- Scope: [이 Phase에서 구현하는 것]
- Depends on: Phase 1
- Deliverable: [검증 가능한 산출물]
- Done Criteria: [완료 판단 기준]

**Phase 3: [이름]**
- Scope: [이 Phase에서 구현하는 것]
- Depends on: Phase 2
- Deliverable: [검증 가능한 산출물]
- Done Criteria: [완료 판단 기준]

### 7.3 Rollback Criteria
[어떤 상황에서 롤백하는가? 임계값은?]

---

## 8. Acceptance Criteria

### Feature: [기능명]
- **Given** [전제 조건]
- **When** [행동]
- **Then** [기대 결과]

### Verification Checklist
- [ ] 모든 Acceptance Criteria 충족 확인
- [ ] DO NOT CHANGE 영역 미변경 확인
- [ ] Non-Goals 범위 침범 없음 확인
- [ ] 기존 테스트 통과 확인 (해당 시)
- [ ] 새 기능에 대한 테스트 작성 확인 (해당 시)

---

## 9. Open Questions & Decisions

| # | 질문 | 상태 | 결정 내용 | 결정 일자 |
|---|---|---|---|---|
| 1 | | Open / Resolved | | |

---

## 10. References & Context

- [관련 문서, 경쟁사 분석, 기술 스펙, 디자인 파일 링크]
- [이전 시도/실패 이력이 있다면 반드시 기술]

---

## 11. Status Tracker

| 항목 | 내용 |
|------|------|
| **Status** | Draft |
| **Current Phase** | — |
| **Last Updated** | [날짜] |
| **Next Milestone** | [다음 단계] |
| **Blockers** | None |

---

## 12. Change Log & Decision Log

### 12.1 Change Log

> 변경 유형: **Clarification** (에이전트 즉시 반영) / **Minor** (인간 승인 후 반영) / **Major** (인간 결정 필수)

| CR# | 날짜 | 유형 | 섹션 | 변경 내용 | 승인자 |
|-----|------|------|------|-----------|--------|
| — | | | | 초기 버전 | [Owner] |

### 12.2 Decision Log

> 구현 중 PRD에 명시되지 않았던 의사결정. 다음 세션/Phase에서 반드시 참조.

| D# | 날짜 | 결정 사항 | 근거 | 기각된 대안 | 영향 범위 |
|----|------|-----------|------|------------|-----------|
| | | | | | |

---

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
- 총 Change Request: 건
- Major: / Minor: / Clarification:
- Phase 추가/삭제:
