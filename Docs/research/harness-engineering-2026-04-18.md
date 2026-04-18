# Harness Engineering Deep Research — 2026-04-18

**Goal**: 외부 harness 엔지니어링 best practice 2026 + 우리 프로젝트 부족점/개선 후보 도출.
**Method**: 3 병렬 agent (외부 리서치 / SPEC 입도 ↔ 모델 capacity / 자체 audit).
**Confidence**: High on Anthropic-cited claims, Medium on vendor blogs, Low on single-data-point claims (e.g., "harness > model" 22 vs 1).

---

## Executive Summary

**1. 사용자 가설은 directionally correct.** Opus 4.7 같은 high-capacity 모델은 fine-grained 사전 분해 → 오히려 overhead. Anthropic 자체 task budget 도입, Latent Space "minimal harness, maximal model" 철학, dev.to "Taming Opus 4.5's Efficiency" 등 다수 증거. 그러나 **spec의 what + why + boundaries(Non-Goals/DO NOT CHANGE)는 여전히 load-bearing** — 줄여야 할 건 **how 분해**, 줄이지 말아야 할 건 **what/why**.

**2. 우리 프로젝트 강점**: 6-gate enforcement, SPEC AC outcome-focused, SOD via context fork, circuit breakers, cherrypick manifest.

**3. 우리 프로젝트 핵심 공백**:
- **P0**: 모델 인식형 plan depth 부재 — 모든 SPEC에 동일 plan 강제 (Opus엔 과함)
- **P0**: Session 결정 로그 없음 → 학습 루프 검증 불가
- **P0**: Instinct promotion 파이프라인 stub (실제 promotion 사례 0)
- **P1**: AC ↔ 코드 traceability 없음 — drift 검출 약함
- **P1**: Multi-agent review 직렬 실행 (병렬 fanout 미구현)
- **P2**: 9 Track union — 과도, 4-5개로 축소 검토
- **P2**: ship-checklist 강제 아닌 advisory

---

## 1. 외부 best practice 2026

### Harness 정의 (Anthropic + HumanLayer 공통)
"LLM 모델이 아닌 모든 것" — system prompt + MCP + sub-agents + hooks + skills + slash commands + permissions + back-pressure (test/lint/type).

### 강력한 단일 데이터: harness > model
Morph 분석: harness swap → SWE-bench +22점, model swap → +1점. 1개 연구라 directional이지 universal 아님.

### Workflow gate 패턴
| 패턴 | 채택 | Anthropic 권장 |
|------|------|---------------|
| Spec→Plan→Build→Test→Review→Ship (6-gate) | 우리 + 일부 enterprise SDD | 명시 X |
| Plan-mode-only | Cursor / Codex 보편 | 강하게 권장 ("planning ≠ execution 분리가 가장 중요") |
| Vibe coding | Karpathy throwaway용 한정 | 명시 반대 (production 부적합) |
| TDD-first | agent-skills 표준 | 권장 |
| Ralph loop | Geoffrey Huntley + vercel-labs | 명시 X (folklore 명칭) |
| Initializer + Coding 2-agent | Anthropic 자체 long-running | **공식 권장** |

**관찰**: Anthropic 본인은 6-gate 같은 ceremony 권장 안 함. **우리 6-gate는 over-prescribed 가능성**. 다만 SPEC-driven enterprise workflow엔 fit.

### Hook 패턴
**Universal**: PostToolUse 자동 lint, PreToolUse 파괴적 명령 차단, Stop hook tests-pass enforce
**Production 패턴**: blocking보다 **feedback injection** ("handler.ts:42 — 3 TS errors") 권장
**ETH Zurich 연구**: LLM 생성 CLAUDE.md = **성능 저하 + 토큰 20%↑**. 인간 작성 권장. ✅ 우리는 인간 작성

### Multi-agent
- Subagent fanout 3-5 + context isolation = 표준
- **Cost: 15× tokens** vs single chat — 고가치 task만 정당화
- Reviewer-as-second-opinion 증거 약함 (논문 부재)

### MCP 트렌드
Tool Poisoning Attack (Invariant Labs 2025)으로 **allowlist + 신뢰 등급** 표준화. ✅ 우리 `.mcp-allowlist` 일치

### 2026 emerging 트렌드
1. harness > model 인식 확산
2. MCP zero-trust 기본
3. Plan mode → Cursor/Codex 보편화
4. Hooks > prompts (메커니즘으로 강제)
5. Hybrid harness (Claude plan / Codex execute / Claude review)
6. Multi-role 환경 — **여전히 미성숙. 우리 프로젝트가 실제 사례** (논문 부재)

