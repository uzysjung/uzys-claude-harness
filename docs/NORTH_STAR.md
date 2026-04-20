# uzys-claude-harness — North Star

> 장기 방향성. PRD/SPEC이 "무엇을 어떻게"를 다루면, 본 문서는 **왜·어디로**를 다룬다.
> 의사결정이 모호할 때 본 문서를 기준으로 우선순위를 판정한다.

---

## 1. North Star Statement

> **"필수적인 skill / plugin / CLAUDE.md / Agent.md 번들만으로, 구체적인 디렉션 없이도 고수준의 서비스를 한 번에 만들 수 있게 하는 하네스."**

사용자가 매번 "이건 이렇게 해, 저건 저렇게 해"를 지시하지 않아도 — Track만 선택하면 그 Stack에 필요한 모든 맥락(rules / hooks / skills / agents / plugins / MCP)이 자동 설치되고, SPEC 한 번 정의하면 `/uzys:auto`가 Plan → Build → Test → Review → Ship을 완주한다. 사용자는 **큰 그림 결정**(North Star, SPEC 범위, Major CR, Ship 승인)에만 개입.

"Harness = AI Model(s) + Harness"의 **Harness 쪽**을 극단적으로 얇지만 단단하게 만든다.

---

## 2. North Star Metric (NSM)

**1차 지표 (현재 단계)**: **HITO — Human-In-The-Loop Occurrences per Feature**
- 정의: 하나의 feature를 `/uzys:spec` → `/uzys:ship` 까지 가는 동안 사용자가 명시적으로 개입(지시문 입력/승인/수정 요청)한 횟수
- 목표: **≤ 3회 per feature** (SPEC 정의 1 + Major CR 평균 1 + Ship 최종 승인 1)
- 의미: 이 지표가 달성되면 "구체적 디렉션 없이도 만들어진다"는 Statement가 수치로 증명됨. 초과분은 harness 부족분 지표.

**2차 보조 지표**

| Metric | 정의 | 목표 |
|--------|------|------|
| **Clean Install Success Rate** | `curl\|bash` 1회 실행으로 Track 설치가 에러 없이 완료되는 비율 | ≥ 95% |
| **Revision Loop Depth** | `/uzys:auto` 한 사이클에서 에이전트 자동 수정 루프가 돌아가는 평균 횟수 | ≤ 2 |
| **Explicit Instruction Length** | 사용자가 세션당 입력하는 평균 지시문 길이 | 감소 추세 (4주 moving avg) |
| **Test-harness PASS Rate** | 147 assertion 중 PASS 비율 | 100% (현재 147/147) |

> 모든 지표는 single-user 환경(Jay 본인 + 초대된 early adopter)에서 자가 수집. Phase 3 진입 시 재정의.

---

## 3. Strategic Boundaries (방향성 경계)

### 3.1 Will (집중)

- **Minimum Viable Bundle** — Track별로 그 Stack에 진짜 필요한 skill/plugin/MCP만. 과잉 번들 금지.
- **Deterministic Harness** — hook으로 강제 가능한 건 hook으로 (순서, 파일 보호, 게이트). LLM 판단은 최후 수단.
- **ECC-First** — 자체 작성 전에 ECC/agent-skills/vendor 생태계에 있는지 먼저 확인. 없으면 cherry-pick. 없으면 자체.
- **Multi-Stack 동등성** — Python REST / Next.js / SSR / 데이터 / 임원용 문서 / 순수 CLI 어디든 같은 6-gate와 같은 `/uzys:*` 명령이 통한다.
- **Project-Scope 오염 금지** — 글로벌 `~/.claude/` 절대 건드리지 않음 (D16 보호).
- **Transparent Defaults** — 설치 중 어떤 plugin/skill이 설치되는지 각 줄 단위로 명시. 숨김 동작 없음.

### 3.2 Won't (의도적 비-방향)

scope creep의 1차 방어선. "X는 안 한다"를 명시.

- **범용 Best Practice 강요 안 함** — 린터 영역(naming, formatting, import 순서)은 린터에. Rule은 프로젝트 특화 불변식만.
- **UI 스킨 / 테마 / 시각 장식 없음** — CLI 출력 색상 수준. gum/whiptail 같은 TUI 의존 추가 안 함 (근본 문제를 fd 재부착 + 출력 격리로 해결).
- **모든 Track에 모든 skill 설치 안 함** — UI skill은 UI track에만, Python skill은 Python track에만.
- **팀/조직 협업 기능 우선 안 함** — 현 단계는 1인 시니어 엔지니어용. multi-user는 Phase 4 탐색.
- **LLM 판단에만 의존하는 자동화 금지** — 의사결정 게이트(`Proposed → Accepted`, `REGRESSION → Review block`)는 명시적 pass/fail.
- **특정 Stack에 tied된 hack 금지** — "우리는 Postgres + Next.js만 지원" 같은 단일 스택 가정 금지.

### 3.3 Trade-offs (의식적 선택)

| 선택 | 포기한 것 | 근거 |
|------|----------|------|
| Rule 17 / Hook 6 slim-down | 범용 guide 두께 | 린터로 가능한 건 린터에. Rule은 "반드시 지켜야"만. 분기 1회 재평가 |
| `/uzys:auto` revision 자동 루프 | 매 단계 인간 승인 | 1인 사용자 속도 우선. revision 상한 + Escalation Gate로 폭주 방지 |
| ECC cherry-pick | 통합 플러그인 자체 관리 | 상위 커뮤니티에 유지보수 위임. sync 자동 drift 감지 |
| shell 스크립트 설치 | npm 패키지 / 플러그인화 | 의존성 0, bash 5+만. `curl\|bash` 1줄로 충분 |
| 9 Track vs 단일 monolith | 설치 로직 복잡도 | 멀티 역할 사용자에게 필수. TSV + helper 함수로 복잡도 관리 |
| 도메인 비종속 generic 템플릿 | GoalTrack/Vantage 도메인 맞춤 편의 | 누구나 fork해서 쓰도록. 특정 개인 private repo 참조 제거 |

