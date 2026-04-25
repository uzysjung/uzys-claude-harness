# Project CLAUDE.md -- Project Management Track

## Stack

- **Output**: Jira tickets, Confluence pages, PRD/RICE/agile artifacts, sprint reports
- **Tools**: pm-skills (6 — senior PM, scrum master, Jira expert, Confluence expert, Atlassian admin, template creator)
- **Tools**: product-skills (15 — RICE, PRD, agile PO, UX research, landing page, SaaS scaffolder ...)
- **No Dev Stack**: 코드 개발 프로젝트가 아님. 산출물은 문서/티켓/리포트.

## Workflow

자연어 워크플로우 (6-gate 미적용):

```
요청 -> PM/Scrum 에이전트 분석 -> pm-skills/product-skills로 산출물 생성 -> reviewer 검증 -> 전달
```

- 6-gate 개발 워크플로우를 사용하지 않음.
- 자연어 요청을 받아 PM/Scrum/RICE 등 적절한 skill 호출.
- pm-skills + product-skills 양쪽 도구가 모두 설치되어 있음 — 상황에 맞춰 선택:
  - **pm-skills**: Jira/Confluence/Atlassian admin, scrum master 운영 — 운영 중심
  - **product-skills**: RICE/PRD/agile PO/UX research/SaaS scaffolder — 기획 중심
- reviewer가 논리 흐름, 우선순위 근거, 범위 적합성 검증.

## Active Rules

| Rule | 설명 |
|------|------|
| git-policy | 산출물 버전 관리 |
| change-management | 변경 영향 분석, 결정 로그 |
| gates-taxonomy | Pre-flight/Revision/Escalation/Abort 게이트 분류 |

**참고**: 개발 관련 규칙(test-policy, code-style, error-handling 등)은 적용하지 않음.

## Agents

| Agent | Scope | Model | 역할 |
|-------|-------|-------|------|
| reviewer | global | opus | 검증 전용 (SOD). PRD/RICE 우선순위 근거 검증 |
| strategist | global | opus | 전략적 의사결정 — RICE score 합리화, 로드맵 자료 |

**참고**: code-reviewer, security-reviewer는 이 트랙에 불필요.

## Skills

- **pm-skills (6)**: senior PM, scrum master, Jira expert, Confluence expert, Atlassian admin, template creator
- **product-skills (15)**: RICE, PRD, agile PO, UX researcher, UI design system, competitive teardown, landing page generator, SaaS scaffolder, product analytics, experiment designer, product discovery, roadmap communicator, code-to-prd, research summarizer, apple-hig-expert
- **document-skills (docx/xlsx/pptx)**: PRD/agenda/지표 시트/스폰서 덱

**참고**: agent-skills(6-gate), ECC CL-v2, Impeccable 코딩 스킬은 이 트랙에 미적용.

## Plugins

이 트랙은 Atlassian + 마켓플레이스 plugin을 통해 동작:

- pm-skills (alirezarezvani/claude-skills marketplace)
- product-skills (alirezarezvani/claude-skills marketplace)

설치는 `/plugin marketplace add` + `/plugin install` (자동 — installer가 처리).

## Commands

| Namespace | Command | 용도 |
|-----------|---------|------|
| uzys: | (미적용) | 본 트랙은 6-gate 미사용 |
| ecc: | (미적용) | 보안 스캔 불필요 |

대신 자연어로 직접 요청:
- "이번 스프린트 retro 정리해줘" -> scrum master skill
- "이 feature RICE 점수 매겨줘" -> product-skills RICE
- "PRD 초안 만들어줘" -> product-skills PRD generator
- "Confluence 회의록 정리" -> Confluence expert

## Boundaries

**Always (자동 실행)**:
- 우선순위 결정 시 명시적 기준 (RICE/MoSCoW 등) 사용 — 추정 금지
- PRD 작성 시 acceptance criteria 명시
- 변경 이력 git/Confluence로 관리
- 산출물 완성 후 reviewer 검증

**Ask First (확인 후 실행)**:
- 외부 시스템 (Jira/Confluence) 실제 변경
- 민감 정보 (인사/재무 추정) 포함 여부
- main 브랜치 머지

**Never (금지)**:
- 검증되지 않은 우선순위 제시 ("그냥 중요해 보임")
- 출처 없는 데이터로 RICE Reach/Impact 산정
- Jira ticket 임의 closed/reopened
- 6-gate 워크플로우 강제 적용 (이 트랙은 자연어 기반)
