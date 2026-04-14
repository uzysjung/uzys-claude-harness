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
PROJECT_DIR="$(pwd)"

while [[ $# -gt 0 ]]; do
  case $1 in
    --track) TRACK="$2"; shift 2 ;;
    --gsd) GSD=true; shift ;;
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 [--track <track>] [--gsd] [--project-dir <path>]"; echo ""; echo "프로젝트 스코프 전용. 글로벌 ~/.claude/는 건드리지 않음."; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
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
COMMON_RULES="git-policy change-management"
DEV_RULES="test-policy commit-policy ship-checklist code-style error-handling ecc-git-workflow ecc-testing"
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

# --- Commands ---
# uzys: commands (dev tracks only)
if [ "$TRACK" != "executive" ]; then
  for cmd in spec plan build test review ship; do
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

# --- Skills (ECC + 자체) ---
safe_copy_dir "$TEMPLATES/skills/continuous-learning-v2" "$PROJ/skills/continuous-learning-v2"
safe_copy_dir "$TEMPLATES/skills/strategic-compact" "$PROJ/skills/strategic-compact"
safe_copy "$TEMPLATES/skills/spec-scaling/SKILL.md" "$PROJ/skills/spec-scaling/SKILL.md"

# --- Hooks ---
safe_copy "$TEMPLATES/hooks/session-start.sh" "$PROJ/hooks/session-start.sh"
safe_copy "$TEMPLATES/hooks/protect-files.sh" "$PROJ/hooks/protect-files.sh"
safe_copy "$TEMPLATES/hooks/gate-check.sh" "$PROJ/hooks/gate-check.sh"
safe_copy "$TEMPLATES/hooks/uncommitted-check.sh" "$PROJ/hooks/uncommitted-check.sh"
chmod +x "$PROJ/hooks/"*.sh

# --- settings.local.json (with absolute paths) ---
PROJECT_ABS="$(pwd)"
cat > "$PROJ/settings.local.json" << SETTINGS
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "bash \"${PROJECT_ABS}/${PROJ}/hooks/session-start.sh\""
      }]
    }],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "bash \"${PROJECT_ABS}/${PROJ}/hooks/protect-files.sh\""
        }]
      },
      {
        "matcher": "Skill",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"${PROJECT_ABS}/${PROJ}/hooks/gate-check.sh\""
          },
          {
            "type": "command",
            "command": "bash \"${PROJECT_ABS}/${PROJ}/hooks/uncommitted-check.sh\""
          }
        ]
      },
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "bash \"${PROJECT_ABS}/${PROJ}/skills/continuous-learning-v2/hooks/observe.sh\" pre",
          "async": true,
          "timeout": 10
        }]
      }
    ],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "bash \"${PROJECT_ABS}/${PROJ}/skills/continuous-learning-v2/hooks/observe.sh\" post",
        "async": true,
        "timeout": 10
      }]
    }]
  }
}
SETTINGS
info "Created: $PROJ/settings.local.json (hooks with absolute paths)"

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

# Railway plugin & MCP (dev tracks)
if [ "$TRACK" != "executive" ]; then
  echo -n "  Railway plugin..."
  claude plugin marketplace add railwayapp/railway-plugin 2>/dev/null || true
  claude plugin install railway-plugin@railway-plugin 2>/dev/null && info "installed" || warn "already installed or manual install needed"

  echo -n "  Railway MCP..."
  claude mcp add railway-mcp-server -- npx -y @railway/mcp-server 2>/dev/null && info "installed" || warn "already installed"
fi

# Impeccable (UI tracks)
case "$TRACK" in
  csr-*|ssr-*|full)
    echo -n "  Impeccable..."
    npx skills add pbakaus/impeccable 2>/dev/null && info "installed" || warn "already installed"

    echo -n "  Playwright skill..."
    npx skills add testdino-hq/playwright-skill 2>/dev/null && info "installed" || warn "already installed"
    ;;
esac

# Track-specific
case "$TRACK" in
  csr-supabase)
    echo -n "  Supabase MCP..."
    claude mcp add supabase -- npx -y @supabase/mcp-server 2>/dev/null && info "installed" || warn "already installed"
    ;;
esac

case "$TRACK" in
  csr-*|ssr-nextjs|full)
    echo -n "  react-best-practices..."
    npx skills add vercel-labs/agent-skills --skill react-best-practices 2>/dev/null && info "installed" || warn "already installed"

    echo -n "  shadcn-ui..."
    npx skills add shadcn/ui 2>/dev/null && info "installed" || warn "already installed"
    ;;
esac

case "$TRACK" in
  ssr-nextjs|full)
    echo -n "  next-best-practices..."
    npx skills add vercel-labs/next-skills 2>/dev/null && info "installed" || warn "already installed"
    ;;
esac

# Anthropic document-skills (executive)
case "$TRACK" in
  executive|full)
    echo -n "  Anthropic document-skills..."
    claude plugin marketplace add anthropics/skills 2>/dev/null || true
    claude plugin install document-skills@anthropic-agent-skills 2>/dev/null && info "installed" || warn "already installed or manual install needed"
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

echo ""
echo -e "Installed:"
echo -e "  Track: ${BOLD}$TRACK${NC}"
echo -e "  Rules: $(ls "$PROJ/rules/"*.md 2>/dev/null | wc -l | tr -d ' ') files"
echo -e "  Commands: uzys($(ls "$PROJ/commands/uzys/"*.md 2>/dev/null | wc -l | tr -d ' ')) ecc($(ls "$PROJ/commands/ecc/"*.md 2>/dev/null | wc -l | tr -d ' '))"
echo -e "  Skills: $(find "$PROJ/skills" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ') skills"
echo -e "  Agents: $(ls "$PROJ/agents/"*.md 2>/dev/null | wc -l | tr -d ' ') project (전부 .claude/agents/, 글로벌 없음)"
echo -e "  GSD: $([ "$GSD" = true ] && echo "yes" || echo "no")"
if [ "$INSTALL_FAILURES" -gt 0 ]; then
  echo ""
  echo -e "  ${RED}Install failures ($INSTALL_FAILURES):${NC}"
  echo -e "$FAILED_ITEMS"
fi
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo -e "  1. Start Claude Code: ${CYAN}claude${NC}"
echo -e "  2. Begin workflow:    ${CYAN}/uzys:spec${NC}"
echo ""
