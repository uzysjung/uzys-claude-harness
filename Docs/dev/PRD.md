# PRD: Claude Code Agent Harness

> **Status**: In Progress
> **Owner**: Jay (Uzys)
> **Last Updated**: 2026-04-12
> **Stakeholders**: Jay (CEO/CTO/CISO/CPO/CSO/Data Scientist)

---

## 1. Executive Summary

Claude Code Agent Harness는 Jay의 멀티 역할(CEO/CTO/CISO/CPO/CSO/데이터 사이언티스트)과 멀티 트랙(9개) 기술 스택을 위한 통합 Claude Code 개발 환경이다. agent-skills의 6단계 게이트 워크플로우(Define-Plan-Build-Verify-Review-Ship)를 뼈대로, ECC(Everything Claude Code)에서 cherry-pick한 도구를 레이어로, 11개 행동 원칙(CLAUDE.md)을 기반으로 동작한다.

성공 기준: 프로젝트 유형에 관계없이 `setup-harness.sh` 한 번 실행으로 Track별 환경이 자동 구성되고, 6단계 워크플로우가 Hook으로 강제되며, 경험이 자동 축적되는 시스템.

---

## 2. Problem Statement

### 2.1 Problem Description

기존 Claude Code 환경에서 다음 문제가 반복 발생했다:

1. **토큰 낭비**: ECC 156개 스킬 중 실제 사용은 약 20개. 전체 설치 시 컨텍스트 윈도우를 불필요하게 소비.
2. **단계 건너뛰기**: 워크플로우 게이트 없이 Build에서 바로 Ship으로 진행 가능. 테스트/리뷰 누락.
3. **수동 설정 반복**: 프로젝트마다 동일한 Rules, Agents, Skills를 수동으로 구성. Track(CSR/SSR/Data/Executive)별 차이가 관리되지 않음.
4. **체계 부재**: 경험 축적, 디자인 품질 검증, 보안 스캔이 개인 습관에 의존. 프로세스로 강제되지 않음.

### 2.2 Evidence

- **정량 근거**: ECC 156개 중 cherry-pick 대상 14개 (D22 추가 후). 나머지 142개는 미사용.
- **정성 근거**: 프로젝트 초기 설정에 매번 30분 이상 소요. Track별 스택 차이(Supabase vs Railway, React vs HTMX)를 매번 수동 판단.

### 2.3 Impact (풀지 않았을 때의 비용)

- 세션당 불필요한 토큰 소비로 비용 증가
- 테스트/리뷰 누락으로 프로덕션 결함 발생 가능성 상승
- 프로젝트 간 학습 전이 불가 -- 같은 실수 반복
- 보안 취약점이 배포 직전까지 발견되지 않음

---

## 3. Target Users

| 사용자 유형 | 핵심 니즈 | 현재 대안(workaround) |
|---|---|---|
| Jay (개발자 역할) | 9개 Track별 자동 초기화, 일관된 워크플로우 | 프로젝트마다 수동 설정, 기억에 의존 |
| Jay (CTO/CPO/CSO 역할) | PPT/Excel/Word/PDF 산출물 빠른 생성 | Anthropic document-skills 직접 호출 |
| Jay (데이터 사이언티스트 역할) | Python/DuckDB/ML 파이프라인 + PySide6 GUI | 별도 환경 없이 범용 Claude Code 사용 |

### Key Job Stories

1. When 새 프로젝트를 시작할 때, I want to Track 하나만 선택하면 필요한 모든 Rules/Skills/Agents가 자동 설치되기를, so I can 설정 시간 없이 바로 개발에 집중할 수 있다.
2. When Build 단계에서 바로 Ship하려 할 때, I want to Hook이 Verify/Review 단계를 강제하기를, so I can 테스트/리뷰 누락 없이 안전하게 배포할 수 있다.
3. When 프로젝트가 끝난 후, I want to 축적된 경험(instinct)을 다음 프로젝트로 이관할 수 있기를, so I can 같은 실수를 반복하지 않고 점진적으로 개선할 수 있다.

---

## 4. Goals & Success Metrics

### 4.1 Goals