---

## 4. Phase Roadmap (장기 진화 단계)

### Phase 1 — Foundation (현재, ~v27.x)
- 목표: **구체적 디렉션 없이도 Track 선택 → Spec → Ship까지 흘러가는 최소 번들** 완성.
- 성공 조건: 9 Track clean install 100%, test-harness 147/147 PASS, HITO 측정 baseline 확보.
- 핵심 산출물: 9 Track, 6-gate, 3 자체 skill(north-star/ui-visual-review/spec-scaling), PLAN template, ADR workflow, install.sh end-to-end E2E.

### Phase 2 — Adoption Loop
- 목표: 실제 프로젝트 2-3개에 적용해서 HITO 데이터 수집. 부족한 부분 역추적.
- 진입 조건: Phase 1 안정화. test-harness 유지. 외부 사용자(Jay 외) 첫 설치 성공.
- 핵심 산출물: HITO 측정 스크립트, 세션 evaluation 자동화, instinct promotion 첫 사례.

### Phase 3 — Self-Improvement Loop
- 목표: **Ralph 루프 + continuous-learning-v2 instinct 자동 승격**으로 harness가 세션 경험으로 스스로 개선.
- 진입 조건: HITO ≤ 3 달성 + 2-3 프로젝트 실전 운용 + instinct confidence ≥ 0.8 사례 3개 이상.
- 핵심 산출물: instinct → Rule 자동 승격 파이프라인(인간 승인 게이트 유지), 세션 간 학습 이전.

### Phase 4 (탐색) — Multi-User / Team Harness
- 가설: 1인 하네스를 소규모 팀이 공유 가능한 버전으로 확장.
- 진입 조건: Phase 3 자기 개선 루프 안정 + 외부 early adopter 5+.
- 결정 사항: 본 문서 분기 갱신 시 검토. 현재는 Won't에 등록.

---

## 5. Decision Heuristics (의사결정 휴리스틱)

신규 요청·제안이 들어왔을 때 다음 4 게이트를 **모두** 통과해야 우선순위 진입.

| Gate | 질문 | Pass 기준 |
|------|------|---------|
| **1. Trend** | Claude Code 생태계 흐름(ECC / agent-skills / MCP 표준 / Ralph 루프 / spec-driven / auto memory)에 1개 이상 정렬되는가? | YES — 어느 흐름인지 명시 |
| **2. Persona** | 시니어 엔지니어 / 멀티 역할 개인(CEO·CTO·CISO·데이터 사이언티스트)에게 직접 가치를 주는가? 팀 기능 우선이면 -1. | YES |
| **3. Capability** | hook / skill / plugin / MCP / rule 중 하나로 **결정론적**으로 구현 가능한가? LLM 판단에만 의존하면 -1. | YES (구현 수단 명시) |
| **4. Lean** | Rule 17 / Hook 6 / Skill 번들 크기를 **늘리지 않거나 기존 확장**인가? 새 범주 신설이면 근거 필수. | YES 또는 근거 있음 |

4개 모두 Pass = 우선순위 진입. 1개라도 Fail = 보류(Open Question) 또는 거절.

### 이 게이트를 통과한 최근 기능 (v27.8~v27.12)
- **v27.8.0 curl|bash 설치 UX fix** — Trend(실제 설치 경험), Persona(사용자 통증), Capability(shell flag), Lean(기존 script 확장). 4/4.
- **v27.10.0 north-star skill** — Trend(spec-driven + Ralph), Persona(큰 그림 결정), Capability(skill), Lean(새 범주지만 4-gate 자체가 의사결정 축이라 필수). 4/4.
- **v27.11.0 ui-visual-review** — Trend(chrome-devtools MCP), Persona(UI regression 방지), Capability(skill + Playwright), Lean(UI track 한정). 4/4.

### 이 게이트로 거절된 제안
- **gum TUI installer** — Persona/Capability는 Pass지만 **Lean Fail** (end user에 gum 의존성 추가). `</dev/null` + fd 3 패턴으로 의존성 0 해결.
- **GoalTrack WAGI 지표** — 도메인 특수. Lean Fail + Persona 일반화 부족.
- **skills-lock.json (Vantage)** — 현재 내부 skill만이라 공급망 위험 낮음. 필요도 < 복잡도. Lean Fail.

---

## 6. Versioning & Review

- 본 문서는 **분기 1회** 또는 **NSM(HITO) 도달/미달** 시 갱신.
- 주요 갱신 (Major CR): NSM 변경 / Phase 정의 변경 / Won't 변경.
- 가벼운 갱신 (Clarification): Trade-off 추가, 트렌드 매핑 보강, 새 Pass/Fail 사례 추가.
- 갱신 시 사유 + 날짜 1줄을 Changelog에 기록.

---

## 7. Changelog

- 2026-04-20: 초안 작성. 근거 — 사용자 본인 정의 Statement + v27.8~v27.12.1 7개 커밋의 4-gate 사후 검증 결과 + Phase 1 완료 상태(147 test-harness PASS).
