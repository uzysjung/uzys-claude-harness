# Project CLAUDE.md -- CSR Supabase Track

## Stack

- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime) + Edge Functions (Deno)
- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Desktop**: Tauri (Rust shell)
- **Infra**: Supabase hosted / self-hosted
- **MCP**: Supabase

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
| test-policy | 단위/통합/E2E 테스트. 커버리지 80% 이상 |
| ship-checklist | 배포 전 최종 점검 체크리스트 |
| code-style | 불변성, 소형 파일(800줄 이하), 함수 50줄 이하 |
| error-handling | 명시적 에러 처리. 에러 무시 금지 |
| design-workflow | UI/UX 설계 프로세스. shape -> build -> polish |
| tauri | Tauri IPC, 보안 설정, 빌드 구성 |
| shadcn | shadcn/ui 컴포넌트 사용 규칙, 커스터마이징 패턴 |
| api-contract | Supabase Edge Function 계약. 요청/응답 스키마 정의 |

## Agents

| Agent | Scope | Model | 역할 |
|-------|-------|-------|------|
| reviewer | global | opus | 검증 전용 (SOD). 코드/문서/UI 관점 전환 |
| code-reviewer | project | sonnet | 일상적 코드 리뷰. CRITICAL -> LOW 분류 |
| security-reviewer | project | sonnet | OWASP Top 10, Supabase RLS 검증 |

## Skills

- **agent-skills**: 워크플로우 백본 (spec-driven-development, idea-refine)
- **ECC CL-v2**: instinct 기반 학습. 세션 관찰 -> 패턴 축적
- **Impeccable**: 프론트엔드 디자인 품질 (polish, critique, audit)
- **react-best-practices**: React 패턴, 훅 규칙, 상태 관리
- **shadcn-ui**: shadcn/ui 컴포넌트 가이드, 테마 커스터마이징
- **supabase**: Supabase 종합 (DB/Auth/Edge/Realtime/Storage/Vectors/Cron/Queues)
- **postgres-best-practices**: 쿼리 최적화, RLS, 인덱스, 연결 풀링, SSR 통합

## Plugins

- **agent-skills**: 6-gate 워크플로우 엔진
- **supabase-agent-skills**: Supabase 전용 전문 지식 (공식 플러그인, D23)
- **Vercel CLI** + **Netlify CLI**: 프론트엔드 배포 (Supabase backend + JAMstack hosting)

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
- Supabase RLS 정책 변경 시 security-reviewer 실행
- Supabase 쿼리 작성 시 postgres-best-practices 스킬 참조 (인덱스, RLS 영향)
- git pull로 세션 시작

**Ask First (확인 후 실행)**:
- Supabase 마이그레이션 실행
- Edge Function 배포
- Tauri 빌드/릴리스
- main 브랜치 머지

**Never (금지)**:
- main 직접 커밋
- 시크릿 하드코딩
- RLS 비활성화 상태로 배포
- 게이트 건너뛰기 (Hotfix 예외)
- DO NOT CHANGE 영역 수정
