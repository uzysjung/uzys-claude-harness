# Claude Code 환경 구성 Blueprint

> **Owner**: Jay (CEO/CTO/CISO/CSO/Data Scientist)
> **Date**: 2026-04-12
> **Status**: Draft — 확인 후 실행 단계로 전환

---

## 1. 현재 상태 (As-Is)

### 1.1 Jay의 역할

| 역할 | 핵심 업무 |
|------|-----------|
| CEO | 사업 의사결정, 전략 방향 |
| CTO | 기술 ROI, 외주 비용 검증, 관리체계, 워크플로우 정의, 아키텍트 |
| CISO | 보안 관리체계 (K-ISMS 등) |
| CSO (전략) | 사업 기획, 경쟁 분석, 제안서, DD |
| Data Scientist/Analyst | Python 생태계, DuckDB, Trino, ML/DL |

### 1.2 기술 스택

**CSR (Client-Side Rendering)** — Tauri로 Mac/Windows 앱 + iOS/AOS 앱 확장 전제

| # | Backend | Frontend | DB | 배포 |
|---|---------|----------|----|------|
| CSR-1 | Supabase Edge Functions | React + shadcn/ui | Supabase (PostgreSQL) | Supabase |
| CSR-2 | Railway + Fastify | React + shadcn/ui | PostgreSQL | Railway |
| CSR-3 | Railway + FastAPI | React + shadcn/ui | PostgreSQL | Railway |

**SSR (Server-Side Rendering)**

| # | Backend | Frontend | DB | 배포 |
|---|---------|----------|----|------|
| SSR-1 | Railway + FastAPI | Jinja2 + HTMX + Tailwind/daisyUI | PostgreSQL | Railway |
| SSR-2 | Railway + Next.js | React + shadcn/ui | PostgreSQL | Railway |

**데이터 분석/사이언스** — Claude Code에서 통합 운영

| 영역 | 도구 |
|------|------|
| 범용 분석 | Python (pandas, polars), DuckDB, Trino |
| ML/DL | scikit-learn, PyTorch/TensorFlow 등 전통 ML + 딥러닝 |
| 시각화 | matplotlib, plotly 등 |
| Desktop GUI | PySide6 — 간단한 분석/예측 프로그램, 도구성 앱 |

**공통 인프라**

| 항목 | 도구 |
|------|------|
| 형상관리 | Git + GitHub |
| PaaS | Railway, Supabase |
| OCI | Oracle Cloud Infrastructure (SSH port forwarding) |
| AI 코딩 에이전트 | Claude Code (Opus), OpenCode, Antigravity |

### 1.3 현재 Claude Code 구성

**확정된 것:**

- MCP: Context7, GitHub MCP (2개만)
- 공통 스킬: postgres-best-practices, architecture-decision-record, impeccable, playwright-skill
- **디자인 도구**: Impeccable (pbakaus/impeccable, 18K★) — `/impeccable teach`로 프로젝트 디자인 컨텍스트 생성 → `/polish`, `/critique`, `/audit` 등으로 디자인 품질 관리
- **디자인 레퍼런스**: awesome-design-md (VoltAgent, 66개 DESIGN.md) — 유명 사이트 디자인 시스템을 마크다운으로 추출. 프로젝트에 DESIGN.md 드롭해서 AI가 참조
- **워크플로우 레퍼런스**: addyosmani/agent-skills — Define→Plan→Build→Verify→Review→Ship 6단계 워크플로우. 상식적인 개발 프로세스의 간결한 에이전트 구현
- **워크플로우 뼈대**: addyosmani/agent-skills — Define→Plan→Build→Verify→Review→Ship 6단계 게이트
- **도구 레이어**: ECC cherry-pick — security-scan, continuous-learning-v2, code-reviewer, security-reviewer, git-workflow, testing
- Rules: 7개 공통 (code-style.md, error-handling.md 포함)
- 설치 스크립트: setup-tooling.sh / setup-tooling.ps1 (대화형)

**이 프로젝트에서 구축한 것:**

- AGENT-GUIDELINES (11개 원칙): Think Before Acting, Simplicity First, Surgical Changes, Goal-Driven Execution, Separate Eval from Gen, Long-Running Management, Fact vs Opinion, Sprint Contract, Circuit Breakers, Harness Maintenance, Perimeter Not Blueprint
- PRD 템플릿 (Section 1-13): Status Tracker, Change Log, Decision Log, Retrospective 포함
- PRD Lifecycle & Change Management: Draft→Review→Approved→In Progress→Complete
- prd-lifecycle SKILL.md: Create, Session Start, Phase Transition, Change Request, Review, Complete 트리거
- 글로벌 CLAUDE.md (행동 철학)
- 프로젝트별 CLAUDE.md 템플릿

### 1.4 관심 있는 도구/프레임워크

| 도구 | 상태 | 관심 포인트 |
|------|------|------------|
| GSD (get-shit-done) v1/v2 | 평가 중 | 작은 프로젝트에서 오버헤드 우려. Opus 사용 시 강제가 오히려 방해? |
| gitagent | 컨셉 관심 | Git-native 에이전트 정의 표준. 프레임워크 불가지론. compliance 지원 |
| revfactory/harness | 컨셉/아이디어만 | 메타스킬로 도메인별 에이전트 팀 설계 |
| ecc.tools | 사용 중 | 30 agents + 135 skills + 60 commands |

---

