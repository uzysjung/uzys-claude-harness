# Commit Policy

## Core Rule

코드 또는 문서 변경 시 **즉시 커밋**한다. "나중에 한꺼번에" 금지.

## Format

```
<type>: <description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

## Commit Workflow

1. `git diff` — 변경 사항 확인
2. `git add <specific files>` — 관련 파일만 스테이징 (`git add -A` 지양)
3. 커밋 메시지 작성 — "why"에 초점
4. `git commit` — 실행
5. 다음 작업 진행

## Rules

- 커밋 없이 다음 작업으로 넘어가면 경고.
- `.env`, `.key`, `.pem`, credentials 파일은 스테이징 금지.
- `--no-verify` 사용 금지. hook 실패 시 원인 수정.
- Breaking change는 body에 `BREAKING CHANGE:` 표기.
