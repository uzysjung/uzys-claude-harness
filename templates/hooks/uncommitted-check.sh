#!/bin/bash
# PreToolUse Hook: 커밋되지 않은 변경 경고
# uzys: 커맨드 실행 전 uncommitted changes가 있으면 경고
# 차단은 하지 않음 (경고만)
set -e

INPUT_JSON=$(cat)

# skill 이름 추출
SKILL_NAME=$(echo "$INPUT_JSON" | jq -r '.tool_input.skill // .tool_input.args // ""' 2>/dev/null || echo "")

# uzys: 커맨드가 아니면 무시
case "$SKILL_NAME" in
  uzys:spec|uzys:plan|uzys:build|uzys:test|uzys:review|uzys:ship) ;;
  *) exit 0 ;;
esac

# git repo가 아니면 무시
git rev-parse --git-dir > /dev/null 2>&1 || exit 0

# 커밋되지 않은 변경 확인
UNCOMMITTED=$(git status --porcelain 2>/dev/null | head -5)
if [ -n "$UNCOMMITTED" ]; then
  COUNT=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  echo "WARNING: ${COUNT}개의 커밋되지 않은 변경이 있습니다. commit-policy에 따라 즉시 커밋하세요." >&2
  echo "$UNCOMMITTED" >&2
  if [ "$COUNT" -gt 5 ]; then
    echo "... (${COUNT}개 중 5개만 표시)" >&2
  fi
fi

# 경고만, 차단하지 않음
exit 0