## 2. 요구사항 (To-Be)

### 2.1 에이전트 체계

Jay가 원하는 에이전트 구조:

```
범용 에이전트 (모든 프로젝트 공통)
├── 특화 에이전트 (분야별, 필요 시 활성화)
│   ├── [스택별 개발 에이전트]
│   ├── [데이터 분석 에이전트]
│   ├── [비즈니스/전략 에이전트]
│   └── ...
└── 리뷰 에이전트 (생성-평가 분리 원칙 구현)
```

**모든 에이전트에 공통 강제되어야 할 것:**

| 영역 | 내용 |
|------|------|
| Memory | 세션 간 경험 축적, 반복 실수 방지 |
| PRD | PRD 기반 개발, PRD를 persistent anchor로 참조 |
| 변경/형상관리 | PRD 변경 → Git 반영, Change Log/Decision Log 추적 |
| **Git 워크플로우** | **코드/문서 변경 시 반드시 commit→push→PR. 자동화하되 오케스트레이터와 중복 금지** |
| Task 관리 | Phase 기반 작업 분해, Sprint Contract, 인간 게이트 |
| ADR | 의사결정 기록 (architecture-decision-record) |

### 2.2 해결해야 할 구체적 문제

| # | 문제 | 설명 |
|---|------|------|
| P1 | 양방향 PRD 변경 | PRD 먼저 변경 → 개발, 또는 서비스 변경 후 → PRD 업데이트. 양쪽 다 발생 |
| P2 | Git 반영 의무화 | PRD, 로드맵, Plan 변경도 Git에 커밋. 단, 버든 최소화 |
| P3 | 동시 세션 현황 동기화 | 같은 프로젝트에서 Claude Code 터미널 여러 개. PR과 현황이 반드시 반영 |
| P4 | 경험 축적 | 반복되는 실수나 세션 경험이 프로젝트 지식으로 누적 |
| P5 | ADR 기록 | 의사결정 내용이 구조적으로 기록·참조 |
| **P6** | **Git 워크플로우 중복** | **ECC의 git-workflow rule과 자체 Git 강제 규칙이 충돌할 수 있음. 레이어 경계 필요** |

### 2.3 리뷰 에이전트 구조 — 열린 의사결정

Anthropic Harness Design 논문의 핵심: **구현과 리뷰를 분리하면 품질이 비약적으로 향상.**

두 가지 접근:

| 접근 | 구현 | 장점 | 단점 |
|------|------|------|------|
| **A. 역할별 전문 리뷰어** | 코드 리뷰어, PRD 리뷰어, UI 리뷰어, QA 리뷰어 각각 별도 subagent | 도메인별 깊은 검증, 평가 기준 특화 가능 | 관리 포인트 증가, 토큰 오버헤드, 작은 프로젝트에서 과잉 |
| **B. 단일 리뷰어 + 역할 전환** | 하나의 리뷰 subagent가 context에 따라 코드/문서/UI/QA 관점 전환 | 관리 단순, 토큰 효율, 작은~중간 프로젝트에 적합 | 대형 프로젝트에서 검증 깊이 한계 |

**Jay의 의견 필요**: A vs B, 또는 하이브리드 (기본 B, 대형 프로젝트 시 A 확장)?

### 2.4 오케스트레이터 — 열린 의사결정

현재 ECC 사용 중. GSD에 대한 고민:

| 고려사항 | ECC (현행) | GSD v1 | GSD v2 |
|----------|-----------|--------|--------|
| 스타/커뮤니티 | ~116K★ | ~50K★ | ~5.3K★ |
| 프로젝트 규모 | 모든 규모 | 중~대형 최적 | 대형, 장기 자율 실행 |
| Opus와의 궁합 | 자유도 높음, Opus 판단 신뢰 | 구조 강제 (fresh context per task) | 독립 CLI, context 직접 제어 |
| 작은 프로젝트 부담 | 낮음 | 높을 수 있음 (discuss→plan→execute→verify 사이클 필수) | 더 높음 |
| 컨텍스트 관리 | 수동 (/compact, /clear) | 자동 (subagent마다 fresh 200K) | 완전 자동 |
| 학습 곡선 | 낮음 | 중간 | 높음 |

**현실적 옵션:**

1. **ECC 유지 (현행)**: Opus의 자체 판단력을 신뢰. CLAUDE.md + PRD lifecycle로 구조 보완.
2. **ECC + GSD v1 선택적**: 대형 프로젝트만 GSD. 작은 건 ECC.
3. **GSD v1 전면 전환**: 모든 프로젝트에 discuss→plan→execute→verify.

**Jay의 기존 판단**: "프로젝트마다 GSD 또는 ECC 하나만" — 이 원칙 유지하되, 선택 기준이 필요.

### 2.5 Tauri 확장

- 현재 진행 중. CSR 프로젝트에서 Mac/Windows + iOS/AOS 앱 확장.
- Tauri v2 기준. 기존 React 앱을 그대로 래핑.
- `.claude/rules/tauri.md` 필요 (이미 이전 세션에서 초안 작성).

---

## 3. 하네스 관점 정리

### 3.1 아키텍처 결정: agent-skills 기반 + ECC 도구 레이어

