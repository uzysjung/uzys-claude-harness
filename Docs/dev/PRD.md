# PRD: Claude Code Agent Harness

> **Status**: In Progress
> **Owner**: Jay (Uzys)
> **Last Updated**: 2026-04-16
> **Stakeholders**: Jay (CEO/CTO/CISO/CPO/CSO/Data Scientist)

---

## 1. Executive Summary

Claude Code Agent Harness는 Jay의 멀티 역할(CEO/CTO/CISO/CPO/CSO/데이터 사이언티스트)과 멀티 트랙(9개) 기술 스택을 위한 통합 Claude Code 개발 환경이다. agent-skills의 6단계 게이트 워크플로우(Define-Plan-Build-Verify-Review-Ship)를 뼈대로, ECC(Everything Claude Code) + GSD + supabase-agent-skills에서 **20개 cherry-pick + 1 자체 작성 (plan-checker) = 21 custom assets**한 도구를 레이어로, 11개 행동 원칙(CLAUDE.md) + Decision Making Universal Meta-Rule을 기반으로 동작한다.

현재 **Phase 5.2 완료** (v26.7.0). 5개 신규 hook(mcp-pre-exec, checkpoint-snapshot, codebase-map, agentshield-gate, model-routing)으로 보안/관측/비용 기준 강화.

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

- **정량 근거**: ECC 156개 중 cherry-pick 18개 + GSD 부분 cherry-pick 2개 + 자체 작성 plan-checker 1 + 외부 플러그인 (supabase/agent-skills, agent-skills, impeccable 등). 총 cherrypicks.lock 매니페스트 20건.
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
| Cherry-pick 사용률 | ~13% (20/156) | **100% (20/20 매니페스트)** (ECC 18 + GSD 2) | cherrypicks.lock + test-harness T4 |
| 보안 스캔 누락률 | 수동 의존 | 0% (Ship 게이트) | ship-checklist.md + agentshield-gate.sh 자동 차단 |
| MCP 서버 화이트리스트 | 없음 | opt-in (D35) | .mcp-allowlist + mcp-pre-exec.sh |
| 토큰 비용 최적화 | 수동 | opt-in (D24) | model-routing.md rule 활성 시 |

---

## 5. Solution Outline

### 5.1 Approach

3개 레이어로 구성한다:

- **뼈대**: agent-skills 6단계 워크플로우 (`uzys:` 네임스페이스). Define-Plan-Build-Verify-Review-Ship.
- **도구**: **20개 cherry-pick + 1 자체 작성 (plan-checker) = 21 custom assets** (Phase 5.1 후: ECC 18 + GSD 2 + supabase-agent-skills 1). agents 4(ECC) + skills 9(ECC) + rules 5(ECC 3 + GSD 2) + commands 3(ECC) + 자체 작성 plan-checker 1. 매니페스트는 `.dev-references/cherrypicks.lock`. 전체 포크가 아닌 필요한 것만 선별.
- **원칙**: 11개 행동 원칙 + Decision Making Universal Meta-Rule (CLAUDE.md, 현재 150줄). Karpathy LLM 관찰 + Anthropic Harness Design + HyperAgents 사상 + harness-engineering-audit-2026-04 리서치 반영.

자동화는 `setup-harness.sh`가 담당하고, 게이트 강제는 Hook 기반(gate-check.sh, spec-drift-check.sh, agentshield-gate.sh, mcp-pre-exec.sh, exit code 2)으로 구현한다.

### 5.2 Key Features / Capabilities

