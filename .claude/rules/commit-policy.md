# Commit Policy

## Core Rule

코드 또는 문서 변경 시 **즉시 commit → push**. "나중에 한꺼번에" 금지.

## Timing

1. task 1개 완료 → 즉시 커밋
2. 다음 task 시작 전 push
3. 작업 단위(Phase 전환, 기능 완성) → PR 생성

커밋 형식은 ecc-git-workflow.md 참조 (Conventional Commits).

## Commit Workflow

1. `git diff` — 변경 사항 확인
2. `git add <specific files>` — 관련 파일만 스테이징 (`git add -A` 지양)
3. 커밋 메시지 작성 — "why"에 초점
4. `git commit` → `git push`

## Safety

- 커밋 없이 다음 작업으로 넘어가면 경고 (uncommitted-check Hook).
- `.env`, `.key`, `.pem`, credentials 파일은 스테이징 금지.
- `--no-verify` 사용 금지. hook 실패 시 원인 수정.
