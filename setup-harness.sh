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

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES="$SCRIPT_DIR/templates"

# ============================================================
# Argument Parsing
# ============================================================
# 이 스크립트는 프로젝트 스코프 전용. 글로벌 ~/.claude/는 절대 건드리지 않음.
TRACK=""
GSD=false
MODEL_ROUTING="off"
PROJECT_DIR="$(pwd)"

while [[ $# -gt 0 ]]; do
  case $1 in
    --track) TRACK="$2"; shift 2 ;;
    --gsd) GSD=true; shift ;;
    --model-routing) MODEL_ROUTING="$2"; shift 2 ;;
    --model-routing=*) MODEL_ROUTING="${1#*=}"; shift ;;
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 [--track <track>] [--gsd] [--model-routing on|off] [--project-dir <path>]"; echo ""; echo "프로젝트 스코프 전용. 글로벌 ~/.claude/는 건드리지 않음."; echo ""; echo "--model-routing on: 6-gate 단계별 권장 모델 Rule 설치 (기본 off)"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# 검증
case "$MODEL_ROUTING" in
  on|off) ;;
  *) echo "Invalid --model-routing value: $MODEL_ROUTING (must be 'on' or 'off')"; exit 1 ;;
esac

# ============================================================
# Utility Functions
# ============================================================
INSTALL_FAILURES=0
FAILED_ITEMS=""

info()  { echo -e "  ${GREEN}✓${NC} $1"; }
warn()  { echo -e "  ${YELLOW}!${NC} $1"; }
fail()  { echo -e "  ${RED}✗${NC} $1"; }
install_fail() { INSTALL_FAILURES=$((INSTALL_FAILURES+1)); FAILED_ITEMS="$FAILED_ITEMS\n  - $1"; warn "$1 (INSTALL FAILED)"; }
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

if [ -z "$TRACK" ]; then
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
  else
    fail "Invalid selection"
    exit 1
  fi
fi

info "Track: $TRACK"

# ============================================================
# Step 3: GSD Selection
# ============================================================
if [ "$GSD" = false ] && [ "$TRACK" != "executive" ] && [ -t 0 ]; then
  read -rp "  Install GSD (large project orchestrator)? [y/N]: " GSD_ANSWER
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
DEV_RULES="test-policy ship-checklist code-style error-handling ecc-git-workflow ecc-security-common ecc-performance-common gsd-planner-antipatterns"
UI_RULES="design-workflow"

# Track-specific rules (case statement for bash 3.2 compatibility on macOS)
get_track_rules() {
  case "$1" in
    csr-supabase) echo "tauri shadcn api-contract" ;;
    csr-fastify)  echo "tauri shadcn api-contract database" ;;
    csr-fastapi)  echo "tauri shadcn api-contract database" ;;
    ssr-htmx)     echo "htmx seo" ;;
    ssr-nextjs)   echo "nextjs seo shadcn" ;;
    data)         echo "pyside6 data-analysis" ;;
    executive)    echo "" ;;
    tooling)      echo "cli-development" ;;
    full)         echo "tauri shadcn api-contract database htmx seo nextjs pyside6 data-analysis cli-development" ;;
    *)            echo "" ;;
  esac
}

# Determine which rules to install
RULES_TO_INSTALL="$COMMON_RULES"
if [ "$TRACK" != "executive" ]; then
  RULES_TO_INSTALL="$RULES_TO_INSTALL $DEV_RULES"
fi
# UI rules for tracks with UI
case "$TRACK" in
  csr-*|ssr-*|full) RULES_TO_INSTALL="$RULES_TO_INSTALL $UI_RULES" ;;
esac
RULES_TO_INSTALL="$RULES_TO_INSTALL $(get_track_rules "$TRACK")"

# Copy rules
for rule in $RULES_TO_INSTALL; do
  if [ -f "$TEMPLATES/rules/${rule}.md" ]; then
    safe_copy "$TEMPLATES/rules/${rule}.md" "$PROJ/rules/${rule}.md"
  else
    warn "Rule template not found: ${rule}.md"
  fi