| 기능 | 우선순위 | 설명 |
|---|---|---|
| 6단계 게이트 워크플로우 | Must | uzys:spec - uzys:plan - uzys:build - uzys:test - uzys:review - uzys:ship |
| Hook 기반 게이트 차단 | Must | gate-check.sh로 이전 단계 미완료 시 차단 (exit code 2) |
| Track별 자동 초기화 (9종) | Must | csr-supabase, csr-fastify, csr-fastapi, ssr-htmx, ssr-nextjs, data, executive, tooling, full |
| Cherry-pick (21건) | Must | ECC + GSD + supabase-agent-skills. cherrypicks.lock 매니페스트 + sync-cherrypicks.sh |
| reviewer subagent (SOD) | Must | context: fork로 구현과 검증 분리 |
| auto memory + CL-v2 instinct | Must | 경험 축적, confidence scoring, Rule 승격 제안 |
| protect-files.sh | Must | .env, lock 파일 등 보호 영역 Write/Edit 차단 |
| SPEC drift 자동 검출 | Must | spec-drift-check.sh, ship 모드 exit 2 (D22) |
| MCP pre-execution blocking | Must | .mcp-allowlist + mcp-pre-exec.sh, CVE 대응 (D35, Phase 5.2) |
| AgentShield auto-gate | Must | /uzys:ship 전 자동 scan, CRITICAL 차단 (D27) |
| Supabase agent-skills (csr-supabase/full) | Must | RLS/인덱스/SSR 전문 지식 (D23) |
| Plan-checker (자체 작성) | Should | Goal-backward verification, Revision Gate 패턴 (D31) |
| silent-failure-hunter (ECC agent) | Should | 숨은 에러 탐지, dev Track (P1-5) |
| build-error-resolver (ECC agent) | Should | 빌드 에러 최소 diff 복구 (D30) |
| Checkpoint auto-snapshot | Should | tool 40회마다 docs/checkpoints/ 스냅샷 (D25) |
| Repository Map (codebase-map) | Should | session-start bash regex symbol 인덱스 (D26) |
| uncommitted-check.sh | Should | 커밋되지 않은 변경이 있을 때 경고 |
| spec-scaling 스킬 | Should | SPEC.md 300줄 초과 시 기능별 분리 + 마스터 라우트 |
| strategic-compact 스킬 | Could | 컨텍스트 윈도우 효율적 관리 |
| Model Routing rule (opt-in) | Could | 6-gate × Haiku/Sonnet/Opus 매핑, `--model-routing=on` (D24) |
| GSD gates-taxonomy | Could | pre-flight/revision/escalation/abort 4유형 (P1-6) |

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
| affaan-m/everything-claude-code | 외부 리포 (cherry-pick 18건) | agents 4, skills 9, rules 3, commands 3. cherrypicks.lock 매니페스트 |
| gsd-build/gsd-2 | 외부 리포 (부분 cherry-pick 2건) | gates-taxonomy.md, planner-antipatterns.md. D6 "사상만 흡수" 부분 완화 |
| supabase/agent-skills | 외부 플러그인 | csr-supabase/full Track 전문 지식 (RLS/인덱스/SSR). D23 |
| pbakaus/impeccable | 외부 스킬 | 디자인 품질 도구 17개 |
| anthropics/skills | 외부 플러그인 | document-skills (pptx/docx/xlsx/pdf), executive/full Track |
| Railway MCP/Plugin | 외부 서비스 | 배포 인프라 |
| Supabase MCP | 외부 서비스 | csr-supabase Track 전용 |
| @owloops/claude-powerline | 외부 도구 | 상태표시줄 (D21 교체, 이전 claude-code-statusline) |
| ecc-agentshield | npx 패키지 | 보안 스캔 (agentshield-gate.sh에서 호출, D27) |

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

**Phase 3: Tooling Track + Dogfooding [Complete]**

- Scope:
  - 신규 tooling Track 추가 (cli-development.md rule + tooling.md project template)
  - --project-only 플래그 추가
  - 이 프로젝트에 자체 적용 (dogfooding)
  - 1차 검증 (gate Hook, reviewer fork, CL-v2 등)
  - PRD 동기화 (D14, D15, V 검증 반영)
- Depends on: Phase 2
- Deliverable: 9 Track 지원 setup-harness.sh, 자기 적용 완료, 동기화된 PRD
- Done Criteria:
  - tooling Track으로 setup-harness.sh 동작 [검증 완료]
  - 이 프로젝트의 .claude/에 하네스 설치 완료 [검증 완료]
  - 다음 작업이 /uzys:spec으로 시작 가능 [검증 완료]

**Phase 4b: 필수성 감사 + 프로젝트 스코프화 [Complete]**

