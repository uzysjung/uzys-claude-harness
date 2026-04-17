# CLI / Bash Development Rules

tooling Track 전용. 기본 bash 규약(shebang/quoting/local/backticks/stderr)은 shellcheck가 처리. 여기는 프로젝트 특화만.

## Cross-Platform (BSD vs GNU)

macOS(BSD)와 Linux(GNU) 양쪽 지원이 필수인 경우:

| 명령 | BSD | GNU | 회피 |
|------|-----|-----|------|
| `sed -i` | `sed -i ''` | `sed -i` | `-i.bak` + `rm *.bak` 또는 분기 |
| `date` | `date -j` | `date -d` | `if command -v gdate` 폴백 |
| `readlink -f` | 미지원 | 지원 | `cd "$(dirname $f)" && pwd` |

차이가 큰 명령은 `command -v` 폴백 필수.

## set 플래그

- `set -e` + `|| true` 혼용 금지 (의도 불분명). 실패 허용 섹션은 명시적 try 블록으로
- plugin 설치 등 실패 허용 구간에서 `set -e` 비활성화 가능
- `set -o pipefail`은 파이프 실패 검출 필요 시

## Hook Script 규약

PreToolUse hook 작성 시:
- stdin으로 JSON 받음 → `jq` 또는 `grep` 폴백 (jq 미설치 환경 대응)
- **차단**: `exit 2` + stderr에 사유
- **통과**: `exit 0` (출력 없음)
- async hook은 10초 이내 완료

## 임시 파일

`/tmp/file.txt` 같은 **고정 경로 금지** — 세션 충돌. `mktemp`/`mktemp -d` 사용.

## Testing

- **shellcheck**: 필수 정적 분석
- **bats**: 단위 테스트 (optional)
- **수동**: `echo '{"...": "..."}' | bash hook.sh` heredoc/pipe로 stdin mock
