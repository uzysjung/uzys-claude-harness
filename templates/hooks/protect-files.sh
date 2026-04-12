#!/bin/bash
# PreToolUse Hook: Write/Edit 대상이 보호 파일이면 차단
# Python 의존 없음 — jq 또는 순수 bash로 동작
set -e

INPUT_JSON=$(cat)

# jq가 있으면 사용, 없으면 grep 폴백
if command -v jq &> /dev/null; then
  FILE_PATH=$(echo "$INPUT_JSON" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)
else
  # 순수 bash 폴백: file_path 추출
  FILE_PATH=$(echo "$INPUT_JSON" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')
  if [ -z "$FILE_PATH" ]; then
    FILE_PATH=$(echo "$INPUT_JSON" | grep -o '"path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')
  fi
fi

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")

# 보호 패턴 확인
case "$BASENAME" in
  .env|.env.*)
    echo "BLOCKED: Protected file: $BASENAME. Environment files must be edited manually." >&2
    exit 2
    ;;
  package-lock.json|yarn.lock|pnpm-lock.yaml|Cargo.lock|poetry.lock|uv.lock)
    echo "BLOCKED: Protected file: $BASENAME. Lock files should not be edited directly." >&2
    exit 2
    ;;
  *.pem|*.key|*.p12|*.pfx)
    echo "BLOCKED: Protected file: $BASENAME. Certificate/key files must not be modified by agents." >&2
    exit 2
    ;;
esac

exit 0
