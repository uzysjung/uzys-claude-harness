# PRD: Claude Code Agent Harness System

> **Status**: Draft
> **Owner**: Jay (CEO/CTO/CISO/CSO)
> **Last Updated**: 2026-04-12
> **Stakeholders**: Jay (전 역할)
> **Blueprint**: `claude-code-blueprint.md` 참조

---

## 1. Executive Summary

Jay의 멀티트랙 개발 환경(CSR 3개 + SSR 2개 + 데이터/PySide6 + 비개발)을 위한 Claude Code 에이전트 하네스 시스템을 구축한다. addyosmani/agent-skills의 6단계 게이트(Define→Plan→Build→Verify→Review→Ship)를 워크플로우 뼈대로, ECC에서 검증된 도구를 cherry-pick하고, 기존 11개 행동 원칙 + PRD 라이프사이클을 통합한다.

성공 기준: 실제 CSR 프로젝트에서 전체 워크플로우(Define~Ship)를 1회 완주하고, 검증 에이전트가 구현 에이전트와 분리되어 동작하는 것을 확인.

---

## 2. Problem Statement

### 2.1 Problem Description
현재 Claude Code 환경이 ECC 전체 설치 + 산발적 Rules로 구성되어 있어, 워크플로우 게이트가 느슨하고 필수 단계(Verify, Review, Security)가 누락될 수 있다. 프로젝트별 설정이 수동이고, 경험 축적/디자인 품질 관리/동시 세션 관리가 체계화되지 않았다.

### 2.2 Evidence
- 정량: ECC 156개 스킬 중 실제 사용 ~20개 미만 (토큰 낭비)
- 정성: 이전 세션들에서 반복적으로 "필수 원칙이 누락되는 것이 걱정" 언급

### 2.3 Impact
- 코드 품질: 검증/리뷰 단계 건너뛰기로 인한 버그 유입
- 보안: 배포 전 보안 검증 누락 가능성
- 생산성: 프로젝트 시작마다 수동 설정 반복
- 지식 손실: 세션 간 경험이 축적되지 않아 같은 실수 반복

---

## 3. Target Users

| 사용자 유형 | 핵심 니즈 | 현재 대안 |
|---|---|---|
| Jay (개발자) | 멀티트랙 프로젝트에서 일관된 워크플로우 | 수동 ECC 설정 + 산발적 Rules |
| Jay (CTO/아키텍트) | 기술 결정 추적, ADR 자동화 | 수동 기록 |
| Jay (CISO) | 배포 전 보안 검증 강제 | 수동 `/security-scan` 실행 |

### Key Job Stories
1. When 새 프로젝트를 시작할 때, I want to Track별 최적 설정이 자동 적용되기를, so I can 설정 없이 바로 개발에 집중할 수 있다.
2. When 구현이 완료될 때, I want to 검증 에이전트가 자동으로 리뷰하기를, so I can 내가 만든 것을 내가 평가하는 편향을 피할 수 있다.

---

## 4. Goals & Success Metrics

### 4.1 Goals
1. agent-skills 기반 6단계 게이트 워크플로우 구축
2. ECC cherry-pick + 자체 에이전트/Rules/Hooks 통합
3. 프로젝트 초기화 자동화 (Track 선택 → 전체 설정)

### 4.2 Non-Goals

- [ ] ECC 전체 재설치 또는 ECC 포크
- [ ] GSD 도입 (이번 스코프 아님)
- [ ] gitagent CLI 도입 (사상만 흡수, 도구 미도입)
- [ ] CI/CD 파이프라인 구축 (Railway 배포는 기존 그대로)
- [ ] 새로운 MCP 서버 추가 (Context7 + GitHub MCP 유지)
- [ ] Cursor/Codex/Gemini CLI 지원 (Claude Code 전용)

### 4.3 Success Metrics

| 메트릭 | 현재 값 | 목표 값 | 측정 방법 |
|---|---|---|---|
| 프로젝트 초기화 시간 | ~30분 (수동) | ~5분 (스크립트) | 시간 측정 |
| 워크플로우 게이트 준수율 | 측정 불가 | 6/6 단계 완주 | Self-Audit |
| 검증/구현 분리 | 없음 | 100% 분리 | reviewer subagent 호출 로그 |
| 경험 축적 | 없음 | 세션당 1+ learning | memory/ 파일 변경 추적 |