- Tag: v26.2.0 ~ v26.2.1. Decisions: D16 ~ D22.
- Scope:
  - 글로벌 설치 경로 완전 제거 (`templates/global/` 폐기, D16)
  - Decision Making Universal Meta-Rule 추가 (D17)
  - `.dev-references/cherrypicks.lock` + `sync-cherrypicks.sh` 신규 (D18)
  - `.claude/settings.json` 통합, `$CLAUDE_PROJECT_DIR` 사용 (D19)
  - `.mcp.json` 프로젝트 스코프 (D20)
  - 필수성 7기준 판정 기반 8개 제거 + 7개 추가 (D21, Phase 4b 본체)
  - SPEC drift 자동 검출 `spec-drift-check.sh` (D22)
  - test-harness.sh 도입 (T1~T11, 초기 52 PASS)
- Deliverable: 글로벌 코드 0건, 매니페스트 기반 버전 관리, deterministic ship drift 차단
- Done Criteria:
  - `setup-harness.sh`에 글로벌 수정 명령 0건 [T7 검증]
  - cherrypicks.lock 14개 항목 일관성 [T4 검증]
  - ship 모드 spec-drift-check BLOCK 동작 [검증 완료]

**Phase 5.1: P1 Cherry-picks [Complete]**

- Tag: v26.5.0 ~ v26.6.0. Decisions: D28 ~ D32.
- Scope: `harness-engineering-audit-2026-04.md` (`Docs/research/`) §11.2 P1 8건 중 5건 이행
  - P1-3: `ecc-security-common.md` rule (ECC cherry-pick)
  - P1-4: `ecc-performance-common.md` rule (ECC, modified — 글로벌 경로 1줄 수정)
  - P1-5: `silent-failure-hunter.md` agent (ECC, dev Track)
  - P1-6: `gsd-gates-taxonomy.md` rule (GSD **첫 cherry-pick**, 공통 Rule)
  - B9b: `gsd-planner-antipatterns.md` rule (GSD, DEV_RULES)
  - A14 (D30): `build-error-resolver.md` agent (ECC, dev Track)
  - B1 (D31): `plan-checker.md` agent (**자체 작성 130줄**, GSD 961줄 재사용 불가 후 사상 흡수). Goal-backward verification + Revision Gate
- Deferred (D29, Backlog): P1-1 skill-comply (Python 의존), P1-7 GSD session-state (중복), P1-9 구현 (D34 조사 후 D35 Phase 5.2로)
- Deliverable: 21 cherry-pick 매니페스트 (ECC 18 + GSD 2 + supabase 1), 8 dev Track agents

**Phase 5.2: 보안/운영 Hook [Complete]**

- Tag: v26.3.0 ~ v26.7.0. Decisions: D23 ~ D27, D33 ~ D35.
- Scope: 리서치 문서 §11.1 P0 5건 + 보안 hook 추가
  - P0-1 (D23, v26.3.0): `supabase-agent-skills` 통합 (csr-supabase/full, `claude plugin install` 공식 경로)
  - P0-2 (D24, v26.4.0): Model Routing rule (opt-in, `--model-routing=on`)
  - P0-3 (D25, v26.4.0): Checkpoint auto-snapshot (`checkpoint-snapshot.sh`, tool 40회마다 `docs/checkpoints/`). **자동 /compact는 Claude Code 구조적 불가**로 명시, 대체 접근
  - P0-4 (D26, v26.4.0): Repository Map (`codebase-map.sh`, Python/TS/JS/Rust/Go/Shell bash regex, 10분 TTL)
  - P0-5 (D27, v26.4.0): AgentShield auto-gate (`agentshield-gate.sh`, /uzys:ship PreToolUse, CRITICAL + `.agentshield-ignore` 비매칭 시 exit 2)
  - D33 조사: Memory Architecture 공존 확인 (Claude Code v2.1.59+ Memory는 CL-v2와 역할 분리, `Docs/research/memory-architecture-check.md`)
  - D34 조사: MCP hook 기술 타당성 확인 (`Docs/research/mcp-pre-exec-feasibility.md`)
  - D35 (v26.7.0): MCP pre-execution blocking 구현. `mcp-pre-exec.sh` (PreToolUse `mcp__.*` matcher), `.mcp-allowlist` (opt-in 화이트리스트, `.mcp.json`에서 자동 생성), 위험 파라미터 패턴 감지
