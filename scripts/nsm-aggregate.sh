#!/bin/bash
# ============================================================
# nsm-aggregate.sh (P2-02)
# `.claude/evals/hito-YYYY-MM-DD.log` 의 timestamp stream 을
# ADR-008 알고리즘 (gap ≥ 60분) 으로 session 분할 + NSM 집계.
#
# Sources:
#   - docs/decisions/ADR-008-session-boundary-definition.md (algorithm)
#   - docs/NORTH_STAR.md §2 (NSM ≤ 3 prompts/feature 목표)
#   - docs/evals/hito-baseline-2026-04-30.md (baseline 보고서)
#
# 사용:
#   bash scripts/nsm-aggregate.sh                      # 기본 summary
#   bash scripts/nsm-aggregate.sh --sessions           # session 분할 list
#   bash scripts/nsm-aggregate.sh --gap-minutes 60     # 임계값 변경
#   bash scripts/nsm-aggregate.sh --since 2026-04-23   # 시작일 필터
#   bash scripts/nsm-aggregate.sh --until 2026-04-30   # 종료일 필터
#   bash scripts/nsm-aggregate.sh --dir <path>         # log dir 지정
#
# Exit: 0 = 성공, 1 = 인자 오류, 2 = 로그 디렉토리 없음
# bash 3.2 호환. macOS BSD date + GNU date 양쪽 지원.
# ============================================================
set -u

RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

LOG_DIR=".claude/evals"
SINCE=""
UNTIL=""
GAP_MINUTES=60
SHOW_SESSIONS=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dir) LOG_DIR="$2"; shift 2 ;;
    --since) SINCE="$2"; shift 2 ;;
    --until) UNTIL="$2"; shift 2 ;;
    --gap-minutes) GAP_MINUTES="$2"; shift 2 ;;
    --sessions) SHOW_SESSIONS=true; shift ;;
    -h|--help)
      sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -d "$LOG_DIR" ]]; then
  echo -e "${RED}ERROR: $LOG_DIR not found.${NC}" >&2
  echo "Hint: hito-counter.sh writes to .claude/evals/. Run with --dir <path> if elsewhere." >&2
  exit 2
fi

# Convert ISO 8601 UTC (YYYY-MM-DDTHH:MM:SSZ) → epoch seconds.
# BSD/GNU date 분기 (cli-development.md 규약).
ts_to_epoch() {
  local ts="$1"
  if date -j -f "%Y-%m-%dT%H:%M:%SZ" "$ts" "+%s" >/dev/null 2>&1; then
    # BSD date (macOS)
    TZ=UTC date -j -f "%Y-%m-%dT%H:%M:%SZ" "$ts" "+%s"
  else
    # GNU date (Linux)
    date -u -d "$ts" "+%s"
  fi
}

# Collect timestamps from all matching log files (sorted, deduplicated by file order).
TS_FILE=$(mktemp -t nsm-ts.XXXXXX)
trap 'rm -f "$TS_FILE"' EXIT

for f in "$LOG_DIR"/hito-*.log; do
  [[ -f "$f" ]] || continue
  base=$(basename "$f")
  date_part="${base#hito-}"
  date_part="${date_part%.log}"
  if [[ -n "$SINCE" && "$date_part" < "$SINCE" ]]; then
    continue
  fi
  if [[ -n "$UNTIL" && "$date_part" > "$UNTIL" ]]; then
    continue
  fi
  awk '/prompt_submit/ {print $1}' "$f" >> "$TS_FILE"
done

if [[ ! -s "$TS_FILE" ]]; then
  echo -e "${YELLOW}WARN: 매칭되는 prompt 없음 (--since/--until 범위 또는 빈 로그).${NC}" >&2
  exit 0
fi

# Sort timestamps ascending (string sort works for ISO 8601 UTC).
sort -o "$TS_FILE" "$TS_FILE"

GAP_SECONDS=$((GAP_MINUTES * 60))