1. **6단계 게이트 워크플로우 + Hook 기반 강제**: Define-Plan-Build-Verify-Review-Ship 순서를 Hook(gate-check.sh)으로 프로그래밍적으로 차단. 단계 건너뛰기 시 exit code 2 반환.
2. **9개 Track별 자동 초기화**: `setup-harness.sh --track <name>` 한 번으로 해당 Track에 필요한 Rules, Skills, Agents, Hooks, MCP 전체 설치.
3. **구현/검증 분리 (SOD)**: reviewer subagent(context: fork)가 구현 에이전트와 격리된 상태에서 코드/문서/UI를 검증. 만든 사람이 평가하지 않는다.
4. **경험 축적**: auto memory + CL-v2 instinct로 세션 중 자동 학습. high-confidence instinct는 Rule 승격 제안.

### 4.2 Non-Goals (명시적 범위 제외)

- [ ] ECC 전체 설치 또는 포크 -- cherry-pick만 사용
- [ ] gitagent CLI 도입 -- 사상만 흡수, 도구는 미도입
- [ ] CI/CD 파이프라인 구축 -- Railway 배포만. GitHub Actions 등은 별도
- [ ] Cursor/Codex 지원 -- Claude Code 전용

### 4.3 Success Metrics

| 메트릭 | 현재 값 | 목표 값 | 측정 방법 |
|---|---|---|---|
| 프로젝트 초기화 시간 | 약 30분 (수동) | 5분 이내 (자동) | setup-harness.sh 실행 시간 |
| 단계 건너뛰기 발생률 | 통제 불가 | 0% (Hook 차단) | gate-check.sh exit code 로그 |
| ECC 스킬 사용률 | ~13% (20/156) | 100% (8/8 cherry-pick) | 설치된 스킬 대비 활용률 |
| 보안 스캔 누락률 | 수동 의존 | 0% (Ship 게이트) | ship-checklist.md 체크리스트 |

---

## 5. Solution Outline

### 5.1 Approach

3개 레이어로 구성한다:

- **뼈대**: agent-skills 6단계 워크플로우 (`uzys:` 네임스페이스). Define-Plan-Build-Verify-Review-Ship.
- **도구**: ECC cherry-pick 14개 (D21+D22 후. agents:2, skills:9, rules:1, commands:2). 매니페스트는 .dev-references/cherrypicks.lock. 전체 포크가 아닌 필요한 것만 선별.
- **원칙**: 11개 행동 원칙 (CLAUDE.md, 현재 121줄). Karpathy LLM 관찰 + Anthropic Harness Design + HyperAgents 사상 종합.

자동화는 `setup-harness.sh`가 담당하고, 게이트 강제는 Hook 기반(gate-check.sh, exit code 2)으로 구현한다.

### 5.2 Key Features / Capabilities

| 기능 | 우선순위 | 설명 |
|---|---|---|
| 6단계 게이트 워크플로우 | Must | uzys:spec - uzys:plan - uzys:build - uzys:test - uzys:review - uzys:ship |
| Hook 기반 게이트 차단 | Must | gate-check.sh로 이전 단계 미완료 시 차단 (exit code 2) |
| Track별 자동 초기화 (9종) | Must | csr-supabase, csr-fastify, csr-fastapi, ssr-htmx, ssr-nextjs, data, executive, tooling, full |
| ECC cherry-pick | Must | CL-v2, code-reviewer, security-reviewer, security-scan, checkpoint, strategic-compact |
| reviewer subagent (SOD) | Must | context: fork로 구현과 검증 분리 |
| auto memory + CL-v2 instinct | Must | 경험 축적, confidence scoring, Rule 승격 제안 |
| protect-files.sh | Must | .env, lock 파일 등 보호 영역 Write/Edit 차단 |
| uncommitted-check.sh | Should | 커밋되지 않은 변경이 있을 때 경고 |
| spec-scaling 스킬 | Should | SPEC.md 300줄 초과 시 기능별 분리 + 마스터 라우트 |
| strategic-compact 스킬 | Could | 컨텍스트 윈도우 효율적 관리 |

### 5.3 User Flow (핵심 시나리오)

**개발 Track (csr-fastapi 예시)**