- Deliverable: 5 신규 hook + 1 신규 rule, test-harness 67 PASS
- Done Criteria:
  - T5 hooks=9 반영, 전 Track 설치 검증
  - 5 시나리오 mcp-pre-exec unit test 통과 (T3.9-13)
  - CVE-2025-59536, CVE-2026-21852 대응 (MCP 화이트리스트 기반)

**Phase 5.3: 문서 현행화 + Phase 4 E2E 준비 [In Progress]**

- Tag: v26.7.1 (patch, 문서만).
- Scope:
  - PRD 현행화 (본 섹션 포함)
  - USAGE.md 신규 hook 섹션 + ECC 커맨드 3개 추가
  - README.md `--model-routing` 플래그 예시
  - LICENSE 파일 신규 (MIT, README 주장과 파일 부재 불일치 해소)
  - `sync-cherrypicks.sh` 실행 → drift 확인
  - Phase 4 Real-World E2E 준비 섹션 신규 (본 섹션 바로 아래)
- Depends on: Phase 5.2 완료 (v26.7.0)
- Deliverable: 현행화된 PRD/USAGE/README, LICENSE, v26.7.1 태그
- Done Criteria:
  - PRD Status Tracker = "Phase 5.3 (Documentation + E2E Preparation)"
  - USAGE.md 11 ECC commands (`/ecc:harness-audit`, `/ecc:eval`, `/ecc:e2e` 추가)
  - LICENSE 파일 존재
  - sync-cherrypicks.sh 실행 결과 기록

**Sync Status (2026-04-16)**:
- Total cherrypicks.lock: **20건** (ECC 18 + GSD 2)
- `=` 동일: 17건
- `!` 변경 감지 (수동 머지 필요): **3건** (ecc-cl-v2, ecc-git-workflow, ecc-performance-common)
- `✗` origin URL 불일치: **gsd 이전 기록 오기 (gsd-2 → get-shit-done), 본 Phase에서 수정** (D36)
- 3 conflict 해소는 **별도 plan**. 각각은 이미 `modified: true` 상태라 로컬 변경 유지가 의도된 경우가 있음 (ecc-cl-v2: agents/ 제거, ecc-git-workflow: 글로벌 경로 제거, ecc-performance-common: 본 Phase 수정)

**Phase 4: Real-World E2E Validation [Partial — 단발 A/B 완료, 대화형 재실험 필요]**

> 주의: "Phase 4"는 시간 순서가 아닌 **논리 순서**. Phase 4b/5.x가 먼저 완료됐지만, 외부 프로젝트 E2E 실증은 여전히 Phase 4로 구분.

**Phase 4a — A/B Controlled Experiment (단발 `claude -p`, v26.7.4 완료)**

- 실험: `~/Development/phase4-experiment/{baseline,harness}` 동시 병렬 실행
- 과제: Local Markdown Notebook (React + Tauri + SQLite), 원본 프롬프트
- 결과 보고: `Docs/research/phase-4-ab-log.md`
- **정량 결과**:
  - B(harness) 비용 65% 감소 ($0.57 vs A $1.63)
  - B 시간 84% 감소 (109s vs 677s)
  - B output tokens 86% 감소 (5.2k vs 38.4k)
  - B 자연 완료, A 예산 초과 오류 종료
- **정성 결과**:
  - B는 287줄 구조화된 SPEC 생성 (20 체크리스트 100% 커버)
  - A는 Rust backend 615줄 + 빌드 설정 생성, React frontend 미완성 (예산 초과)
  - B는 **단발 모드의 구조적 제약**으로 Build 단계 진입 불가 (6-gate 정책 의도)
- **입증**: 비용/시간/예측 가능성/설계 품질 ✅ / 완성된 코드/전체 6-gate 동작 ❌
- **판정**: **Partial** — 비용-효율 + 설계 품질 입증, 전체 워크플로우 실증은 대화형 필요

**Phase 4b — 대화형 재실험 [Future]**

- Scope: 대화형 세션에서 `/uzys:spec` → `/uzys:plan` → `/uzys:build` → `/uzys:test` → `/uzys:review` → `/uzys:ship` 순차 실행. A는 동일 대화형이지만 하네스 없음.
- Depends on: Phase 4a 완료 (v26.7.4)
- Deliverable:
  - 대화형 A/B 로그
  - Phase 5 신규 hook 실전 동작 확인 (mcp-pre-exec, agentshield-gate, checkpoint-snapshot, codebase-map)
  - V3 (6단계 전체) + V13 (UI 자동 활성화) 실증
