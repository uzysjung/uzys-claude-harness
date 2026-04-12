# Raw 요청사항 — Jay의 원문 기반 시간순 정리

> 이 문서는 Jay가 이 프로젝트 세션들에서 요청하거나 재반영 요청한 내용을 날것 그대로 정리한 것.
> REQUIREMENTS.md에 반영 여부를 표기.

---

## 초기 세션 (2026-01~02)

### S1. 범용 업무 에이전트 설계
- 소통: 발전적 방향을 물어보면서 진행, 잘못된 것은 지적
- 권한: R&R 실행, 중단등에 대한 권한
- 목표설정: 목표와 성공지표 완성기준을 정의하고 PDCA로 계속 목표에 도달
- 에이전트가 자체 판단, 물어봐야 할 것이 생기면 물어봄
- AC에 도달했다고 판단하면 사람이 검증
- **반영**: ✅ CLAUDE.md 11개 원칙 + reviewer subagent

### S2. CLAUDE.md 작성
- Karpathy 스킬 참조해서 통합
- 빈말/아부/불필요한 사과 금지, 직설적 건조한 어조
- 검증된 사실만, 불확실하면 명시
- 질문 전제 오류 → 지적 먼저
- CTO/COO 출신 눈높이
- Self-Learning: 검색→학습→요청→설치→문서화→수행
- PDCA: Plan→Do→Check→Act, 각 Task는 context window 안에서 완료 가능 크기
- 각 iteration 후 진행 기록 파일 만들고 learnings 업데이트
- Frontend story는 "브라우저 검증" AC 필수
- **반영**: ✅ 11개 원칙 + test-policy + reviewer

