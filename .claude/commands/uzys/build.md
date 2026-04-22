Build phase — TDD로 점진적 구현한다.

## Gate Check

`docs/todo.md`가 존재하는지 확인한다. 없으면 "Plan 단계(`/uzys:plan`)를 먼저 완료하세요" 경고.

## Process

1. `docs/todo.md`에서 다음 미완료 task를 선택한다.
2. agent-skills의 incremental-implementation + test-driven-development 스킬을 따른다:
   - RED: 실패하는 테스트 먼저 작성
   - GREEN: 테스트를 통과하는 최소 구현
   - REFACTOR: 코드 개선 (테스트 유지)
3. 완료된 task를 todo.md에서 체크한다.
4. **git-policy.md 적용: 즉시 commit → push**. issue_tracking enabled 시 commit message에 issue 번호 포함:
   - 진행 중: `<type>: 설명 (refs #N)`
   - task 완전 완료: PR에서 `Closes #N` 권장 (commit 단위 close 지양)
5. Build 중 새 bug/feature 발견 → `gh-issue-workflow` skill로 backlog 등록 (5섹션 ISSUE 템플릿). 현재 작업 흐름 깨지 않고 비동기 기록.

## Context-Aware Skill Selection

현재 편집 중인 파일에 따라 추가 스킬을 자동 활성화:

| 파일 유형 | 추가 활성화 |
|-----------|------------|
| `.tsx`, `.jsx`, `.html`, `.css` | frontend-ui-engineering 스킬 + DESIGN.md/.impeccable.md 참조 |
| API 라우트, 엔드포인트 | api-and-interface-design 스킬 |
| 외부 라이브러리 사용 | source-driven-development 스킬 (공식 문서 확인) |

## Auto-Actions

- SPEC.md가 300줄 초과 시 spec-scaling 스킬로 분리 제안.
- 커밋 없이 다음 task로 넘어가면 경고.
- 각 task 완료 시 todo.md 자동 업데이트.

## Gate Status Update

이 단계가 성공적으로 완료되면 `.claude/gate-status.json`의 `build.completed`를 `true`로, `build.timestamp`를 현재 시각으로 업데이트한다.

```bash
jq '.build.completed = true | .build.timestamp = now | .build.timestamp = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))' .claude/gate-status.json > /tmp/gate-tmp.json && mv /tmp/gate-tmp.json .claude/gate-status.json
```
