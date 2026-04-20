#!/bin/bash
# ============================================================
# setup-harness.sh
# Jay's Universal Agent Harness — 프로젝트 초기화 스크립트
#
# 용도: Claude Code 프로젝트에 하네스 시스템을 설치
# 실행: bash setup-harness.sh [--track <track>] [--gsd] [--global-only]
# ============================================================
# set -e는 plugin 설치 실패 시 전체 중단을 방지하기 위해 사용하지 않음
# 각 critical section에서 명시적으로 에러 처리

# v27.8.0 — curl|bash 경유로 호출된 경우 stdin이 pipe라 프롬프트가 보이지 않는다.
# stdin이 이미 tty면 no-op. 아니면 fd 3에 /dev/tty 먼저 시도 (CI/background 환경 안전).
if [ ! -t 0 ] && exec 3</dev/tty 2>/dev/null; then
  exec <&3 3<&-
fi

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# v27.1.0 — scripts/ 디렉토리로 이동: templates는 repo root의 형제
HARNESS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATES="$HARNESS_ROOT/templates"

# ============================================================
# Argument Parsing
# ============================================================
# 이 스크립트는 프로젝트 스코프 전용. 글로벌 ~/.claude/는 절대 건드리지 않음.
TRACK=""
SELECTED_TRACKS=()  # v26.11.0 — 다중 Track 지원
ADD_MODE=false      # v26.11.0 — 기존 설치 위에 추가 모드
UPDATE_MODE=false   # v26.13.0 — 기존 설치에 정책 파일만 덮어쓰기
GSD=false
WITH_ECC=false      # v27.2.0 — 비대화형 ECC 설치
WITH_PRUNE=false    # v27.2.0 — 비대화형 ECC prune (--with-prune은 --with-ecc 자동 활성)
WITH_TOB=false      # v27.2.0 — 비대화형 Trail of Bits 설치
PROJECT_DIR="$(pwd)"

while [[ $# -gt 0 ]]; do
  case $1 in
    --track)
      [ -z "${2:-}" ] || [[ "$2" == --* ]] && { echo "ERROR: --track requires a value" >&2; exit 1; }
      SELECTED_TRACKS+=("$2"); shift 2 ;;
    --add-track)
      [ -z "${2:-}" ] || [[ "$2" == --* ]] && { echo "ERROR: --add-track requires a value" >&2; exit 1; }
      SELECTED_TRACKS+=("$2"); ADD_MODE=true; shift 2 ;;
    --update) UPDATE_MODE=true; shift ;;
    --gsd) GSD=true; shift ;;
    --with-ecc) WITH_ECC=true; shift ;;
    --with-prune) WITH_PRUNE=true; WITH_ECC=true; shift ;;
    --with-tob) WITH_TOB=true; shift ;;
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    -h|--help) cat <<HELP
Usage: $0 [--track <track>]... [--add-track <track>]... [--update] [--gsd] [--project-dir <path>] [--with-ecc] [--with-prune] [--with-tob]

프로젝트 스코프 전용. 글로벌 ~/.claude/는 건드리지 않음.

