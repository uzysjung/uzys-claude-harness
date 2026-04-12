# Project CLAUDE.md -- Executive Track

## Stack

- **Output**: PPT (pptx), Excel (xlsx), Word (docx), PDF
- **Tools**: Anthropic document-skills (pptx, docx, xlsx, pdf)
- **Analysis**: 사업 제안서, Due Diligence, 경쟁 분석, 재무 모델
- **No Dev Stack**: 코드 개발 프로젝트가 아님

## Workflow

자연어 워크플로우 (6-gate 미적용):

```
요청 -> strategist 에이전트 분석 -> document-skills로 산출물 생성 -> reviewer 검증 -> 전달
```

- 6-gate 개발 워크플로우를 사용하지 않음.
- 자연어 요청을 받아 strategist 에이전트가 구조화.
- document-skills가 최종 문서 형식(pptx/docx/xlsx/pdf) 생성.
- reviewer가 논리 흐름, 설득력, 범위 커버리지 검증.

## Active Rules

| Rule | 설명 |
|------|------|
| git-policy | 브랜치 전략, 산출물 버전 관리 |
| change-management | 변경 영향 분석, 문서 이력 추적 |

**참고**: 개발 관련 규칙(test-policy, code-style, error-handling 등)은 적용하지 않음.

## Agents

| Agent | Scope | Model | 역할 |
|-------|-------|-------|------|
| reviewer | global | opus | 검증 전용 (SOD). 문서/제안서 품질 검증 |
| strategist | global | opus | 사업 전략, 제안서, DD, 재무 모델 전문 |

**참고**: code-reviewer, security-reviewer는 이 트랙에 불필요.

## Skills

- **document-skills (pptx)**: PowerPoint 프레젠테이션 생성/편집
- **document-skills (docx)**: Word 문서 생성/편집
- **document-skills (xlsx)**: Excel 스프레드시트 생성/편집/분석
- **document-skills (pdf)**: PDF 생성/합치기/분할
- **document-skills (doc-coauthoring)**: 구조화된 문서 공동 작성 워크플로우

**참고**: agent-skills(6-gate), ECC CL-v2, Impeccable은 이 트랙에 미적용.

## Plugins

없음. Executive 트랙은 플러그인 의존 없이 에이전트 + document-skills로 동작.

## Commands

| Namespace | Command | 용도 |
|-----------|---------|------|
| uzys: | (미적용) | Executive 트랙은 6-gate 미사용 |
| ecc: | (미적용) | 개발 보안 스캔 불필요 |
| imm: | (미적용) | 프론트엔드 디자인 불필요 |
| gsd: | (미적용) | 개발 오케스트레이션 불필요 |

대신 자연어로 직접 요청:
- "제안서 작성해줘" -> strategist + document-skills(pptx/docx)
- "경쟁사 분석" -> strategist 분석 + document-skills(xlsx)
- "DD 보고서" -> strategist DD 프레임워크 적용

## Boundaries

**Always (자동 실행)**:
- 산출물 완성 후 reviewer 검증 실행
- 수치/날짜/법규 인용 시 1차 출처 확인
- 근거 불충분 시 명시 ("근거 불충분" 라벨링)
- 변경 이력 git으로 관리

**Ask First (확인 후 실행)**:
- 최종 문서 포맷 선택 (pptx vs docx vs pdf)
- 외부 데이터 소스 참조 (API 호출, 웹 검색)
- 민감한 재무/전략 정보 포함 여부
- main 브랜치 머지

**Never (금지)**:
- 검증되지 않은 수치를 사실처럼 제시
- 출처 없는 통계/시장 데이터 사용
- 민감 정보(NDA 대상 등) 커밋
- 6-gate 워크플로우 강제 적용 (이 트랙은 자연어 기반)
