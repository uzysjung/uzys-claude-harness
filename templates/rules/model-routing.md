# Model Routing

> **활성화 조건**: 이 파일이 `.claude/rules/model-routing.md`에 존재할 때만 적용. 비활성 시 파일 삭제 또는 설치 시 `--model-routing=off`.
>
> **목적**: 같은 작업이라도 모델을 용도에 맞게 선택해 **토큰 비용 40–70% 감소** (업계 리서치 기준). 사용자가 `/model` 명령으로 수동 전환하는 것을 **권장 매핑으로 가이드**한다.

## 원칙

- **비용 우선**: 성능 차이가 작업 결과에 영향 없으면 더 싼 모델 선택
- **품질 우선**: 결정/아키텍처/검증 단계에서는 비용보다 품질 우선
- **모델 기본값은 세션 전반 sonnet**: 아래 표는 단계별 "권장 전환" 시점

## 6-Gate × Model Mapping

| 단계 | 권장 모델 | 근거 |
|------|----------|------|
| `/uzys:spec` | **sonnet** | SPEC 작성은 구조화 + 맥락 이해. Haiku는 놓치는 것 많음 |
| `/uzys:plan` | **sonnet** | Task 분해 + 의존성 판단. Sonnet이 ROI 최고 |
| `/uzys:build` | **sonnet** (복잡) / **haiku** (반복 작업) | TDD 사이클 중 단순 구현은 Haiku 고려 |
| `/uzys:test` | **haiku** | 테스트 실행/로그 분석은 저비용으로 충분 |
| `/uzys:review` | **opus** | 검증은 품질 최우선. reviewer subagent도 opus |
| `/uzys:ship` | **sonnet** | 배포 절차 체크는 Sonnet 적정 |

## 작업 유형 × Model Mapping

| 작업 유형 | 권장 모델 | 이유 |
|----------|----------|------|
| 파일 탐색 (Glob/Grep) | haiku | 단순 IO |
| 간단한 Edit | haiku | 로컬 변경 |
| 대규모 리팩터링 | sonnet | 여러 파일 영향 분석 |
| 아키텍처 결정 | opus | 장기 영향 |
| 보안/성능 리뷰 | opus | 놓치면 비용 큼 |
| 테스트 작성 | sonnet | 엣지 케이스 도출 |
| 문서/제안서 작성 | sonnet | 구조적 사고 |
| 일상 코드 리뷰 | sonnet (code-reviewer agent) | 이미 sonnet 지정 |
| 심층 리뷰 | opus (reviewer agent) | fork 컨텍스트 + 품질 우선 |

## Self-Check (이 Rule이 활성화된 세션)

Claude는 task 시작 전 이 표를 참조해 다음을 스스로 평가:
1. 현재 작업이 어느 범주에 속하는가?
2. 현재 모델이 권장과 일치하는가?
3. 불일치 시 사용자에게 `/model <name>` 전환 제안

단, **에이전트는 자동으로 모델을 바꾸지 않는다**. `/model` 명령은 사용자가 실행한다 (Claude Code CLI 제약).

## 토글 (on/off)

- **활성**: `bash setup-harness.sh --model-routing=on ...` → 이 파일이 설치됨
- **비활성**: `--model-routing=off` (기본) → 파일 미설치, 모델 라우팅 권장 없음
- **기존 프로젝트 on 전환**: `cp templates/rules/model-routing.md .claude/rules/`
- **off 전환**: `rm .claude/rules/model-routing.md`

## 제약 (Claude Code 구조적 한계)

- Hook에서 `/model` 명령을 프로그래밍적으로 호출할 방법 **없음**
- 이 Rule은 **권장 지침**이고, 실제 전환은 사용자 수동
- 따라서 "강제"가 아닌 "가이드"로 동작
