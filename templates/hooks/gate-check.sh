#!/bin/bash
# PreToolUse Hook: 워크플로우 게이트 강제
# Skill 도구 호출 시 이전 게이트 완료 여부 확인
# 미완료 시 exit code 2로 차단
set -e

GATE_FILE=".claude/gate-status.json"
INPUT_JSON=$(cat)

# tool_input에서 skill 이름 추출 (jq 우선, bash 폴백)
if command -v jq &> /dev/null; then
  SKILL_NAME=$(echo "$INPUT_JSON" | jq -r '.tool_input.skill // .tool_input.args // ""' 2>/dev/null || echo "")
else
  # jq 없을 때 bash 폴백
  SKILL_NAME=$(echo "$INPUT_JSON" | grep -o '"skill"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')
  if [ -z "$SKILL_NAME" ]; then
    SKILL_NAME=$(echo "$INPUT_JSON" | grep -o '"args"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')
  fi
fi

# uzys: 커맨드가 아니면 통과
# uzys:auto는 게이트 체크 제외 (auto 커맨드가 내부에서 gate-status 직접 관리)
case "$SKILL_NAME" in
  uzys:spec|uzys:plan|uzys:build|uzys:test|uzys:review|uzys:ship) ;;
  uzys:auto) exit 0 ;;
  *) exit 0 ;;
esac

# gate-status.json 없으면 초기 상태 생성 (모두 미완료)
if [ ! -f "$GATE_FILE" ]; then
  mkdir -p "$(dirname "$GATE_FILE")"
  cat > "$GATE_FILE" << 'INIT'
{
  "define": { "completed": false },
  "plan": { "completed": false },
  "build": { "completed": false },
  "verify": { "completed": false },
  "review": { "completed": false },
  "ship": { "completed": false },
  "hotfix": false
}
INIT
fi

# 게이트 상태 읽기 (jq 우선, grep 폴백)
is_completed() {
  if command -v jq &> /dev/null; then
    jq -r ".$1.completed // false" "$GATE_FILE" 2>/dev/null
  else
    grep -A1 "\"$1\"" "$GATE_FILE" 2>/dev/null | grep -o '"completed"[[:space:]]*:[[:space:]]*true' | head -1 | grep -q 'true' && echo "true" || echo "false"
  fi
}

is_hotfix() {
  if command -v jq &> /dev/null; then
    jq -r ".hotfix // false" "$GATE_FILE" 2>/dev/null
  else
    grep -o '"hotfix"[[:space:]]*:[[:space:]]*true' "$GATE_FILE" 2>/dev/null | head -1 | grep -q 'true' && echo "true" || echo "false"
  fi
}

HOTFIX=$(is_hotfix)

# 게이트 순서 검증
case "$SKILL_NAME" in
  uzys:spec)
    # Define은 항상 허용 (첫 단계). 새 사이클 시작이므로 모든 게이트 리셋
    cat > "$GATE_FILE" << 'RESET'
{
  "define": { "completed": false },
  "plan": { "completed": false },
  "build": { "completed": false },
  "verify": { "completed": false },
  "review": { "completed": false },
  "ship": { "completed": false },
  "hotfix": false
}
RESET
    exit 0
    ;;
  uzys:plan)
    if [ "$(is_completed define)" != "true" ]; then
      echo "BLOCKED: Define 단계가 완료되지 않았습니다. /uzys:spec을 먼저 실행하세요. (docs/SPEC.md 필요)" >&2
      exit 2
    fi
    ;;
  uzys:build)
    if [ "$HOTFIX" = "true" ]; then
      exit 0  # hotfix 모드: plan 건너뛰기 허용
    fi
    if [ "$(is_completed plan)" != "true" ]; then
      echo "BLOCKED: Plan 단계가 완료되지 않았습니다. /uzys:plan을 먼저 실행하세요. (docs/todo.md 필요)" >&2
      exit 2
    fi
    ;;
  uzys:test)
    if [ "$(is_completed build)" != "true" ]; then
      echo "BLOCKED: Build 단계가 완료되지 않았습니다. /uzys:build를 먼저 실행하세요." >&2
      exit 2
    fi
    ;;
  uzys:review)
    if [ "$HOTFIX" = "true" ]; then
      exit 0  # hotfix 모드: review 건너뛰기 허용
    fi
    if [ "$(is_completed verify)" != "true" ]; then
      echo "BLOCKED: Verify 단계가 완료되지 않았습니다. /uzys:test를 먼저 실행하세요." >&2
      exit 2
    fi
    ;;
  uzys:ship)
    if [ "$HOTFIX" = "true" ]; then
      # hotfix: verify만 필수
      if [ "$(is_completed verify)" != "true" ]; then
        echo "BLOCKED: Hotfix 모드에서도 Verify는 필수입니다. /uzys:test를 먼저 실행하세요." >&2
        exit 2
      fi
      exit 0
    fi
    if [ "$(is_completed review)" != "true" ]; then
      echo "BLOCKED: Review 단계가 완료되지 않았습니다. /uzys:review를 먼저 실행하세요." >&2
      exit 2
    fi
    ;;
esac

exit 0
