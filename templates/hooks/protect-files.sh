#!/bin/bash
# PreToolUse Hook: Write/Edit 대상이 보호 파일이면 차단
set -e

INPUT_JSON=$(cat)

# tool_input에서 file_path 추출
FILE_PATH=$(echo "$INPUT_JSON" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
    inp = data.get("tool_input", {})
    print(inp.get("file_path", inp.get("path", "")))
except Exception:
    print("")
' 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")

# 보호 패턴 확인
case "$BASENAME" in
  .env|.env.*)
    echo "{\"decision\": \"block\", \"reason\": \"Protected file: $BASENAME. Environment files must be edited manually.\"}"
    exit 0
    ;;
  package-lock.json|yarn.lock|pnpm-lock.yaml|Cargo.lock|poetry.lock|uv.lock)
    echo "{\"decision\": \"block\", \"reason\": \"Protected file: $BASENAME. Lock files should not be edited directly.\"}"
    exit 0
    ;;
  *.pem|*.key|*.p12|*.pfx)
    echo "{\"decision\": \"block\", \"reason\": \"Protected file: $BASENAME. Certificate/key files must not be modified by agents.\"}"
    exit 0
    ;;
esac