done

# Model Routing rule (opt-in, D24)
if [ "$MODEL_ROUTING" = "on" ]; then
  safe_copy "$TEMPLATES/rules/model-routing.md" "$PROJ/rules/model-routing.md"
  info "Model routing enabled (6-gate model mapping guide)"
fi

# --- Commands ---
# uzys: commands (dev tracks only)
if [ "$TRACK" != "executive" ]; then
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
if [ "$TRACK" != "executive" ]; then
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
if [ "$TRACK" = "executive" ] || [ "$TRACK" = "full" ]; then
  safe_copy_dir "$TEMPLATES/skills/market-research" "$PROJ/skills/market-research"
fi

# Test/eval skills (D22 — behavior-level testing)
if [ "$TRACK" != "executive" ]; then
  safe_copy_dir "$TEMPLATES/skills/eval-harness" "$PROJ/skills/eval-harness"
  safe_copy_dir "$TEMPLATES/skills/verification-loop" "$PROJ/skills/verification-loop"
  safe_copy_dir "$TEMPLATES/skills/agent-introspection-debugging" "$PROJ/skills/agent-introspection-debugging"
fi
# e2e-testing은 UI Track 한정
case "$TRACK" in
  csr-*|ssr-*|full)
    safe_copy_dir "$TEMPLATES/skills/e2e-testing" "$PROJ/skills/e2e-testing"
    ;;
esac

# --- Hooks ---
safe_copy "$TEMPLATES/hooks/session-start.sh" "$PROJ/hooks/session-start.sh"
safe_copy "$TEMPLATES/hooks/protect-files.sh" "$PROJ/hooks/protect-files.sh"
safe_copy "$TEMPLATES/hooks/gate-check.sh" "$PROJ/hooks/gate-check.sh"
safe_copy "$TEMPLATES/hooks/uncommitted-check.sh" "$PROJ/hooks/uncommitted-check.sh"
safe_copy "$TEMPLATES/hooks/spec-drift-check.sh" "$PROJ/hooks/spec-drift-check.sh"
safe_copy "$TEMPLATES/hooks/checkpoint-snapshot.sh" "$PROJ/hooks/checkpoint-snapshot.sh"
safe_copy "$TEMPLATES/hooks/codebase-map.sh" "$PROJ/hooks/codebase-map.sh"
safe_copy "$TEMPLATES/hooks/agentshield-gate.sh" "$PROJ/hooks/agentshield-gate.sh"
safe_copy "$TEMPLATES/hooks/mcp-pre-exec.sh" "$PROJ/hooks/mcp-pre-exec.sh"
chmod +x "$PROJ/hooks/"*.sh

# --- .claude/settings.json (committable, $CLAUDE_PROJECT_DIR 사용) ---
safe_copy "$TEMPLATES/settings.json" "$PROJ/settings.json"

# --- .mcp.json (프로젝트 MCP, Track별 동적 조립) ---
if [ -f .mcp.json ]; then
  warn ".mcp.json 이미 존재 — 사용자 추가 항목 보존 위해 생성 스킵"
elif command -v jq &> /dev/null; then
  # 임시 파일 정리 trap
  trap 'rm -f .mcp.json.tmp .mcp.json.tmp2' EXIT

  # 공통 항목 (chrome-devtools, context7, github)
  cp "$TEMPLATES/mcp.json" .mcp.json.tmp

  # Track별 조건부 추가
  case "$TRACK" in
    csr-supabase|csr-fastify|csr-fastapi|ssr-htmx|ssr-nextjs|full)
      jq '.mcpServers["railway-mcp-server"] = {"type":"stdio","command":"npx","args":["-y","@railway/mcp-server"]}' .mcp.json.tmp > .mcp.json.tmp2 \
        && mv .mcp.json.tmp2 .mcp.json.tmp || { fail "jq railway 실패"; exit 1; }
      ;;
  esac
  case "$TRACK" in
    csr-supabase|full)
      jq '.mcpServers["supabase"] = {"type":"stdio","command":"npx","args":["-y","@supabase/mcp-server"]}' .mcp.json.tmp > .mcp.json.tmp2 \
        && mv .mcp.json.tmp2 .mcp.json.tmp || { fail "jq supabase 실패"; exit 1; }
      ;;
  esac

  # _comment 제거하고 최종 .mcp.json 생성
  jq 'del(._comment)' .mcp.json.tmp > .mcp.json || { fail "jq finalize 실패"; exit 1; }
  rm -f .mcp.json.tmp
  trap - EXIT
  info "Created: .mcp.json (Track-aware, 글로벌 mcp add 없음)"
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
if [ "$TRACK" != "executive" ]; then
  echo -n "  agent-skills plugin..."
  claude plugin marketplace add addyosmani/agent-skills 2>/dev/null || true
  claude plugin install agent-skills@addy-agent-skills 2>/dev/null && info "installed" || warn "already installed or manual install needed"