- Done Criteria:
  - 6-gate 전체 동작 확인
  - Blocking 이슈 0건
  - 대화형 A/B 비교 (같은 과제, 수정 요청 허용)
- **Note**: 사용자가 claude 세션 직접 실행 필요 (대화형은 내가 자동 실행 불가)

**Phase 4c — `-p` 체이닝 자동화 [Future, 선택]**

- Scope: 6개 단계를 순차 `claude -p` 호출로 자동화 — `spec.sh`, `plan.sh`, `build.sh` 등
- 목적: 단발 모드에서도 6-gate 전체 실행 가능하게 해 N=2+ 반복 실험 가능하게 함
- Deliverable: `scripts/phase4-chained-run.sh` + 사용 가이드

**Phase 6: 장기 운영 [Future — 후보 재검토 필요]**

- Scope 후보 (각각 별도 plan + 재평가 필요):
  - **R3 Rule 효과 측정 자동화** — 리서치 문서 §R3. 단, skill-comply (Python 디렉토리)는 프로젝트 원칙 위반 가능성 → Skip 권장 상태
  - **P10 분기 정리 (Harness Maintenance)** — Rule/Skill/Agent 비활성화 후 영향 측정. 다음 분기 초 (~2026-07) 착수
  - **R2 Cross-project learning 전이** — instinct-export/import 이미 구현 (A3/A4). 실전 필요 시 수동 실행
  - **신규 Track**: ML/research, 모바일, 게임 (사용자 수요 발생 시)
- Dependencies: Phase 4 E2E 완료 후 실측 데이터 필요
- Note: 이 Phase는 "실행 대기" 가 아닌 "재평가 필요". 리서치 문서의 Backlog 6건은 Skip 판정 유지

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
| ECC | github.com/affaan-m/everything-claude-code | cherry-pick 소스 (18건) |
| GSD | github.com/gsd-build/gsd-2 | 부분 cherry-pick (2건): gates-taxonomy, planner-antipatterns |
| supabase/agent-skills | github.com/supabase/agent-skills | csr-supabase Track 전문 지식 (D23) |
| Anthropic skills | github.com/anthropics/skills | pptx/docx/xlsx/pdf 공식 (executive/full) |
| Railway | docs.railway.com | 배포/로그 |
| Impeccable | github.com/pbakaus/impeccable | 디자인 품질 |
| Karpathy LLM observations | — | 행동 원칙 1-4 출처 |
| Anthropic Harness Design | code.claude.com/docs/en/hooks, code.claude.com/docs/en/memory | 행동 원칙 5-6, 8, 10 + D33/D34 조사 근거 |
| HyperAgents (arxiv.org/abs/2603.19461) | — | 자기 개선 아키텍처 |
| gitagent | github.com/open-gitagent/gitagent | SOD, SOUL.md, Git-native agents |
| @owloops/claude-powerline | github.com/owloops/claude-powerline | 상태표시줄 (D21 교체) |
| HumanLayer — Harness Engineering | humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents | "Coding Agent = AI Model(s) + Harness" 정의 |
| `Docs/research/` | 본 레포 | harness-engineering-audit-2026-04, memory-architecture-check, mcp-pre-exec-feasibility |
| Jay의 기존 리포 | uzysjung/std-dev-boilerplate, uzysjung/dyld-vantage | Rules 기반, Track별 참조 |

---

## 11. Status Tracker

| 항목 | 내용 |
|------|------|
| **Status** | In Progress |
| **Current Phase** | Phase 4a 완료 (단발 A/B) / Phase 4b 대화형 재실험 대기 |
| **Last Updated** | 2026-04-16 |
| **Latest Tag** | v26.7.3 → v26.7.4 (Phase 4a 실험 로그 + 분석) |
| **Next Milestone** | Phase 4b 대화형 재실험 (사용자 실행 필요) OR Phase 4c `-p` 체이닝 자동화 |
| **Blockers** | 대화형 세션은 내가 자동 실행 불가 — 사용자 수동 필요 |
| **Phase 4a 결과** | Partial 입증 — 비용 -65%, 시간 -84%, output token -86%, B 자연 완료 vs A 예산 초과 오류. 단발 모드 구조적 제약으로 Build 미진입 |
| **Known Skip** | Phase 6 skill-comply/stocktake (Python 도입 원칙 위반), CHANGELOG/CONTRIBUTING (개인 프로젝트) |

