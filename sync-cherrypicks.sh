#!/bin/bash
# ============================================================
# sync-cherrypicks.sh
# ECC, agent-skills, vercel-labs 등 외부 출처에서 cherry-pick한
# 파일들의 변경을 감지하고 동기화한다.
#
# 사용:
#   bash sync-cherrypicks.sh           # 검증 + diff 표시 (실제 수정 안 함)
#   bash sync-cherrypicks.sh --apply   # 변경사항 자동 적용 (modified=false만)
#   bash sync-cherrypicks.sh --check   # CI용 — 변경 있으면 exit 1
# ============================================================
# bash 3.2 호환 (declare -A 미사용)
# 글로벌 ~/.claude/는 절대 건드리지 않음

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MANIFEST="$SCRIPT_DIR/.dev-references/cherrypicks.lock"

APPLY=false
CHECK=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --apply) APPLY=true; shift ;;
    --check) CHECK=true; shift ;;
    -h|--help) echo "Usage: $0 [--apply|--check]"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# Prerequisites
if ! command -v jq &> /dev/null; then
  echo -e "${RED}ERROR: jq required for sync-cherrypicks.sh${NC}" >&2
  exit 1
fi

if [ ! -f "$MANIFEST" ]; then
  echo -e "${RED}ERROR: $MANIFEST not found${NC}" >&2
  exit 1
fi

# 출처별 source repo pull
echo -e "${CYAN}[1/3] Pulling source repos${NC}"

pull_source() {
  local source_id="$1"
  local local_path
  local_path=$(jq -r ".sources.\"$source_id\".local_path // empty" "$MANIFEST")
  if [ -z "$local_path" ] || [ "$local_path" = "null" ]; then
    return 0
  fi
  if [ ! -d "$SCRIPT_DIR/$local_path/.git" ]; then
    echo -e "  ${YELLOW}!${NC} $source_id: $local_path 미존재 또는 git repo 아님 (skip)"
    return 0
  fi
  echo -n "  $source_id..."
  (cd "$SCRIPT_DIR/$local_path" && git pull --quiet 2>/dev/null) && echo -e " ${GREEN}✓${NC}" || echo -e " ${YELLOW}pull 실패${NC}"
}

for source_id in $(jq -r '.sources | keys[]' "$MANIFEST"); do
  pull_source "$source_id"
done

# 각 cherrypick 검사
echo ""
echo -e "${CYAN}[2/3] Checking cherrypicks${NC}"

CHANGES=0
CONFLICTS=0
TOTAL=0

# bash 3.2 호환: jq로 한 줄씩 출력
while IFS=$'\t' read -r id source src dst type modified; do
  TOTAL=$((TOTAL + 1))

  # source repo의 local_path
  local_path=$(jq -r ".sources.\"$source\".local_path // empty" "$MANIFEST")
  if [ -z "$local_path" ]; then
    echo -e "  ${YELLOW}!${NC} $id: source $source 의 local_path 없음 (skip)"
    continue
  fi

  src_full="$SCRIPT_DIR/$local_path/$src"
  dst_full="$SCRIPT_DIR/$dst"

  # 파일/디렉토리 존재 확인
  if [ "$type" = "file" ]; then
    if [ ! -f "$src_full" ]; then
      echo -e "  ${RED}✗${NC} $id: src 파일 없음 ($src_full)"
      continue
    fi
    if [ ! -f "$dst_full" ]; then
      echo -e "  ${RED}✗${NC} $id: dst 파일 없음 ($dst_full)"
      continue
    fi

    # hash 비교
    src_hash=$(shasum -a 256 "$src_full" | cut -d' ' -f1)
    dst_hash=$(shasum -a 256 "$dst_full" | cut -d' ' -f1)

    if [ "$src_hash" = "$dst_hash" ]; then
      echo -e "  ${GREEN}=${NC} $id: 동일"
    else
      CHANGES=$((CHANGES + 1))
      if [ "$modified" = "true" ]; then
        echo -e "  ${YELLOW}!${NC} $id: 변경됨 + 로컬 수정 → 수동 머지 필요"
        CONFLICTS=$((CONFLICTS + 1))
      else
        echo -e "  ${YELLOW}△${NC} $id: 변경됨 (자동 업데이트 가능)"
        if [ "$APPLY" = true ]; then
          cp "$src_full" "$dst_full"
          echo -e "    ${GREEN}→ updated${NC}"
        fi
      fi
    fi
  elif [ "$type" = "directory" ]; then
    if [ ! -d "$src_full" ]; then
      echo -e "  ${RED}✗${NC} $id: src 디렉토리 없음 ($src_full)"
      continue
    fi
    if [ ! -d "$dst_full" ]; then
      echo -e "  ${RED}✗${NC} $id: dst 디렉토리 없음 ($dst_full)"
      continue
    fi

    # 디렉토리는 diff -r로 비교
    if diff -r -q "$src_full" "$dst_full" > /dev/null 2>&1; then
      echo -e "  ${GREEN}=${NC} $id: 동일 (디렉토리)"
    else
      CHANGES=$((CHANGES + 1))
      if [ "$modified" = "true" ]; then
        echo -e "  ${YELLOW}!${NC} $id: 디렉토리 변경 + 로컬 수정 → 수동 머지 필요"
        CONFLICTS=$((CONFLICTS + 1))
      else
        echo -e "  ${YELLOW}△${NC} $id: 디렉토리 변경 (자동 동기화 가능)"
        if [ "$APPLY" = true ]; then
          rsync -a --delete "$src_full" "$(dirname "$dst_full")/"
          echo -e "    ${GREEN}→ synced${NC}"
        fi
      fi
    fi
  fi
done < <(jq -r '.cherrypicks[] | [.id, .source, .src, .dst, .type, .modified] | @tsv' "$MANIFEST")

# Summary
echo ""
echo -e "${CYAN}[3/3] Summary${NC}"
echo "  Total: $TOTAL cherrypicks"
echo "  Changed: $CHANGES"
echo "  Conflicts (수동 머지 필요): $CONFLICTS"

if [ "$CHECK" = true ] && [ "$CHANGES" -gt 0 ]; then
  echo -e "${RED}변경사항 있음 — CI 모드에서 exit 1${NC}" >&2
  exit 1
fi

if [ "$APPLY" = false ] && [ "$CHANGES" -gt 0 ]; then
  echo ""
  echo "변경사항을 적용하려면: bash $0 --apply"
fi

exit 0