---

## 5. Solution Outline

### 5.1 Approach

**가벼운 뼈대 + 필요한 도구만**: agent-skills 플러그인을 설치하고, ECC에서 6개 구성 요소만 cherry-pick. 자체 에이전트(reviewer, data-analyst, strategist) + Rules + Hooks로 보완.

### 5.2 Key Features / Capabilities

| 기능 | 우선순위 | 설명 |
|---|---|---|
| agent-skills 플러그인 설치 + CLAUDE.md 게이트 선언 | Must | 6단계 워크플로우 뼈대 |
| 글로벌 CLAUDE.md 업데이트 | Must | 11개 원칙 + 필수 게이트 + Git Policy + 자기 개선 원칙 |
| 프로젝트 CLAUDE.md 템플릿 | Must | Track별 분기, PRD/DESIGN.md 참조 |
| reviewer subagent | Must | 구현/검증 분리 (context: fork, model: opus) |
| data-analyst subagent | Must | Python/DuckDB/Trino/ML/PySide6 범용 |
| strategist subagent | Should | 비즈니스/전략/DD |
| Rules (tauri, pyside6, test-policy, git-policy, design-workflow) | Must | Track별 기계적 제약 |
| ECC cherry-pick 설치 스크립트 | Must | 6개 구성 요소만 선택 설치 |
| SessionStart Hook | Should | git pull + PRD 읽기 |
| 디자인 워크플로우 (Impeccable + DESIGN.md) | Should | `/impeccable teach` → `.impeccable.md` + DESIGN.md 배치 |
| setup-project.sh 초기화 스크립트 | Could | Track 선택 → 전체 설정 자동화 |

### 5.3 User Flow

```
1. 새 프로젝트 디렉토리 생성
2. setup-project.sh 실행 → Track 선택 (CSR/SSR/Data/비개발)
3. 자동: CLAUDE.md 생성, Rules 복사, subagent 복사, agent-skills 설치, ECC cherry-pick
4. /impeccable teach → .impeccable.md 생성 (UI Track)
5. DESIGN.md 배치 (awesome-design-md에서 선택 또는 자체 작성)
6. PRD 작성 시작: "PRD 만들자" → prd-lifecycle 스킬 트리거
7. 개발 시작: Define → Plan → Build → Verify → Review → Ship
```

---

## 6. Technical Boundaries

### 6.1 Constraints
- Claude Code Opus 사용 (토큰 예산 고려)
- CLAUDE.md 200줄 이하 (공식 권장)
- agent-skills는 Claude Code 플러그인으로 설치 (marketplace)
- ECC cherry-pick은 개별 파일 복사 방식 (전체 플러그인 설치 아님)
- 모든 설정 파일은 Git 추적 대상

### 6.2 DO NOT CHANGE

```
DO NOT CHANGE:
- 11개 행동 원칙 (글로벌 CLAUDE.md): 이미 검증·확정됨
- PRD 템플릿 (Section 1-13): 이미 검증·확정됨
- PRD Lifecycle & Change Management: 이미 검증·확정됨
- prd-lifecycle SKILL.md: 이미 검증·확정됨
- MCP 구성 (Context7 + GitHub MCP): 변경 불필요
```

### 6.3 Tech Stack & Architecture Decisions

| 영역 | 결정 사항 | 근거 |
|---|---|---|
| 워크플로우 뼈대 | addyosmani/agent-skills | 간결, 6단계 게이트, Opus와 궁합 (blueprint D2) |
| 도구 레이어 | ECC cherry-pick (6개) | 검증된 도구, 전체 설치 대비 토큰 90%+ 절약 |
| 디자인 | Impeccable + awesome-design-md | 이미 설치됨 + DESIGN.md 표준 |
| 경험 축적 | Claude Code auto memory + ECC continuous-learning-v2 | 마크다운 기반, 이관 가능 (blueprint D3) |
| 검증 분리 | reviewer subagent (context: fork) | Harness Design 원칙, SOD (blueprint D1) |