--track       Track 1개 또는 여러 개 (반복 가능). 다중 시 union으로 설치
--add-track   기존 설치 위에 추가 (.mcp.json/.claude/* 보존하면서 union)
--update      기존 설치의 정책 파일만 templates로 덮어쓰기 (백업 자동 생성)
--gsd         GSD 오케스트레이터 포함
--with-ecc    ECC plugin 프로젝트 스코프 자동 설치 (인터랙티브 프롬프트 skip, 비대화형용)
--with-prune  ECC 설치 + 89 KEEP 외 자동 prune (--with-ecc 자동 포함)
--with-tob    Trail of Bits security plugin 자동 설치
HELP
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# v26.11.1 — D16 보호: --project-dir이 글로벌 ~/.claude/* 또는 시스템 경로 차단
# (mtime guard는 사후 검증이라 실제 write를 막지 못함 — 사전 차단 필요)
if [ -n "$PROJECT_DIR" ]; then
  # 절대 경로로 정규화 (cd로 검증)
  if [ -d "$PROJECT_DIR" ]; then
    PROJECT_DIR_ABS="$(cd "$PROJECT_DIR" && pwd)"
  else
    PROJECT_DIR_ABS="$PROJECT_DIR"
  fi
  case "$PROJECT_DIR_ABS" in
    "$HOME/.claude"|"$HOME/.claude/"*)
      echo "ERROR: --project-dir은 글로벌 ~/.claude/ 영역으로 설정할 수 없음 (D16)" >&2
      echo "       입력: $PROJECT_DIR (절대: $PROJECT_DIR_ABS)" >&2
      exit 1 ;;
    "/"|"/etc"|"/etc/"*|"/usr/bin"|"/usr/sbin"|"/usr/local/bin"|"/bin"|"/sbin"|"/System"|"/System/"*)
      # /var는 macOS TMPDIR(/var/folders/...) 포함이라 일괄 차단 안 함. /etc/ + 시스템 binary만.
      echo "ERROR: --project-dir은 시스템 디렉토리로 설정할 수 없음" >&2
      echo "       입력: $PROJECT_DIR (절대: $PROJECT_DIR_ABS)" >&2
      exit 1 ;;
  esac
  PROJECT_DIR="$PROJECT_DIR_ABS"
fi

# 후방호환: TRACK은 첫 번째 Track (기존 변수 사용처 유지)
if [ "${#SELECTED_TRACKS[@]}" -gt 0 ]; then
  TRACK="${SELECTED_TRACKS[0]}"
fi

# v26.11.2 — Track 이름 검증: 알 수 없는 Track 거부 (silent partial install 차단)
VALID_TRACKS="csr-supabase csr-fastify csr-fastapi ssr-htmx ssr-nextjs data executive tooling full"
for t in "${SELECTED_TRACKS[@]}"; do
  if ! echo " $VALID_TRACKS " | grep -qF " $t "; then
    echo "ERROR: Unknown track '$t'. Valid: $VALID_TRACKS" >&2
    exit 1
  fi
done

# ============================================================
# Utility Functions
# ============================================================
INSTALL_FAILURES=0
FAILED_ITEMS=""

info()  { echo -e "  ${GREEN}✓${NC} $1"; }
warn()  { echo -e "  ${YELLOW}!${NC} $1"; }
fail()  { echo -e "  ${RED}✗${NC} $1"; }
install_fail() { INSTALL_FAILURES=$((INSTALL_FAILURES+1)); FAILED_ITEMS="$FAILED_ITEMS\n  - $1"; warn "$1 (INSTALL FAILED)"; }

# v27.8.0 — 설치 명령 비대화형 실행 래퍼.
# stdin을 /dev/null에 붙여 interactive 프롬프트(y/n)를 EOF로 종료,
# stdout/stderr를 임시 로그에 격리해 진행 표시 줄을 덮어쓰지 않게 한다.
# 실패 시 로그 tail을 stderr로 출력해 디버그 가능.
# 사용: run_quiet <label> <command...>
run_quiet() {
  local label="$1"; shift
  local log; log=$(mktemp)
  if "$@" </dev/null >"$log" 2>&1; then
    rm -f "$log"
    return 0
  else
    local rc=$?
    # 실패 로그를 stderr로 최대 5줄만 노출 (디버그 단서)
    if [ -s "$log" ]; then
      echo "    [debug: $label exit=$rc]" >&2
      tail -n 5 "$log" | sed 's/^/      /' >&2
    fi
    rm -f "$log"
    return "$rc"
  fi
}

# v26.11.2 — install 명령 1회 재시도 래퍼 (네트워크 일시 장애 완화)
# 사용: retry_install <label> <command...>
retry_install() {
  local label="$1"; shift
  if "$@" 2>/dev/null; then info "installed: $label"; return 0; fi
  sleep 2
  if "$@" 2>/dev/null; then info "installed (retry): $label"; return 0; fi
  install_fail "$label"
  return 1
}
section() { echo -e "\n${CYAN}[$1]${NC} $2"; }

check_cmd() {
  if command -v "$1" &> /dev/null; then
    return 0
  else
    fail "$1 not found"
    return 1
  fi
}

safe_copy() {
  local src="$1" dst="$2"
  if [ -f "$dst" ]; then
    warn "Already exists: $dst (skipped)"
  else
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    info "Created: $dst"
  fi
}

safe_copy_dir() {
  local src="$1" dst="$2"
  if [ -d "$dst" ]; then
    warn "Already exists: $dst (skipped)"
  else
    mkdir -p "$(dirname "$dst")"
    cp -R "$src" "$dst"
    info "Created: $dst"
  fi
}

# v26.11.0 — 다중 Track 지원 헬퍼
# any_track 'pattern1|pattern2|pattern3': SELECTED_TRACKS 중 하나라도 패턴 매칭 시 0
# 주의: bash case 변수 확장 시 '|' OR이 일관되지 않아 IFS 분리로 직접 처리
any_track() {
  local raw="$1"
  local IFS='|'
  local patterns
  read -ra patterns <<< "$raw"
  local t p
  for t in "${SELECTED_TRACKS[@]}"; do
    for p in "${patterns[@]}"; do
      # shellcheck disable=SC2254  # intentional bash glob pattern (csr-* 등) for case match
      case "$t" in
        $p) return 0 ;;
      esac
    done
  done
  return 1
}

# has_dev_track: SELECTED_TRACKS 중 executive 외 dev Track 존재 여부
has_dev_track() {
  local t
  for t in "${SELECTED_TRACKS[@]}"; do
    [ "$t" != "executive" ] && return 0
  done
  return 1
}

# all_executive: SELECTED_TRACKS이 모두 executive (또는 비어있음)
all_executive() {
  local t
  for t in "${SELECTED_TRACKS[@]}"; do
    [ "$t" != "executive" ] && return 1
  done
  return 0
}

# ============================================================
# Update Mode (v26.13.0) — 기존 설치의 정책 파일만 templates로 덮어쓰기
# 대상: rules/, agents/, commands/uzys/, hooks/, .claude/CLAUDE.md
# 보존: settings.json, gate-status.json, .mcp.json, docs/*, SPEC.md, PRD.md
# 원칙: 타깃 디렉토리에 이미 존재하는 파일만 덮어쓴다 (Track 혼입 방지)
# ============================================================
if [ "$UPDATE_MODE" = true ]; then
  section "UPDATE" "정책 파일 갱신 (templates → .claude/)"
  cd "$PROJECT_DIR" || { fail "cd $PROJECT_DIR 실패"; exit 1; }
  if [ ! -d ".claude" ]; then
    fail ".claude/ 디렉토리가 없음. --update는 기존 설치 위에서만 동작한다."
    echo "  먼저 setup-harness.sh --track <track> --project-dir . 로 초기 설치 필요." >&2
    exit 1
  fi

  BACKUP_DIR=".claude.backup-$(date +%Y%m%d-%H%M%S)"
  if ! cp -R .claude "$BACKUP_DIR"; then
    fail "백업 생성 실패: $BACKUP_DIR"
    exit 1
  fi
  info "Backup created: $BACKUP_DIR"

  # 1) 기존 파일만 덮어쓰기
  update_dir() {
    local target="$1" source="$2" pattern="${3:-*}"
    [ ! -d "$target" ] && return 0
    [ ! -d "$source" ] && return 0
    local count=0 f base
    for f in "$target"/$pattern; do
      [ -f "$f" ] || continue
      base=$(basename "$f")
      if [ -f "$source/$base" ]; then
        cp "$source/$base" "$f" && count=$((count+1))
      fi
    done
    info "$target: $count files updated"
  }

  # 2) Orphan prune (v26.14.0): templates에 없는데 target에 있는 파일 제거
  prune_orphans() {
    local target="$1" source="$2" pattern="${3:-*}"
    [ ! -d "$target" ] && return 0
    [ ! -d "$source" ] && return 0
    local count=0 f base removed=""
    for f in "$target"/$pattern; do
      [ -f "$f" ] || continue
      base=$(basename "$f")
      if [ ! -f "$source/$base" ]; then
        rm "$f" && count=$((count+1)) && removed="$removed $base"
      fi
    done
    if [ "$count" -gt 0 ]; then
      info "$target: $count orphan(s) pruned —$removed"
    fi
  }

  update_dir ".claude/rules" "$TEMPLATES/rules" "*.md"
  update_dir ".claude/agents" "$TEMPLATES/agents" "*.md"
  update_dir ".claude/commands/uzys" "$TEMPLATES/commands/uzys" "*.md"
  update_dir ".claude/hooks" "$TEMPLATES/hooks" "*.sh"

  prune_orphans ".claude/rules" "$TEMPLATES/rules" "*.md"
  prune_orphans ".claude/agents" "$TEMPLATES/agents" "*.md"
  prune_orphans ".claude/commands/uzys" "$TEMPLATES/commands/uzys" "*.md"
  prune_orphans ".claude/hooks" "$TEMPLATES/hooks" "*.sh"

  if [ -f ".claude/CLAUDE.md" ] && [ -f "$TEMPLATES/CLAUDE.md" ]; then
    cp "$TEMPLATES/CLAUDE.md" ".claude/CLAUDE.md" && info ".claude/CLAUDE.md 갱신"
  fi

  # 3) settings.json stale hook 참조 제거 (v26.14.0)
  # .claude/hooks/*.sh 를 참조하는 hook 등록 중 실존 파일 없는 것 제거
  clean_stale_hook_refs() {
    local settings=".claude/settings.json"
    [ ! -f "$settings" ] && return 0
    if ! command -v jq &> /dev/null; then
      warn "jq 미설치 — settings.json stale hook cleanup 스킵"
      return 0
    fi
    local refs tmp removed=0 ref
    tmp=$(mktemp)
    cp "$settings" "$tmp"
    # .claude/hooks/ 경로를 포함한 command만 추출해서 파일명만 뽑기
    refs=$(jq -r '
      [.. | objects | select(has("command")) | .command] | .[] |
      select(contains("/.claude/hooks/")) |
      capture("/\\.claude/hooks/(?<n>[^\"/ ]+\\.sh)").n
    ' "$settings" 2>/dev/null | sort -u)
    for ref in $refs; do
      if [ ! -f ".claude/hooks/$ref" ]; then
        jq --arg name "$ref" '
          .hooks |= with_entries(
            .value |= map(
              .hooks |= map(select(.command | contains($name) | not))
            )
          )
        ' "$tmp" > "${tmp}.new" && mv "${tmp}.new" "$tmp"
        removed=$((removed+1))
        info "settings.json: stale hook ref 제거 — $ref"
      fi
    done
    if [ "$removed" -gt 0 ]; then
      mv "$tmp" "$settings"
    else
      rm -f "$tmp"
    fi
  }
  clean_stale_hook_refs

  echo ""
  info "Update complete."
  echo "  Diff 확인: diff -r $BACKUP_DIR .claude"
  echo "  Rollback:  rm -rf .claude && mv $BACKUP_DIR .claude"
  exit 0
fi

# ============================================================
# Prerequisites
# ============================================================
section "0/7" "Prerequisites"

check_cmd node || { fail "Node.js 22+ required. https://nodejs.org"; exit 1; }
check_cmd git  || { fail "Git required."; exit 1; }
check_cmd claude || { fail "Claude Code required. https://claude.ai/code"; exit 1; }
check_cmd jq || { warn "jq not found. Hook fallback로 동작하지만 설치 권장: brew install jq"; }

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 22 ]; then
  fail "Node.js $NODE_VER → 22+ required"
  exit 1
fi
info "Node.js v$(node -v | sed 's/v//') (≥22 OK)"

# ============================================================
# (글로벌 설치 단계 제거됨 — 글로벌 ~/.claude/는 절대 수정하지 않음)
# 모든 파일은 프로젝트 .claude/에 설치됨.
# 사용자가 글로벌 설정을 원하면 bootstrap-dev.sh 또는 수동 설치 사용.
# ============================================================

# ============================================================
# Step 2: Track Selection
# ============================================================
section "2/7" "Track Selection"

TRACKS=("csr-supabase" "csr-fastify" "csr-fastapi" "ssr-htmx" "ssr-nextjs" "data" "executive" "tooling" "full")

if [ "${#SELECTED_TRACKS[@]}" -eq 0 ]; then
  # v26.11.1 — 비대화형(자동화/CI/pipe) 환경에서 명확 에러 (read EOF로 silent fail 방지)
  if [ ! -t 0 ]; then
    fail "비대화형 환경에서 --track 필수 (예: --track tooling)"
    echo "  Available: ${TRACKS[*]}" >&2
    exit 1
  fi
  echo ""
  echo -e "  ${BOLD}Available Tracks:${NC}"
  echo ""
  for i in "${!TRACKS[@]}"; do
    echo "    $((i+1)). ${TRACKS[$i]}"
  done
  echo ""
  read -rp "  Select track (1-${#TRACKS[@]}): " TRACK_NUM
  if [[ "$TRACK_NUM" -ge 1 && "$TRACK_NUM" -le "${#TRACKS[@]}" ]]; then
    TRACK="${TRACKS[$((TRACK_NUM-1))]}"
    SELECTED_TRACKS=("$TRACK")
  else
    fail "Invalid selection"
    exit 1
  fi
fi

# 다중 Track 표시 + ADD_MODE 안내
if [ "${#SELECTED_TRACKS[@]}" -eq 1 ]; then
  info "Track: $TRACK"
else
  info "Tracks: ${SELECTED_TRACKS[*]} (다중 — union 설치)"
fi
[ "$ADD_MODE" = true ] && info "Mode: --add-track (기존 .mcp.json/.claude/* 보존하며 union 추가)"

# ============================================================
# Step 3: GSD Selection
# v27.5.0 — /dev/tty로 curl|bash 인터랙티브 지원, ADD_MODE 시 skip
# ============================================================
if [ "$GSD" = false ] && has_dev_track && [ "$ADD_MODE" = false ] \
   && { [ -t 0 ] || [ -e /dev/tty ]; }; then
  read -rp "  Install GSD (large project orchestrator)? [y/N]: " GSD_ANSWER < /dev/tty 2>/dev/null || GSD_ANSWER=""
  if [[ "$GSD_ANSWER" =~ ^[Yy]$ ]]; then
    GSD=true
  fi
fi

# ============================================================
# Step 4: Project Directory Setup
# ============================================================
section "3/7" "Project Structure"

cd "$PROJECT_DIR"
PROJ=".claude"
mkdir -p "$PROJ"/{commands/{uzys,ecc},rules,skills,agents,hooks}
mkdir -p docs/decisions

# ============================================================
# Step 5: Install Track-Specific Components
# ============================================================
section "4/7" "Track Components ($TRACK)"

# --- Track → Rule Mapping ---
COMMON_RULES="git-policy change-management gates-taxonomy"
DEV_RULES="test-policy ship-checklist code-style error-handling"
UI_RULES="design-workflow"

# Track-specific rules (case statement for bash 3.2 compatibility on macOS)
get_track_rules() {
  case "$1" in
    csr-supabase) echo "tauri shadcn api-contract" ;;
    csr-fastify)  echo "tauri shadcn api-contract database" ;;
    csr-fastapi)  echo "tauri shadcn api-contract database" ;;
    ssr-htmx)     echo "htmx" ;;
    ssr-nextjs)   echo "nextjs shadcn" ;;
    data)         echo "pyside6 data-analysis" ;;
    executive)    echo "" ;;
    tooling)      echo "cli-development" ;;
    full)         echo "tauri shadcn api-contract database htmx nextjs pyside6 data-analysis cli-development" ;;
    *)            echo "" ;;
  esac
}

# Determine which rules to install (다중 Track union)
RULES_TO_INSTALL="$COMMON_RULES"
if has_dev_track; then
  RULES_TO_INSTALL="$RULES_TO_INSTALL $DEV_RULES"
fi
# UI rules: SELECTED_TRACKS 중 하나라도 csr-*/ssr-*/full
if any_track 'csr-*|ssr-*|full'; then
  RULES_TO_INSTALL="$RULES_TO_INSTALL $UI_RULES"
fi
# Track-specific rules (모든 SELECTED_TRACKS의 union)
for T in "${SELECTED_TRACKS[@]}"; do
  RULES_TO_INSTALL="$RULES_TO_INSTALL $(get_track_rules "$T")"
done
# 중복 제거
RULES_TO_INSTALL=$(echo "$RULES_TO_INSTALL" | tr ' ' '\n' | awk 'NF && !seen[$0]++' | tr '\n' ' ')

# Copy rules
for rule in $RULES_TO_INSTALL; do
  if [ -f "$TEMPLATES/rules/${rule}.md" ]; then
    safe_copy "$TEMPLATES/rules/${rule}.md" "$PROJ/rules/${rule}.md"
  else
    warn "Rule template not found: ${rule}.md"
  fi
done

# (model-routing + ecc-performance-common rule 제거됨 — CLAUDE.md Agents 표 + Context Management 참조)

# --- Commands ---
# uzys: commands (dev tracks only)
if has_dev_track; then
  for cmd in spec plan build test review ship auto; do
    safe_copy "$TEMPLATES/commands/uzys/${cmd}.md" "$PROJ/commands/uzys/${cmd}.md"
  done
fi

# ecc: commands
for cmd in "$TEMPLATES/commands/ecc/"*.md; do
  [ -f "$cmd" ] && safe_copy "$cmd" "$PROJ/commands/ecc/$(basename "$cmd")"
done

# imm: 커맨드 제거됨 — Impeccable 스킬은 /polish, /critique 등으로 직접 호출 가능

# --- 메타 원칙 CLAUDE.md (프로젝트 .claude/CLAUDE.md) ---
safe_copy "$TEMPLATES/CLAUDE.md" "$PROJ/CLAUDE.md"

# --- Agents (모두 프로젝트 .claude/agents/, 글로벌 없음) ---
safe_copy "$TEMPLATES/agents/reviewer.md" "$PROJ/agents/reviewer.md"
safe_copy "$TEMPLATES/agents/data-analyst.md" "$PROJ/agents/data-analyst.md"
safe_copy "$TEMPLATES/agents/strategist.md" "$PROJ/agents/strategist.md"
safe_copy "$TEMPLATES/agents/code-reviewer.md" "$PROJ/agents/code-reviewer.md"     # ECC
safe_copy "$TEMPLATES/agents/security-reviewer.md" "$PROJ/agents/security-reviewer.md" # ECC
# P1-5: silent-failure-hunter (dev Track 한정)
if has_dev_track; then
  safe_copy "$TEMPLATES/agents/silent-failure-hunter.md" "$PROJ/agents/silent-failure-hunter.md" # ECC
  # Phase 5.1 A14: build-error-resolver (ECC, dev Track 한정)
  safe_copy "$TEMPLATES/agents/build-error-resolver.md" "$PROJ/agents/build-error-resolver.md"
  # Phase 5.1 B1: plan-checker (자체 작성, GSD 사상 흡수, dev Track 한정)
  safe_copy "$TEMPLATES/agents/plan-checker.md" "$PROJ/agents/plan-checker.md"
fi

# --- Skills (ECC + 자체) ---
safe_copy_dir "$TEMPLATES/skills/continuous-learning-v2" "$PROJ/skills/continuous-learning-v2"
safe_copy_dir "$TEMPLATES/skills/strategic-compact" "$PROJ/skills/strategic-compact"
safe_copy "$TEMPLATES/skills/spec-scaling/SKILL.md" "$PROJ/skills/spec-scaling/SKILL.md"
# 공통 cherry-pick 스킬 (Phase 4b A3, A4)
safe_copy_dir "$TEMPLATES/skills/deep-research" "$PROJ/skills/deep-research"
# market-research는 executive Track 한정
if any_track 'executive|full'; then
  safe_copy_dir "$TEMPLATES/skills/market-research" "$PROJ/skills/market-research"
fi

# Test/eval skills (D22 — behavior-level testing)
if has_dev_track; then
  safe_copy_dir "$TEMPLATES/skills/eval-harness" "$PROJ/skills/eval-harness"
  safe_copy_dir "$TEMPLATES/skills/verification-loop" "$PROJ/skills/verification-loop"
  safe_copy_dir "$TEMPLATES/skills/agent-introspection-debugging" "$PROJ/skills/agent-introspection-debugging"
fi
# e2e-testing은 UI Track 한정
if any_track 'csr-*|ssr-*|full'; then
  safe_copy_dir "$TEMPLATES/skills/e2e-testing" "$PROJ/skills/e2e-testing"
fi

# v26.10.0 — Track별 ECC cherry-pick skills (ECC plugin 통째 설치 대체)
if any_track 'data|csr-fastapi|full'; then
  safe_copy_dir "$TEMPLATES/skills/python-patterns" "$PROJ/skills/python-patterns"
  safe_copy_dir "$TEMPLATES/skills/python-testing" "$PROJ/skills/python-testing"
fi
if any_track 'ssr-nextjs|full'; then
  safe_copy_dir "$TEMPLATES/skills/nextjs-turbopack" "$PROJ/skills/nextjs-turbopack"
fi
if any_track 'executive|full'; then
  safe_copy_dir "$TEMPLATES/skills/investor-materials" "$PROJ/skills/investor-materials"
  safe_copy_dir "$TEMPLATES/skills/investor-outreach" "$PROJ/skills/investor-outreach"
fi

# v26.16.0 — data Track 외부 skill 5종 (npx skills add + claude plugin)
# 평가 근거: docs/research/data-track-skills-eval-2026-04-18.md
if any_track 'data|full'; then
  echo -n "  polars (K-Dense scientific-skills)..."
  npx skills add K-Dense-AI/scientific-agent-skills --skill polars --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"

  echo -n "  dask (K-Dense, 분산처리)..."
  npx skills add K-Dense-AI/scientific-agent-skills --skill dask --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"

  echo -n "  python-resource-management (wshobson)..."
  npx skills add https://github.com/wshobson/agents --skill python-resource-management --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"

  echo -n "  python-performance-optimization (wshobson)..."
  npx skills add https://github.com/wshobson/agents --skill python-performance-optimization --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"

  echo -n "  Anthropic data plugin (visualization, SQL exploration)..."
  claude plugin marketplace add anthropics/knowledge-work-plugins </dev/null >/dev/null 2>&1 || true
  claude plugin install data@knowledge-work-plugins </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed or manual"
fi

# --- Hooks ---
# 자동 등록 hook (settings.json에서 참조):
safe_copy "$TEMPLATES/hooks/session-start.sh" "$PROJ/hooks/session-start.sh"
safe_copy "$TEMPLATES/hooks/protect-files.sh" "$PROJ/hooks/protect-files.sh"
safe_copy "$TEMPLATES/hooks/gate-check.sh" "$PROJ/hooks/gate-check.sh"
safe_copy "$TEMPLATES/hooks/agentshield-gate.sh" "$PROJ/hooks/agentshield-gate.sh"
safe_copy "$TEMPLATES/hooks/mcp-pre-exec.sh" "$PROJ/hooks/mcp-pre-exec.sh"
# 수동/on-demand 호출 유틸리티 (자동 트리거 없음):
safe_copy "$TEMPLATES/hooks/spec-drift-check.sh" "$PROJ/hooks/spec-drift-check.sh"  # /uzys:ship에서 명시 호출
safe_copy "$TEMPLATES/hooks/checkpoint-snapshot.sh" "$PROJ/hooks/checkpoint-snapshot.sh"  # /ecc:checkpoint에서 호출
chmod +x "$PROJ/hooks/"*.sh

# --- .claude/settings.json (committable, $CLAUDE_PROJECT_DIR 사용) ---
safe_copy "$TEMPLATES/settings.json" "$PROJ/settings.json"

# --- .mcp.json (프로젝트 MCP, Track별 동적 조립, ADD_MODE 시 jq merge) ---
if [ -f .mcp.json ] && [ "$ADD_MODE" = false ]; then
  warn ".mcp.json 이미 존재 — 사용자 추가 항목 보존 위해 생성 스킵 (재실행/추가 시 --add-track 사용)"
elif command -v jq &> /dev/null; then
  trap 'rm -f .mcp.json.tmp .mcp.json.tmp2' EXIT

  # v26.11.2 — ADD_MODE 시 기존 .mcp.json invalid면 백업 후 템플릿으로 복구
  if [ "$ADD_MODE" = true ] && [ -f .mcp.json ]; then
    if jq empty .mcp.json 2>/dev/null; then
      cp .mcp.json .mcp.json.tmp
      info "ADD_MODE: 기존 .mcp.json 보존하면서 새 Track의 MCP union"
    else
      BACKUP=".mcp.json.invalid.$(date +%s).bak"
      mv .mcp.json "$BACKUP"
      cp "$TEMPLATES/mcp.json" .mcp.json.tmp
      warn "ADD_MODE: 기존 .mcp.json invalid → $BACKUP 으로 백업 후 템플릿 재생성"
    fi
  else
    cp "$TEMPLATES/mcp.json" .mcp.json.tmp
  fi

  # v26.12.0 — Track별 MCP 매핑을 templates/track-mcp-map.tsv에서 데이터 주도 로드.
  # 신규 MCP 추가 시 tsv 한 줄만 수정하면 됨 (setup-harness.sh 수정 불필요).
  MCP_MAP="$TEMPLATES/track-mcp-map.tsv"
  if [ -f "$MCP_MAP" ]; then
    while IFS=$'\t' read -r mcp_name track_pattern mcp_cmd mcp_args; do
      # 주석/빈 라인 skip
      case "$mcp_name" in '#'*|'') continue ;; esac
      [ -z "$track_pattern" ] && continue
      if any_track "$track_pattern"; then
        jq --arg name "$mcp_name" --arg cmd "$mcp_cmd" --argjson args "$mcp_args" \
          'if .mcpServers[$name] == null then .mcpServers[$name] = {"type":"stdio","command":$cmd,"args":$args} else . end' \
          .mcp.json.tmp > .mcp.json.tmp2 \
          && mv .mcp.json.tmp2 .mcp.json.tmp || { fail "jq $mcp_name 실패"; exit 1; }
      fi
    done < "$MCP_MAP"
  else
    warn "track-mcp-map.tsv 없음 — Track별 MCP 추가 스킵"
  fi

  # _comment 제거하고 최종 .mcp.json 생성
  jq 'del(._comment)' .mcp.json.tmp > .mcp.json || { fail "jq finalize 실패"; exit 1; }
  rm -f .mcp.json.tmp
  trap - EXIT
  if [ "$ADD_MODE" = true ]; then
    info "Updated: .mcp.json (union 추가)"
  else
    info "Created: .mcp.json (Track-aware, 글로벌 mcp add 없음)"
  fi