**핵심 판단**: 워크플로우 뼈대는 addyosmani/agent-skills의 6단계 게이트, 실행 도구는 ECC에서 cherry-pick.

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 0: Claude Code 시스템 프롬프트 (~50 inst, 변경 불가)   │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: 워크플로우 뼈대 (agent-skills 6단계 게이트)         │
│   Define → Plan → Build → Verify → Review → Ship           │
│   각 단계 완료 없이 다음 진행 금지                            │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: 행동 원칙 (글로벌 CLAUDE.md, 11개 원칙)             │
│   + PRD 라이프사이클 + Sprint Contract + Self-Audit          │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: 프로젝트 컨텍스트 (project CLAUDE.md)               │
│   스택, PRD 참조, DESIGN.md, .impeccable.md, Git Policy     │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Rules (.claude/rules/)                              │
│   code-style, error-handling, test-policy, tauri, pyside6   │
├─────────────────────────────────────────────────────────────┤
│ Layer 5: Skills (.claude/skills/)                            │
│   prd-lifecycle, impeccable, agent-skills 스킬들             │
│   + ECC cherry-pick: continuous-learning-v2, security-scan   │
├─────────────────────────────────────────────────────────────┤
│ Layer 6: Agents (.claude/agents/)                            │
│   reviewer (검증), data-analyst, strategist                  │
│   + ECC cherry-pick: code-reviewer, security-reviewer        │
├─────────────────────────────────────────────────────────────┤
│ Layer 7: Hooks (deterministic 100%)                          │
│   SessionStart, PreToolUse, Stop                             │
├─────────────────────────────────────────────────────────────┤
│ Layer 8: MCP + 외부 도구                                     │
│   Context7, GitHub MCP                                       │
└─────────────────────────────────────────────────────────────┘
```

**왜 이 구조인가:**

- **Opus는 간결한 원칙에 강하다**. 156개 스킬보다 16개 스킬 + 명확한 게이트가 Opus의 판단력을 더 잘 살린다.
- **HyperAgents 수렴 원리**: 에이전트가 자율 개선하면 최소한의 구조로 수렴한다. 최소 뼈대에서 시작하는 게 올바른 방향.
- **유지보수**: 16개 스킬은 Jay가 직접 읽고 수정할 수 있다. 156개는 불가능.
- **ECC는 도구로서 가치가 있다**: security-scan, continuous-learning-v2, code-reviewer는 검증된 도구. 전체 생태계를 뼈대로 쓸 필요 없이, 필요한 도구만 cherry-pick.

### 3.2 ECC cherry-pick 대상

| ECC 구성 요소 | 용도 | 가져오는 이유 |
|--------------|------|-------------|
| **continuous-learning-v2** | instinct 추출, confidence scoring, export | 경험 축적 (D3) |
| **security-scan (AgentShield)** | 보안 감사 + 설정 검증 | Ship 단계 게이트 (D9) |
| **code-reviewer agent** | 다관점 코드 리뷰 | Review 단계 보강 |
| **security-reviewer agent** | OWASP, 시크릿 감지 | Review 단계 보강 |
| **git-workflow rule** | Conventional Commits, PR 템플릿 | Git How 레이어 (D7) |
| **testing rule** | pytest/vitest 패턴 | Verify 단계 보강 |

**가져오지 않는 것**: ECC의 planner agent(agent-skills의 Plan이 대체), prd-workflow(우리 prd-lifecycle이 대체), orchestrate command(agent-skills의 게이트 구조가 대체), 대부분의 비즈니스 스킬(필요 시만).

### 3.3 하네스 유지보수 원칙 적용

- **현재 Opus 기준**: Opus는 instruction-following이 강하므로, 과도한 scaffold가 오히려 방해될 수 있다.
- **주기적 재검토**: 새 모델 출시 시 기존 규칙이 여전히 필요한지 확인.
- **점진적 추가**: 실패가 관찰될 때만 규칙/hook 추가. 선제적으로 만들지 않는다.
- **측정 가능한 제거**: 구성 요소를 하나씩 빼면서 영향 측정.

### 3.3 CLAUDE.md 토큰 예산

- 프론티어 모델 기준 ~150-200개 instruction 한계
- Claude Code 시스템 프롬프트가 ~50개 소비
- **남은 예산: ~100-150개 instruction**
- 글로벌 CLAUDE.md (11개 원칙): ~40-50 instruction 추정
- 프로젝트 CLAUDE.md: ~30-40 instruction 추정
- **여유: ~20-60 instruction** → 스킬/rules로 분산해야 함

---

## 4. 에이전트 설계 (제안)

### 4.1 범용 에이전트 (글로벌 — 모든 프로젝트)

**역할**: 기본 개발, 문서 작성, 분석. Jay의 모든 작업에 적용.

**구현**: `~/.claude/CLAUDE.md` (이미 구축된 11개 원칙)

**공통 강제 메커니즘:**

| 영역 | 구현 레이어 | 방식 |
|------|------------|------|
| Memory/경험 축적 | Hook (Stop) + 스킬 | 세션 종료 시 learnings 자동 추출 → `.claude/memory/learnings.md` 에 추가 |
| PRD 참조 | 프로젝트 CLAUDE.md | `docs/PRD.md`를 매 세션 시작 시 읽도록 지시 |
| 변경관리 | prd-lifecycle 스킬 | Change Request 유형 판단 → 자동/수동 분기 |
| Git 반영 | Hook (Stop) + Rules | Phase/작업 완료 시 자동 커밋 제안. PRD 변경도 포함 |
| Task 관리 | prd-lifecycle 스킬 | Sprint Contract, Phase Transition, Self-Audit |
| ADR | architecture-decision-record 스킬 | 중대 결정 시 자동 트리거 |

### 4.2 특화 에이전트 (프로젝트별 활성화)

subagent 파일로 구현. 프로젝트 `.claude/agents/` 또는 글로벌 `~/.claude/agents/`에 배치.

| 에이전트 | 트리거 | 핵심 역할 |
|----------|--------|-----------|
| **csr-developer** | CSR 프로젝트 (React + shadcn/ui) | React 패턴, API 계약, Tauri 통합 |
| **ssr-developer** | SSR 프로젝트 (HTMX or Next.js) | SSR 패턴, SEO, htmx/Next.js 분기 |
| **data-analyst** | 데이터 분석 요청 | Python, DuckDB, Trino, 시각화, ML/DL |
| **strategist** | 비즈니스/전략 문서 | 제안서, DD, 경쟁 분석, 재무 모델 |
| **infra-ops** | 배포/인프라 작업 | Railway, Supabase, OCI, CI/CD |

### 4.3 리뷰 에이전트

**제안: 접근 B (단일 리뷰어 + 역할 전환) 기본, 필요 시 A 확장**

이유:
- Jay는 1인 개발자/의사결정자. 동시에 여러 리뷰어를 운용하는 건 오버헤드.
- Opus의 역할 전환 능력이 충분히 강함.
- 대형 프로젝트에서 깊은 리뷰가 필요하면 그때 전문 리뷰어 subagent 추가.

**구현**: `.claude/agents/reviewer.md`

```yaml
---
name: reviewer
description: |
  코드, 문서, PRD, UI, QA 관점의 리뷰. 
  생성자와 평가자를 분리하기 위해 사용.
  Use when: 구현 완료 후 검증, Phase 전환 시, PR 생성 전.
