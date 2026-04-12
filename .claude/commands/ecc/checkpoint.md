현재 진행 상태의 스냅샷을 생성한다. 게이트 간 savepoint로 활용.

## Process

아래 항목을 확인하고 체크포인트를 기록한다:

1. **테스트 상태** — 전체/통과/실패 수, 커버리지
2. **빌드 상태** — 성공 또는 에러
3. **코드 변경** — `git diff --stat` 요약
4. **완료된 작업** — 체크리스트
5. **차단 이슈** — 있으면 기술
6. **다음 단계** — 남은 작업

## Output Format

```markdown
### Checkpoint: [YYYY-MM-DD HH:MM]

**Tests**: Total X, Pass Y, Fail Z, Coverage XX%
**Build**: PASS / FAIL
**Changes since last checkpoint**: `git diff --stat`
**Completed**: [x] Task 1, [x] Task 2, [ ] Task 3 (진행 중)
**Blockers**: [있으면 기술]
**Next**: 1. Step 1, 2. Step 2
```

## Usage

- 주요 변경 전 savepoint로
- Phase 전환 시 진행 상태 기록
- 롤백 결정 시 참조점
- `git commit -m "chore: checkpoint [설명]"` 과 함께 사용
