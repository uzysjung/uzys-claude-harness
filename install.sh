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

# v27.8.0 — curl|bash로 호출된 경우 stdin이 pipe라 interactive 프롬프트가 깨진다.
# controlling tty가 실제 열리는지 fd 3에 먼저 시도 (set -e + redirection 실패 회피).
# CI/background 환경에서는 open이 실패하므로 조용히 skip.
if exec 3</dev/tty 2>/dev/null; then
  exec <&3 3<&-
fi

REPO="${UZYS_HARNESS_REPO:-https://github.com/uzysjung/uzys-claude-harness.git}"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# v27.8.0 — 사전 의존성 체크 (설치 중간에 죽지 않도록)
for cmd in git bash; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: 필수 명령 '$cmd'가 없습니다. 먼저 설치하세요." >&2
    exit 1
  fi
done

echo "Downloading uzys-claude-harness..."
if ! git clone --depth 1 "$REPO" "$TMP/harness" 2>&1; then
  echo "ERROR: git clone failed. Check network and repository URL." >&2
  exit 1
fi

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