model: opus
context: fork
---
```

리뷰 시 자동 전환할 관점:

| 관점 | 평가 기준 |
|------|-----------|
| 코드 | 버그, 보안, 성능, 가독성, 테스트 커버리지 |
| 문서/PRD | 일관성, 완성도, Non-Goals 침범 여부 |
| UI | 접근성, 반응형, 디자인 일관성, CWV |
| QA | 엣지케이스, 에러 핸들링, 사용자 시나리오 |

---

## 5. 동시 세션 문제 (P3) — 설계 방향

같은 프로젝트에서 Claude Code 터미널 여러 개 운영 시 충돌 방지.

### 5.1 현실적 제약

Claude Code는 각 세션이 독립적. 세션 간 실시간 동기화 메커니즘은 없다.

### 5.2 해결 전략

| 방법 | 구현 | 효과 |
|------|------|------|
| **Git 기반 분기** | 세션별 feature branch → PR merge | 가장 안정적. GSD가 이미 이 패턴 내장 |
| **Session Start 프로토콜** | 매 세션 시작 시 `git pull` + PRD 재읽기 강제 (prd-lifecycle 스킬) | 최신 상태 반영 |
| **Lock file 컨벤션** | `.claude/active-sessions.md`에 현재 작업 영역 기록 | 충돌 예방 (수동) |
| **PR 기반 동기화** | 작업 완료 시 반드시 PR 생성 → merge 후 다른 세션에서 pull | 가장 실용적 |

**추천**: Git branch 분기 + Session Start에서 `git pull` 강제. GSD v1의 worktree 패턴이 이 문제의 정답이지만, ECC만 쓸 경우 rules에서 branch 컨벤션을 강제.

---

## 6. 경험 축적 (P4) — 설계 방향

### 6.1 기존 생태계 옵션

| 도구 | 방식 | 장단점 |
|------|------|--------|
| **cipher** (3.4K★) | 에이전트 전용 메모리 레이어 | 코딩 에이전트 특화, 오픈소스 |
| **claude-reflect** | correction 캡처 → CLAUDE.md 자동 동기화 | 단순, 가벼움 |
| **GSD learnings** | cross-session learnings CRUD | GSD 생태계 안에서만 동작 |
| **Continuous-Claude-v2** (2.2K★) | Hooks로 ledger/handoff 유지 | context management 특화 |

### 6.2 최소 구현

`.claude/memory/` 디렉토리에 마크다운 파일로 축적:

```
.claude/memory/
├── learnings.md          # 반복 실수, 패턴, best practice
├── decisions.md          # ADR 요약 (상세는 docs/decisions/)
└── project-context.md    # 프로젝트 고유 맥락 (스택, 제약, 히스토리)
```

**Hook (Stop)**: 세션 종료 시 "이 세션에서 배운 것이 있으면 `.claude/memory/learnings.md`에 추가" 프롬프트.

---

## 7. Git 워크플로우 중복 문제 (P6) — 분석

### 7.1 ECC가 이미 커버하는 Git 기능

ECC의 `rules/common/git-workflow`가 제공하는 것:

| 기능 | 구현 방식 |
|------|-----------|
| Conventional Commits | Rule로 커밋 메시지 포맷 강제 (feat/fix/refactor) |
| PR 워크플로우 | `/pr` 명령 + code-reviewer agent |
| Branch 전략 | Rule로 feat/fix/refactor 브랜치 네이밍 강제 |
| 보안 (시크릿 차단) | Hook (PreToolUse) — .env, 시크릿 패턴 감지 |

GSD v1이 추가로 제공하는 것:

| 기능 | 구현 방식 |
|------|-----------|
| Worktree 기반 세션 격리 | Phase별 git worktree 자동 생성/정리 |
| Atomic commit per task | Plan 단위 자동 커밋 |
| Squash merge on milestone | 마일스톤 완료 시 squash |
| Branch protection hook | main 직접 커밋 차단 |

### 7.2 중복 방지 전략

**원칙: "Git how"는 오케스트레이터에 위임, "Git what"만 공통 규칙에서 강제.**

| 레이어 | 담당 | 내용 |
|--------|------|------|
| **공통 규칙 (CLAUDE.md / Rules)** | What | "변경이 있으면 반드시 Git에 반영되어야 한다", "PRD 변경도 커밋 대상이다", "main 직접 커밋 금지" |
| **오케스트레이터 (ECC/GSD)** | How | 구체적인 커밋 타이밍, 브랜치 전략, PR 템플릿, worktree 관리 |
| **Hook** | Gate | 보호 파일 변경 차단, 시크릿 감지 (오케스트레이터와 무관하게 작동) |

**실용적 구현:**

```markdown
# 프로젝트 CLAUDE.md에 추가할 Git 정책 (What 레이어)