else
  warn ".mcp.json 생성 스킵 — jq 필요 (brew install jq)"
fi

# .mcp-allowlist 자동 생성 (D35 — opt-in security gate)
# .mcp.json 생성 후에 실행 (첫 설치에서도 allowlist가 생성되도록 순서 수정, v26.7.3)
if [ ! -f ".mcp-allowlist" ] && [ -f ".mcp.json" ] && command -v jq &>/dev/null; then
  {
    echo "# MCP Server Allowlist — auto-generated by setup-harness.sh"
    echo "# mcp-pre-exec.sh hook이 참조. 허용하지 않을 서버는 삭제하거나 '#' 주석."
    echo "# 파일 자체를 삭제하면 gate 비활성 (모든 MCP 호출 통과)."
    echo ""
    jq -r '.mcpServers | keys[]' .mcp.json 2>/dev/null
  } > .mcp-allowlist
  info ".mcp-allowlist generated from .mcp.json"
fi

# --- Project CLAUDE.md ---
if [ -f "$TEMPLATES/project-claude/${TRACK}.md" ]; then
  safe_copy "$TEMPLATES/project-claude/${TRACK}.md" "CLAUDE.md"
else
  warn "Project CLAUDE.md template not found for track: $TRACK"
fi

# ============================================================
# Step 6: Plugin & Skill Installation
# ============================================================
section "5/7" "Plugins & Skills"