### 6.4 Assumptions

| 가정 | 틀렸을 때 영향 | 검증 방법 |
|---|---|---|
| agent-skills 플러그인이 ECC와 충돌하지 않음 | 스킬 중복 로드, 토큰 낭비 | Phase 1에서 실제 설치 후 `/skills` 목록 확인 |
| ECC 개별 파일 cherry-pick이 가능함 | 전체 플러그인 설치 필요할 수 있음 | Phase 1에서 파일 복사 후 동작 확인 |
| reviewer subagent가 context: fork로 독립 실행됨 | 메인 컨텍스트와 공유되어 SOD 무효화 | Phase 1에서 실제 호출 후 컨텍스트 격리 확인 |
| auto memory가 프로젝트별로 분리됨 | 크로스 프로젝트 오염 | Claude Code 문서에서 확인 완료 (Git repo 단위 분리) |

### 6.5 Dependencies
- addyosmani/agent-skills GitHub 리포 접근 가능
- ECC GitHub 리포 접근 가능 (개별 파일 참조)
- Claude Code v2.1.59+ (auto memory 지원)
- Node.js 22+ (agent-skills 플러그인 요구사항)

### 6.6 Risks & Mitigations

| 리스크 | 발생 확률 | 영향도 | 완화 방안 |
|---|---|---|---|
| agent-skills + ECC 스킬 이름 충돌 | 중 | 중 | 설치 후 `/skills` 목록 검사. 충돌 시 ECC 쪽 rename |
| ECC cherry-pick 파일이 ECC 업데이트 시 깨짐 | 중 | 낮 | 버전 고정 + 주기적 동기화 체크 |
| 6단계 게이트가 작은 프로젝트에서 과잉 | 낮 | 중 | hotfix 단축 경로 (Build→Verify→Ship) 허용 |
| Opus 토큰 예산 초과 | 중 | 높 | CLAUDE.md 200줄 제한 준수, 스킬은 progressive disclosure |

---

## 7. Implementation Phases

### 7.1 Appetite
3일. 이 이상 걸리면 과잉 설계.

### 7.2 Phases

**Phase 1: 뼈대 설치 + 글로벌 설정**
- Scope:
  1. agent-skills 플러그인 설치 및 동작 확인
  2. ECC cherry-pick 대상 6개 파일 식별 + 복사
  3. 충돌 검사 (agent-skills vs ECC 스킬 이름)
  4. 글로벌 CLAUDE.md 업데이트 (11개 원칙 + 필수 게이트 + Git Policy + 자기 개선)
- Depends on: 없음
- Deliverable: 글로벌 설정 완료, agent-skills + ECC cherry-pick 동작 확인
- Done Criteria:
  - `claude` 실행 시 `/spec`, `/plan`, `/build`, `/test`, `/review`, `/ship` 명령 확인
  - ECC cherry-pick 스킬/에이전트가 로드되는 것 확인
  - 글로벌 CLAUDE.md가 200줄 이하

**Phase 2: 프로젝트 템플릿 + Subagents + Rules**
- Scope:
  1. 프로젝트 CLAUDE.md 템플릿 작성 (Track별 분기)
  2. reviewer.md subagent 작성 (context: fork, model: opus)
  3. data-analyst.md subagent 작성
  4. strategist.md subagent 작성
  5. Rules 작성: tauri.md, pyside6.md, test-policy.md, git-policy.md, design-workflow.md
  6. 디자인 워크플로우 통합: DESIGN.md 배치 가이드
- Depends on: Phase 1 (agent-skills + ECC cherry-pick 동작 확인 필요)
- Deliverable: 프로젝트 템플릿 디렉토리 완성
- Done Criteria:
  - 프로젝트 CLAUDE.md 템플릿이 Track별로 올바른 Rules/Skills 참조
  - reviewer subagent가 context: fork로 독립 실행 확인
  - 각 Rule 파일이 해당 Track에서만 활성화