## Git Policy
- 코드/문서/PRD/설정 변경 시 반드시 commit + push. 로컬에만 남기지 않는다.
- PRD, 로드맵, Sprint Contract 변경도 Git 추적 대상이다.
- main/master 직접 커밋 금지. feature branch → PR → merge.
- 커밋/PR의 구체적 방법은 오케스트레이터(ECC/GSD)의 워크플로우를 따른다.
- 오케스트레이터가 없는 경우: Conventional Commits + `gh pr create`.
```

이렇게 하면 ECC의 git-workflow rule과 충돌하지 않는다. ECC가 "how"를 담당하고, CLAUDE.md는 "반드시 해야 한다"만 선언.

---

## 8. 놓치고 있는 것들

### 8.1 보안 (CISO 역할 반영 부족)

현재 구성에서 보안이 ECC의 security rule에 의존하고 있다. CISO 역할을 감안하면:

| 항목 | 현황 | 필요한 것 |
|------|------|-----------|
| 시크릿 관리 | ECC security rule | 충분하나, Hook으로 deterministic 차단 추가 권장 |
| 의존성 취약점 | 없음 | `npm audit` / `pip audit` 자동 실행 Hook 또는 CI |
| OWASP Top 10 | ECC security-reviewer agent | Rule로 체크리스트 강제 추가 고려 |
| K-ISMS 컴플라이언스 | 없음 | 민감 데이터 처리 프로젝트 시 별도 rule/checklist 필요 |

### 8.2 테스트 전략 일관성

각 Track별 테스트 도구가 다르지만 통합 정책이 없다.

| Track | 테스트 도구 | 커버리지 기준 |
|-------|------------|-------------|
| CSR (React) | Vitest + React Testing Library + Playwright | 미정 |
| SSR (HTMX) | pytest + Playwright | 미정 |
| SSR (Next.js) | Vitest + Playwright | 미정 |
| Data/PySide6 | pytest | 미정 |

**필요**: 전체 Track 공통 테스트 정책 rule (최소 커버리지, 테스트 유형별 요구사항).

### 8.3 컨텍스트 압축 전략

Opus + 200K context에서도 대형 프로젝트는 컨텍스트가 부족할 수 있다. 현재 "수동 /compact at 50%"만 있고 자동화가 없다.

| 상황 | 현재 | 개선 |
|------|------|------|
| 50% 컨텍스트 도달 | 수동 /compact | Claude Code의 `autocompact` 기능 활용 (최근 추가됨) |
| 태스크 전환 | 수동 /clear | SessionStart Hook에서 이전 태스크 컨텍스트 자동 정리 |
| 대형 파일 편집 | 전체 파일 로드 | `.claude/rules/`에서 "큰 파일은 관련 부분만 읽어라" 지시 |

### 8.4 비용/토큰 모니터링

Opus는 비싸다. 현재 토큰 사용량 추적이 없다.

- Claude Code에 `/stats` 명령이 있고, 최근 `rate_limits` 필드가 statusline에 추가됨
- ECC에 `ecc-tools-cost-audit` 스킬이 있음
- **필요**: 프로젝트별 토큰 예산 설정 + 경고 임계값

### 8.5 롤백/복구 전략

에이전트가 잘못된 변경을 할 때의 복구 경로가 명시되지 않았다.

- GSD는 savepoint 패턴 내장
- ECC는 savepoint command 있음
- **필요**: 공통 규칙에 "중대 변경 전 savepoint 생성" 추가

### 8.6 PySide6 에이전트 지원

PySide6은 Python GUI이므로 기존 data-analyst subagent에 포함하기엔 성격이 다르다. 별도 rule이 적절하다.

| 항목 | 내용 |
|------|------|
| 별도 subagent | 불필요 — 빈도가 낮으므로 rule로 충분 |
| Rule 필요 | `.claude/rules/pyside6.md` — Qt 위젯 패턴, 시그널/슬롯, QThread, 배포(PyInstaller) |
| Context7 활용 | PySide6 최신 문서 자동 주입 가능 |

### 8.7 디자인 시스템 & 레퍼런스

**Impeccable 활용 심화**

현재 impeccable이 스킬로 설치되어 있지만, `.impeccable.md`(프로젝트별 디자인 컨텍스트)가 체계적으로 관리되지 않고 있다.

| 단계 | 명령 | 용도 |
|------|------|------|
| 초기 설정 | `/impeccable teach` | 브랜드, 대상 사용자, 비주얼 레퍼런스 → `.impeccable.md` 생성 |
| 구현 중 | `/polish [페이지]` | alignment, spacing, typography, color, 인터랙션 상태 미세 조정 |
| 구현 후 | `/critique [페이지]` | 디자인 리뷰 + 스코어링 + 페르소나 테스트 |
| 배포 전 | `/audit [페이지]` | 접근성, 성능, 테마, 반응형, 안티패턴 체크 |

**awesome-design-md 활용**

프로젝트 시작 시 원하는 디자인 톤의 DESIGN.md를 프로젝트 루트에 배치. AI가 해당 디자인 시스템을 참조해서 일관된 UI를 생성한다. Google Stitch가 도입한 개념이며, 마크다운이므로 모든 AI 에이전트가 읽을 수 있다.

```
project-root/
├── DESIGN.md              # awesome-design-md에서 선택하거나 자체 작성
├── .impeccable.md         # /impeccable teach로 생성
└── CLAUDE.md              # 프로젝트 컨텍스트 (DESIGN.md 참조 포함)
```

### 8.8 개발 워크플로우 뼈대 (addyosmani/agent-skills)

Addy Osmani의 agent-skills는 시니어 엔지니어의 개발 프로세스를 6단계로 코드화한 것이다. **이것을 우리 체계의 워크플로우 뼈대로 채택한다.** ECC는 도구 레이어로 덧입힌다.

| Phase | agent-skills 스킬 | 우리 체계 통합 | ECC cherry-pick |
|-------|-------------------|---------------|-----------------|
| **Define** | idea-refine, spec-driven-development | PRD 라이프사이클 (prd-lifecycle 스킬) | — |
| **Plan** | planning-and-task-breakdown | Sprint Contract + Phase 분해 | — |
| **Build** | incremental-implementation, context-engineering, frontend-ui-engineering | ECC 실행 + CLAUDE.md 원칙 + Impeccable | git-workflow rule |
| **Verify** | test-driven-development, browser-testing, debugging | playwright-skill + 검증 에이전트 | testing rule |
| **Review** | code-review-and-quality, security-and-hardening, performance | 리뷰 에이전트 (구현/검증 분리) | code-reviewer, security-reviewer |
| **Ship** | git-workflow, ci-cd, documentation, shipping | ADR + Railway 배포 + Git Policy | security-scan, continuous-learning-v2 |

**게이트 규칙 (CLAUDE.md에 선언):**

```
## Mandatory Workflow Gates
- Define 완료 없이 Plan 진행 금지 (PRD Draft 이상)
- Plan 완료 없이 Build 진행 금지 (Sprint Contract 확정)
- Build 완료 없이 Verify 진행 금지 (구현 산출물 존재)
- Verify 완료 없이 Review 진행 금지 (테스트 통과)
- Review 완료 없이 Ship 진행 금지 (검증 에이전트 승인)
- 단, 긴급 수정(hotfix)은 Build→Verify→Ship 단축 경로 허용
```

### 8.9 자기 개선 원칙 (HyperAgents 사상 반영)

Meta의 HyperAgents 논문(2026.03, ICLR 2026)의 핵심 발견: **에이전트가 자유롭게 자기 개선하도록 두면, 결국 개발자가 수동으로 만드는 것과 동일한 하네스 구성 요소를 스스로 발명한다.**

에이전트가 자율적으로 수렴한 구성 요소:

| 에이전트가 발명한 것 | 우리 체계에서의 대응 | 상태 |
|---------------------|---------------------|------|
| Persistent Memory | `.claude/memory/` + auto memory + ECC instincts | ✅ 구축됨 |
| Performance Tracking | ECC cost-audit + `/stats` | ✅ 있음 |
| Multi-stage Verification Pipeline | 검증 에이전트 + `/audit` + `/security-scan` | ✅ 구축 중 |
| Decision Protocols | Change Request 유형 판단 (Clarification/Minor/Major) | ✅ 구축됨 |
| Domain Knowledge Base | Context7 + Rules + Skills | ✅ 구축됨 |
| Retry/Recovery Logic | Circuit Breakers (3회 실패 → 멈추고 보고) | ✅ 구축됨 |

**핵심 사상의 실용적 적용:**

1. **하네스는 수렴 아키텍처**: 개발자가 만들든 에이전트가 만들든 같은 구조로 수렴한다. 따라서 우리가 만드는 하네스는 올바른 방향이다.

2. **메타 개선 메커니즘을 편집 가능하게**: 우리 체계에서 이것은 **CLAUDE.md와 Rules가 마크다운이므로 에이전트 자신이 개선 제안을 할 수 있다**는 뜻. 구체적으로:
   - ECC의 `/instinct-export`로 패턴 추출 → 검증 후 Rules에 반영
   - auto memory의 learnings → 검증 후 CLAUDE.md에 승격
   - **단, 자동 반영은 금지. 인간 게이트 필수** (HyperAgents 논문도 human oversight 강조)

3. **개선 능력의 도메인 간 전이**: 한 프로젝트에서 축적된 경험이 다른 프로젝트에 전이 가능해야 한다. 이것이 Jay의 **개인 지식기반 리포** 전략의 이론적 근거.

4. **하네스 유지보수 원칙 강화**: 우리의 원칙 10(Harness Maintenance)이 HyperAgents의 관찰과 정확히 일치한다 — "가장 단순한 해법부터 시작, 필요할 때만 복잡성 추가, 새 모델에서 기존 scaffold 재검토." 에이전트 능력이 올라가면 우리가 만든 규칙 중 일부는 불필요해진다. **주기적으로 규칙을 제거하며 영향을 측정**해야 한다.

---

## 9. 의사결정 확정

| # | 주제 | 결정 | 상세 |
|---|------|------|------|
| D1 | 리뷰 에이전트 구조 | **B + 구현/검증 에이전트 분리** | 단일 리뷰어 + 역할전환 기본. 단, 구현 에이전트와 검증 에이전트는 별도 subagent로 분리 (Harness Design 원칙). 필요 시 도메인별 전문 리뷰어 확장 |
| D2 | 워크플로우 아키텍처 | **agent-skills 뼈대 + ECC 도구 레이어** | agent-skills의 6단계 게이트(Define→Plan→Build→Verify→Review→Ship)가 워크플로우 뼈대. ECC는 전체 설치가 아닌 cherry-pick(security-scan, continuous-learning-v2, code-reviewer, security-reviewer, git-workflow rule, testing rule). §3.1, §8.8 참조 |
| D3 | 경험 축적 도구 | **ECC continuous-learning-v2 + Claude Code auto memory** | ECC의 instinct 시스템(confidence scoring, import/export) 활용. Claude Code 네이티브 auto memory(`~/.claude/projects/<project>/memory/`)도 병행. 마크다운 기반이므로 추출·이관 가능 |
| D4 | 동시 세션 전략 | **Git branch 분기 + Session Start pull 강제** | 확정 |
| D5 | 데이터 분석 에이전트 | **범용 (단일 data-analyst subagent)** | Python + DuckDB + Trino + ML/DL + PySide6 통합 |
| D6 | gitagent | **사상 흡수, 도구 미도입** | Git-native 에이전트 정의, SOUL.md, compliance, SOD 등 핵심 사상을 우리 체계에 반영. 도구 자체는 아직 초기이므로 미도입 |
| D7 | Git 워크플로우 레이어 | **What/How 분리** | CLAUDE.md는 "반드시 커밋/PR" 선언(What), ECC가 구체적 방법(How) 담당 |
| D8 | 테스트 커버리지 | **Track별 차등** | 아래 상세 참조 |
| D9 | 보안 | **워크플로우 마지막에 Security scan + 오픈소스 탐지** | 개발 워크플로우 완료 후 `/security-scan`(ECC AgentShield) + 의존성 감사 자동 실행. K-ISMS는 해당 프로젝트에서 별도 체크리스트 |

### D3 상세: 경험 축적 시스템

두 시스템을 병행하되 역할을 분리한다:

| 시스템 | 역할 | 데이터 위치 | 이관성 |
|--------|------|------------|--------|
| **Claude Code auto memory** | 세션 중 자동 교정 사항 축적. 수동 개입 불필요 | `~/.claude/projects/<project>/memory/MEMORY.md` + 토픽별 .md | 마크다운. 복사만 하면 이관 |
| **ECC continuous-learning-v2** | instinct 패턴 추출, confidence scoring, evolution | `.claude/skills/project-patterns/instincts.json` + learned skills | `/instinct-export`로 JSON/MD 추출 가능 |

Jay의 지식기반 구축 전략:

```
프로젝트별 memory/ → 주기적으로 → 개인 지식기반 리포 (knowledge-base/)
  ├── learnings/          # auto memory에서 검증된 것만 옮김
  ├── instincts/          # ECC export에서 high-confidence만
  ├── decisions/          # ADR 아카이브
  └── patterns/           # 반복 패턴 정리