# agent-skills (dev tracks only)
if has_dev_track; then
  echo -n "  agent-skills plugin..."
  claude plugin marketplace add addyosmani/agent-skills </dev/null >/dev/null 2>&1 || true
  claude plugin install agent-skills@addy-agent-skills </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed or manual install needed"
fi

# ECC: plugin 통째 설치 대신 Track별 cherry-pick으로 전환 (v26.10.0).
#       기존에 글로벌 ECC plugin 설치된 경우 안내: claude plugin uninstall everything-claude-code@everything-claude-code

# Railway plugin — Railway 사용 Track만 (csr-supabase는 Vercel/Netlify 사용으로 제외, v27.4.0)
if any_track 'csr-fastify|csr-fastapi|ssr-htmx|ssr-nextjs|full'; then
  echo -n "  Railway plugin..."
  claude plugin marketplace add railwayapp/railway-plugin </dev/null >/dev/null 2>&1 || true
  claude plugin install railway-plugin@railway-plugin </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed or manual install needed"
fi

# Railway agent-skills — Railway MCP가 설치되는 Track과 동일
if any_track 'csr-fastify|csr-fastapi|ssr-htmx|ssr-nextjs|full'; then
  echo -n "  Railway agent-skills..."
  claude plugin marketplace add railwayapp/railway-skills </dev/null >/dev/null 2>&1 || true
  claude plugin install railway@railway-skills </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed or manual install needed"
