# Project CLAUDE.md -- SSR HTMX Track

## Stack

- **Backend**: FastAPI + Python 3.12+ (uvicorn)
- **Templating**: Jinja2
- **Frontend**: HTMX + Alpine.js (필요 시)
- **UI**: Tailwind CSS + daisyUI
- **Database**: PostgreSQL (SQLAlchemy / SQLModel)
- **Infra**: Railway

## Workflow

6-gate 개발 워크플로우 적용:

```
Define(/uzys:spec) -> Plan(/uzys:plan) -> Build(/uzys:build) -> Verify(/uzys:test) -> Review(/uzys:review) -> Ship(/uzys:ship)
```

- 각 게이트를 순서대로 통과해야 다음 단계 진행 가능.
- Hotfix 단축: Build -> Verify -> Ship (긴급 수정에 한함).

## Active Rules

| Rule | 설명 |
|------|------|
| git-policy | 브랜치 전략, PR 필수, main 직접 커밋 금지 |
| change-management | 변경 영향 분석, DO NOT CHANGE 영역 보호 |
| test-policy | 단위/통합/E2E (pytest + Playwright). 커버리지 80% 이상 |
| ship-checklist | 배포 전 최종 점검 체크리스트 |
| code-style | 불변성(Pydantic 모델), 소형 파일, 함수 50줄 이하 |
| error-handling | 명시적 에러 처리. HTTPException 계층화 |
| design-workflow | UI/UX 설계 프로세스. shape -> build -> polish |
| htmx | HTMX 속성 규칙, 부분 렌더링, hx-swap 전략 |
| seo | 시맨틱 HTML, 메타 태그, OG 태그, 구조화된 데이터 |

## Agents

| Agent | Scope | Model | 역할 |
|-------|-------|-------|------|
| reviewer | global | opus | 검증 전용 (SOD). 코드/문서/UI 관점 전환 |
| code-reviewer | project | sonnet | 일상적 코드 리뷰. CRITICAL -> LOW 분류 |
| security-reviewer | project | sonnet | OWASP Top 10, CSRF/XSS 방어 검증 |

## Skills

- **agent-skills**: 워크플로우 백본 (spec-driven-development, idea-refine)
- **ECC CL-v2**: instinct 기반 학습. 세션 관찰 -> 패턴 축적
- **Impeccable**: 프론트엔드 디자인 품질 (polish, critique, audit)

## Plugins

- **agent-skills**: 6-gate 워크플로우 엔진
- **Railway**: 배포 자동화 (FastAPI 서비스 + PostgreSQL)

## Commands

| Namespace | Command | 용도 |
|-----------|---------|------|
| uzys: | spec, plan, build, test, review, ship | 6-gate 개발 사이클 |
| ecc: | security-scan, instinct-status, evolve, promote | 보안 스캔, 학습 관리 |
| imm: | teach, polish, critique, audit, shape, adapt | 디자인 품질 관리 |
| gsd: | (선택 설치) | 대형 프로젝트 오케스트레이션 |

## Boundaries

**Always (자동 실행)**:
- 코드 변경 후 code-reviewer 실행
- 커밋 전 보안 체크 (하드코딩된 시크릿 탐지)
- Jinja2 템플릿에서 사용자 입력 자동 이스케이프 확인
- HTMX 응답에 적절한 Content-Type 헤더 확인
- git pull로 세션 시작

**Ask First (확인 후 실행)**:
- Alembic 마이그레이션 실행
- Railway 배포
- SEO 관련 메타 태그/sitemap 변경
- main 브랜치 머지

**Never (금지)**:
- main 직접 커밋
- 시크릿 하드코딩
- Jinja2 autoescaping 비활성화
- 프로덕션 DB 직접 조작
- 게이트 건너뛰기 (Hotfix 예외)
- DO NOT CHANGE 영역 수정