fi

# ECC plugin — 순정 설치 (agents + skills + commands 자동. rules는 플러그인 미지원이라 safe_copy 유지)
if [ "$TRACK" != "executive" ]; then
  echo -n "  ECC (everything-claude-code) plugin..."
  claude plugin marketplace add affaan-m/everything-claude-code 2>/dev/null || true
  claude plugin install everything-claude-code@everything-claude-code 2>/dev/null && info "installed" || warn "already installed or manual install needed"
fi

# Railway plugin (MCP는 .mcp.json으로 이관됨)
if [ "$TRACK" != "executive" ]; then
  echo -n "  Railway plugin..."
  claude plugin marketplace add railwayapp/railway-plugin 2>/dev/null || true
  claude plugin install railway-plugin@railway-plugin 2>/dev/null && info "installed" || warn "already installed or manual install needed"
fi

# Impeccable (UI tracks)
case "$TRACK" in
  csr-*|ssr-*|full)
    echo -n "  Impeccable..."
    npx skills add pbakaus/impeccable --yes 2>/dev/null && info "installed" || warn "already installed"
    ;;
esac

# Playwright (모든 dev Track 공통, 이전 UI 한정에서 이동)
if [ "$TRACK" != "executive" ]; then
  echo -n "  Playwright skill..."
  npx skills add testdino-hq/playwright-skill --yes 2>/dev/null && info "installed" || warn "already installed"
fi

# 공통 도구 (Phase 4b 신규)
if [ "$TRACK" != "executive" ]; then
  echo -n "  find-skills (vercel-labs)..."
  npx skills add vercel-labs/skills --skill find-skills --yes 2>/dev/null && info "installed" || warn "already installed"

  echo -n "  agent-browser..."
  if command -v agent-browser &> /dev/null; then
    info "already installed"
  else
    npm install -g agent-browser 2>/dev/null && info "installed" || install_fail "agent-browser"
  fi

  echo -n "  architecture-decision-record..."
  npx skills add yonatangross/orchestkit --skill architecture-decision-record --yes 2>/dev/null && info "installed" || warn "already installed"
fi

# Supabase MCP는 .mcp.json으로 이관됨 (claude mcp add 제거)

# Supabase agent-skills (csr-supabase 전용 + full) — D23
case "$TRACK" in
  csr-supabase|full)
    echo -n "  Supabase agent-skills..."
    claude plugin marketplace add supabase/agent-skills 2>/dev/null || true
    claude plugin install supabase@supabase-agent-skills 2>/dev/null && info "installed" || warn "already installed or manual install needed"

    echo -n "  Supabase postgres-best-practices..."
    claude plugin install postgres-best-practices@supabase-agent-skills 2>/dev/null && info "installed" || warn "already installed or manual install needed"
    ;;
esac

case "$TRACK" in
  csr-*|ssr-nextjs|full)
    echo -n "  react-best-practices..."
    npx skills add vercel-labs/agent-skills --skill react-best-practices --yes 2>/dev/null && info "installed" || warn "already installed"

    echo -n "  shadcn-ui..."
    npx skills add shadcn/ui --yes 2>/dev/null && info "installed" || warn "already installed"

    echo -n "  web-design-guidelines..."
    npx skills add vercel-labs/agent-skills --skill web-design-guidelines --yes 2>/dev/null && info "installed" || warn "already installed"
    ;;