fi

# Vercel + Netlify + Supabase CLI — csr-supabase 자동화 (v27.6.0: Supabase CLI 추가)
# Supabase CLI는 'supabase login' (OAuth) 한 번 → CLI 명령 자동.
# MCP server는 별도로 SUPABASE_ACCESS_TOKEN env var 필요 (project-claude 가이드 참조).
if any_track 'csr-supabase|full'; then
  echo -n "  Vercel CLI..."
  if command -v vercel &> /dev/null; then
    info "already installed"
  else
    npm install -g vercel </dev/null >/dev/null 2>&1 && info "installed" || install_fail "vercel CLI"
  fi

  echo -n "  Netlify CLI..."
  if command -v netlify &> /dev/null; then
    info "already installed"
  else
    npm install -g netlify-cli </dev/null >/dev/null 2>&1 && info "installed" || install_fail "netlify CLI"
  fi

  echo -n "  Supabase CLI..."
  if command -v supabase &> /dev/null; then
    info "already installed"
  else
    npm install -g supabase </dev/null >/dev/null 2>&1 && info "installed (run 'supabase login' once for OAuth)" || install_fail "supabase CLI"
  fi

  # .env.example 생성 + .gitignore 보강 (v27.7.0)
  if [ ! -f ".env.example" ]; then
    cat > .env.example <<'ENVEOF'
