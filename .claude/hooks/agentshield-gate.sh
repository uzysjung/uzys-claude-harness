#!/bin/bash
# ============================================================
# agentshield-gate.sh — PreToolUse Skill hook (uzys:ship 차단)
#
# 목적: /uzys:ship Skill 실행 전 ECC AgentShield 보안 스캔 실행.
#       CRITICAL 발견 + .agentshield-ignore 미매칭 시 exit 2.
#
# 입력: PreToolUse stdin JSON (Skill hook)
# 출력: stderr 경고 + exit 2 (차단) 또는 exit 0 (통과)
#
# 활성화 조건:
#   1. 이 hook이 settings.json Skill matcher에 등록
#   2. npx 명령 사용 가능 (Node.js 환경)
#
# False-positive 허용:
#   .agentshield-ignore 파일 — 한 줄에 하나의 정규식.
#   매칭되는 finding은 CRITICAL이어도 무시.
# ============================================================
set -u

# Skill 이름 파싱 — uzys:ship 만 대상
INPUT=$(cat 2>/dev/null || echo "{}")
SKILL_NAME=""
if command -v jq &>/dev/null; then
  SKILL_NAME=$(echo "$INPUT" | jq -r '.tool_input.skill // empty' 2>/dev/null || echo "")
else
  SKILL_NAME=$(echo "$INPUT" | grep -oE '"skill"[[:space:]]*:[[:space:]]*"[^"]*"' | sed -E 's/.*"([^"]*)"$/\1/')
fi

# 대상 아니면 즉시 통과
case "$SKILL_NAME" in
  uzys:ship) ;;
  *) exit 0 ;;
esac

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
IGNORE_FILE="$PROJECT_DIR/.agentshield-ignore"
SCAN_LOG="/tmp/agentshield-scan-$$.log"

cd "$PROJECT_DIR" || exit 0

# npx ecc-agentshield 실행 (타임아웃 안전 장치 없음 — ship 시점이라 사용자 대기 허용)
if ! command -v npx &>/dev/null; then
  echo "[agentshield-gate] npx not found — scan skipped (manual review required)" >&2
  exit 0
fi

npx ecc-agentshield@1.4.0 scan > "$SCAN_LOG" 2>&1 || true

# CRITICAL 섹션에서 finding 라인 추출
CRITICAL_FINDINGS=$(awk '
  /● CRITICAL/ { in_crit=1; next }
  /● HIGH|● MEDIUM|● LOW|● INFO/ { in_crit=0 }
  in_crit && /^[[:space:]]*●/ { print }
' "$SCAN_LOG")

if [ -z "$CRITICAL_FINDINGS" ]; then
  rm -f "$SCAN_LOG"
  echo "[agentshield-gate] No CRITICAL findings. Ship allowed." >&2
  exit 0
fi

# ignore 파일 매칭
FILTERED_FINDINGS=""
while IFS= read -r line; do
  [ -z "$line" ] && continue
  MATCHED=false
  if [ -f "$IGNORE_FILE" ]; then
    while IFS= read -r pattern; do
      # 빈 라인 / 주석 skip
      case "$pattern" in
        ""|"#"*) continue ;;
      esac
      # v26.11.2 — grep -F (fixed string) — `.*` 같은 regex로 모든 finding bypass 차단 (M4)
      if echo "$line" | grep -qF "$pattern"; then
        MATCHED=true
        break
      fi
    done < "$IGNORE_FILE"
  fi
  if [ "$MATCHED" = false ]; then
    FILTERED_FINDINGS="$FILTERED_FINDINGS$line"$'\n'
  fi
done <<< "$CRITICAL_FINDINGS"

if [ -z "$FILTERED_FINDINGS" ]; then
  rm -f "$SCAN_LOG"
  echo "[agentshield-gate] CRITICAL findings all matched .agentshield-ignore. Ship allowed." >&2
  exit 0
fi

# BLOCK
echo "[agentshield-gate] BLOCKED: CRITICAL security findings detected" >&2
echo "" >&2
echo "$FILTERED_FINDINGS" >&2
echo "" >&2
echo "다음 조치 중 하나 필요:" >&2
echo "  1. 실제 취약점 수정" >&2
echo "  2. false-positive인 경우 .agentshield-ignore에 정규식 추가" >&2
echo "  3. 스캔 로그 확인: $SCAN_LOG" >&2
exit 2