esac

case "$TRACK" in
  ssr-nextjs|full)
    echo -n "  next-best-practices..."
    npx skills add vercel-labs/next-skills --yes 2>/dev/null && info "installed" || warn "already installed"
    ;;
esac

# Anthropic document-skills + executive plugins
case "$TRACK" in
  executive|full)
    echo -n "  Anthropic document-skills..."
    claude plugin marketplace add anthropics/skills 2>/dev/null || true
    claude plugin install document-skills@anthropic-agent-skills 2>/dev/null && info "installed" || warn "already installed or manual install needed"

    echo -n "  c-level-skills..."
    claude plugin marketplace add alirezarezvani/c-level-skills 2>/dev/null || true
    claude plugin install c-level-skills@c-level-skills 2>/dev/null && info "installed" || warn "already installed or manual install needed"

    echo -n "  finance-skills..."
    claude plugin marketplace add alirezarezvani/finance-skills 2>/dev/null || true
    claude plugin install finance-skills@finance-skills 2>/dev/null && info "installed" || warn "already installed or manual install needed"
    ;;
esac

# GSD (optional)
if [ "$GSD" = true ]; then
  echo -n "  GSD..."
  npx get-shit-done-cc@latest 2>/dev/null && info "installed" || install_fail "GSD"
fi

# Optional: Advanced plugins (interactive only)
if [ "$TRACK" != "executive" ] && [ -t 0 ]; then
  echo ""
  echo -e "  ${BOLD}Optional Plugins:${NC}"
  read -rp "  Install cc-devops-skills (CI/CD, Docker, GitHub Actions)? [y/N]: " DEVOPS_ANSWER
  if [[ "$DEVOPS_ANSWER" =~ ^[Yy]$ ]]; then
    echo -n "  cc-devops-skills..."
    claude plugin marketplace add akin-ozer/cc-devops-skills 2>/dev/null || true
    claude plugin install cc-devops-skills@cc-devops-skills 2>/dev/null && info "installed" || install_fail "cc-devops-skills"
  fi

  read -rp "  Install Trail of Bits security (CodeQL, Semgrep)? [y/N]: " TOB_ANSWER
  if [[ "$TOB_ANSWER" =~ ^[Yy]$ ]]; then
    echo -n "  Trail of Bits security..."
    claude plugin marketplace add trailofbits/skills 2>/dev/null || true
    claude plugin install trailofbits-skills@trailofbits-skills 2>/dev/null && info "installed" || install_fail "Trail of Bits"
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

# Executive check
if [ "$TRACK" = "executive" ]; then
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

# Summary
echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}  Setup Complete — $TRACK${NC}"
  echo -e "${GREEN}========================================${NC}"
else
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}  Setup Complete with $ERRORS warning(s)${NC}"
  echo -e "${YELLOW}========================================${NC}"
fi

# === 설치 결과 검증 테이블 ===
echo ""
echo -e "${BOLD}┌─────────────────────────────────────────────────┐${NC}"
echo -e "${BOLD}│  Installation Report — $TRACK${NC}"
echo -e "${BOLD}├─────────────────┬──────────┬──────────┬─────────┤${NC}"
printf  "${BOLD}│ %-15s │ %-8s │ %-8s │ %-7s │${NC}\n" "Category" "Found" "Expected" "Status"
echo -e "${BOLD}├─────────────────┼──────────┼──────────┼─────────┤${NC}"

# Rules
RULES_FOUND=$(ls "$PROJ/rules/"*.md 2>/dev/null | wc -l | tr -d ' ')
case "$TRACK" in
  executive) RULES_EXPECTED=3 ;;
  tooling) RULES_EXPECTED=12 ;;
  data) RULES_EXPECTED=13 ;;
  ssr-htmx) RULES_EXPECTED=14 ;;
  csr-supabase|ssr-nextjs) RULES_EXPECTED=15 ;;
  csr-fastify|csr-fastapi) RULES_EXPECTED=16 ;;
  full) RULES_EXPECTED=22 ;;
  *) RULES_EXPECTED=16 ;;