# .env.example — csr-supabase Track
# Copy to .env (gitignored) and fill in values: cp .env.example .env

# ===== Supabase Management API (MCP server용) =====
# Personal Access Token — @supabase/mcp-server가 프로젝트 생성/마이그레이션/Edge Functions 배포에 사용
# 발급: https://supabase.com/dashboard/account/tokens
SUPABASE_ACCESS_TOKEN=

# 프로젝트 참조 ID (예: "abcdefghijklmnop")
# 위치: Supabase Dashboard → Project Settings → General
SUPABASE_PROJECT_REF=

# DB 패스워드 (supabase db push 등 직접 DB 접근용)
# 위치: Supabase Dashboard → Project Settings → Database
SUPABASE_DB_PASSWORD=

# ===== Frontend (public, 클라이언트 노출 OK) =====
# 위치: Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# ===== Optional — 앱 측 AI 기능용 =====
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=

# ===== Note =====
# - Vercel/Netlify는 별도 CLI login 사용 (env 불필요): vercel login / netlify login
# - Supabase CLI(supabase login)는 OAuth로 ~/.config/supabase/에 토큰 저장 — env 별개
# - .env는 .gitignore됨 (자동 추가). 절대 commit 금지.
ENVEOF
    info ".env.example 생성 (csr-supabase 토큰 가이드)"
  fi

  # .gitignore에 .env 추가 (없으면)
  if [ -f .gitignore ] && ! grep -qE '^\.env$|^\.env\s' .gitignore; then
    echo "" >> .gitignore
    echo "# Secret env (auto-added by setup-harness.sh)" >> .gitignore
    echo ".env" >> .gitignore
    info ".gitignore에 .env 추가"
  fi
fi

# Impeccable (UI tracks)
if any_track 'csr-*|ssr-*|full'; then
  echo -n "  Impeccable..."
  npx skills add pbakaus/impeccable --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"
fi

# Playwright (모든 dev Track 공통, 이전 UI 한정에서 이동)
if has_dev_track; then
  echo -n "  Playwright skill..."
  npx skills add testdino-hq/playwright-skill --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"
fi

# 공통 도구 (Phase 4b 신규)
if has_dev_track; then
  echo -n "  find-skills (vercel-labs)..."
  npx skills add vercel-labs/skills --skill find-skills --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"

  echo -n "  agent-browser..."
  if command -v agent-browser &> /dev/null; then
    info "already installed"
  else
    npm install -g agent-browser </dev/null >/dev/null 2>&1 && info "installed" || install_fail "agent-browser"
  fi

  echo -n "  architecture-decision-record..."
  npx skills add yonatangross/orchestkit --skill architecture-decision-record --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"
fi

# Supabase MCP는 .mcp.json으로 이관됨 (claude mcp add 제거)

# Supabase agent-skills (csr-supabase 전용 + full) — D23
if any_track 'csr-supabase|full'; then
  echo -n "  Supabase agent-skills..."
  claude plugin marketplace add supabase/agent-skills </dev/null >/dev/null 2>&1 || true
  claude plugin install supabase@supabase-agent-skills </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed or manual install needed"

  echo -n "  Supabase postgres-best-practices..."
  claude plugin install postgres-best-practices@supabase-agent-skills </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed or manual install needed"
fi

if any_track 'csr-*|ssr-nextjs|full'; then
  echo -n "  react-best-practices..."
  npx skills add vercel-labs/agent-skills --skill react-best-practices --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"

  echo -n "  shadcn-ui..."
  npx skills add shadcn/ui --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"

  echo -n "  web-design-guidelines..."
  npx skills add vercel-labs/agent-skills --skill web-design-guidelines --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"
fi

if any_track 'ssr-nextjs|full'; then
  echo -n "  next-best-practices..."
  npx skills add vercel-labs/next-skills --yes </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed"
fi

# Anthropic document-skills + executive plugins
if any_track 'executive|full'; then
  echo -n "  Anthropic document-skills..."
  claude plugin marketplace add anthropics/skills </dev/null >/dev/null 2>&1 || true
  claude plugin install document-skills@anthropic-agent-skills </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed or manual install needed"

  echo -n "  c-level-skills..."
  claude plugin marketplace add alirezarezvani/c-level-skills </dev/null >/dev/null 2>&1 || true
  claude plugin install c-level-skills@c-level-skills </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed or manual install needed"

  echo -n "  finance-skills..."
  claude plugin marketplace add alirezarezvani/finance-skills </dev/null >/dev/null 2>&1 || true
  claude plugin install finance-skills@finance-skills </dev/null >/dev/null 2>&1 && info "installed" || warn "already installed or manual install needed"
fi

# GSD (optional)
if [ "$GSD" = true ]; then
  echo -n "  GSD..."
  npx get-shit-done-cc@latest 2>/dev/null && info "installed" || install_fail "GSD"
fi

# Optional: Trail of Bits security (v27.2.0 — TTY 또는 --with-tob 플래그)
# v27.5.0 — ADD_MODE에서는 --with-tob 명시한 경우만 진행 (재프롬프트 노이즈 제거)
if has_dev_track && { [ "$WITH_TOB" = true ] || { [ "$ADD_MODE" = false ] && { [ -t 0 ] || [ -e /dev/tty ]; }; }; }; then
  echo ""
  echo -e "  ${BOLD}Optional Plugins:${NC}"

  if [ "$WITH_TOB" = true ]; then
    TOB_ANSWER="y"
    info "--with-tob 플래그 감지 — 자동 진행"
  else
    read -rp "  Install Trail of Bits security (CodeQL, Semgrep)? [y/N]: " TOB_ANSWER < /dev/tty 2>/dev/null || TOB_ANSWER=""
  fi

  if [[ "$TOB_ANSWER" =~ ^[Yy]$ ]]; then
    echo -n "  Trail of Bits security..."
    claude plugin marketplace add trailofbits/skills </dev/null >/dev/null 2>&1 || true
    claude plugin install trailofbits-skills@trailofbits-skills </dev/null >/dev/null 2>&1 && info "installed" || install_fail "Trail of Bits"
  fi
fi

# ============================================================
# Step 7: Documentation
# ============================================================
section "6/7" "Documentation"

if [ -f "$TEMPLATES/../README.md" ] && [ ! -f "README.md" ]; then
  cp "$TEMPLATES/../README.md" "README.md"
  info "README.md created"
elif [ -f "README.md" ]; then
  warn "README.md already exists (skipped)"
