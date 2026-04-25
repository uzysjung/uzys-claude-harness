# Project CLAUDE.md -- Growth Marketing Track

## Stack

- **Output**: 콘텐츠(blog/landing/twitter), SEO 최적화, demand gen 캠페인, 시장 조사 요약
- **Tools**: marketing-skills (44 — content/SEO/CRO/channels/growth/intelligence/sales/twitter)
- **Tools**: business-growth-skills (4 — customer success, sales engineering, RevOps, contract)
- **Tools**: content-creator (SEO content + brand voice + frameworks)
- **Tools**: demand-gen (multi-channel demand gen + paid + partnership)
- **Tools**: research-summarizer (시장 조사 요약)
- **No Dev Stack**: 코드 개발 프로젝트가 아님. 산출물은 콘텐츠/캠페인 자료.

## Workflow

자연어 워크플로우 (6-gate 미적용):

```
요청 -> Growth/Marketing skill 호출 -> 산출물 생성 -> reviewer 검증 -> 전달
```

- 6-gate 개발 워크플로우를 사용하지 않음.
- 자연어 요청을 받아 적절한 marketing skill 호출.
- 시장 조사 → research-summarizer → content-creator → marketing-skills/CRO 흐름.
- demand-gen은 multi-channel 캠페인 설계 시 호출.
- reviewer가 메시지 일관성, 브랜드 보이스 정합성, 데이터 인용 정확도 검증.

## Active Rules

| Rule | 설명 |
|------|------|
| git-policy | 콘텐츠 버전 관리 |
| change-management | 캠페인 변경 영향 분석 |
| gates-taxonomy | Pre-flight/Revision/Escalation/Abort 게이트 분류 |

**참고**: 개발 관련 규칙(test-policy, code-style, error-handling 등)은 적용하지 않음.

## Agents

| Agent | Scope | Model | 역할 |
|-------|-------|-------|------|
| reviewer | global | opus | 검증 전용 (SOD). 메시지/데이터 인용 정확도 검증 |
| strategist | global | opus | GTM 전략, 경쟁 분석, 시장 진입 의사결정 |

**참고**: code-reviewer, security-reviewer는 이 트랙에 불필요.

## Skills

- **marketing-skills (44)**: content/SEO/CRO/channels/growth/intelligence/sales/twitter
- **business-growth-skills (4)**: customer success, sales eng, RevOps, contract
- **content-creator**: SEO content + brand voice + frameworks
- **demand-gen**: multi-channel demand gen + paid media + partnership
- **research-summarizer**: 시장 조사 요약
- **document-skills (docx/xlsx/pptx)**: 캠페인 브리프, 지표 시트, 투자 자료

**참고**: agent-skills(6-gate), ECC CL-v2, Impeccable 코딩 스킬은 이 트랙에 미적용.

## Plugins

이 트랙은 alirezarezvani/claude-skills marketplace + 별도 plugin을 통해 동작:

- marketing-skills (alirezarezvani/claude-skills)
- business-growth-skills (alirezarezvani/claude-skills, executive 트랙과 공유)
- content-creator (별도 plugin)
- demand-gen (별도 plugin)
- research-summarizer (별도 plugin)

설치는 `/plugin marketplace add` + `/plugin install` (자동 — installer가 처리).

## Commands

| Namespace | Command | 용도 |
|-----------|---------|------|
| uzys: | (미적용) | 본 트랙은 6-gate 미사용 |
| ecc: | (미적용) | 보안 스캔 불필요 |

대신 자연어로 직접 요청:
- "이 페르소나용 SEO 블로그 5개 안 작성" -> content-creator
- "Q3 demand gen 플레이북" -> demand-gen
- "경쟁사 X 시장 조사 요약" -> research-summarizer
- "twitter thread 작성" -> marketing-skills (twitter)
- "CRO 가설 + AB 테스트 설계" -> marketing-skills (CRO)

## Boundaries

**Always (자동 실행)**:
- 시장 데이터 / 통계 인용 시 1차 출처 확인 — 못 하면 "근거 불충분" 명시
- 메시지 작성 시 브랜드 보이스 일관성 (.impeccable.md 가용 시 참조)
- 변경 이력 git으로 관리
- 산출물 완성 후 reviewer 검증

**Ask First (확인 후 실행)**:
- 외부 채널(메일/광고/SNS) 실제 발행
- 민감한 캠페인 예산/타겟 데이터 포함 여부
- 경쟁사 직접 비교 콘텐츠 발행
- main 브랜치 머지

**Never (금지)**:
- 검증되지 않은 통계를 사실처럼 제시 (예: "고객의 X%는...")
- 출처 없는 시장 규모 추정 (TAM/SAM/SOM 무근거)
- 경쟁사 비방/허위 비교
- 6-gate 워크플로우 강제 적용 (이 트랙은 자연어 기반)