```

### D6 상세: gitagent 사상 흡수

gitagent에서 가져올 핵심 사상:

| gitagent 사상 | 우리 체계에서의 구현 |
|---------------|---------------------|
| 에이전트 정의의 Git 버전관리 | `.claude/agents/*.md`를 Git 추적. 변경 시 diff/blame 가능 |
| SOUL.md (에이전트 정체성) | subagent frontmatter에 name, description, model, context 명시 |
| compliance / SOD (Segregation of Duties) | 구현 에이전트 ≠ 검증 에이전트 분리 (D1). 리뷰어가 자기가 만든 것 평가 금지 |
| memory/ 디렉토리 (Git 추적 상태) | `.claude/memory/` + auto memory (이미 반영) |
| hooks/bootstrap.md, teardown.md | SessionStart Hook, SessionEnd Hook (이미 반영) |
| `gitagent validate` (CI에서 에이전트 품질 검증) | ECC AgentShield `npx ecc-agentshield scan` 으로 대체 |

### D8 상세: Track별 테스트 커버리지

| Track | 테스트 도구 | 커버리지 기준 |
|-------|------------|-------------|
| CSR (React + Tauri) | Vitest + React Testing Library + Playwright | UI 컴포넌트 60%, API 호출 80%, 비즈니스 로직 90% |
| SSR (HTMX) | pytest + Playwright | API 엔드포인트 80%, 템플릿 렌더링 60%, 비즈니스 로직 90% |
| SSR (Next.js) | Vitest + Playwright | 동일 CSR 기준 |
| Data/PySide6 | pytest | 데이터 파이프라인 80%, ML 모델 평가 메트릭 기반, GUI 수동 |
| 비개발 (Track 4) | 해당 없음 | — |

---

## 10. 다음 단계

### Phase 1: 기반 구조 (이번 작업)

1. **글로벌 CLAUDE.md 업데이트**: 11개 원칙 + 공통 강제 (Memory, PRD, Git Policy, ADR, **Define→Plan→Build→Verify→Review→Ship 필수 게이트**, 자기 개선 원칙)
2. **프로젝트 CLAUDE.md 템플릿 업데이트**: Track별 분기, PRD 참조, Git Policy, ECC 연계, **DESIGN.md 참조 지시**, `.impeccable.md` 관리
3. **Subagent 파일 작성**:
   - `reviewer.md` (검증 에이전트 — 코드/문서/UI/QA 관점 전환)
   - `data-analyst.md` (범용 — Python/DuckDB/Trino/ML/PySide6)
   - `strategist.md` (비즈니스/전략/DD)
4. **Rules 작성**: tauri.md, pyside6.md, test-policy.md, git-policy.md, **design-workflow.md** (Impeccable + DESIGN.md 활용 규칙)

### Phase 2: 자동화 & Hook

5. **Hook 구현**: SessionStart (git pull + PRD 읽기), PreToolUse (보호 파일 차단)
6. **ECC 연계 확인**: continuous-learning-v2, auto memory, security-scan 워크플로우 정합성

### Phase 3: 검증 & 반복

7. **실제 프로젝트 적용**: 하나의 CSR 프로젝트에서 전체 워크플로우 테스트
8. **setup-tooling 스크립트 업데이트**: 새 에이전트/Rules/Hooks 포함
9. **지식기반 리포 초기화**: knowledge-base/ 구조 생성

---

## 11. References

### 행동 원칙 & 하네스 설계

| 소스 | URL | 기여 |
|------|-----|------|
| Andrej Karpathy LLM 관찰 | github.com/forrestchang/andrej-karpathy-skills | 원칙 1-4: 가정 금지, 단순함, 수술적 변경, 목표 주도 |
| Anthropic Harness Design (2026.03) | anthropic.com/engineering/harness-design-long-running-apps | 원칙 5-6, 8, 10: 평가 분리, 장기 작업, 스프린트 계약, 하네스 유지보수 |
| Meta HyperAgents (ICLR 2026) | arxiv.org/abs/2603.19461 | 자기 개선 원칙, 하네스 수렴 아키텍처, 도메인 간 전이 |
| Cobus Greyling HyperAgents 분석 | cobusgreyling.medium.com/hyperagents-by-meta-892580e14f5b | 하네스가 수렴 아키텍처인 이유, 개발자 역할 변화 |

### 워크플로우 & 에이전트 스킬

| 소스 | URL | 기여 |
|------|-----|------|
| addyosmani/agent-skills | github.com/addyosmani/agent-skills | **워크플로우 뼈대**: Define→Plan→Build→Verify→Review→Ship 6단계 게이트 |
| AI-optimized PRD 교차 분석 | Osmani, Haberlah, Shape Up, AGENTS.md | PRD 템플릿, DO NOT CHANGE, Non-Goals, Phase 게이트 |
| revfactory/harness | github.com/revfactory/harness | 메타스킬 에이전트 팀 설계 (컨셉) |
| gitagent | github.com/open-gitagent/gitagent | Git-native 에이전트 정의, SOUL.md, SOD, compliance (사상 흡수) |

### 도구 & 생태계

| 소스 | URL | 기여 |
|------|-----|------|
| Everything Claude Code (ECC) | github.com/affaan-m/everything-claude-code | **도구 레이어**: security-scan, continuous-learning-v2, code-reviewer, git-workflow |
| GSD (get-shit-done) v1/v2 | github.com/gsd-build/get-shit-done, github.com/gsd-build/gsd-2 | 참조: worktree 격리, fresh context, autonomous 실행 |
| Impeccable | impeccable.style | **디자인 품질**: /teach, /polish, /critique, /audit |
| awesome-design-md | github.com/VoltAgent/awesome-design-md | **디자인 레퍼런스**: 66개 사이트 DESIGN.md |
| Context7 | github.com/upstash/context7 | MCP: 라이브러리 최신 문서 주입 |

### Claude Code 공식

| 소스 | URL | 기여 |
|------|-----|------|
| Claude Code Docs | code.claude.com/docs | Hooks, Skills, Agents, Memory, Settings |
| Claude Code Releases | github.com/anthropics/claude-code/releases | auto memory, autocompact, plugin system, effort frontmatter |
| Anthropic Skills Repo | github.com/anthropics/claude-code (skills/) | 공식 스킬 참조 |

### 커뮤니티 & 큐레이션

| 소스 | URL | 기여 |
|------|-----|------|
| awesome-claude-code | github.com/hesreallyhim/awesome-claude-code | 스킬/플러그인/에이전트 큐레이션 |
| claude-code-plugins-plus-skills | github.com/jeremylongshore/claude-code-plugins-plus-skills | 340 plugins + 1367 skills 카탈로그, CCPI 패키지 매니저 |
| shanraisshan/claude-code-best-practice | github.com/shanraisshan/claude-code-best-practice | Command→Agent→Skill 아키텍처 패턴 |