fi

if [ -f "$TEMPLATES/../USAGE.md" ] && [ ! -f "USAGE.md" ]; then
  cp "$TEMPLATES/../USAGE.md" "USAGE.md"
  info "USAGE.md created"
elif [ -f "USAGE.md" ]; then
  warn "USAGE.md already exists (skipped)"
fi

# ============================================================
# Verification
# ============================================================
section "7/7" "Verification"

ERRORS=0

# Project-level CLAUDE.md
[ -f "$PROJ/CLAUDE.md" ] && {
  LINE_COUNT=$(wc -l < "$PROJ/CLAUDE.md" 2>/dev/null || echo "999")
  if [ "$LINE_COUNT" -le 200 ]; then
    info "Project CLAUDE.md: ${LINE_COUNT} lines (≤200)"
  else
    fail "Project CLAUDE.md: ${LINE_COUNT} lines (>200 limit!)"
    ERRORS=$((ERRORS+1))
  fi
} || { fail "Missing: $PROJ/CLAUDE.md"; ERRORS=$((ERRORS+1)); }

# Project agents (5개)
for agent in reviewer data-analyst strategist code-reviewer security-reviewer; do
  [ -f "$PROJ/agents/${agent}.md" ] && info "Agent: ${agent}" || { fail "Missing: ${agent}"; ERRORS=$((ERRORS+1)); }
done

# Executive check (모든 SELECTED_TRACKS이 executive일 때만)
if all_executive; then
  if [ ! -d "$PROJ/commands/uzys" ] || [ -z "$(ls -A "$PROJ/commands/uzys" 2>/dev/null)" ]; then
    info "Executive: agent-skills commands not installed (correct)"
  else
    fail "Executive: uzys commands should not be installed"
    ERRORS=$((ERRORS+1))
  fi
fi

# ECC skills
[ -d "$PROJ/skills/continuous-learning-v2" ] && info "ECC: CL-v2 skill" || { fail "Missing: CL-v2"; ERRORS=$((ERRORS+1)); }

# 글로벌 미수정 검증 (절대 조건)
if [ -f "$HOME/.claude/CLAUDE.md" ]; then
  GLOBAL_MTIME=$(stat -f "%m" "$HOME/.claude/CLAUDE.md" 2>/dev/null || stat -c "%Y" "$HOME/.claude/CLAUDE.md" 2>/dev/null)
  NOW=$(date +%s)
  if [ -n "$GLOBAL_MTIME" ] && [ $((NOW - GLOBAL_MTIME)) -lt 60 ]; then
    fail "ALERT: ~/.claude/CLAUDE.md was modified within last 60s — should NEVER happen"
    ERRORS=$((ERRORS+1))
  else
    info "Global ~/.claude/CLAUDE.md untouched (correct)"
  fi
fi

# Display: 다중 Track이면 union 표기
if [ "${#SELECTED_TRACKS[@]}" -gt 1 ]; then
  TRACK_DISPLAY="${SELECTED_TRACKS[*]}"
  MULTI=true
else
  TRACK_DISPLAY="$TRACK"
  MULTI=false
fi

# Summary
echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}  Setup Complete — $TRACK_DISPLAY${NC}"
  echo -e "${GREEN}========================================${NC}"
else
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}  Setup Complete with $ERRORS warning(s)${NC}"
  echo -e "${YELLOW}========================================${NC}"
fi

# === 설치 결과 검증 테이블 ===
echo ""
echo -e "${BOLD}┌─────────────────────────────────────────────────┐${NC}"
echo -e "${BOLD}│  Installation Report — $TRACK_DISPLAY${NC}"
echo -e "${BOLD}├─────────────────┬──────────┬──────────┬─────────┤${NC}"
printf  "${BOLD}│ %-15s │ %-8s │ %-8s │ %-7s │${NC}\n" "Category" "Found" "Expected" "Status"
echo -e "${BOLD}├─────────────────┼──────────┼──────────┼─────────┤${NC}"

# v26.11.0: 다중 Track 시 expected 검증 skip (union 카운트 계산 복잡 — Found만 표시)
multi_status() {
  if [ "$MULTI" = true ]; then
    echo "${YELLOW}—${NC}"
  else
    [ "$1" -ge "$2" ] && echo "${GREEN}✅${NC}" || echo "${RED}❌${NC}"
  fi
}

# Rules
RULES_FOUND=$(ls "$PROJ/rules/"*.md 2>/dev/null | wc -l | tr -d ' ')
case "$TRACK" in
  executive) RULES_EXPECTED=3 ;;
  tooling) RULES_EXPECTED=8 ;;
  data) RULES_EXPECTED=9 ;;
  ssr-htmx) RULES_EXPECTED=9 ;;
  ssr-nextjs) RULES_EXPECTED=10 ;;
  csr-supabase) RULES_EXPECTED=11 ;;
  csr-fastify|csr-fastapi) RULES_EXPECTED=12 ;;
  full) RULES_EXPECTED=17 ;;
  *) RULES_EXPECTED=12 ;;
esac
[ "$MULTI" = true ] && RULES_EXP_DISP="multi" || RULES_EXP_DISP="$RULES_EXPECTED"
RULES_STATUS=$(multi_status "$RULES_FOUND" "$RULES_EXPECTED")
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Rules" "$RULES_FOUND" "$RULES_EXP_DISP" "$RULES_STATUS"

# Commands
UZYS_FOUND=$(ls "$PROJ/commands/uzys/"*.md 2>/dev/null | wc -l | tr -d ' ')
ECC_FOUND=$(ls "$PROJ/commands/ecc/"*.md 2>/dev/null | wc -l | tr -d ' ')
if all_executive; then UZYS_EXP=0; else UZYS_EXP=7; fi  # 6 + auto
ECC_EXP=8
UZYS_STATUS=$(multi_status "$UZYS_FOUND" "$UZYS_EXP")
ECC_STATUS=$(multi_status "$ECC_FOUND" "$ECC_EXP")
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Commands uzys:" "$UZYS_FOUND" "$UZYS_EXP" "$UZYS_STATUS"
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Commands ecc:" "$ECC_FOUND" "$ECC_EXP" "$ECC_STATUS"