```
1. bash setup-harness.sh --track csr-fastapi
   → Rules(18개) + Commands(uzys:6 + ecc:8) + Skills(CL-v2, spec-scaling) + Agents(2개) + Hooks(4개) 자동 설치

2. claude 시작 → SessionStart Hook 실행 (git pull + 스펙 재읽기)

3. /uzys:spec → 스펙 작성 (SPEC.md 생성)
4. /uzys:plan → Sprint Contract + Phase 분해
5. /uzys:build → TDD로 점진 구현 (commit-policy 자동 적용)
6. /uzys:test → 테스트 실행 + 커버리지 확인 (test-policy 자동 참조)
7. /uzys:review → reviewer subagent + code-reviewer + security-reviewer
8. /uzys:ship → security-scan + E2E 확인 + Railway 배포
```

**Executive Track**

```
1. bash setup-harness.sh --track executive
   → document-skills + strategist agent만 설치. agent-skills 미설치.

2. 자연어로 요청: "Q3 실적 보고 PPT 만들어줘"
   → strategist agent + document-skills:pptx 자동 활성화
```

---

## 6. Technical Boundaries

### 6.1 Constraints (변경 불가능한 제약)

- Claude Code CLI 기반 동작 (GUI/IDE 통합 없음)
- Node.js 22+ 필수
- jq 권장 (settings.json 병합용, 없으면 수동 안내)
- 글로벌 CLAUDE.md 200줄 이하 엄수

### 6.2 DO NOT CHANGE (보호 영역)

```
DO NOT CHANGE:
- 11개 행동 원칙 구조 (CLAUDE.md): 확장은 가능하나 기존 원칙의 삭제 또는 의미 변경 금지
- PRD 템플릿 (Section 1-13, PRD-TEMPLATE-standalone.md): 레퍼런스 구조 고정
- MCP 구성 (Context7 + GitHub + Railway + Supabase): 추가는 가능, 기존 제거 금지
```

### 6.3 Tech Stack & Architecture Decisions

| 영역 | 결정 사항 | 근거 |
|---|---|---|
| 워크플로우 뼈대 | agent-skills (Addy Osmani) | 6단계 게이트가 Jay의 개발 철학과 일치 |
| 도구 레이어 | ECC cherry-pick (14개, cherrypicks.lock) | 156개 중 실사용 도구만 선별, 토큰 절약 |
| 디자인 품질 | Impeccable (pbakaus) | /polish, /critique, /audit 직접 호출 |
| 배포 | Railway MCP + Plugin | MCP와 플러그인 동시 설치 (기능 보완) |
| 문서 산출물 | Anthropic document-skills | pptx/docx/xlsx/pdf 공식 지원 |
| 경험 축적 | auto memory + CL-v2 | 세션 중 자동 학습 + instinct confidence scoring |
| SOD 격리 | reviewer subagent (context: fork) | gitagent 사상 흡수, 구현과 검증 분리 |
| Hook 엔진 | Claude Code 내장 Hook (settings.local.json) | SessionStart, PreToolUse, PostToolUse |

### 6.4 Assumptions

| 가정 | 틀렸을 때 영향 | 검증 방법 |
|---|---|---|
| ECC 개별 파일이 플러그인 없이 독립 동작 | CL-v2, code-reviewer 등 사용 불가 | 설치 후 기능 테스트 (Q2) |
| agent-skills와 ECC 스킬 이름 충돌 없음 | 커맨드 실행 시 예상치 못한 스킬 활성화 | 설치 후 네임스페이스 테스트 (Q1) |
| CL-v2 observer가 독립 동작 | instinct 축적 불가 | CL-v2 config.json으로 활성화 테스트 (Q3) |
| Railway 플러그인과 MCP 동시 설치 시 충돌 없음 | 배포 명령 중복 실행 | 동시 설치 후 배포 테스트 (Q5) |

### 6.5 Dependencies