---

## 2. SPEC 입도 ↔ 모델 capacity

### 사용자 가설 검증

**가설**: "Opus면 자잘하게 쪼갤 필요 없지 않나"
**판정**: **directionally correct** (vendor blog + Anthropic + practitioner guides 다수 일치, 그러나 head-to-head RCT는 없음)

### 증거
- **Anthropic Opus 4.7 release notes**: task budgets 도입 = 모델 self-pace 사전 분해 불필요
- **keepmyprompts Opus 4.7 가이드**: "think step by step" 같은 scaffolding은 reasoning gap 보충용 — Opus 4.7은 native로 처리, **삭제해도 효과 동일**
- **Latent Space "Is Harness Engineering Real?"**: Claude Code 철학 = "minimal harness, maximal model"
- **MindStudio Qwen vs Opus**: 작은 모델은 ambiguity 처리 약함, Opus는 unstated goal infer

### 모델 tier별 권장 spec depth (Agent B)

| 모델 | Spec | AC | Plan | TodoWrite |
|------|------|----|----|----------|
| Haiku 4.5 | Detailed + edge cases | per-subtask | pre-written 10-20 task | forced fine-grained |
| Sonnet 4.6 | goal + 3-5 milestones | per-milestone | plan-mode draft + edit | conditional |
| **Opus 4.5/4.6/4.7** | **1-paragraph what+why+boundaries** | **outcome-level only** | **ambiguous할 때만, 단순 작업엔 skip** | only when genuine uncertainty |

Anthropic 공식: "if you can describe the diff in one sentence, skip the plan"

### 안티패턴
- **Over-decomposition (Opus)**: TodoWrite for trivial edits = 토큰 burn + context fragment + iteration slow (dev.to 실증)
- **Micro-AC on Opus**: 모델이 이미 enforce, spec이 noise됨 (Marmelab)
- **Under-spec**: ambiguity → multi-agent contradictions, policy-invisible violations

### 우리 프로젝트 implication
- `/uzys:plan`이 **모든 SPEC**에 vertical slicing + per-task AC 강제 — **Opus엔 과함**
- planning-and-task-breakdown 자동 호출 — model-aware로 conditional 변경 필요
- 사용자가 짚은 지점이 정확함

---

## 3. 자체 audit (Agent C)

### 강점 6
1. 6-gate workflow 강제 (`gate-check.sh` exit 2)
2. SPEC AC outcome-focused + Non-Goals/DO NOT CHANGE
3. SOD via subagent context fork
4. Circuit breakers (3 retry, 5 Ralph iter)
5. Multi-track union install
6. cherrypick.lock manifest + sync 스크립트

### Critical gaps

| # | Severity | Gap | Evidence |
|---|:-:|------|----------|
| 1 | **P0** | Session 결정 로그 없음 | grep "decision log" → 없음. 감사 불가 |
| 2 | **P0** | Instinct promotion stub | 실제 promotion 사례 0. CL-v2 `instinct.json` 미발견 |
| 3 | **P1** | Spec drift = 파일 사이즈 체크만 | `spec-drift-check.sh`에 AC↔code matcher 없음 |
| 4 | **P1** | Multi-axis review 직렬 | parallel fanout 미구현 — 1× 시간 |
| 5 | **P2** | Ralph loop checkpoint 없음 | iter 4 깨지면 iter 3 복원 불가 |

### Over-engineered/under-used
- **9 Track + union**: 추가 track마다 6+ 파일. 실프로젝트 ≤3 track 사용. **4-5로 축소 권장** (csr/ssr/data/executive/full)
- **continuous-learning-v2**: 설치만 됨, 실 사용 없음. 첫 promotion 사례 없으면 dead code
- **ship-checklist**: advisory (exit code 강제 X) — 명목상 gate

### 외부 표준 대비 gap
| 영역 | 표준 | 우리 | Gap |
|------|------|-----|-----|
| Spec 추적 | bidirectional AC↔code | 단방향 (AC 작성만) | P1 |
| Multi-agent | parallel fanout | sequential | P1 |
| 학습 loop | precedent 있음 | precedent 없음 | P0 |
| Ralph loop | versioned iter | 단일 상태 | P2 |
| 관측성 | session+decision log | 없음 | P0 |
| Lock-in | provider-agnostic (Agent Skills) | Claude Code 강결합 | P1 |

---

## 4. Top 개선 후보 (ROI 순)

### 즉시 진행 권장 (P0/P1, low effort)