# Session 분할 (ADR-008 algorithm).
SESSION_FILE=$(mktemp -t nsm-sess.XXXXXX)
trap 'rm -f "$TS_FILE" "$SESSION_FILE"' EXIT

PREV_EPOCH=0
SESS_START=""
SESS_END=""
SESS_COUNT=0
SESS_NUM=0
TOTAL_PROMPTS=0

while IFS= read -r ts; do
  TOTAL_PROMPTS=$((TOTAL_PROMPTS + 1))
  EPOCH=$(ts_to_epoch "$ts")

  if [[ "$PREV_EPOCH" -eq 0 ]] || (( EPOCH - PREV_EPOCH >= GAP_SECONDS )); then
    # flush previous session
    if [[ "$SESS_COUNT" -gt 0 ]]; then
      printf '%d\t%s\t%s\t%d\n' "$SESS_NUM" "$SESS_START" "$SESS_END" "$SESS_COUNT" >> "$SESSION_FILE"
    fi
    SESS_NUM=$((SESS_NUM + 1))
    SESS_START="$ts"
    SESS_COUNT=1
  else
    SESS_COUNT=$((SESS_COUNT + 1))
  fi
  SESS_END="$ts"
  PREV_EPOCH=$EPOCH
done < "$TS_FILE"

# flush last session
if [[ "$SESS_COUNT" -gt 0 ]]; then
  printf '%d\t%s\t%s\t%d\n' "$SESS_NUM" "$SESS_START" "$SESS_END" "$SESS_COUNT" >> "$SESSION_FILE"
fi

SESSION_COUNT=$SESS_NUM

# Output: --sessions list
if $SHOW_SESSIONS; then
  echo -e "${CYAN}=== Session Breakdown (gap ≥ ${GAP_MINUTES}min, ADR-008) ===${NC}"
  printf '%-3s %-22s %-22s %s\n' "#" "Start" "End" "Prompts"
  printf '%-3s %-22s %-22s %s\n' "---" "----------------------" "----------------------" "-------"
  while IFS=$'\t' read -r n start end count; do
    printf '%-3d %-22s %-22s %d\n' "$n" "$start" "$end" "$count"
  done < "$SESSION_FILE"
  echo ""
fi

# Summary
AVG_PER_SESSION=0
if [[ "$SESSION_COUNT" -gt 0 ]]; then
  # bash arithmetic: integer division. Multiply by 10 for 1-decimal precision.
  AVG_PER_SESSION=$(awk -v t="$TOTAL_PROMPTS" -v s="$SESSION_COUNT" 'BEGIN { printf "%.1f", t/s }')
fi

echo -e "${CYAN}=== Summary (NSM aggregate, ADR-008) ===${NC}"
echo "Log directory:           $LOG_DIR"
echo "Window:                  ${SINCE:-<beginning>} → ${UNTIL:-<end>}"
echo "Gap threshold:           ${GAP_MINUTES} min"
echo "Total prompts:           $TOTAL_PROMPTS"
echo "Total sessions:          $SESSION_COUNT"
echo "Avg prompts/session:     $AVG_PER_SESSION"
echo ""

# AC threshold check (ADR-001 OQ1: 세션 ≥ 10)
if [[ "$SESSION_COUNT" -ge 10 ]]; then
  echo -e "${GREEN}✓ AC3 #2 (세션 ≥ 10): PASS${NC} ($SESSION_COUNT sessions)"
else
  echo -e "${YELLOW}⚠ AC3 #2 (세션 ≥ 10): UNDER${NC} ($SESSION_COUNT sessions)"
fi

# NSM ≤ 3 (NORTH_STAR §2) — informational only (per-feature 매핑은 별도)
echo ""
echo 'Note: NSM ≤ 3 prompts/feature 평가는 feature 분류 (수동 또는 commit-window 매핑) 필요.'
echo '      --sessions 옵션으로 session boundary 확인 후 feature 라벨링.'