| 의존성 | 유형 | 비고 |
|---|---|---|
| addyosmani/agent-skills | 외부 플러그인 | 워크플로우 뼈대. 업데이트 시 호환성 확인 필요 |
| affaan-m/everything-claude-code | 외부 리포 (cherry-pick) | CL-v2, agents, rules 소스 |
| pbakaus/impeccable | 외부 스킬 | 디자인 품질 도구 17개 |
| anthropics/skills | 외부 플러그인 | document-skills (pptx/docx/xlsx/pdf) |
| Railway MCP/Plugin | 외부 서비스 | 배포 인프라 |
| Supabase MCP | 외부 서비스 | csr-supabase Track 전용 |
| kcchien/claude-code-statusline | 외부 도구 | 상태표시줄 (jq 의존) |

### 6.6 Risks & Mitigations

| 리스크 | 발생 확률 | 영향도 | 완화 방안 |
|---|---|---|---|
| agent-skills 업데이트로 uzys: 래핑 깨짐 | 중 | 높 | 주기적 리포 변경 확인, 버전 고정 검토 |
| ECC cherry-pick 파일이 ECC 업데이트와 비호환 | 중 | 중 | 복사 시점 기록, 업데이트 시 diff 확인 |
| Hook exit code 2가 Claude Code 버전에 따라 동작 변경 | 낮 | 높 | Anthropic 릴리즈 노트 추적 |
| CL-v2 observer 토큰 비용 과다 | 중 | 낮 | config.json으로 빈도 조절 (기본 비활성) |

---

## 7. Implementation Phases

### 7.1 Appetite

개인 프로젝트. 시간 제약 없음. 단, 각 Phase는 독립적으로 검증 가능해야 한다.

### 7.2 Phases

**Phase 1: 기본 구현 [Complete]**

- Scope: 전체 하네스 구조 설계 및 구현
  - CLAUDE.md (11개 행동 원칙)
  - templates/ (agents, commands, rules, hooks, skills, project-claude)
  - setup-harness.sh (8 Track 자동 초기화)
  - README.md + USAGE.md
- Depends on: 없음
- Deliverable: 88개 파일, 동작하는 setup-harness.sh
- Done Criteria:
  - V1: setup-harness.sh로 각 Track 초기화 성공 [검증 완료]
  - V2: executive Track에 agent-skills 미설치 확인 [검증 완료]
  - V8: 글로벌 CLAUDE.md 200줄 이하 (122줄) [검증 완료]
  - V9: ECC cherry-pick 로드 확인 [검증 완료]

**Phase 2: 게이트 강화 + 정제 [Complete]**

- Scope:
  - 게이트 Hook 프로그래밍적 차단 (gate-check.sh, exit code 2)
  - imm: 래핑 제거 (Impeccable 직접 /polish 등 사용)
  - ECC 추가 cherry-pick (checkpoint, strategic-compact)
  - PRD 작성 (본 문서)
  - protect-files.sh Python 의존 제거 (jq/bash 폴백)
  - uncommitted-check.sh 추가
  - 테스트 및 검증
- Depends on: Phase 1
- Deliverable: 게이트 Hook 동작, 정제된 커맨드 구조, PRD
- Done Criteria:
  - V4: reviewer가 context: fork로 격리 실행 [검증 완료 — 부모 컨텍스트 미공유 확인]
  - V10: auto memory + CL-v2 동작 [검증 완료 — observations.jsonl 5+ 이벤트 기록]
  - V14: 단계 건너뛰기 시도 시 게이트 차단 동작 [검증 완료 — exit code 2 차단 확인]
  - V15: /ship 실행 시 E2E 미통과면 배포 차단 [LLM 지시 수준]
  - V17: 코드 변경 후 커밋 없이 다음 작업 진행 시 경고 [uncommitted-check.sh 동작]
  - V18: SPEC.md 300줄 초과 시 분리 제안 [spec-scaling skill 활성]

**Phase 3: Tooling Track + Dogfooding [In Progress]**

- Scope:
  - 신규 tooling Track 추가 (cli-development.md rule + tooling.md project template)
  - --project-only 플래그 추가
  - 이 프로젝트에 자체 적용 (dogfooding)
  - 1차 검증 (gate Hook, reviewer fork, CL-v2 등)
  - PRD 동기화 (D14, D15, V 검증 반영)