### S3. GitHub 연동
- PRD → Issues, Milestone, Project로 단위 분류해서 진행
- Milestone은 2주 이내, Issue는 8시간 이하
- Issue Label 체계 (type:feature/bug/spike, priority)
- PR은 Issue에 링크 (Closes #N)
- Milestone 완료 시 Release Gate 체크
- **반영**: ⚠️ 부분 반영. Git policy rule에 commit/push/PR 의무화. GitHub Project/Milestone 단위 관리는 agent-skills `/plan`에 위임

### S4. PRD 템플릿 설계
- 너무 디테일하면 AI 사고 범위를 좁히고 싶지 않음
- 요구사항과 범위는 명확히, 중요한 부분 안 놓치도록
- 유명 템플릿 최대한 리서치해서 교집합 기반 근거있게 작성
- DO NOT CHANGE 영역 명시
- Non-Goals 명시 (AI가 "생략 = 범위 내"로 해석하는 것 방지)
- Phase 기반 순차 구현
- Self-audit 패턴
- SPEC.md = persistent anchor
- **반영**: ✅ PRD-TEMPLATE-standalone.md (레퍼런스)

### S5. 에이전트 프레임워크 구축
- Planner/PM/Dev/QA 에이전트
- 상호작용: 불확실한 것은 물어봐야 함 (Inscope/outscope/가드레일)
- SaaS, 데이터 분석 특화
- 배포 Blue-Green, Sentry
- Claude Code로 어떻게 쓰는지 초보자 튜토리얼
- Critical Mistakes 방지 시스템 (3회 반복 패턴 감지)
- **반영**: ✅ agent-skills 워크플로우 + ECC cherry-pick + reviewer subagent

---

## 중간 세션 (2026-03)

### S6. 맞춤형 지침 컴팩트화
- 클로드.md 범용 지침을 웹/모바일앱에서 쓸 맞춤형 지침으로
- 생성 후 리뷰어 관점 자가 평가 (생성자≠평가자)
- 명시되지 않은 것은 범위 밖
- 파일 생성, HTML, 시각화도 하잖아 → 산출물 만드는 에이전트에 적합하게
- **반영**: ✅ reviewer subagent (context: fork) + 원칙 5

### S7. 기술 스택 정리 (std-dev-boilerplate)
- Track 4개: SSR, CSR, Next.js, 비개발(CTO/CSO)
- GSD 또는 ECC 하나만 (프로젝트마다)
- Context7 + GitHub MCP만 (PostgreSQL/Playwright/Chrome DevTools MCP 제거 — CLI 대체)
- Impeccable 추가 (디자인 품질)
- expect.dev 평가 → 거부 (너무 초기)
- openui 평가 → 거부 (너무 좁음)
- Rules: code-style.md, error-handling.md 추가
- setup-tooling.sh / .ps1 대화형 스크립트
- **반영**: ✅ §3 설치 매핑 전체

### S8. AI 에이전트 행동지침 일반화
- Karpathy + Anthropic Harness Design 종합
- PPT, 제안서, 분석할 때도 잘 활용할 수 있도록 제너럴하게
- 11개 원칙 도출
- PRD Lifecycle + 변경관리 워크플로우
- **반영**: ✅ AGENT-GUIDELINES-reference.md + change-management.md

---

## 현재 세션 (2026-04-12)

### S9. Claude Code 환경 구성 요청 (메인)
- 에이전트 정의: 범용 + 특화 + 리뷰
- 모든 에이전트 공통 강제: Memory, PRD, 변경/형상관리, Task, ADR
- **코드/문서 변경 시 반드시 커밋 푸시 PR** — ECC/GSD와 겹치면 안 됨
- 기술스택: CSR 3개 + SSR 2개 + Data + Executive
- Tauri로 Mac/Windows/iOS/AOS 확장
- PySide6 추가 (분석/예측 GUI)
- GSD: 작은 프로젝트에서 무거울까 걱정, Opus와 강제 궁합
- 리뷰: 구현과 검증 에이전트 구분
- 반복 실수/세션 경험 축적
- ADR 기록
- **반영**: ✅ 전체 REQUIREMENTS.md

### S10. 의사결정 D1-D9
- D1: B + 구현/검증 분리
- D2: ECC 유지 + 필수 원칙 보장 → 후에 agent-skills 뼈대 + ECC cherry-pick으로 변경
- D3: ECC CL-v2 + auto memory, 마크다운으로 빼서 가져갈 수 있어야. 나만의 지식기반 구축
- D4: Git branch + Session Start pull
- D5: 범용 data-analyst
- D6: gitagent 사상 흡수, 도구 미도입
- D7: What/How 분리
- D8: Track별 테스트 차등
- D9: 워크플로우 마지막에 Security scan + 오픈소스 탐지
- **반영**: ✅ 전체

### S11. 디자인/워크플로우/자기개선 추가
- Impeccable 활용 심화 (getting-started 참조)
- awesome-design-md (DESIGN.md 레퍼런스)
- addyosmani/agent-skills → 워크플로우 뼈대로 채택
- HyperAgents 사상: "핵심만 남기고 알아서 개선될 수 있으면 좋겠어"
- **반영**: ✅ §4 워크플로우 + §6.2 HyperAgents

### S12. agent-skills를 뼈대로 확정
- "agent-skills를 기반으로, ECC를 도구 레이어로 덧입히자"
- 내 철학이랑 같아
- **반영**: ✅ §3, §4 전체 구조 변경

### S13. PRD-Lifecycle 가치 판단
- agent-skills /spec이 Define 진입점 → 수용
- PRD-Lifecycle 스킬 제거, 고유 가치 3개 분해 → 수용
- PRD 템플릿은 레퍼런스로 유지 → 수용
- **반영**: ✅ §4.2

### S14. 빠진 것 지적
- CPO/CSO 역할 빠짐 → 추가
- Track → 스킬/플러그인 자동 매핑 → 추가
- GSD 선택적 설치 → 추가
- Railway 공식 MCP/플러그인 빠짐 → 추가
- Anthropic 공식 스킬 (pptx/docx/xlsx/pdf) 빠짐 → 추가
- std-dev-boilerplate, dyld-vantage 리포 확인해서 필요한 것 가져와 → 추가
- **반영**: ✅

### S15. 산출물 정리 요청
- README.md + USAGE.md 만들어져야
- 필수 커맨드/보조 커맨드 설명
- 커맨드 너무 많지 않고 워크플로우에 맞춰 실행하면 알아서 스킬/행동 이행
- **반영**: ✅ §5.7 커맨드 설계 + §5.8 README/USAGE

### S16. Impeccable 관리 정책
- 쓸 수는 있지만 별도 관리 안 함. 삭제하거나 그러지는 말고.
- **반영**: ✅ §5.7 보조 커맨드 섹션

### S17. 운영 레벨 규칙 (이번 지적)
- 배포 이후 배포항목과 최신 PRD 다르면 PRD 업데이트 → **반영**: ✅ ship-checklist.md
- 배포하려고 할 때 E2E 필수 테스트 했는지, 커버리지 확인 → **반영**: ✅ ship-checklist.md
- 주요 변경점에 세션 savepoint → **반영**: ✅ ECC savepoint 활용 (cherry-pick)
- 변경마다 git commit → **반영**: ✅ commit-policy.md (코드 변경 시 무조건)
- PRD가 일정 사이즈 넘어가면 기능별 분리 + 마스터 라우트 PRD → **반영**: ✅ spec-scaling 스킬

### S18. Claude Code 환경 설정 추가
- claude-code-statusline 설치 (모델, 컨텍스트, 비용, git, rate limit 실시간 표시)
- `"defaultMode": "bypassPermissions"` — 매번 허가 안 물음
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` — Agent Teams 활성화
- `"teammateMode": "tmux"` — 병렬 에이전트 tmux 실행
- **반영**: ✅ §3.1 공통 설치 + §3.1.1 settings.json + bootstrap-dev.sh

### S19. 커맨드 네임스페이스
- 자체 워크플로우: `uzys:{커맨드}` (예: `/uzys:spec`, `/uzys:build`)
- ECC: `ecc:{커맨드}` (예: `/ecc:security-scan`)
- Impeccable: `imm:{커맨드}` (예: `/imm:polish`)
- GSD: `gsd:{커맨드}` (GSD 내장, 선택 설치 시)
- 이유: 4개 소스 커맨드가 섞이면 출처 불분명 → 네임스페이스로 구분
- **반영**: ✅ §5.7 커맨드 설계

---

## 반영 상태 요약

| 상태 | 건수 |
|------|------|
| ✅ 반영 완료 | 19 |
| ⚠️ 부분 반영 | 1 (S3 GitHub Project/Milestone — agent-skills /plan에 위임) |
| ❌ 미반영 | 0 |
