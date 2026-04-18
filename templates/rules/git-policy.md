# Git Policy

CLAUDE.md Git Policy의 프로젝트 레벨 확장. 중복 내용 제거.

## Commit 메시지

Conventional Commits: `<type>: <description>`
Types: feat, fix, refactor, docs, test, chore, perf, ci

커밋 메시지는 **why 중심**. what은 diff가 보여준다. Breaking change는 body에 `BREAKING CHANGE:` 표기.

## Branch 명명

`feat/<name>`, `fix/<name>`, `refactor/<name>`.

## PR

- Issue 링크: `Closes #N`
- 전체 커밋 이력 분석 (`git diff [base]...HEAD`)
- 요약에 변경 + 테스트 계획 포함
- 새 branch는 `-u` 플래그로 push

## Safety

- `--force`, `reset --hard`, hook 검증 우회 플래그 (`--no` + `verify` 옵션 결합 형태) 사용 금지 (명시적 요청 제외)
- git config 수정 금지
- `.env`, credentials, lock 파일 커밋 금지