- Depends on: Phase 2
- Deliverable: 9 Track 지원 setup-harness.sh, 자기 적용 완료, 동기화된 PRD
- Done Criteria:
  - tooling Track으로 setup-harness.sh 동작
  - 이 프로젝트의 .claude/에 하네스 설치 완료
  - 다음 작업이 /uzys:spec으로 시작 가능

**Phase 4: 실전 적용 + E2E 검증 [Future]**

- Scope:
  - 외부 실제 프로젝트에 하네스 적용
  - 전체 워크플로우 E2E 검증 (Define~Ship)
  - CL-v2 instinct 축적 장기 검증
  - Track 간 전환 테스트
  - 불필요한 scaffold 식별 및 제거
- Depends on: Phase 3
- Deliverable: 검증 완료 보고서, 필요 시 조정된 Rules/Hooks
- Done Criteria:
  - V3: 6단계 워크플로우 전체 동작
  - V13: /build 시 UI 파일이면 frontend-ui-engineering + Impeccable 자동 활성화

### 7.3 Rollback Criteria

- Hook이 정상 동작을 방해하는 경우 (false positive 차단 3회 이상): 해당 Hook 비활성화 후 원인 분석
- setup-harness.sh가 기존 프로젝트 파일을 덮어쓰는 경우: safe_copy 로직 검증 후 백업에서 복원

---

## 8. Acceptance Criteria

### Feature: 6단계 게이트 워크플로우

- **Given** 프로젝트에 하네스가 설치된 상태
- **When** SPEC.md 없이 /uzys:plan을 실행하면
- **Then** gate-check.sh가 exit code 2를 반환하고 실행이 차단된다

### Feature: Track별 자동 초기화

- **Given** setup-harness.sh가 존재하는 상태
- **When** `--track csr-fastapi`로 실행하면
- **Then** CSR 공통 Rules + FastAPI 전용 Rules + ECC cherry-pick + Hooks가 모두 설치된다

### Feature: 구현/검증 분리

- **Given** /uzys:review를 실행한 상태
- **When** reviewer subagent가 활성화되면
- **Then** context: fork로 격리된 환경에서 코드를 검증한다

### Feature: 경험 축적

- **Given** 여러 세션에 걸쳐 개발한 상태
- **When** /ecc:instinct-status를 실행하면
- **Then** 축적된 instinct 목록과 confidence score가 표시된다

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
| Q1 | agent-skills + ECC cherry-pick 스킬 이름 충돌 여부 | Open | — | — |
| Q2 | ECC 개별 파일이 플러그인 없이 동작하는지 | Open | — | — |
| Q3 | CL-v2 독립 동작 여부 | Open | — | — |
| Q4 | GSD + agent-skills 명령 충돌 여부 | Open | — | — |
| Q5 | Railway 플러그인과 MCP 동시 설치 시 중복 여부 | Open | — | — |
| Q6 | Supabase MCP와 postgres-best-practices 스킬 간 역할 중복 | **Resolved** | MCP는 DB 연결/쿼리 실행, 스킬은 설계 가이드(인덱스/RLS/성능). 중복 아님 — 보완재. | 2026-04-15 |

---

## 10. References & Context

| 소스 | URL | 용도 |
|------|-----|------|
| agent-skills | github.com/addyosmani/agent-skills | 워크플로우 뼈대 (6-gate) |
| ECC | github.com/affaan-m/everything-claude-code | cherry-pick 소스 (14개) |
| Anthropic skills | github.com/anthropics/skills | pptx/docx/xlsx/pdf 공식 |
| Railway | docs.railway.com | 배포/로그 |
| Impeccable | github.com/pbakaus/impeccable | 디자인 품질 |
| GSD | github.com/gsd-build/get-shit-done | 선택적 오케스트레이터 |
| Karpathy LLM observations | — | 행동 원칙 1-4 출처 |
| Anthropic Harness Design (2026.03) | — | 행동 원칙 5-6, 8, 10 출처 |
| HyperAgents (arxiv.org/abs/2603.19461) | — | 자기 개선 아키텍처 |
| gitagent | github.com/open-gitagent/gitagent | SOD, SOUL.md, Git-native agents |
| claude-code-statusline | github.com/kcchien/claude-code-statusline | 상태표시줄 |
| Jay의 기존 리포 | uzysjung/std-dev-boilerplate, uzysjung/dyld-vantage | Rules 기반, Track별 참조 |

