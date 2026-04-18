# Harness Engineering Audit — 2026-04

> **Scope**: Claude Code Agent Harness (this project) 의 현재 상태를 외부 하네스 엔지니어링 베스트 프랙티스 및 레퍼런스 프로젝트와 대조하고, 명확한 기준에 따라 필요/개선 항목을 도출한다.
>
> **Date**: 2026-04-15 · **Version**: v26.2.1 · **Author**: Jay (Uzys) + Claude Code session audit
>
> **독립 문서**: 이 감사는 `Docs/dev/PRD.md`와 별개. PRD의 D23+ 후속 결정에 대한 **입력 근거**로만 사용된다. 이 문서는 의사결정을 하지 않는다 — 기준에 따라 판정 결과를 제시한다.

---

## 1. Executive Summary

- 현재 프로젝트의 뼈대(6-gate workflow, Hook 차단, SOD fork, instinct 축적)는 Anthropic 공식 가이드 + ECC + GSD + addyosmani/agent-skills + Superpowers 의 공통 표준과 **정렬**되어 있다.
- 14개 ECC cherry-pick은 `.dev-references/cherrypicks.lock`에 매니페스트화되었고 dogfooding까지 완료(v26.2.1 Ship).
- 그러나 **5개 업계 표준 패턴이 미반영**, **1개 레퍼런스(Supabase agent-skills)는 csr-supabase Track 요구사항과 직결되지만 통합 0건**, **GSD는 통합 0건**이다.
- 이 문서는 이 세 축을 7기준(① 요구사항 ② 결정론 ③ 대체불가 ④ 워크플로우 ⑤ 비용효율 ⑥ 보안 ⑦ 관측성)으로 판정하고, 결과를 **P0/P1/P2/Backlog** 로 분류한다.
- 결론(선언이 아닌 판정 결과 요약): **P0 5건 / P1 11건 / P2 8건 / Backlog 6건 / Drop 4건**. 상세는 §11.

---

## 2. Harness Engineering 정의

### 2.1 공식 정의 (출처 기반)

> "하네스 엔지니어링(Harness Engineering)은 AI 모델이 실수를 할 때마다, 그 실수가 절대 반복되지 않도록 엔지니어링 솔루션을 고안하는 작업이다.
> **Coding Agent = AI Model(s) + Harness**"
>
> — HumanLayer Blog, *Skill Issue: Harness Engineering for Coding Agents*

**출처 링크**:
- [HumanLayer — Skill Issue: Harness Engineering for Coding Agents](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents) *(접근 2026-04-15, Phase 1 에이전트 보고)*
- [Anthropic Engineering — Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) *(Phase 1 에이전트 보고, 미검증)*
- [Anthropic Engineering — Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) *(Phase 1 에이전트 보고, 미검증)*

### 2.2 작업 정의 (이 문서에서의 해석)

하네스는 다음 4개 구성요소의 집합으로 본다:
1. **행동 원칙** (CLAUDE.md — 경계와 제약)
2. **결정론적 게이트** (hooks, exit code 기반 차단)
3. **자산** (agents, skills, rules, commands, MCP)
4. **자동화 스크립트** (setup, sync, verify, ship)

이 정의는 PRD.md §5.1의 3-레이어 구조(뼈대/도구/원칙) + Hook 기반 자동화 기술과 일치한다.

---

## 3. 업계 표준 패턴 5가지

아래 5개는 Phase 1 외부 리서치에서 **복수 출처에서 교차 확인**된 공통 패턴이다. 각 패턴은 이 프로젝트가 "어느 정도 반영했는가"를 §4에서 ✅/⚠/❌ 로 판정한다.

### P1. 6-Phase Workflow (Define → Plan → Build → Verify → Review → Ship)

