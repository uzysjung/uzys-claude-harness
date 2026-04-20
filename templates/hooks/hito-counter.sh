#!/bin/bash
# ============================================================
# hito-counter.sh (v27.14.0)
# UserPromptSubmit hook — HITO (Human-In-The-Loop Occurrences) 측정용.
#
# NORTH_STAR.md NSM 추적을 위한 Phase 2 baseline 수집 인프라.
# 사용자 prompt submit 시마다 타임스탬프 1줄 추가.
# 프롬프트 내용은 기록하지 않음 (프라이버시).
#
# 로그 위치: .claude/evals/hito-YYYY-MM-DD.log
# 집계: `wc -l .claude/evals/hito-*.log` 로 일일 카운트
#       더 정밀한 분류(명시적 지시 vs 승인 vs 확인)는 수동 eval에서.
#
# Exit: 항상 0 (hook 차단 금지)
# ============================================================

DATE=$(date +%Y-%m-%d 2>/dev/null || echo "unknown")
LOG_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/evals"
LOG_FILE="$LOG_DIR/hito-$DATE.log"

mkdir -p "$LOG_DIR" 2>/dev/null || exit 0

TS=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "?")
echo "$TS prompt_submit" >> "$LOG_FILE" 2>/dev/null

exit 0
