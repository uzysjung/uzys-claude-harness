#!/bin/bash
# karpathy Gate — Claude Code PreToolUse hook (Write|Edit matcher, non-blocking warn).
#
# v0.6.0 cherry-pick from alirezarezvani/claude-skills@f567c61
#   src: engineering/karpathy-coder/hooks/karpathy-gate.sh
#   License: MIT (alirezarezvani/claude-skills)
#
# Adapt for Claude Code PreToolUse context:
#   - upstream은 git pre-commit (staged files) context 가정
#   - 본 스크립트는 PreToolUse Write|Edit — Claude가 코드 작성 직전 발동
#   - stdin으로 tool_input JSON 받음 (Claude Code hook spec)
#   - file_path 추출 → Python 도구로 complexity 검사 (best-effort)
#   - 비차단 (exit 0 항상) — upstream "warn, doesn't reject" 정신 유지
#
# Python 3 + plugin scripts 부재 시 graceful exit (commit/edit 차단 X).

# 어떤 실패도 차단 안 함
set +e

# stdin tool_input JSON 읽기 (Claude Code hook spec: PreToolUse 시 자동 주입)
INPUT=$(cat 2>/dev/null || echo "")

# file_path 추출 — jq 우선, grep 폴백 (cli-development.md hook 컨벤션)
# jq 가용 시: escape 처리 정확. 미설치 시: grep+sed (단순 케이스만)
if command -v jq >/dev/null 2>&1; then
  FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")
else
  FILE_PATH=$(printf '%s' "$INPUT" | grep -o '"file_path":"[^"]*"' | head -1 | sed 's/"file_path":"//; s/"$//')
fi

# 짧은 reminder — 모든 Write|Edit 시점에 출력 (4 원칙 환기)
printf '[karpathy] Think Before / Simplicity / Surgical / Goal-Driven\n' >&2

# Python 3 + plugin scripts 가용 시만 complexity 검사
SCRIPT_DIR="${CLAUDE_PLUGIN_ROOT:-}/scripts"
if ! command -v python3 >/dev/null 2>&1; then
  # Python 3 부재 — reminder만 출력하고 종료
  exit 0
fi
if [ ! -d "$SCRIPT_DIR" ]; then
  # plugin 미설치 또는 ${CLAUDE_PLUGIN_ROOT} 미세팅
  exit 0
fi
if [ -z "$FILE_PATH" ]; then
  # tool_input 파싱 실패 또는 file_path 없음
  exit 0
fi

# 코드 파일 한정
case "$FILE_PATH" in
  *.py|*.ts|*.tsx|*.js|*.jsx)
    # complexity_checker 실행, WARN만 stderr로
    python3 "$SCRIPT_DIR/complexity_checker.py" "$FILE_PATH" --threshold medium 2>/dev/null \
      | grep -E "^[[:space:]]+\[WARN\]" >&2 \
      || true
    ;;
esac

exit 0