**Phase 3: 자동화 + 통합 검증**
- Scope:
  1. setup-project.sh 초기화 스크립트 작성 (Track 선택 → 전체 설정)
  2. SessionStart Hook 구현 (git pull + PRD 상태 확인)
  3. 실제 CSR 프로젝트에서 전체 워크플로우(Define~Ship) 1회 완주 테스트
  4. 경험 축적 검증 (auto memory + continuous-learning-v2)
- Depends on: Phase 2
- Deliverable: 초기화 스크립트 + 워크플로우 완주 기록
- Done Criteria:
  - setup-project.sh 실행 후 5분 이내 프로젝트 설정 완료
  - Define→Plan→Build→Verify→Review→Ship 6단계 전부 실행 기록
  - `.claude/memory/` 또는 auto memory에 1개 이상 learning 축적

### 7.3 Rollback Criteria
- agent-skills + ECC 충돌이 해결 불가 → ECC 단독으로 롤백
- 토큰 예산 초과 → agent-skills 스킬 중 Build phase 일부 비활성화

---

## 8. Acceptance Criteria

### Feature: agent-skills 워크플로우 게이트
- **Given** agent-skills 플러그인이 설치된 상태에서
- **When** `/spec`을 실행하면
- **Then** spec-driven-development 스킬이 활성화되고 PRD 작성 플로우가 시작된다

### Feature: 구현/검증 분리
- **Given** Build 단계에서 코드를 작성한 후
- **When** Review 단계로 전환하면
- **Then** reviewer subagent가 context: fork로 별도 컨텍스트에서 실행되어 코드를 평가한다

### Feature: ECC cherry-pick 도구
- **Given** Ship 단계에서
- **When** `/security-scan`을 실행하면
- **Then** ECC AgentShield가 실행되어 보안 감사 결과를 출력한다

### Feature: 프로젝트 초기화
- **Given** 빈 프로젝트 디렉토리에서
- **When** `setup-project.sh`을 실행하고 "CSR-1" Track을 선택하면
- **Then** CLAUDE.md, Rules(shadcn, api-contract, tauri, test-policy, git-policy, design-workflow), subagents(reviewer, data-analyst), .impeccable.md 가이드가 생성된다

### Feature: 경험 축적
- **Given** 세션에서 에이전트가 실수를 교정받은 후
- **When** 세션이 종료되면
- **Then** auto memory에 해당 교정 사항이 기록되고, 다음 세션에서 참조된다

### Verification Checklist
- [ ] 모든 Acceptance Criteria 충족
- [ ] DO NOT CHANGE 영역 미변경 (11개 원칙, PRD 템플릿, prd-lifecycle 스킬)
- [ ] Non-Goals 범위 침범 없음 (GSD, gitagent CLI, CI/CD, 새 MCP)
- [ ] 글로벌 CLAUDE.md 200줄 이하
- [ ] 기존 프로젝트의 동작에 영향 없음

---

## 9. Open Questions & Decisions

| # | 질문 | 상태 | 결정 내용 | 결정 일자 |
|---|---|---|---|---|
| 1 | agent-skills와 ECC 스킬 이름 충돌 여부 | Open | Phase 1에서 확인 | — |
| 2 | ECC 개별 파일 cherry-pick 가능 여부 | Open | Phase 1에서 확인 | — |
| 3 | continuous-learning-v2가 플러그인 없이 독립 동작하는지 | Open | Phase 1에서 확인. 불가 시 ECC 플러그인 최소 설치 검토 | — |

---

## 10. References & Context

### Blueprint
- `claude-code-blueprint.md` — 전체 아키텍처, 의사결정(D1-D9), 레이어 구조, 하네스 원칙

### 기존 산출물 (DO NOT CHANGE)
- `AGENT-GUIDELINES-reference.md` — 11개 원칙 상세 참조
- `PRD-LIFECYCLE.md` — 변경관리 워크플로우
- `PRD-TEMPLATE-standalone.md` — PRD 템플릿 (Section 1-13)
- `SKILL.md` — prd-lifecycle 스킬
- `global/CLAUDE.md` — 글로벌 행동 철학 (현행, 업데이트 대상)

