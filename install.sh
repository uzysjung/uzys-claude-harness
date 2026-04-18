#!/bin/bash
# ============================================================
# install.sh — uzys-claude-harness 원격 설치 스크립트
#
# 사용법:
#   curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh | bash -s -- --track csr-fastapi
#   curl -fsSL ... | bash -s -- --track executive --project-dir /path/to/project
#
# 또는:
#   bash <(curl -fsSL https://raw.githubusercontent.com/.../install.sh) --track tooling
#
# 동작:
#   1. 리포를 /tmp에 shallow clone
#   2. setup-harness.sh 실행 (모든 인자 전달)
#   3. 클론 제거 (설치 결과만 유지)
#
# 요구사항: git, node >=22, claude CLI, jq (권장)
# ============================================================
set -e

REPO="https://github.com/uzysjung/uzys-claude-harness.git"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "Downloading uzys-claude-harness..."
git clone --depth 1 "$REPO" "$TMP/harness" 2>/dev/null || {
  echo "ERROR: git clone failed. Check network and repository URL." >&2
  exit 1
}

echo "Running setup-harness.sh..."
bash "$TMP/harness/scripts/setup-harness.sh" "$@"
EXIT_CODE=$?

echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "Installation complete. Temporary clone removed."
else
  echo "Installation failed (exit $EXIT_CODE). Check output above." >&2
fi

exit $EXIT_CODE
