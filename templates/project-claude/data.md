# Project CLAUDE.md -- Data Track

## Stack

- **Language**: Python 3.12+
- **Query Engine**: DuckDB (로컬 분석) + Trino (분산 쿼리)
- **ML/DL**: scikit-learn, PyTorch, transformers
- **Data**: pandas, polars, Apache Arrow, Parquet
- **Visualization**: matplotlib, seaborn, plotly
- **Desktop**: PySide6 (Qt for Python)
- **Notebook**: Jupyter / JupyterLab

## Workflow

6-gate 개발 워크플로우 적용:

```
Define(/uzys:spec) -> Plan(/uzys:plan) -> Build(/uzys:build) -> Verify(/uzys:test) -> Review(/uzys:review) -> Ship(/uzys:ship)
```

- 각 게이트를 순서대로 통과해야 다음 단계 진행 가능.
- Hotfix 단축: Build -> Verify -> Ship (긴급 수정에 한함).
- 탐색적 분석(EDA)은 Build 게이트에서 노트북 기반 진행 허용.

## Active Rules

| Rule | 설명 |
|------|------|
| git-policy | 브랜치 전략, PR 필수, main 직접 커밋 금지 |
| change-management | 변경 영향 분석, DO NOT CHANGE 영역 보호 |
| test-policy | 단위/통합 테스트 (pytest). 커버리지 80% 이상 |
| commit-policy | Conventional Commits 형식. 즉시 커밋 |
| ship-checklist | 배포/릴리스 전 최종 점검 체크리스트 |
| code-style | 불변성, 소형 파일(800줄 이하), 함수 50줄 이하 |
| error-handling | 명시적 에러 처리. 데이터 파이프라인 실패 복구 |
| pyside6 | PySide6 위젯 규칙, 시그널/슬롯 패턴, 스레딩 |
| data-analysis | 데이터 품질 검증, 재현 가능한 분석, 시드 고정 |

## Agents

| Agent | Scope | Model | 역할 |
|-------|-------|-------|------|
| reviewer | global | opus | 검증 전용 (SOD). 코드/문서/분석 관점 전환 |
| data-analyst | global | opus | DuckDB/Trino/ML/PySide6 전문 |
| code-reviewer | project | sonnet | 일상적 코드 리뷰. CRITICAL -> LOW 분류 |
| security-reviewer | project | sonnet | 데이터 접근 권한, PII 처리 검증 |

## Skills

- **agent-skills**: 워크플로우 백본 (spec-driven-development, idea-refine)
- **ECC CL-v2**: instinct 기반 학습. 세션 관찰 -> 패턴 축적
- **Impeccable**: 디자인 품질 (PySide6 UI 용도)

## Plugins

- **agent-skills**: 6-gate 워크플로우 엔진
- **Railway**: 배포 자동화 (데이터 파이프라인, API 서빙)

## Commands

| Namespace | Command | 용도 |
|-----------|---------|------|
| uzys: | spec, plan, build, test, review, ship | 6-gate 개발 사이클 |
| ecc: | security-scan, instinct-status, evolve, promote | 보안 스캔, 학습 관리 |
| imm: | teach, polish, critique, audit | 디자인 품질 관리 (PySide6 UI) |
| gsd: | (선택 설치) | 대형 프로젝트 오케스트레이션 |

## Boundaries

**Always (자동 실행)**:
- 코드 변경 후 code-reviewer 실행
- 커밋 전 보안 체크 (하드코딩된 시크릿/DB 자격증명 탐지)
- 데이터 파이프라인에 입력 검증 확인
- ML 실험에 랜덤 시드 고정 확인
- git pull로 세션 시작

**Ask First (확인 후 실행)**:
- 대용량 데이터 처리 실행 (메모리/디스크 영향)
- 모델 학습 시작 (GPU 자원 소비)
- Trino 클러스터 쿼리 실행
- main 브랜치 머지

**Never (금지)**:
- main 직접 커밋
- 시크릿/자격증명 하드코딩
- PII 데이터를 로그/커밋에 포함
- 시드 없는 ML 실험 (재현 불가)
- 게이트 건너뛰기 (Hotfix 예외)
- DO NOT CHANGE 영역 수정