**A. 모델 인식형 Plan depth (P0, 사용자 가설 직접 반영)**
- `/uzys:plan` 스킬에 모델 tier 인식 분기:
  - Opus: SPEC만으로 충분 시 plan skip 허용 (outcome AC만)
  - Sonnet: 3-5 milestone plan
  - Haiku: 기존 detailed task list 유지
- planning-and-task-breakdown 강제 호출 → conditional
- 효과: 사용자 정확히 지목한 ceremony 제거

**B. Session Decision Log (P0, ~50 LOC)**
- SessionStart hook에서 `.claude/logs/YYYYMMDD.session.md` 생성
- 게이트 전환/instinct/escalation/주요 결정 append
- 학습 루프 검증 + replay 가능

**C. Instinct promotion 첫 사례 (P0)**
- 실제 1-2개 instinct을 Rule로 promote
- `docs/decisions/ADR-N-instinct-promoted-X.md` 기록
- CL-v2 dead code 비판 해소

### 다음 라운드 (P1, medium effort)

**D. AC ↔ code traceability matcher (P1)**
- `spec-ac-matcher.sh`: SPEC.md AC 파싱 → 코드/테스트 grep → match confidence
- spec-drift-check.sh와 통합

**E. /uzys:review 병렬 fanout (P1)**
- code-reviewer + security-reviewer + performance-reviewer 동시 실행
- 결과 merge → 단일 리포트
- 효과: 3-5× speedup

### 후순위 (P2, high effort)

**F. Track 9 → 4-5 축소** (csr/ssr/data/executive/full + 나머지는 옵션 add-track)
**G. Ralph loop 체크포인트** (`.claude/checkpoints/ralph-iter-N.tar.gz`)
**H. ship-checklist exit code 강제**
**I. AGENTS.md 표준 호환** (Cursor/Codex portability)

---

## 5. 사용자 가설에 대한 최종 답

**"스펙은 중요하지만 자잘하게 쪼갤 필요는 없지 않나, Opus면"** → **맞다.**

증거:
- Anthropic Opus 4.7 task budgets = 모델 self-pace
- "minimal harness, maximal model" Claude Code 철학
- Latent Space + dev.to + Marmelab 모두 일치
- "if diff를 1문장으로 설명할 수 있으면 plan skip" (Anthropic best practices)

**다만 줄여야 할 것은 how(task 분해), 줄이지 말아야 할 것은 what + why + boundaries**.
- WHAT (Objective, Functional Goals): 유지
- WHY (Business Goals, 의사결정 근거): 유지
- BOUNDARIES (Non-Goals, DO NOT CHANGE): 유지 — Opus도 ambiguity로 폭주 가능
- HOW (vertical slicing, per-task AC): **모델 tier별 conditional**

우리 프로젝트가 받아들일 핵심 변경: **`/uzys:plan`과 planning-and-task-breakdown 호출을 model-aware conditional로**. SPEC 자체는 현 구조 유지.

---

## Sources

### Agent A (외부 best practice)
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- https://www.anthropic.com/engineering/multi-agent-research-system
- https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents
- https://nyosegawa.com/en/posts/harness-engineering-best-practices-2026/
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/sub-agents
- https://github.com/snarktank/ralph
- https://modelcontextprotocol.io/specification/draft/basic/security_best_practices
- https://thoughts.jock.pl/p/ai-coding-harness-agents-2026
- https://addyosmani.com/blog/self-improving-agents/
- https://arxiv.org/html/2508.08322v1

### Agent B (SPEC 입도)
- https://marmelab.com/blog/2025/11/12/spec-driven-development-waterfall-strikes-back.html
- https://www.technologyreview.com/2025/11/05/1127477/from-vibe-coding-to-context-engineering-2025-in-software-development/
- https://www.keepmyprompts.com/en/blog/claude-opus-4-7-prompting-guide-whats-changed
- https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7
- https://code.claude.com/docs/en/best-practices
- https://www.latent.space/p/claude-code
- https://www.latent.space/p/ainews-is-harness-engineering-real
- https://cursor.com/blog/scaling-agents
- https://blog.continue.dev/task-decomposition
- https://addyosmani.com/blog/good-spec/
- https://dev.to/shinpr/taming-opus-45s-efficiency-using-todowrite-to-keep-claude-code-on-track-1ee5

### Agent C (자체 audit)
- 본 리포지토리 `/templates/`, `/setup-harness.sh`, `/Docs/SPEC.md`, `/Docs/research/repo-deep-research-2026-04-17.md`