---

## 11. Status Tracker

| 항목 | 내용 |
|------|------|
| **Status** | In Progress |
| **Current Phase** | Phase 3 (Tooling Track + Dogfooding) |
| **Last Updated** | 2026-04-15 |
| **Next Milestone** | Phase 3 완료 -- 자기 적용, 1차 검증, PRD 동기화 |
| **Blockers** | 없음 (Phase 2 V4/V10/V14 검증 완료) |

---

## 12. Change Log & Decision Log

### 12.1 Change Log

> 변경 유형: **Clarification** (에이전트 즉시 반영) / **Minor** (인간 승인 후 반영) / **Major** (인간 결정 필수)

| CR# | 날짜 | 유형 | 섹션 | 변경 내용 | 승인자 |
|-----|------|------|------|-----------|--------|
| -- | 2026-04-12 | -- | 전체 | 초기 버전. Phase 1 완료 상태에서 현황 반영 | Jay |

### 12.2 Decision Log

> 구현 중 PRD에 명시되지 않았던 의사결정. 다음 세션/Phase에서 반드시 참조.

| D# | 날짜 | 결정 사항 | 근거 | 기각된 대안 | 영향 범위 |
|----|------|-----------|------|------------|-----------|
| D1 | 2026-04 | 옵션 B + 구현/검증 분리 | 구현 에이전트가 자기 코드를 평가하면 관대해짐. SOD 필수 | 옵션 A (단일 에이전트) | reviewer subagent 설계 전체 |
| D2 | 2026-04 | agent-skills 뼈대 + ECC 도구 레이어 | ECC 전체는 토큰 낭비. agent-skills가 Jay 철학과 일치 | ECC 전체 포크, GSD 뼈대 | 전체 아키텍처 |
| D3 | 2026-04 | auto memory + CL-v2로 경험 축적 | 마크다운으로 빼서 가져갈 수 있어야. 나만의 지식기반 구축 | 별도 DB 기반 학습 | 경험 축적 시스템 |
| D4 | 2026-04 | Git branch + SessionStart pull | 동시 세션 충돌 방지. main 직접 커밋 금지 | 단일 브랜치 운영 | git-policy, session-start hook |
| D5 | 2026-04 | 범용 data-analyst subagent | Python/DuckDB/Trino/ML/PySide6 통합 | Track별 전용 에이전트 분리 | data Track 전체 |
| D6 | 2026-04 | gitagent 사상 흡수, 도구 미도입 | 사상(SOD, SOUL.md, Git-native)은 유용하나 CLI 도구는 과잉 | gitagent CLI 전체 도입 | reviewer 설계, agents Git 추적 |
| D7 | 2026-04 | What/How 분리 | Git policy에서 "변경 시 커밋 필수"(What)만 강제. 커밋 방식(How)은 ECC git-workflow에 위임 | What+How 통합 rule | git-policy, ecc-git-workflow |
| D8 | 2026-04 | Track별 테스트 차등 | UI 60%, API 80%, 비즈니스 로직 90%. Track 특성에 맞는 커버리지 | 일률 80% | test-policy.md |
| D9 | 2026-04 | Ship 마지막에 security scan | 배포 직전 보안 취약점 + 오픈소스 라이선스 검사 | 매 커밋마다 scan (비용 과다) | ship-checklist.md |
| D10 | 2026-04 | imm: 래핑 제거 | Impeccable 스킬은 /polish, /critique 등으로 직접 호출 가능. 별도 래핑은 불필요한 추상 레이어 | imm: 네임스페이스 유지 | commands 구조, USAGE.md |
| D11 | 2026-04 | 게이트 Hook으로 프로그래밍적 차단 | CLAUDE.md 선언만으로는 강제 불가. exit code 2로 실제 차단 | 선언적 게이트만 유지 | gate-check.sh, settings.local.json |
| D12 | 2026-04 | ECC checkpoint + strategic-compact 추가 cherry-pick | 컨텍스트 관리와 작업 복구에 필수 | 미포함 (기존 6개 유지) | ECC cherry-pick 범위 확장 (6개 -> 8개) |
| D13 | 2026-04 | protect-files.sh Python 의존 제거 | jq/bash 폴백으로 Python 미설치 환경 지원 | Python 필수 의존 유지 | protect-files.sh |
| D14 | 2026-04-13 | tooling Track 신규 추가 | bash/markdown/CLI 도구 위주 메타 프로젝트는 기존 9개 Track 어디에도 맞지 않음. 자기 자신(이 프로젝트)을 dogfooding하기 위한 Track 필요 | 기존 Track 확장 (csr 등에 cli-development 추가) | setup-harness.sh, cli-development.md, tooling.md, README/USAGE |
| D15 | 2026-04-13 | --project-only 플래그 추가 (D16에서 더 강화) | 글로벌 영향 없이 프로젝트 스코프만 설치 | 기존 --global-only만 유지 | setup-harness.sh |
| D16 | 2026-04-14 | **글로벌 설치 경로 완전 제거 + templates/global/ 폐기** | "글로벌 절대 불변" 원칙을 구조에 강제. 글로벌 코드 1줄도 없는 setup-harness.sh | --project-only/--global-only 플래그 유지 | templates/, setup-harness.sh, 모든 agent를 .claude/agents/로 |
| D17 | 2026-04-14 | **CLAUDE.md에 Decision Making Universal Meta-Rule 추가** | "스킬 좋고 나쁨을 임의 결정"하는 패턴 차단. 명시적 기준 강제 | 11개 원칙만 유지 | templates/CLAUDE.md, .claude/CLAUDE.md |
| D18 | 2026-04-14 | **`.dev-references/cherrypicks.lock` + `sync-cherrypicks.sh` 신규** | ECC/agent-skills/vercel-labs cherry-pick 버전관리. 7개 출처 매니페스트, hash 기반 변경 감지 | 수동 동기화 | .gitignore에서 lock 파일 예외 처리 |
| D19 | 2026-04-14 | **`.claude/settings.json`으로 통합** (settings.local.json 폐기) | `$CLAUDE_PROJECT_DIR` 변수 사용으로 절대 경로 제거. committable 파일로 단일화 | settings.local.json 유지 | templates/settings.json + setup-harness.sh |
| D20 | 2026-04-14 | **`.mcp.json` 프로젝트 스코프** (`claude mcp add` 글로벌 호출 제거) | MCP를 프로젝트별로 관리. 글로벌 ~/.claude/ 미수정 원칙 강화 | 글로벌 mcp add 유지 | templates/mcp.json + setup-harness.sh Track별 동적 조립 |
| D21 | 2026-04-14 | **8개 파일 제거 + 7개 공통 도구 추가** (Phase 4b 본체) | 필수성 기준 적용 (commit-policy/ecc-testing/projects/CL-v2 agents/test_parse 제거 + deep-research/find-skills/agent-browser/playwright 공통 이동/chrome-devtools/claude-powerline/market-research 추가) | 현행 유지 | templates/, setup-harness.sh, project-claude templates 8종 |
| D22 | 2026-04-14 | **SPEC drift 자동 검출 (`spec-drift-check.sh`)** | 사용자 지적: "스펙 정의 후 빌드에서 기능 수정 시 SPEC 반영" 미보장. 이전엔 LLM 지시 수준. 이제 SPEC/todo의 unchecked + Status 불일치를 deterministic 검출. ship 모드에서는 exit 2로 차단 | LLM 지시 유지 | templates/hooks/spec-drift-check.sh + ship-checklist.md 통합 |
| D23 | 2026-04-15 | **Supabase agent-skills 공식 플러그인 통합** (csr-supabase/full Track) | csr-supabase Track 직결. Supabase 전문 지식(RLS, 인덱스, SSR 통합)은 대체 불가. 사용자 명시 지시 + 리서치 감사(`Docs/research/harness-engineering-audit-2026-04.md` P0-1, 커밋 `a494c3c`) 7기준 판정 결과 | 옵션 A (`npx skills add`), 옵션 C (로컬 cherry-pick) | setup-harness.sh csr-supabase case, project-claude/csr-supabase.md, PRD Q6 Resolved |
| D24 | 2026-04-15 | **Model Routing rule (opt-in, `--model-routing=on`)** | 토큰 비용 40–70% 감소 가능. 사용자 선택권 보장 — 기본 off | 항상 설치 / 강제 라우팅 | templates/rules/model-routing.md 신규, setup-harness.sh 플래그 |
| D25 | 2026-04-15 | **Checkpoint auto-snapshot (`checkpoint-snapshot.sh`)** | Claude Code hook이 `/compact` 직접 호출 불가. 대신 40회 tool call마다 docs/checkpoints/ 자동 저장 + session-start 경고. 실제 compact는 사용자 수동 | 완전 자동 compact (구조적 불가) | templates/hooks/checkpoint-snapshot.sh, session-start.sh 경고 통합, settings.json PostToolUse |
| D26 | 2026-04-15 | **Repository Map (`codebase-map.sh`)** | Grep/Glob 남발 방지. bash regex 기반 symbol 추출(Python/TS/JS/Rust/Go/Shell). session-start에서 10분 TTL로 자동 갱신 | Tree-sitter 바인딩 (과잉) | templates/hooks/codebase-map.sh, session-start.sh 통합 |
| D27 | 2026-04-15 | **AgentShield auto-gate (`agentshield-gate.sh`)** | `/uzys:ship` Skill 호출 전 자동 실행. CRITICAL + `.agentshield-ignore` 비매칭 시 exit 2. false-positive 정책: git-policy.md의 `--no-verify` 금지 명시 문장은 ignore | 수동 scan 유지 | templates/hooks/agentshield-gate.sh, .agentshield-ignore, settings.json Skill matcher |

