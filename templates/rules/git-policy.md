# Git Policy

## Branch Rules

- `main` 직접 커밋 금지. 모든 작업은 feature branch에서.
- Branch 명명: `feat/<name>`, `fix/<name>`, `refactor/<name>`
- 동시 세션 시 세션별 별도 feature branch 사용.
- 세션 시작 시 `git pull --rebase` 강제.

## Commit / Push / PR Rules

- 코드/문서 변경 시 **즉시 commit → push**. "나중에 한꺼번에" 금지.
- Conventional Commits 형식: `<type>: <description>`
- Types: feat, fix, refactor, docs, test, chore, perf, ci
- 커밋 메시지는 "why"에 초점. "what"은 diff에서 보인다.
- Breaking change는 body에 `BREAKING CHANGE:` 표기.
- 작업 단위 완료 시(Phase 전환, 기능 완성) **반드시 PR 생성**.

## PR Rules

- PR은 Issue에 링크: `Closes #N`
- PR 생성 시 전체 커밋 이력 분석 (최신 커밋만이 아닌 `git diff [base]...HEAD`)
- PR 요약에 변경 사항 + 테스트 계획 포함.
- 새 branch는 `-u` 플래그로 push.

## Safety

- git config 수정 금지.
- `--force`, `--no-verify`, `reset --hard` 사용 금지 (명시적 요청 제외).
- `.env`, credentials, lock 파일 커밋 금지.