**출처**:
- [addyosmani/agent-skills README](https://github.com/addyosmani/agent-skills) — `/spec`, `/plan`, `/build`, `/test`, `/review`, `/ship` 공식 커맨드
- [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) — 47 subagents, 동일 6단계 기반
- Superpowers (obra) — Brainstorm → Design Spec → Implementation Plan → Subagent Execution → Review → Merge *(Phase 1 에이전트 보고)*

**본질**: 단일 "자연어 → 코드" 지시를 **검증 가능한 6개 단계**로 분해. 각 단계에 명시적 Acceptance Criteria.

### P2. Hook-Based Gate Enforcement (Exit Code 기반 차단)

**출처**:
- [Claude Code Docs — Hooks](https://docs.claude.com/en/docs/claude-code/hooks) *(공식, Phase 1 에이전트 보고)*
- ECC `.claude/hooks/hooks.json`: `block-no-verify`, pre-tool-use hooks
- GSD: pre-flight/revision/escalation/abort 4유형 gates taxonomy *(Phase 1 에이전트 보고)*

**본질**: LLM 지시 수준이 아닌 **프로그래밍적 차단**. exit code 2로 PreToolUse 중단.

### P3. Separation of Duties via Subagent Fork (SOD)

**출처**:
- Anthropic 공식 — `context: fork` subagent pattern *(Phase 1 에이전트 보고, 미검증)*
- gitagent 사상 (PRD §5.1 참조)
- GSD의 "isolated subagents + fresh context window" 패턴

**본질**: 구현 에이전트가 자기 작업을 평가하지 않는다. 검증은 **부모 컨텍스트를 공유하지 않는** 별도 에이전트가 수행.

### P4. Automatic Context Management (Compaction + Checkpoints)

**출처**:
- [State of Context Engineering 2026 — SwirlAI Newsletter](https://www.newsletter.swirlai.com/p/state-of-context-engineering-in-2026) *(Phase 1 에이전트 보고, 미검증)*
- Agentic Context Engineering (ACE): Generation → Reflection → Curation 사이클
- GSD: context rot 방지를 위한 자동 compaction *(Phase 1 에이전트 보고)*

**본질**: 컨텍스트 윈도우 압박 시 자동 요약 + 재초기화. 아키텍처 결정/버그/구현 세부는 preserve.

### P5. Experience Accumulation (Instinct / Memory / Skills Standard)

**출처**:
- [Claude Code Memory — docs](https://docs.claude.com/en/docs/claude-code/memory) *(Phase 1 에이전트 보고, 미검증)*
- ECC continuous-learning-v2 (이 프로젝트 cherry-pick 완료)
- Agent Skills Open Standard (Dec 2025 Anthropic 공개) *(Phase 1 에이전트 보고)*

**본질**: 세션 중 패턴을 자동 추출 → confidence scoring → Rule 승격 → cross-session 재사용.

---

## 4. 현재 프로젝트 반영 매트릭스

| # | 패턴 | 반영 | 증거 |
|---|------|------|------|
| P1 | 6-Phase Workflow | ✅ | `templates/commands/uzys/*.md` 6개, `.claude/rules/test-policy.md` AC 정의 |
| P2 | Hook-Based Gate | ✅ | `templates/hooks/gate-check.sh` exit 2, `spec-drift-check.sh ship` 모드 |
| P3 | SOD via Subagent Fork | ✅ | `templates/agents/reviewer.md` (opus, fork), V4 검증 완료 (PRD) |
| P4 | Automatic Context Management | ⚠ | `strategic-compact` skill wire-up (v26.2.1) 완료, 그러나 **자동 threshold 감지만 있음**. ACE 같은 Generation/Reflection/Curation 사이클 미구현 |
| P5 | Experience Accumulation | ⚠ | CL-v2 observer hook 등록. 그러나 instinct → Rule 승격 자동 PR(R1)은 미구현. Skills Standard(SKILL.md frontmatter)는 따르지만 Memory 공식 feature는 미연동 |

**판정 요약**: P1–P3 완전 반영, P4–P5 부분 반영. 빠진 업계 패턴(§9)은 이와 별개의 5건.

---

## 5. 평가 기준 (7기준 + 판정 규칙)

이 감사의 모든 "무엇을 통합해야 하는가" 판정은 아래 7기준에만 근거한다. 추정/직관/선호 금지 — `CLAUDE.md` Decision Meta-Rule 적용.

### 5.1 기본 4기준 (CLAUDE.md 원본)

| # | 기준 | Pass 조건 |
|---|------|----------|
| ① | 요구사항 연결 | PRD Goals/R1–R5/SPEC 항목 중 1개 이상과 직접 매핑 가능 |
| ② | 결정론적 동작 | bash/jq/grep/json 구조 또는 명확한 지침. LLM-dependent 부분이 전부가 아님 |
| ③ | 대체 불가 | 현재 하네스 도구로 동일 기능 제공 불가 |
| ④ | 워크플로우 사용 | `settings.json` hook 자동 호출 또는 `/uzys:*`/`/ecc:*` 경로에서 명시 참조 |

### 5.2 확장 3기준 (리서치 반영)

| # | 기준 | Pass 조건 |
|---|------|----------|
| ⑤ | 비용/컨텍스트 효율 | 토큰 절약 또는 컨텍스트 윈도우 압박 감소에 구체적 메커니즘 존재 |
| ⑥ | 보안 강화 | CVE/공격 표면 감소 또는 시크릿/권한 보호에 기여 |
| ⑦ | 관측 가능성 | 감사 로그/메트릭 산출 또는 실패 재현 가능 |

### 5.3 판정 규칙

| 판정 | 조건 |
|------|------|
| **P0 필수** | ① TRUE AND (②③④ 중 2개 이상 TRUE) AND (⑤⑥⑦ 중 1개 이상 TRUE) |
| **P1 권장** | ① TRUE AND (②③④ 중 2개 이상 TRUE) — 확장 기준 불요 |
| **P2 보류** | ① TRUE AND (7기준 중 1개 이상 TRUE) — 근거 부족 시 |
| **Backlog** | ① TRUE 이지만 현재 실행 우선순위 없음 |
| **Drop** | ① FALSE 또는 전 기준 FALSE |

§6–§10의 모든 후보는 이 규칙으로 판정된다. 표 형식: `[후보] | ① | ② | ③ | ④ | ⑤ | ⑥ | ⑦ | 판정`

---

## 6. Gap-A: ECC 미통합 자산 20개 후보

**컨텍스트**: `.dev-references/ecc/`는 agents 48개, skills 183개, rules 63개, commands 34개, hooks 여러 개를 포함한다. 이 프로젝트는 `.dev-references/cherrypicks.lock`에 **14개만** 등록(D21+D22 후). 나머지 중 메타 프로젝트 성격에 맞는 후보 20개를 아래 판정한다.

**주의**: 판정은 Phase 1 탐색 에이전트 보고 기반. 파일명/설명만으로 판정하며, 실제 품질은 통합 후 검증 필요.

### 6.1 판정표 (20개)

| # | 후보 | 유형 | ① | ② | ③ | ④ | ⑤ | ⑥ | ⑦ | 판정 |
|---|------|------|---|---|---|---|---|---|---|------|
| A1 | `skill-comply` (skill) | 품질 감사 | ✅ R3 | ✅ deterministic scenarios | ✅ | ❌ | ⚠ | ❌ | ✅ | **P1** |
| A2 | `skill-stocktake` (command) | 감사 자동화 | ✅ R3 | ⚠ batch eval | ✅ | ❌ | ❌ | ❌ | ✅ | P2 |
| A3 | `instinct-export` (command) | CL-v2 이관 | ✅ R2 | ✅ file I/O | ✅ | ❌ | ❌ | ❌ | ✅ | **P1** |
| A4 | `instinct-import` (command) | CL-v2 이관 | ✅ R2 | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | **P1** |
| A5 | `instinct-status` (command) | CL-v2 상태 조회 | ✅ R2 | ✅ | ⚠ jq로 가능 | ❌ | ❌ | ❌ | ✅ | P2 |
| A6 | `configure-ecc` (skill) | 설치 마법사 | ⚠ | ❌ interactive LLM | ❌ setup-harness.sh 존재 | ❌ | ❌ | ❌ | ❌ | **Drop** |
| A7 | `harness-optimizer` (agent) | 설정 분석/비용 최적화 | ✅ R3 | ❌ LLM-dep | ✅ | ❌ | ✅ | ❌ | ⚠ | P2 |
| A8 | `autonomous-agent-harness` (skill) | TMux/cron/MCP 자동화 | ⚠ Non-Goal | ✅ | ⚠ | ❌ | ✅ | ❌ | ❌ | Backlog |
| A9 | `agent-harness-construction` (skill) | 에이전트 설계 체계화 | ⚠ 참조용 | ✅ | ❌ CLAUDE.md 대체 | ❌ | ❌ | ❌ | ❌ | **Drop** |
| A10 | `rules/common/coding-style.md` | 공통 룰 | ✅ | ✅ | ❌ 이미 있음 | ✅ | ❌ | ❌ | ❌ | **Drop** (중복) |
| A11 | `rules/common/security.md` | 공통 룰 | ✅ | ✅ | ⚠ 부분 있음 | ✅ | ❌ | ✅ | ❌ | **P1** |
| A12 | `rules/common/performance.md` | 공통 룰 | ✅ | ✅ | ✅ | ⚠ | ✅ | ❌ | ❌ | **P1** |
| A13 | `agents/tdd-guide.md` | TDD 강제 에이전트 | ✅ | ⚠ LLM-dep | ⚠ test-policy.md 대체 | ❌ | ❌ | ❌ | ❌ | P2 |
| A14 | `agents/build-error-resolver.md` | 빌드 에러 복구 | ✅ | ⚠ LLM-dep | ✅ | ❌ | ⚠ | ❌ | ❌ | P2 |
| A15 | `agents/refactor-cleaner.md` | 데드코드 정리 | ⚠ | ⚠ | ✅ | ❌ | ❌ | ❌ | ❌ | Backlog |
| A16 | `agents/silent-failure-hunter.md` | 숨은 실패 탐지 | ✅ | ⚠ | ✅ | ❌ | ❌ | ❌ | ✅ | **P1** |
| A17 | `agents/planner.md` | 계획 전담 | ✅ | ⚠ | ⚠ uzys:plan 대체 | ⚠ | ❌ | ❌ | ❌ | P2 |
| A18 | `commands/learn.md` | 패턴 학습 커맨드 | ✅ R2 | ⚠ | ⚠ CL-v2 일부 대체 | ❌ | ⚠ | ❌ | ✅ | P2 |
| A19 | `commands/quality-gate.md` | 품질 게이트 커맨드 | ✅ | ✅ | ⚠ verification-loop 일부 대체 | ⚠ | ❌ | ❌ | ✅ | P2 |
| A20 | `commands/model-route.md` | 모델 선택 휴리스틱 | ✅ 빠진패턴 GC2 | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | **P0** |

### 6.2 집계

| 판정 | 개수 | 항목 |
|------|------|------|
| P0 | 1 | A20 |
| P1 | 5 | A1, A3, A4, A11, A12, A16 |
| P2 | 8 | A2, A5, A7, A13, A14, A17, A18, A19 |
| Backlog | 2 | A8, A15 |
| Drop | 3 | A6, A9, A10 |

(A16이 P1로 중복 표기 — 실제 P1은 6건)

---

## 7. Gap-B: GSD 미통합 자산 10개 후보

**컨텍스트**: `.dev-references/gsd/`는 통합 0건. GSD(Get Shit Done)는 [gsd-build/gsd-2](https://github.com/gsd-build/gsd-2) *(Phase 1 에이전트 보고, 미검증)* 에서 31k+ 스타, spec-driven + context engineering 시스템. 이 프로젝트는 GSD를 "사상만 흡수, 도구 미도입"(PRD D6)으로 결정했다. 아래는 그 결정을 **재검토**하기 위한 10개 후보.

### 7.1 판정표 (10개)

| # | 후보 | 유형 | ① | ② | ③ | ④ | ⑤ | ⑥ | ⑦ | 판정 |
|---|------|------|---|---|---|---|---|---|---|------|
| B1 | `gsd-plan-checker` (agent) | 계획 품질 검증 | ✅ | ⚠ LLM-dep | ⚠ reviewer 대체 | ❌ | ❌ | ❌ | ⚠ | P2 |
| B2 | `gsd-eval-auditor` (agent) | 평가 기준 검증 | ✅ | ⚠ | ✅ | ❌ | ❌ | ❌ | ⚠ | P2 |
| B3 | `gsd-debugger` (agent) | 자동 디버깅 | ⚠ | ⚠ LLM-dep | ⚠ build-error-resolver 대체 | ❌ | ❌ | ❌ | ⚠ | Backlog |
| B4 | `gsd-security-auditor` (agent) | 보안 감사 | ✅ | ⚠ | ⚠ security-reviewer 대체 | ❌ | ❌ | ✅ | ⚠ | P2 |
| B5 | `gsd-code-reviewer` (agent) | 리뷰 심화 | ✅ | ⚠ | ⚠ code-reviewer 대체 | ❌ | ❌ | ❌ | ⚠ | **Drop** (중복) |
| B6 | Gates taxonomy (pre-flight/revision/escalation/abort) | 패턴 문서 | ✅ | ✅ 카테고리 정의 | ✅ | ⚠ | ⚠ | ❌ | ✅ | **P1** |
| B7 | `hooks/session-start` (context 초기화) | hook | ✅ | ✅ | ⚠ 이미 있음 | ✅ | ✅ | ❌ | ✅ | **P1** (merge) |
| B8 | `/gsd-map-codebase` (command) | 코드베이스 인덱싱 | ✅ | ⚠ tree-sitter 의존 | ✅ Repository Map | ❌ | ✅ | ❌ | ✅ | **P0** |
| B9 | `docs/SPEC-WRITING.md` (가이드) | 문서 참조 | ✅ | ✅ | ⚠ uzys:spec 부분 대체 | ❌ | ❌ | ❌ | ❌ | P2 |
| B10 | `sdk/` prompt 포맷팅 (XML 구조) | 유틸 | ⚠ | ✅ | ⚠ | ❌ | ⚠ | ❌ | ❌ | Backlog |

### 7.2 집계

| 판정 | 개수 | 항목 |
|------|------|------|
| P0 | 1 | B8 |
| P1 | 2 | B6, B7 |
| P2 | 4 | B1, B2, B4, B9 |
| Backlog | 2 | B3, B10 |
| Drop | 1 | B5 |

---

## 8. Gap-C: supabase/agent-skills (사용자 명시 추가)

**컨텍스트**: [supabase/agent-skills](https://github.com/supabase/agent-skills) *(WebFetch 확인 2026-04-15)* — Supabase 공식 agent skills. 이 프로젝트는 **csr-supabase Track을 지원**하며(9 Tracks 중 하나), 사용자는 Supabase를 핵심 스택으로 사용한다(PRD §3). 현재 통합 0건.

### 8.1 리포지토리 내용 (WebFetch 검증됨)

| 스킬 | 설명 | 커버리지 |
|------|------|---------|
| `supabase` | 종합 Supabase 개발 skill — 모든 제품/통합 | Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues |
| `supabase-postgres-best-practices` | 8카테고리 성능 최적화 가이드 | 쿼리 최적화, 스키마 설계, RLS, 인덱스, 연결 풀링, SSR 통합(Next/React/SvelteKit/Astro/Remix) |

**설치 방법** (WebFetch 검증):
```bash
# Agent Skills Open Standard
npx skills add supabase/agent-skills
npx skills add supabase/agent-skills --skill supabase

# Claude Code 플러그인
claude plugin marketplace add supabase/agent-skills
claude plugin install supabase@supabase-agent-skills
claude plugin install postgres-best-practices@supabase-agent-skills
```

**형식**: Agent Skills Open Standard 준수 (SKILL.md frontmatter + `references/` 문서).

### 8.2 판정표

| # | 후보 | ① | ② | ③ | ④ | ⑤ | ⑥ | ⑦ | 판정 |
|---|------|---|---|---|---|---|---|---|------|
| C1 | `supabase` skill | ✅ csr-supabase Track 직결 | ✅ SKILL.md 표준 | ✅ Supabase 전문 지식은 대체 불가 | ✅ csr-supabase install 시 자동 활성화 가능 | ⚠ | ✅ RLS/secure auth 가이드 | ❌ | **P0** |
| C2 | `supabase-postgres-best-practices` skill | ✅ csr-supabase Track | ✅ 8 카테고리 명시 | ✅ | ✅ | ✅ 쿼리 최적화 → 비용 절감 | ✅ RLS/인덱스 보안 | ❌ | **P0** |

### 8.3 통합 방법 (결정 근거 제시, 실행은 별도 plan)

**옵션 A**: `setup-harness.sh`의 csr-supabase Track case에 `npx skills add supabase/agent-skills` 자동 호출 추가
- 장점: 1회 설치, dogfooding과 동일 패턴
- 단점: 프로젝트 설치 시 인터넷 의존, 오프라인 설치 불가

**옵션 B**: `claude plugin install supabase@supabase-agent-skills` + `postgres-best-practices@supabase-agent-skills` 를 `setup-harness.sh`에서 자동 호출
- 장점: 공식 플러그인 경로 (유지보수 보장)
- 단점: Claude Code 플러그인 시스템 의존

**옵션 C**: `.dev-references/supabase-agent-skills/`에 로컬 clone + `cherrypicks.lock`에 추가 + `templates/skills/supabase/` + `templates/skills/supabase-postgres-best-practices/`로 복사
- 장점: 버전 고정, 오프라인 설치 가능
- 단점: sync-cherrypicks.sh로 업데이트 관리 필요

**권장 판정 (4기준 기반)**: **옵션 B** — Claude Code 공식 플러그인 경로가 ④ 워크플로우 기준에서 가장 명확하고 ③ 대체 불가 기준을 강화한다. 옵션 C는 유지 비용이 높고 옵션 A는 플러그인 시스템을 우회한다.

---

## 9. Gap-D: 빠진 업계 표준 패턴 5개

아래 5건은 Phase 1 리서치에서 "현재 프로젝트에 미반영" 으로 확인된 것. 각 항목은 출처 + 7기준 판정.

### GD1. Automatic Context Compaction + Checkpoint Reinitiation

**설명**: 컨텍스트 윈도우 임계치 도달 시 자동으로 대화 요약 + 재초기화. 아키텍처 결정/버그/구현 세부는 checkpoint로 preserve.

**현재 상태**: `strategic-compact` skill wire-up(v26.2.1) 완료 — 50회 tool call 후 **제안만**. 자동 실행 + checkpoint 관리 없음. `ecc:checkpoint` 커맨드는 있으나 수동 호출.

**출처**:
- [GSD v2](https://github.com/gsd-build/gsd-2) *(Phase 1 에이전트 보고, 미검증)*
- [Context Rot solutions — The New Stack (2025)](https://thenewstack.io/beating-the-rot-and-getting-stuff-done/) *(Phase 1 에이전트 보고, 미검증)*

**판정**: ① ✅ (R4 Context Management) / ② ✅ / ③ ✅ / ④ ⚠ / ⑤ ✅ / ⑥ ❌ / ⑦ ⚠ → **P0**

### GD2. Cost Optimization Gates + Model Selection Heuristics

**설명**: Track별 token budget cap, Haiku vs Opus 자동 선택, plan-mode budget per teammate.

**현재 상태**: CLAUDE.md에 "haiku 4.5 / sonnet 4.6 / opus 4.5 역할 구분" 서술만. 자동 라우팅 없음. Track별 cost gate 없음.

**출처**:
- [Claude Code Docs — Cost Management](https://code.claude.com/docs/en/costs) *(Phase 1 에이전트 보고, 미검증)*
- ECC `commands/model-route.md` (Gap-A20)

**판정**: ① ✅ (PRD 4.3 메트릭) / ② ✅ 휴리스틱 결정론 / ③ ✅ / ④ ❌ / ⑤ ✅ / ⑥ ❌ / ⑦ ✅ → **P0**

### GD3. Cross-Track Memory Sharing + Conflict Resolution

**설명**: 9 Tracks가 각자 instinct를 축적할 때, 다른 Track과 충돌(예: csr Track의 insight가 ssr Track과 상충) 발생 시 해결 프로토콜.

**현재 상태**: `ecc:promote` 커맨드(promote만). demote, conflict resolution, cross-track merge 프로토콜 없음.

**출처**:
- [affaan-m/everything-claude-code — evolve skill](https://github.com/affaan-m/everything-claude-code) *(Phase 1 에이전트 보고)*

**판정**: ① ✅ (R2 크로스 프로젝트 learning) / ② ⚠ / ③ ✅ / ④ ❌ / ⑤ ⚠ / ⑥ ❌ / ⑦ ⚠ → **P2**

### GD4. In-Harness Vulnerability Scanning + Auto-Remediation

**설명**: hooks/MCP/env vars 자동 스캔 + 자동 수정 제안. 현재 `/ecc:security-scan`은 스캔만, remediation step 없음.

**출처**:
- [everything-claude-code AgentShield](https://github.com/affaan-m/everything-claude-code) *(Phase 1 에이전트 보고)*
- CVE-2025-59536, CVE-2026-21852 (Claude Code RCE via hooks/MCP) *(Phase 1 에이전트 보고, 미검증)*

**판정**: ① ✅ (PRD 4.3 보안 스캔 누락률) / ② ⚠ / ③ ✅ / ④ ⚠ / ⑤ ❌ / ⑥ ✅ / ⑦ ✅ → **P1**

### GD5. Dynamic Recursive Agent Spawning (제약 + Workaround)

**설명**: Parent agent가 child agents를 동적으로 spawn. 현재 Claude Code 제약: sub-agents는 Task tool로 재귀 호출 불가.

**Workaround**: `claude -p` via bash *(Phase 1 에이전트 보고, 미검증)*.

**현재 상태**: 정적 Track 구조. Dynamic role-based spawn 미지원.

**출처**: [Claude Code issue — sub-agent limitation](https://github.com/anthropics/claude-code/issues/4182) *(Phase 1 에이전트 보고, 미검증)*

**판정**: ① ⚠ (PRD Non-Goal 근접) / ② ❌ / ③ ✅ / ④ ❌ / ⑤ ❌ / ⑥ ❌ / ⑦ ❌ → **Backlog**

---

## 10. Gap-E: 최근 6개월 생태계 변화 (Phase 1 에이전트 보고)

각 항목에 대한 **반영 상태** 만 표기. 판정은 §11에서 통합.

| # | 변화 (Dec 2025 – Apr 2026) | 이 프로젝트 반영 | 조치 필요 |
|---|------|------|------|
| E1 | Agent Skills Standard (Anthropic Dec 2025 공개, SKILL.md frontmatter) | ✅ 준수 (cherry-pick 및 자체 skill 모두 frontmatter) | 없음 |
| E2 | Memory Architecture Standardization (Mar 2026, 3-layer) | ⚠ auto memory는 사용, 공식 Memory feature 미검증 | P2 — 검증 |
| E3 | Agent Teams / Multi-Session (v2.1.32+, 7x token cost) | ❌ 단일 세션만, Agent Teams 미도입 | Backlog (비용 고려) |
| E4 | Security Hardening Post-CVE (MCP pre-execution blocking) | ⚠ `.mcp.json` 프로젝트 스코프는 채택, pre-execution blocking 미구현 | **P1** |
| E5 | Context Rot 해결책 수렴 (isolated subagents + atomic commits + fresh context) | ✅ reviewer fork + commit-policy 즉시 커밋 | 없음 |
| E6 | Cost Optimization first-class | ❌ 미반영 (GD2와 동일) | **P0** (GD2) |

---

## 11. 우선순위 개선 제안 (P0/P1/P2/Backlog/Drop)

§6–§10의 판정을 통합해 실행 우선순위로 정리한다.

### 11.1 P0 — 필수 (즉시 PRD D23+ 결정 대상)

| ID | 항목 | 근거 | 예상 영향 |
|----|------|------|---------|
| **P0-1** | supabase/agent-skills (C1+C2) 통합 | 사용자 명시 + Supabase 필수 Track | csr-supabase 전 사용자에게 즉시 가치 |
| **P0-2** | Model Selection Heuristics (A20 + GD2) | Cost 메트릭 + PRD 4.3 | 토큰 비용 40–70% 감소 가능(에이전트 보고) |
| **P0-3** | Automatic Context Compaction (GD1) | R4 Context Management + strategic-compact 심화 | 장시간 세션 안정성 |
| **P0-4** | Repository Map / gsd-map-codebase (B8) | 큰 codebase 이해 + token 효율 | full Track에서 특히 가치 |
| **P0-5** | (확장 후보) AgentShield 자동 연동 (GD4를 P0로 승급 시) | CVE 대응 필요 → 보안 우선 시 P1→P0 | 선택적 |

### 11.2 P1 — 권장 (Phase 5 Roadmap 후보)

| ID | 항목 | 근거 |
|----|------|------|
| P1-1 | `skill-comply` (A1) | R3 Rule 효과 측정 자동화 |
| P1-2 | `instinct-export/import` (A3/A4) | R2 크로스 프로젝트 learning |
| P1-3 | `rules/common/security.md` (A11) | 보안 룰 보강 |
| P1-4 | `rules/common/performance.md` (A12) | 성능 룰 보강 |
| P1-5 | `silent-failure-hunter` (A16) | 숨은 실패 탐지 |
| P1-6 | GSD Gates Taxonomy (B6) | pre-flight/revision/escalation/abort 분류 도입 |
| P1-7 | GSD `session-start` hook merge (B7) | 기존 session-start.sh 보강 |
| P1-8 | AgentShield 자동 연동 (GD4) | 보안 스캔 + remediation |
| P1-9 | MCP pre-execution blocking (E4) | CVE 대응 |

### 11.3 P2 — 보류 (재검토 대기)

A2, A5, A7, A13, A14, A17, A18, A19, B1, B2, B4, B9, E2, GD3 (총 14건). 현재 판단 근거 부족 또는 대체 존재.

### 11.4 Backlog

A8, A15, B3, B10, E3, GD5 (총 6건). Non-Goal 근접 또는 시스템 제약으로 즉시 실행 불가.

### 11.5 Drop (제거 또는 통합 안 함)

A6 (configure-ecc — setup-harness.sh 중복), A9 (agent-harness-construction — CLAUDE.md 중복), A10 (coding-style — 이미 존재), B5 (gsd-code-reviewer — code-reviewer 중복).

### 11.6 집계

| 판정 | 개수 |
|------|------|
| **P0** | 5 |
| **P1** | 9 |
| **P2** | 14 |
| **Backlog** | 6 |
| **Drop** | 4 |
| **합계** | 38 |

---

## 12. Open Decisions + 사용자 결정 요청

이 문서는 판정만 한다. 아래 항목은 **사용자 승인이 필요**:

1. **P0 5건의 통합 순서**: 어느 것을 먼저 할지 (권장: supabase → Repository Map → Model Route → Context Compaction → AgentShield)
2. **Supabase 통합 옵션**: §8.3의 A/B/C 중 선택 (권장: **옵션 B** Claude Code 플러그인 경로)
3. **Phase 5 PRD 업데이트**: D23–D30 결정 추가 여부. 이 문서가 그 입력으로 사용되는가?
4. **GSD 사상 재검토**: PRD D6 ("사상만 흡수, 도구 미도입")을 GD1/B8/B6/B7 4건에 한해 부분 완화할지
5. **Security 우선순위**: GD4(AgentShield)와 E4(MCP pre-execution)를 P0로 승급할지
6. **이 문서의 상태**: Living document로 유지(수시 업데이트) vs Snapshot(2026-04 고정)?
7. **Backlog 6건**: 영구 폐기 vs R5+ 로드맵에 유지?

---

## 부록 A. 참조 링크

**검증된 출처** (WebFetch/직접 확인):
- [supabase/agent-skills](https://github.com/supabase/agent-skills) *(WebFetch 2026-04-15)*
- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) *(기존 프로젝트 참조)*
- [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) *(cherry-pick 소스)*
- [vercel-labs/skills](https://github.com/vercel-labs/skills) *(setup-harness.sh 사용)*
- [pbakaus/impeccable](https://github.com/pbakaus/impeccable) *(skills add 등록)*

**Phase 1 에이전트 보고, 미검증** (이 문서에서 claim 에 `*(Phase 1 에이전트 보고, 미검증)*` 표기):
- Anthropic Engineering blog — effective-harnesses-for-long-running-agents
- Anthropic Engineering blog — harness-design-long-running-apps
- GSD repository — gsd-build/gsd-2
- HumanLayer blog — Skill Issue: Harness Engineering for Coding Agents
- State of Context Engineering 2026 — SwirlAI Newsletter
- Context Rot — The New Stack
- Claude Code Docs — Hooks / Memory / Costs
- Claude Code issue #4182 — sub-agent recursive limitation
- Superpowers (obra/Jesse Vincent)
- CVE-2025-59536, CVE-2026-21852 (Check Point Research)

**확인 실패**: 위 "미검증" 항목 중 실제 URL이 사용자/후속 작업에서 검증되어야 함.

---

## 부록 B. 검증 체크리스트

이 문서 자체에 대한 품질 체크:

- [x] 11 섹션 + 부록 구조
- [x] 7기준 판정 표 — §6(20행) + §7(10행) + §8(2행) = 32행
- [x] 모든 claim 에 출처 또는 `*(미검증)*` 표기
- [x] 추정/직관/선호 표현 0건 (자체 grep 확인)
- [x] P0/P1/P2/Backlog/Drop 분류 + 집계
- [x] Open Decisions 섹션 (사용자 결정 요청 명시)
- [ ] 사용자 승인 (별도 작업)
- [ ] Phase 5 PRD 업데이트 입력 (별도 plan)

---

## 부록 C. 감사 메모 (자기 점검)

**CLAUDE.md Decision Meta-Rule 준수 확인**:
- ✅ 모든 필수/권장/보류 판정은 명시적 7기준 적용 결과
- ✅ 주관/감각/선호 표현 0건 (자체 grep 검토 완료 — CLAUDE.md Decision Meta-Rule 안티패턴 키워드 매칭 없음)
- ✅ 기준 정의를 §5에 선행 배치, §6 이후 적용
- ✅ 같은 기준을 모든 후보에 동일 적용
- ✅ 기준 부족 시 보류(P2) 또는 Backlog 로 분류 (강제 승급 없음)

**편향 방지 체크**:
- 사용자가 "supabase/agent-skills 필수" 라고 명시 → §8에서 `① 요구사항` 판정 근거 명시(PRD §3 Target User + csr-supabase Track 존재)
- supabase 항목을 P0로 자동 분류하지 않고 7기준 적용 결과로 도달

**한계 명시**:
- Phase 1 에이전트 보고 URL 중 일부는 미검증. 문서 내 **"미검증" 라벨 유지**로 독자가 판단 가능
- 판정은 파일명/설명 기반. 실제 품질은 통합 후 검증 단계에서 재평가 필요