### 12.3 Roadmap

| R# | 내용 | 전제 조건 |
|----|------|-----------|
| R1 | instinct -> Rule 자동 PR 생성: CL-v2 confidence >= 0.9인 instinct를 `.claude/rules/learned/`에 자동 추가, Git PR 생성, 인간 리뷰 | CL-v2 독립 동작 확인 (Q3) |
| R2 | 크로스 프로젝트 learning 전이: knowledge-base/ 리포에서 다른 프로젝트의 `~/.claude/CLAUDE.md`로 자동 주입 | knowledge-base/ 리포 구조 확정 |
| R3 | Rule 효과 측정 자동화: Rule 비활성화 전후의 에이전트 성능(토큰 사용량, 실패율) 비교 | Claude Code /stats API 활용 |
| R4 | 메타 에이전트: 프로젝트 전체 learnings/instincts를 분석해서 CLAUDE.md 개선안을 제안하는 별도 subagent | R1-R3 데이터 축적 후 |
| R5 | 게이트 Hook deterministic 강화: 현재 gate-check.sh의 상태 추적을 파일 기반에서 구조화된 상태 머신으로 전환 | Phase 3 E2E 검증 결과 |
| R6 | 추가 Track 검토: ML/research, 모바일(iOS/AOS), 게임 등 도메인별 Track 확장 | 사용자 피드백 + 실제 프로젝트 운영 |

---

## 13. Retrospective (Complete 시 작성)

### 13.1 결과 vs. 목표

| 메트릭 | 목표 값 | 실제 값 | 차이 분석 |
|--------|---------|---------|-----------|
| 프로젝트 초기화 시간 | 5분 이내 | -- | Phase 3에서 측정 |
| 단계 건너뛰기 발생률 | 0% | -- | Phase 2 검증 중 |
| ECC 스킬 사용률 | 100% (8/8) | -- | Phase 3에서 측정 |
| 보안 스캔 누락률 | 0% | -- | Phase 3에서 측정 |

### 13.2 Lessons Learned

- **잘된 것**: Phase 1 완료 후 기술
- **개선할 것**: Phase 2 진행 중 식별
- **다음에 시도할 것**: Phase 3 계획 시 반영

### 13.3 변경 통계

- 총 Change Request: 0건 (초기 버전)
- Major: 0 / Minor: 0 / Clarification: 0
- Phase 추가/삭제: 없음