esac
RULES_STATUS=$([ "$RULES_FOUND" -ge "$RULES_EXPECTED" ] && echo "${GREEN}✅${NC}" || echo "${RED}❌${NC}")
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Rules" "$RULES_FOUND" "$RULES_EXPECTED" "$RULES_STATUS"

# Commands
UZYS_FOUND=$(ls "$PROJ/commands/uzys/"*.md 2>/dev/null | wc -l | tr -d ' ')
ECC_FOUND=$(ls "$PROJ/commands/ecc/"*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$TRACK" = "executive" ]; then UZYS_EXP=0; else UZYS_EXP=7; fi  # 6 + auto
ECC_EXP=10
UZYS_STATUS=$([ "$UZYS_FOUND" -ge "$UZYS_EXP" ] && echo "${GREEN}✅${NC}" || echo "${RED}❌${NC}")
ECC_STATUS=$([ "$ECC_FOUND" -ge "$ECC_EXP" ] && echo "${GREEN}✅${NC}" || echo "${RED}❌${NC}")
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Commands uzys:" "$UZYS_FOUND" "$UZYS_EXP" "$UZYS_STATUS"
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Commands ecc:" "$ECC_FOUND" "$ECC_EXP" "$ECC_STATUS"

# Agents
AGENTS_FOUND=$(ls "$PROJ/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$TRACK" = "executive" ]; then AGENTS_EXP=5; else AGENTS_EXP=8; fi
AGENTS_STATUS=$([ "$AGENTS_FOUND" -ge "$AGENTS_EXP" ] && echo "${GREEN}✅${NC}" || echo "${RED}❌${NC}")
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Agents" "$AGENTS_FOUND" "$AGENTS_EXP" "$AGENTS_STATUS"

# Hooks
HOOKS_FOUND=$(ls "$PROJ/hooks/"*.sh 2>/dev/null | wc -l | tr -d ' ')
HOOKS_EXP=9
HOOKS_STATUS=$([ "$HOOKS_FOUND" -ge "$HOOKS_EXP" ] && echo "${GREEN}✅${NC}" || echo "${RED}❌${NC}")
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "Hooks" "$HOOKS_FOUND" "$HOOKS_EXP" "$HOOKS_STATUS"

# Skills
SKILLS_FOUND=$(find "$PROJ/skills" -maxdepth 2 -name "SKILL.md" -o -name "config.json" 2>/dev/null | xargs -I{} dirname {} | sort -u | wc -l | tr -d ' ')
if [ "$TRACK" = "executive" ]; then SKILLS_EXP=5; else SKILLS_EXP=7; fi
SKILLS_STATUS=$([ "$SKILLS_FOUND" -ge "$SKILLS_EXP" ] && echo "${GREEN}✅${NC}" || echo "${RED}❌${NC}")
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
MCP_STATUS=$([ "$MCP_FOUND" != "?" ] && [ "$MCP_FOUND" -ge "$MCP_EXP" ] && echo "${GREEN}✅${NC}" || echo "${YELLOW}⚠️${NC}")
printf "│ %-15s │ %-8s │ %-8s │ %b       │\n" "MCP servers" "$MCP_FOUND" "$MCP_EXP" "$MCP_STATUS"

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
echo -e "  Track: ${BOLD}$TRACK${NC}"
echo -e "  GSD: $([ "$GSD" = true ] && echo "yes" || echo "no")"
echo -e "  Model Routing: $([ "$MODEL_ROUTING" = "on" ] && echo "on" || echo "off (default)")"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo -e "  1. Start Claude Code: ${CYAN}claude${NC}"
echo -e "  2. Begin workflow:    ${CYAN}/uzys:spec${NC}"
echo -e "  3. Auto workflow:     ${CYAN}/uzys:auto${NC} (spec 완료 후)"
echo ""
