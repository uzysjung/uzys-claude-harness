#!/bin/bash
# PreToolUse Hook: 워크플로우 게이트 강제
# Skill 도구 호출 시 이전 게이트 완료 여부 확인
# 미완료 시 exit code 2로 차단
set -e

GATE_FILE=".claude/gate-status.json"
INPUT_JSON=$(cat)

# tool_input에서 skill 이름 추출
SKILL_NAME=$(echo "$INPUT_JSON" | jq -r '.tool_input.skill // .tool_input.args // ""' 2>/dev/null || echo "")

# uzys: 커맨드가 아니면 통과
case "$SKILL_NAME" in
  uzys:spec|uzys:plan|uzys:build|uzys:test|uzys:review|uzys:ship) ;;
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

# 게이트 상태 읽기
is_completed() {
  jq -r ".$1.completed // false" "$GATE_FILE" 2>/dev/null
}

is_hotfix() {
  jq -r ".hotfix // false" "$GATE_FILE" 2>/dev/null
}

HOTFIX=$(is_hotfix)

# 게이트 순서 검증
case "$SKILL_NAME" in
  uzys:spec)
    # Define은 항상 허용 (첫 단계)
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
