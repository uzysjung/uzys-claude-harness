# Project CLAUDE.md -- Full Track (Union)

## Stack

모든 트랙의 스택을 포함. 에이전트가 파일 컨텍스트에 따라 관련 규칙을 자동 판별.

- **Backend (Node)**: Fastify + TypeScript
- **Backend (Python)**: FastAPI + Python 3.12+
- **Backend (Serverless)**: Supabase Edge Functions (Deno)
- **Frontend (CSR)**: React + TypeScript + Vite
- **Frontend (SSR)**: Next.js (App Router) / Jinja2 + HTMX
- **UI**: shadcn/ui + Tailwind CSS / daisyUI
- **Desktop**: Tauri (Rust) / PySide6 (Python)
- **Data**: DuckDB + Trino + ML/DL (PyTorch, scikit-learn)
- **Documents**: PPT/Excel/Word/PDF (document-skills)
- **Infra**: Railway, Supabase
- **MCP**: Supabase

## Workflow

컨텍스트에 따라 워크플로우 자동 선택:

**개발 트랙** (코드 파일 대상):
```
Define(/uzys:spec) -> Plan(/uzys:plan) -> Build(/uzys:build) -> Verify(/uzys:test) -> Review(/uzys:review) -> Ship(/uzys:ship)
```

**Executive 트랙** (문서/제안서 대상):
```
요청 -> strategist 분석 -> document-skills 산출물 -> reviewer 검증 -> 전달
```

- 에이전트가 작업 대상 파일 확장자와 컨텍스트로 트랙 판별.
- 명시적으로 트랙 지정도 가능: "Executive 모드로 제안서 작성".

## Active Rules (전체)

| Rule | 적용 트랙 | 설명 |
|------|-----------|------|
| git-policy | ALL | 브랜치 전략, PR 필수 |
| change-management | ALL | 변경 영향 분석, DO NOT CHANGE 보호 |
| test-policy | DEV | 커버리지 80% 이상 |
| commit-policy | DEV | Conventional Commits |
| ship-checklist | DEV | 배포 전 최종 점검 |
| code-style | DEV | 불변성, 소형 파일 |
| error-handling | DEV | 명시적 에러 처리 |
| design-workflow | CSR/SSR | UI/UX 설계 프로세스 |
| tauri | CSR | Tauri IPC, 보안 |
| shadcn | CSR/SSR-Next | shadcn/ui 규칙 |
| api-contract | CSR | API 계약 정의 |
| database | CSR-Fastify/FastAPI | DB 마이그레이션 |
| htmx | SSR-HTMX | HTMX 속성 규칙 |
| nextjs | SSR-Next | App Router, 캐싱 |
| seo | SSR | SEO 최적화 |
| pyside6 | DATA | PySide6 위젯/시그널 |
| data-analysis | DATA | 데이터 품질, 재현성 |
| ecc-git-workflow | DEV | Conventional Commits, PR (ECC) |
| ecc-testing | DEV | 80% 커버리지, TDD, AAA (ECC) |
| cli-development | TOOLING | Bash 표준, cross-platform, hook 컨벤션 |

**참고**: 에이전트가 현재 작업 파일의 컨텍스트에 따라 관련 규칙만 활성화.

## Agents

| Agent | Scope | Model | 역할 |
|-------|-------|-------|------|
| reviewer | global | opus | 검증 전용 (SOD). 모든 산출물 검증 |
| data-analyst | global | opus | DuckDB/Trino/ML/PySide6 전문 |
| strategist | global | opus | 사업 전략, 제안서, DD |
| code-reviewer | project | sonnet | 일상적 코드 리뷰 |
| security-reviewer | project | sonnet | OWASP Top 10, 보안 검증 |

## Skills

- **agent-skills**: 워크플로우 백본 (6-gate 개발 사이클)
- **ECC CL-v2**: instinct 기반 학습
- **Impeccable**: 프론트엔드 디자인 품질
- **react-best-practices**: React 패턴 (CSR/SSR-Next)
- **shadcn-ui**: shadcn/ui 가이드 (CSR/SSR-Next)
- **document-skills**: pptx/docx/xlsx/pdf (Executive)

## Plugins

- **agent-skills**: 6-gate 워크플로우 엔진
- **Railway**: 배포 자동화

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
- 커밋 전 보안 체크
- 문서 산출물 완성 후 reviewer 검증
- git pull로 세션 시작

**Ask First (확인 후 실행)**:
- DB 마이그레이션 실행
- Railway/Supabase 배포
- Tauri 빌드/릴리스
- 대용량 데이터 처리/모델 학습
- 최종 문서 포맷 선택
- main 브랜치 머지

**Never (금지)**:
- main 직접 커밋
- 시크릿 하드코딩
- 프로덕션 DB 직접 조작
- 게이트 건너뛰기 (개발 트랙, Hotfix 예외)
- DO NOT CHANGE 영역 수정
- 검증되지 않은 수치를 사실처럼 제시
