# CLI / Bash Development Rules

tooling Track에서 적용. Bash 스크립트, CLI 도구, 마크다운 템플릿 위주의 메타 프로젝트용.

## Bash Script Standards

### Shebang & Compatibility
- `#!/bin/bash` 명시 (sh, zsh 가정 금지)
- POSIX sh 호환 필요한 경우 `#!/bin/sh` + 명시 주석
- macOS와 Linux 모두 지원 (BSD vs GNU 차이 주의)

### Variable Conventions
- 상수: `UPPER_SNAKE_CASE` (예: `SCRIPT_DIR`, `INSTALL_FAILURES`)
- 지역 변수: `lower_snake_case`
- **변수 인용 필수**: `"$var"` (공백/특수문자 방어)
- 절대 경로 우선. 상대 경로는 `cd` 후 `pwd`로 절대화

### Function Definitions
```bash
function_name() {
  local var="$1"
  echo "..."
}
```
- `local`로 지역 스코프 선언
- 반환은 `echo` + `$()` 또는 exit code

## Error Handling

### set Options
- `set -e` 신중 사용 — plugin 설치 등 실패 허용 섹션은 별도 처리
- `set -u` 미정의 변수 차단 (옵션)
- `set -o pipefail` 파이프 중간 실패 감지 (필요 시)

### Exit Codes
- `0`: 성공
- `1`: 일반 에러
- `2`: 사용자 입력/설정 에러 (Hook block 시)

### Error Messages
- stderr 사용: `echo "ERROR: ..." >&2`
- 구조화: `[ScriptName] ERROR: message`

## Cross-Platform

### BSD vs GNU 차이
- `sed -i`: BSD는 `sed -i ''`, GNU는 `sed -i`
- `date`: BSD `date -j`, GNU `date -d`
- `readlink -f`: GNU만. macOS는 `cd "$(dirname "$f")" && pwd` 사용

### 회피 전략
- `find`, `xargs` 같은 표준 도구 사용
- BSD/GNU 차이가 큰 명령은 `if command -v gsed` 같은 폴백

## Tool Selection

| 용도 | 우선 | 폴백 |
|------|------|------|
| JSON 파싱 | `jq` | `grep + sed` |
| 텍스트 치환 | `sed` | `awk` |
| 패턴 매칭 | `grep -o` | `awk '/pattern/'` |
| Subprocess | `$(command)` | (backticks 금지) |

## Hook Script Conventions

PreToolUse Hook 작성 시:
- stdin으로 JSON 받음 → `jq` 또는 `grep`으로 파싱
- 차단: `exit 2` + stderr에 사유
- 통과: `exit 0` (출력 없음)
- async hook: 빠른 실행 (10초 이내)

## Markdown Template Quality

- 모든 frontmatter는 `---` 구분
- 링크는 상대 경로 우선
- 깨진 링크 검증: `markdown-link-check` 또는 수동
- 코드 블록 언어 명시 (```bash, ```python)

## Testing

- **shellcheck**: `shellcheck script.sh` 정적 분석 필수
- **bats**: 단위 테스트 (`@test "description" { ... }`)
- **수동 테스트**: heredoc 또는 echo + pipe로 stdin mock

```bash
echo '{"tool_input":{"file_path":".env"}}' | bash protect-files.sh
```

## Anti-Patterns

- `set -e` + `|| true` 혼용 (의도가 불분명)
- 변수 인용 누락: `cp $src $dst` (공백 시 깨짐)
- backticks: `` `command` `` (중첩 어려움)
- 임시 파일을 `/tmp/file.txt`처럼 고정 경로 (충돌 가능)
- 에러를 `2>/dev/null`로 무조건 묵살