# Agents
AGENTS_FOUND=$(ls "$PROJ/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
if all_executive; then AGENTS_EXP=5; else AGENTS_EXP=8; fi
AGENTS_STATUS=$(multi_status "$AGENTS_FOUND" "$AGENTS_EXP")
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Agents" "$AGENTS_FOUND" "$AGENTS_EXP" "$AGENTS_STATUS"

# Hooks
HOOKS_FOUND=$(ls "$PROJ/hooks/"*.sh 2>/dev/null | wc -l | tr -d ' ')
HOOKS_EXP=7
HOOKS_STATUS=$(multi_status "$HOOKS_FOUND" "$HOOKS_EXP")
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Hooks" "$HOOKS_FOUND" "$HOOKS_EXP" "$HOOKS_STATUS"

# Skills
SKILLS_FOUND=$(find "$PROJ/skills" -maxdepth 2 -name "SKILL.md" -o -name "config.json" 2>/dev/null | xargs -I{} dirname {} | sort -u | wc -l | tr -d ' ')
if all_executive; then SKILLS_EXP=5; else SKILLS_EXP=7; fi
SKILLS_STATUS=$(multi_status "$SKILLS_FOUND" "$SKILLS_EXP")
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Skills" "$SKILLS_FOUND" "$SKILLS_EXP" "$SKILLS_STATUS"

# MCP servers
if [ -f ".mcp.json" ] && command -v jq &>/dev/null; then
  MCP_FOUND=$(jq '.mcpServers | keys | length' .mcp.json 2>/dev/null || echo "?")
else
  MCP_FOUND="?"
fi
case "$TRACK" in
  csr-supabase) MCP_EXP=5 ;;
  csr-fast*|ssr-*) MCP_EXP=4 ;;
  full) MCP_EXP=5 ;;
  *) MCP_EXP=3 ;;
esac
if [ "$MULTI" = true ]; then
  MCP_STATUS="${YELLOW}—${NC}"
  MCP_EXP_DISP="multi"
else
  MCP_STATUS=$([ "$MCP_FOUND" != "?" ] && [ "$MCP_FOUND" -ge "$MCP_EXP" ] && echo "${GREEN}✅${NC}" || echo "${YELLOW}⚠️${NC}")
  MCP_EXP_DISP="$MCP_EXP"
fi
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "MCP servers" "$MCP_FOUND" "$MCP_EXP_DISP" "$MCP_STATUS"

# .mcp-allowlist
if [ -f ".mcp-allowlist" ]; then
  ALLOW_STATUS="${GREEN}✅${NC}"
  ALLOW_FOUND="yes"
else
  ALLOW_STATUS="${YELLOW}⚠️${NC}"
  ALLOW_FOUND="no"
fi
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" ".mcp-allowlist" "$ALLOW_FOUND" "yes" "$ALLOW_STATUS"

# settings.json
if [ -f "$PROJ/settings.json" ]; then
  SETTINGS_STATUS="${GREEN}✅${NC}"
else
  SETTINGS_STATUS="${RED}❌${NC}"
fi
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "settings.json" "$([ -f "$PROJ/settings.json" ] && echo yes || echo no)" "yes" "$SETTINGS_STATUS"

# Plugins (network-dependent, count install attempts)
PLUGIN_STATUS="${YELLOW}⚠️${NC}"
if [ "$INSTALL_FAILURES" -eq 0 ]; then
  PLUGIN_STATUS="${GREEN}✅${NC}"
fi
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Plugins" "tried" "network" "$PLUGIN_STATUS"

echo -e "${BOLD}└─────────────────┴──────────┴──────────┴─────────┘${NC}"

if [ "$INSTALL_FAILURES" -gt 0 ]; then
  echo ""
  echo -e "  ${RED}Install failures ($INSTALL_FAILURES):${NC}"
  echo -e "$FAILED_ITEMS"
fi

echo ""
echo -e "  Track: ${BOLD}$TRACK_DISPLAY${NC}"
[ "$ADD_MODE" = true ] && echo -e "  Mode:  ${BOLD}--add-track${NC} (기존 .mcp.json/.claude/* 보존하며 union)"
echo -e "  GSD: $([ "$GSD" = true ] && echo "yes" || echo "no")"
echo ""

# ============================================================
# ECC Plugin 프로젝트 스코프 설치 (v27.2.0)
# 진입 조건: 인터랙티브 (TTY) 또는 --with-ecc/--with-prune 플래그
# curl|bash 환경에서도 /dev/tty로 인터랙티브 가능
# v27.5.0 — ADD_MODE에서는 --with-ecc 명시한 경우만 진행 (재프롬프트 노이즈 제거)
# ============================================================
if [ "$WITH_ECC" = true ] || { [ "$ADD_MODE" = false ] && { [ -t 0 ] || [ -e /dev/tty ]; }; }; then
  section "ECC" "Plugin 프로젝트 스코프 설치 (선택사항)"
  echo "  ECC = everything-claude-code. continuous-learning-v2, security-scan,"
  echo "        ecc-e2e 등 유용한 스킬/에이전트/커맨드 번들."
  echo ""

  # 플래그 명시 시 자동 진행, 아니면 프롬프트 (TTY에서 직접 읽기)
  if [ "$WITH_ECC" = true ]; then
    ECC_ANSWER="y"
    info "--with-ecc 플래그 감지 — 자동 진행"
  else
    read -rp "  ECC plugin을 프로젝트 스코프로 설치(copy)하시겠습니까? [y/N]: " ECC_ANSWER < /dev/tty 2>/dev/null || ECC_ANSWER=""
  fi

  if [[ "$ECC_ANSWER" =~ ^[Yy]$ ]]; then
    # 글로벌 ECC cache 확인, 없으면 설치
    ECC_CACHE="$HOME/.claude/plugins/cache/everything-claude-code/everything-claude-code"
    if [ ! -d "$ECC_CACHE" ]; then
      echo "  글로벌 ECC plugin 설치 중..."
      claude plugin marketplace add affaan-m/everything-claude-code </dev/null >/dev/null 2>&1 || true
      claude plugin install everything-claude-code@everything-claude-code </dev/null >/dev/null 2>&1 && info "글로벌 ECC 설치 완료" || warn "ECC 글로벌 설치 실패 (수동 실행 필요)"
    fi
    if [ -d "$ECC_CACHE" ]; then
      if [ "$WITH_PRUNE" = true ]; then
        PRUNE_ANSWER="y"
        info "--with-prune 플래그 감지 — 자동 prune"
      else
        read -rp "  ECC에서 불필요 항목을 제거(prune)하시겠습니까? [y/N]: " PRUNE_ANSWER < /dev/tty 2>/dev/null || PRUNE_ANSWER=""
      fi

      if [[ "$PRUNE_ANSWER" =~ ^[Yy]$ ]]; then
        bash "$SCRIPT_DIR/prune-ecc.sh" --apply --force
      else
        bash "$SCRIPT_DIR/prune-ecc.sh" --apply --force --copy-only
      fi
      echo ""
      info "사용: claude --plugin-dir .claude/local-plugins/ecc"
    else
      warn "ECC 글로벌 cache 미발견. 설치 후 'bash scripts/prune-ecc.sh --apply' 수동 실행"
    fi
  else
    info "ECC 설치 스킵. 나중에 'bash scripts/prune-ecc.sh --apply' 실행 가능"
  fi
fi

echo ""
echo -e "${BOLD}Next steps:${NC}"
echo -e "  1. Start Claude Code: ${CYAN}claude${NC}"
echo -e "  2. Begin workflow:    ${CYAN}/uzys:spec${NC}"
echo -e "  3. Auto workflow:     ${CYAN}/uzys:auto${NC} (spec 완료 후)"
echo ""
