#!/bin/bash
# ============================================================
# codebase-map.sh — Repository 구조 인덱스 생성
#
# 목적: 프로젝트의 파일 + top-level symbol을 빠르게 스캔해
#       .claude/codebase-map.json 생성. Grep/Glob 남발 방지.
#
# 호출 시점:
#   1. session-start hook (stale 체크 후 자동 갱신)
#   2. 수동 호출: bash .claude/hooks/codebase-map.sh
#
# 지원 언어 (regex 기반, Tree-sitter 불필요):
#   - Python (def, class)
#   - TypeScript/JavaScript (function, class, export)
#   - Rust (fn, struct, impl)
#   - Go (func, type)
#   - Shell (function)
#
# 출력: .claude/codebase-map.json
# {
#   "generated_at": "2026-04-15T...",
#   "file_count": N,
#   "files": [
#     {"path": "src/foo.py", "lines": 123, "symbols": ["def bar", "class Baz"]}
#   ]
# }
# ============================================================
set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MAP_FILE="$PROJECT_DIR/.claude/codebase-map.json"
MAX_FILES="${CODEBASE_MAP_MAX_FILES:-500}"
MAX_SYMBOLS_PER_FILE=20

cd "$PROJECT_DIR" || exit 0
mkdir -p "$(dirname "$MAP_FILE")"

# Stale check (10분 이내면 skip — session-start 경로 최적화)
if [ -f "$MAP_FILE" ]; then
  if command -v stat &>/dev/null; then
    if stat -f "%m" "$MAP_FILE" &>/dev/null; then
      MTIME=$(stat -f "%m" "$MAP_FILE")
    else
      MTIME=$(stat -c "%Y" "$MAP_FILE" 2>/dev/null || echo 0)
    fi
    NOW=$(date +%s)
    AGE=$((NOW - MTIME))
    # Force 플래그로 강제 갱신 가능
    if [ "$AGE" -lt 600 ] && [ "${1:-}" != "--force" ]; then
      exit 0
    fi
  fi
fi

# 제외 패턴
EXCLUDE_PATHS=(
  "./.git/*" "./node_modules/*" "./.venv/*" "./venv/*" "./__pycache__/*"
  "./dist/*" "./build/*" "./.next/*" "./target/*" "./coverage/*"
  "./.dev-references/*" "./.claude/codebase-map.json" "./docs/checkpoints/*"
)
EXCLUDE_ARGS=""
for pat in "${EXCLUDE_PATHS[@]}"; do
  EXCLUDE_ARGS="$EXCLUDE_ARGS -not -path '$pat'"
done

# 지원 파일 확장자
FILE_PATTERNS=(
  "*.py" "*.ts" "*.tsx" "*.js" "*.jsx" "*.rs" "*.go" "*.sh"
)

# 파일 수집 (find + 확장자)
declare -a FOUND_FILES=()
while IFS= read -r f; do
  FOUND_FILES+=("$f")
done < <(
  find . -type f \( \
    -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o \
    -name "*.js" -o -name "*.jsx" -o -name "*.rs" -o \
    -name "*.go" -o -name "*.sh" \
  \) \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" \
    -not -path "./.venv/*" \
    -not -path "./venv/*" \
    -not -path "./__pycache__/*" \
    -not -path "./dist/*" \
    -not -path "./build/*" \
    -not -path "./.next/*" \
    -not -path "./target/*" \
    -not -path "./coverage/*" \
    -not -path "./.dev-references/*" \
    -not -path "./docs/checkpoints/*" \
    2>/dev/null | head -n "$MAX_FILES"
)

FILE_COUNT=${#FOUND_FILES[@]}

# Symbol 추출 함수 (언어별 regex)
extract_symbols() {
  local file="$1"
  case "$file" in
    *.py)
      grep -nE "^(def |class )" "$file" 2>/dev/null | head -n "$MAX_SYMBOLS_PER_FILE" | \
        sed -E 's/^([0-9]+):([a-z]+ [A-Za-z_][A-Za-z0-9_]*).*/\1:\2/'
      ;;
    *.ts|*.tsx|*.js|*.jsx)
      grep -nE "^(export (default )?(async )?(function|class|const|interface|type)|function |class )" "$file" 2>/dev/null | \
        head -n "$MAX_SYMBOLS_PER_FILE" | \
        sed -E 's/^([0-9]+):(.{0,80}).*/\1:\2/'
      ;;
    *.rs)
      grep -nE "^(pub )?(fn|struct|enum|trait|impl) " "$file" 2>/dev/null | \
        head -n "$MAX_SYMBOLS_PER_FILE" | \
        sed -E 's/^([0-9]+):(.{0,80}).*/\1:\2/'
      ;;
    *.go)
      grep -nE "^(func|type) " "$file" 2>/dev/null | \
        head -n "$MAX_SYMBOLS_PER_FILE" | \
        sed -E 's/^([0-9]+):(.{0,80}).*/\1:\2/'
      ;;
    *.sh)
      grep -nE "^(function [A-Za-z_]|[A-Za-z_][A-Za-z0-9_]*\(\))" "$file" 2>/dev/null | \
        head -n "$MAX_SYMBOLS_PER_FILE" | \
        sed -E 's/^([0-9]+):(.{0,80}).*/\1:\2/'
      ;;
  esac
}

# JSON 조립 (jq 있으면 사용, 없으면 수동)
{
  echo "{"
  echo "  \"generated_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"file_count\": $FILE_COUNT,"
  echo "  \"max_files_limit\": $MAX_FILES,"
  echo "  \"files\": ["

  FIRST=true
  for f in "${FOUND_FILES[@]}"; do
    LINES=$(wc -l < "$f" 2>/dev/null | tr -d ' ' || echo 0)

    # Symbols 수집 (라인:텍스트 목록, JSON 배열로 변환)
    SYMBOLS_JSON="[]"
    if command -v jq &>/dev/null; then
      SYMBOLS_JSON=$(extract_symbols "$f" | \
        jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo "[]")
    fi

    [ "$FIRST" = true ] || echo ","
    FIRST=false
    printf '    {"path": "%s", "lines": %s, "symbols": %s}' \
      "$(echo "$f" | sed 's/"/\\"/g' | sed 's/^\.\///')" \
      "$LINES" \
      "$SYMBOLS_JSON"
  done

  echo ""
  echo "  ]"
  echo "}"
} > "$MAP_FILE.tmp"

# 유효성 체크 후 move
if command -v jq &>/dev/null; then
  if jq empty "$MAP_FILE.tmp" 2>/dev/null; then
    mv "$MAP_FILE.tmp" "$MAP_FILE"
  else
    rm -f "$MAP_FILE.tmp"
    echo "[codebase-map] JSON validation failed, map not updated" >&2
    exit 0
  fi
else
  mv "$MAP_FILE.tmp" "$MAP_FILE"
fi

# stderr 보고 (async hook으로 호출될 때도 로그 목적)
echo "[codebase-map] Indexed $FILE_COUNT files → $MAP_FILE" >&2
exit 0
