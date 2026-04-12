#!/bin/bash
# Session Start Hook
# git pull + 세션 컨텍스트 출력
set -e

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

# 1. git pull (branch가 있고 detached HEAD가 아닐 때)
if [ -n "$BRANCH" ] && [ "$BRANCH" != "HEAD" ]; then
  git pull --rebase 2>/dev/null || true
fi

# 2. SPEC 존재 여부 확인
SPEC_EXISTS="false"
if [ -f "docs/SPEC.md" ] || [ -f "SPEC.md" ]; then
  SPEC_EXISTS="true"
fi

# 3. 세션 컨텍스트 출력
if [ "$SPEC_EXISTS" = "true" ]; then
  cat <<EOF
{
  "priority": "INFO",
  "message": "Session started. Branch: ${BRANCH:-detached}. SPEC exists — read docs/SPEC.md first (Persistent Anchor). Check Change Log and current Phase before starting work."
}
EOF
else
  cat <<EOF
{
  "priority": "INFO",
  "message": "Session started. Branch: ${BRANCH:-detached}. No SPEC found. Use /uzys:spec to begin workflow."
}
EOF
fi
