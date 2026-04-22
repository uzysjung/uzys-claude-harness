#!/bin/bash
# ============================================================
# hito-aggregate.sh
# hito-counter.sh가 생성한 `.claude/evals/hito-YYYY-MM-DD.log`를
# 집계해 NORTH_STAR NSM (HITO — Human-In-The-Loop Occurrences) 추세를 표시.
#
# 사용:
#   bash scripts/hito-aggregate.sh                     # 기본: 일별 + 요약
#   bash scripts/hito-aggregate.sh --dir <path>        # 로그 디렉토리 지정
#   bash scripts/hito-aggregate.sh --since 2026-04-20  # 특정 날짜 이후만
#   bash scripts/hito-aggregate.sh --summary           # 요약만
#
# 해석:
#   - 라인 1개 = 사용자 프롬프트 1회 submit
#   - feature 단위 HITO(NSM 정의)는 이 집계에서 자동 계산 불가 — 수동 eval 연계
#   - 목표: ≤ 3 per feature (NORTH_STAR §2)
#
# Exit: 0 = 성공, 1 = 인자 오류, 2 = 로그 디렉토리 없음
# bash 3.2 호환. jq/date-GNU 불필요.
# ============================================================
set -u

RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

LOG_DIR=".claude/evals"
SINCE=""
SUMMARY_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dir) LOG_DIR="$2"; shift 2 ;;
    --since) SINCE="$2"; shift 2 ;;
    --summary) SUMMARY_ONLY=true; shift ;;
    -h|--help)
      sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -d "$LOG_DIR" ]]; then
  echo -e "${RED}ERROR: $LOG_DIR not found.${NC}" >&2
  echo "Hint: hito-counter.sh is installed via .claude/settings.json. Run \`bash scripts/setup-harness.sh --update\` if missing." >&2
  exit 2
fi

# Collect log files matching hito-YYYY-MM-DD.log
LOGS=()
for f in "$LOG_DIR"/hito-*.log; do
  [[ -f "$f" ]] || continue
  # Extract date from filename
  base=$(basename "$f")
  date_part="${base#hito-}"
  date_part="${date_part%.log}"

  # Apply --since filter (lexicographic date compare works for YYYY-MM-DD)
  if [[ -n "$SINCE" && "$date_part" < "$SINCE" ]]; then
    continue
  fi
  LOGS+=("$f")
done

if [[ ${#LOGS[@]} -eq 0 ]]; then
  echo -e "${YELLOW}No HITO logs in $LOG_DIR${NC}"
  [[ -n "$SINCE" ]] && echo "  (filter --since $SINCE)"
  echo ""
  echo "Baseline not yet collected. Use Claude Code sessions to accumulate data."
  exit 0
fi

# Sort by filename (== by date). mapfile is bash 4+; stay on 3.2 compat.
# shellcheck disable=SC2207
IFS=$'\n' SORTED=($(printf '%s\n' "${LOGS[@]}" | sort))
unset IFS

TOTAL=0
DAYS=${#SORTED[@]}

# Daily breakdown
if ! $SUMMARY_ONLY; then
  echo -e "${CYAN}=== HITO Daily Breakdown ===${NC}"
  printf "%-12s  %6s\n" "Date" "Prompts"
  printf "%-12s  %6s\n" "----" "-------"
fi

# For 7-day moving average, keep last-7 window
WINDOW=()
WINDOW_MAX=7

for f in "${SORTED[@]}"; do
  base=$(basename "$f")
  date_part="${base#hito-}"
  date_part="${date_part%.log}"

  COUNT=$(wc -l < "$f" 2>/dev/null | tr -d ' ')
  COUNT=${COUNT:-0}
  TOTAL=$((TOTAL + COUNT))

  # Sliding window
  WINDOW+=("$COUNT")
  if [[ ${#WINDOW[@]} -gt $WINDOW_MAX ]]; then
    WINDOW=("${WINDOW[@]:1}")
  fi

  if ! $SUMMARY_ONLY; then
    printf "%-12s  %6d\n" "$date_part" "$COUNT"
  fi
done

# 7-day moving average (last window)
WINDOW_SUM=0
for v in "${WINDOW[@]}"; do
  WINDOW_SUM=$((WINDOW_SUM + v))
done
WINDOW_COUNT=${#WINDOW[@]}
if [[ $WINDOW_COUNT -gt 0 ]]; then
  # Integer average + remainder for 1-decimal display
  WINDOW_AVG_INT=$((WINDOW_SUM / WINDOW_COUNT))
  WINDOW_AVG_REM=$(( (WINDOW_SUM * 10 / WINDOW_COUNT) % 10 ))
  WINDOW_AVG_STR="${WINDOW_AVG_INT}.${WINDOW_AVG_REM}"
else
  WINDOW_AVG_STR="0.0"
fi

echo ""
echo -e "${CYAN}=== Summary ===${NC}"
printf "%-30s  %s\n" "Log directory:" "$LOG_DIR"
[[ -n "$SINCE" ]] && printf "%-30s  %s\n" "Since:" "$SINCE"
printf "%-30s  %d\n" "Days with data:" "$DAYS"
printf "%-30s  %d\n" "Total prompts:" "$TOTAL"
printf "%-30s  %s (window=%d)\n" "Recent avg prompts/day:" "$WINDOW_AVG_STR" "$WINDOW_COUNT"

echo ""
echo "Next steps:"
echo "  - feature 단위 HITO 추정: 세션 일자별 feature 목록 매핑 후 수동 집계"
echo "  - NORTH_STAR NSM 목표 대비: ≤ 3 prompts per feature (see docs/NORTH_STAR.md §2)"
echo "  - 7일+ 연속 데이터 확보 후 docs/evals/hito-baseline-YYYY-MM-DD.md 리포트 작성"

exit 0