---

## 12. Change Log & Decision Log

### 12.1 Change Log

> 변경 유형: **Clarification** (에이전트 즉시 반영) / **Minor** (인간 승인 후 반영) / **Major** (인간 결정 필수)

| CR# | 날짜 | 유형 | 섹션 | 변경 내용 | 승인자 |
|-----|------|------|------|-----------|--------|
| -- | 2026-04-12 | -- | 전체 | 초기 버전. Phase 1 완료 상태에서 현황 반영 | Jay |
| -- | 2026-04-14 | Major | §7.2, §12.2 | Phase 4b 본체 (D16~D22). 글로벌 경로 제거, cherrypicks.lock, spec-drift-check. v26.2.0 ~ v26.2.1 | Jay |
| -- | 2026-04-15 | Major | §5.2, §7.2, §12.2 | Phase 5.1 (P1 cherry-picks) + Phase 5.2 (5 신규 hook + supabase-agent-skills). v26.3.0 ~ v26.7.0 | Jay |
| -- | 2026-04-16 | Minor | §1, §4.3, §5.1-5.2, §6.5, §7.2, §11 | Phase 5.3 (문서 현행화). Phase 4 Real-World E2E 준비 섹션 신규. v26.7.1 | Jay |

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
| D28 | 2026-04-15 | **P1 쉬운 5건 cherry-pick** (harness audit §11.2) | P1-3 ecc/rules/common/security.md + P1-4 ecc/rules/common/performance.md (common DEV_RULES) + P1-5 ecc/agents/silent-failure-hunter.md (dev Track) + P1-6 gsd gates-taxonomy.md (COMMON_RULES) + P1-2 이미 구현됨 (자체 작성). GSD D6 부분 완화 (gates-taxonomy만 cherry-pick) | 전체 유지 | templates/rules/ecc-security-common.md, ecc-performance-common.md, gates-taxonomy.md, templates/agents/silent-failure-hunter.md, cherrypicks.lock (gsd 소스 추가, 4건 cherrypick 항목 추가), setup-harness.sh |
| D29 | 2026-04-15 | **P1 복잡 3건 Backlog 이월** | P1-1 skill-comply (Python 디렉토리, 유지 비용), P1-7 GSD session-state (이미 session-start.sh가 동등 이상), P1-9 MCP pre-execution blocking (Claude Code MCP hook 구조 조사 필요 — D34에서 해소) | 이번 세션 강행 | R7 Phase 5.2 Backlog로 이월 |
| D30 | 2026-04-15 | **Phase 5.1 A14 build-error-resolver cherry-pick** | ECC 에이전트. TypeScript/webpack/tsconfig 에러 최소 diff 복구 전담. code-reviewer와 역할 분리 (리뷰 vs 수정) | Skip | templates/agents/build-error-resolver.md, setup-harness.sh dev Track 설치, cherrypicks.lock |
| D31 | 2026-04-15 | **Phase 5.1 B1 plan-checker 자체 작성** (GSD 사상 흡수) | 원본 `gsd-plan-checker.md` 961줄은 `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` + `.planning/STATE.md/CONTEXT.md/PROJECT.md/ROADMAP.md` GSD 전용 아티팩트 깊이 참조로 재사용 불가. Goal-backward verification + Revision Gate 사상만 흡수해 ~130줄 자체 작성. docs/plan.md + docs/todo.md + docs/SPEC.md 구조에 맞춤 | 단순 경로 수정 cherry-pick (시도 실패) | templates/agents/plan-checker.md, setup-harness.sh dev Track |
| D32 | 2026-04-15 | **Phase 5.1 B9b planner-antipatterns cherry-pick** (GSD) | B9 SPEC-WRITING.md는 GSD 리포에 존재하지 않음 (리서치 문서 오기재). 대체 후보 중 `planner-antipatterns.md` 선택 — `/uzys:plan` 게이트에서 reviewer + plan-checker가 참조할 구체적 안티패턴 카탈로그 | B9a questioning.md, B9c universal-anti-patterns.md | templates/rules/gsd-planner-antipatterns.md, DEV_RULES |
| D33 | 2026-04-15 | **E2 Memory Architecture 검증 완료** (조사) | Claude Code Memory v2.1.59+ 공식 feature 확인. `~/.claude/projects/<project>/memory/` 저장은 자동 생성 디렉토리 → "글로벌 절대 불변 원칙"에 포함되지 않음(설정 파일만 보호). CL-v2 instinct와 역할 중복 없음 (free-form 노트 vs 구조화 confidence + Rule 승격 파이프라인). 공존 유지 | CL-v2 제거 | Docs/research/memory-architecture-check.md (신규) |
| D34 | 2026-04-15 | **P1-9 MCP pre-execution blocking 기술 타당성 확인** (조사) | Claude Code 공식 hook 문서: PreToolUse matcher가 `mcp__<server>__<tool>` regex 매처 지원 + exit 2 공식 blocking contract 확인. 기술적으로 완전히 가능. 구현은 Phase 5.2로 이월 (사용자 명시 "조사만") | P1-9를 영구 Backlog | Docs/research/mcp-pre-exec-feasibility.md (신규) — 구현 경로 + 7기준 재판정 (P1 → P0 승급 자격) 포함 |
| D35 | 2026-04-15 | **Phase 5.2 P1-9 MCP pre-execution blocking 구현** (P0 승급 후 실행) | D34 조사 근거로 즉시 구현. PreToolUse `mcp__.*` matcher + `.mcp-allowlist` 기반 화이트리스트 + 위험 파라미터 패턴 감지. setup-harness.sh가 설치 시 `.mcp.json`의 서버로 `.mcp-allowlist` 자동 생성(jq). opt-in 구조 — 파일 없으면 gate 비활성 | 수동 scan 유지, 별도 plan 대기 | templates/hooks/mcp-pre-exec.sh, templates/mcp-allowlist.example, templates/settings.json PreToolUse matcher, setup-harness.sh, test-harness.sh T3 unit test 5건 |
| D36 | 2026-04-16 | **cherrypicks.lock gsd URL 수정** (`gsd-2` → `get-shit-done`) | sync-cherrypicks.sh 실행 시 origin URL 불일치 감지. 실제 clone origin 확인 결과 `github.com/gsd-build/get-shit-done.git`. 이전 Explore 에이전트 보고 기반 `gsd-2` 오기재 정정 (P7 Fact vs Opinion 준수) | 기록 유지 | .dev-references/cherrypicks.lock |
| D37 | 2026-04-16 | **`.mcp-allowlist` 자동 생성 순서 버그 fix** | Phase 4 A/B 실험 준비 중 발견. `.mcp-allowlist` 생성 로직이 `.mcp.json` 생성보다 앞에 있어서 **첫 설치 시 미생성**. 두 번째 실행부터 생성되는 bug. 이전 dogfooding sync는 재실행이라 우연히 성공했음. 수정: 생성 블록을 `.mcp.json` 생성 뒤로 이동 + test-harness T5에 ALLOWLIST_OK 체크 추가 | — | setup-harness.sh line 276→287, test-harness.sh T5, v26.7.3 |
| D38 | 2026-04-16 | **Phase 4a 단발 A/B 실험 — Partial 입증** | A/B controlled experiment 실행. B(harness) 결과: 비용 -65%, 시간 -84%, output tokens -86%, 자연 완료 / A: 예산 초과 오류 종료. 정성적: B 287줄 고품질 SPEC (20/20), A Rust backend 615줄+빌드 설정 (frontend 미완성, 7/20). **단발 모드 구조적 한계로 하네스는 Define 이후 진입 불가** (설계 의도). 판정: Partial — 비용/시간/품질 입증, 전체 워크플로우는 대화형 필요. Phase 4b(대화형) 후속 plan 필요 | 단발만으로 Pass 판정 | Docs/research/phase-4-ab-log.md (신규), PRD §7.2 Phase 4a/4b/4c 재구조 |

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