### 외부 소스
- addyosmani/agent-skills: github.com/addyosmani/agent-skills — 워크플로우 뼈대
- ECC: github.com/affaan-m/everything-claude-code — 도구 cherry-pick 소스
- Impeccable: impeccable.style — 디자인 품질 관리
- awesome-design-md: github.com/VoltAgent/awesome-design-md — DESIGN.md 레퍼런스
- Meta HyperAgents: arxiv.org/abs/2603.19461 — 자기 개선 원칙
- Claude Code Docs: code.claude.com/docs — 공식 스킬/에이전트/훅/메모리 문서

### 설치 명령 참조

```bash
# agent-skills 플러그인 설치
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills

# Impeccable 설치 (이미 설치된 경우 skip)
npx skills add pbakaus/impeccable

# ECC cherry-pick (개별 파일 복사 — Phase 1에서 정확한 경로 확인 필요)
# continuous-learning-v2: skills/continuous-learning-v2/
# security-scan: AgentShield npx ecc-agentshield scan
# code-reviewer: agents/code-reviewer.md
# security-reviewer: agents/security-reviewer.md
# git-workflow: rules/common/git-workflow.md
# testing: rules/common/testing.md
```

---

## 11. Status Tracker

| 항목 | 내용 |
|------|------|
| **Status** | Draft |
| **Current Phase** | — |
| **Last Updated** | 2026-04-12 |
| **Next Milestone** | Phase 1: 뼈대 설치 + 글로벌 설정 |
| **Blockers** | None |

---

## 12. Change Log & Decision Log

### 12.1 Change Log

| CR# | 날짜 | 유형 | 섹션 | 변경 내용 | 승인자 |
|-----|------|------|------|-----------|--------|
| — | 2026-04-12 | | | 초기 버전 | Jay |

### 12.2 Decision Log

| D# | 날짜 | 결정 사항 | 근거 | 기각된 대안 | 영향 범위 |
|----|------|-----------|------|------------|-----------|
| D1 | 2026-04-12 | 리뷰: B + 구현/검증 분리 | Harness Design SOD | A(역할별 전문) — 과잉 | agents/ |
| D2 | 2026-04-12 | agent-skills 뼈대 + ECC 도구 레이어 | 간결, Opus 궁합, 유지보수 | ECC 전체 — 토큰 낭비 | 전체 아키텍처 |
| D3 | 2026-04-12 | auto memory + ECC CL-v2 | 마크다운, 이관 가능 | cipher — 별도 의존성 | memory/ |
| D4 | 2026-04-12 | Git branch + Session Start pull | 실용적, 충돌 방지 | Lock file — 수동 | hooks/ |
| D5 | 2026-04-12 | 범용 data-analyst | 빈도 대비 분리 불필요 | ML 분리 — 과잉 | agents/ |
| D6 | 2026-04-12 | gitagent 사상 흡수, 도구 미도입 | 초기 단계 | 즉시 도입 — 미성숙 | 원칙 반영 |
| D7 | 2026-04-12 | Git What/How 분리 | ECC 충돌 방지 | 자체 구현 — 중복 | CLAUDE.md + rules |
| D8 | 2026-04-12 | Track별 테스트 차등 | UI/API/로직 특성 다름 | 80% 일괄 — 비현실 | rules/test-policy |
| D9 | 2026-04-12 | Ship 단계 마지막 security scan | 개발 흐름 비방해 | 모든 단계 — 과잉 | hooks/ + skills |

---

## 13. Retrospective (Complete 시 작성)

### 13.1 결과 vs. 목표

| 메트릭 | 목표 값 | 실제 값 | 차이 분석 |
|--------|---------|---------|-----------|
| 초기화 시간 | ~5분 | | |
| 게이트 준수율 | 6/6 | | |
| 검증/구현 분리 | 100% | | |
| 세션당 learning | 1+ | | |

### 13.2 Lessons Learned
- **잘된 것**:
- **개선할 것**:
- **다음에 시도할 것**:

### 13.3 변경 통계
- 총 Change Request: 건
- Major: / Minor: / Clarification:
- Phase 추가/삭제:
