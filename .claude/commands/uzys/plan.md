Plan phase — 작업을 검증 가능한 작은 단위로 분해한다.

## Gate Check

`docs/SPEC.md`가 존재하는지 확인한다. 없으면 "Define 단계(`/uzys:spec`)를 먼저 완료하세요" 경고.

## Process

1. SPEC.md를 읽고 전체 범위를 파악한다.
2. agent-skills의 planning-and-task-breakdown 스킬을 따라 작업을 분해한다:
   - Vertical slicing: 수평 레이어가 아닌 수직 기능 단위로 분할
   - 각 task에 Acceptance Criteria 정의
   - 의존성 순서 정렬
3. Sprint Contract를 작성한다:
   - 범위 (포함/제외)
   - 완료 기준 (검증 가능한 조건)
   - 제약 조건
4. `docs/plan.md`와 `docs/todo.md`를 생성한다.

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
