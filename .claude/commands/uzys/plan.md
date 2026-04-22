Plan phase — 작업을 검증 가능한 작은 단위로 분해한다.

## Gate Check

`docs/SPEC.md`가 존재하는지 확인한다. 없으면 "Define 단계(`/uzys:spec`)를 먼저 완료하세요" 경고.

## Plan Depth — 변경 복잡도에 맞춰라

모든 SPEC을 동일하게 분해하지 않는다. 복잡도별로 plan 깊이를 조정:

| 복잡도 | 신호 | Plan 형태 |
|--------|------|----------|
| **Trivial** | diff를 1문장으로 설명 가능 / single file / 명확한 fix | **Plan skip 가능**. todo.md에 1-task entry만 (또는 plan 단계 자체 건너뛰기 사용자 합의 시) |
| **Standard** | multi-file / 여러 모듈 / unfamiliar 코드 일부 | **Milestone plan** (3-5개 outcome). per-task AC는 milestone 수준 |
| **Complex** | 새 기능 / cross-cutting / ambiguous 요구사항 | **Detailed plan** (vertical slice 10+ task, per-task AC, 의존성 그래프) |

판단 기준: Anthropic best practices — *"if you can describe the diff in one sentence, skip the plan"*. Opus급 모델은 자율 분해 가능하므로 micro-task 강제 시 ceremony가 됨.

## Process

1. SPEC.md를 읽고 전체 범위 + **복잡도** 판정 (위 표).
1.5. **GitHub Issue 우선 fetch (issue_tracking: enabled 시)**:
   - `gh issue list --state open --json number,title,body,labels` 호출
   - 각 issue body에서 `방향성 (YYYY-MM-DD 확정)` 패턴 grep — 확정된 것만 후보
   - 전제(Given) 미충족 issue 제외
   - 우선순위 정렬 (label P0 > P1 > P2 > unlabeled)
   - 상위 1-3개 issue → todo.md 진입 후보
2. **Trivial이면**: todo.md만 생성하고 즉시 Build로. plan.md는 1-2줄.
3. **Standard/Complex이면**: agent-skills의 planning-and-task-breakdown 스킬을 따라 분해:
   - Vertical slicing: 수평 레이어가 아닌 수직 기능 단위
   - 각 task에 Acceptance Criteria 정의 (Standard는 milestone 수준, Complex는 task 수준)
   - 의존성 순서 정렬
4. **North Star 4-gate 체크 (Complex 복잡도 + `docs/NORTH_STAR.md` 존재 시)**:
   - 신규 기능/task가 NORTH_STAR.md §5 Decision Heuristics의 4-gate(Trend/Persona/Capability/Lean)를 모두 통과하는가?
   - 1개 이상 fail 시 사용자에게 보고 후 결정 대기 (자동 진행 금지)
   - NORTH_STAR.md 부재 시 skip
5. Sprint Contract: 범위(포함/제외) + 완료 기준 + 제약 조건.
6. `docs/plan.md` + `docs/todo.md` 생성.

## Output

- `docs/plan.md` — 전체 계획, Phase 분해, 의존성
- `docs/todo.md` — 체크리스트 형태의 할 일 목록

## Gate

plan.md + todo.md가 존재하고, 최소 1개 task가 정의되어 있어야 완료.

## Gate Status Update

이 단계가 성공적으로 완료되면 `.claude/gate-status.json`의 `plan.completed`를 `true`로, `plan.timestamp`를 현재 시각으로 업데이트한다.

```bash
jq '.plan.completed = true | .plan.timestamp = now | .plan.timestamp = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))' .claude/gate-status.json > /tmp/gate-tmp.json && mv /tmp/gate-tmp.json .claude/gate-status.json
```
