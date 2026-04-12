#!/bin/bash
# ============================================================
# setup-harness.sh
# Jay's Universal Agent Harness — 프로젝트 초기화 스크립트
#
# 용도: Claude Code 프로젝트에 하네스 시스템을 설치
# 실행: bash setup-harness.sh [--track <track>] [--gsd] [--global-only]
# ============================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES="$SCRIPT_DIR/templates"

# ============================================================
# Argument Parsing
# ============================================================
TRACK=""
GSD=false
GLOBAL_ONLY=false
PROJECT_DIR="$(pwd)"

while [[ $# -gt 0 ]]; do
  case $1 in
    --track) TRACK="$2"; shift 2 ;;
    --gsd) GSD=true; shift ;;
    --global-only) GLOBAL_ONLY=true; shift ;;
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 [--track <track>] [--gsd] [--global-only] [--project-dir <path>]"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ============================================================
# Utility Functions
# ============================================================
info()  { echo -e "  ${GREEN}✓${NC} $1"; }
warn()  { echo -e "  ${YELLOW}!${NC} $1"; }
fail()  { echo -e "  ${RED}✗${NC} $1"; }
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
check_cmd jq || { warn "jq not found. settings.json merge will be skipped. Install: brew install jq"; }

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 22 ]; then
  fail "Node.js $NODE_VER → 22+ required"
  exit 1
fi
info "Node.js v$(node -v | sed 's/v//') (≥22 OK)"

# ============================================================
# Step 1: Global Setup (one-time)
# ============================================================
section "1/7" "Global Setup"

CLAUDE_HOME="$HOME/.claude"
mkdir -p "$CLAUDE_HOME/agents" "$CLAUDE_HOME/backups"

# 1.1 Global CLAUDE.md
safe_copy "$TEMPLATES/global/CLAUDE.md" "$CLAUDE_HOME/CLAUDE.md"

# 1.2 Global Agents
for agent in reviewer data-analyst strategist; do
  safe_copy "$TEMPLATES/global/agents/${agent}.md" "$CLAUDE_HOME/agents/${agent}.md"
done

# 1.3 Global settings.json merge
SETTINGS_FILE="$CLAUDE_HOME/settings.json"
if command -v jq &> /dev/null; then
  if [ -f "$SETTINGS_FILE" ]; then
    cp "$SETTINGS_FILE" "$CLAUDE_HOME/backups/settings.json.$(date +%s)"
    jq '. * {
      "defaultMode": "bypassPermissions",
      "env": ((.env // {}) * {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}),
      "teammateMode": "tmux"
    }' "$SETTINGS_FILE" > /tmp/settings_merged.json
    mv /tmp/settings_merged.json "$SETTINGS_FILE"
    info "settings.json merged (backup saved)"
  else
    cat > "$SETTINGS_FILE" << 'SETTINGS'
{
  "defaultMode": "bypassPermissions",
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "tmux"
}
SETTINGS
    info "settings.json created"
  fi
else
  warn "jq not found — settings.json merge skipped. Add manually:"
  echo '    "defaultMode": "bypassPermissions"'
  echo '    "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }'
  echo '    "teammateMode": "tmux"'
fi

# 1.4 Common Skills
section "1.5/7" "Common Skills Installation"
echo -n "  postgres-best-practices..."
npx skills add supabase/postgres-best-practices 2>/dev/null && info "installed" || warn "already installed or failed"
echo -n "  architecture-decision-record..."
npx skills add yonatangross/orchestkit 2>/dev/null && info "installed" || warn "already installed or failed"

# 1.5 Status Line
echo -n "  claude-code-statusline..."
if [ -d "$SCRIPT_DIR/.dev-references/claude-code-statusline" ]; then
  cd "$SCRIPT_DIR/.dev-references/claude-code-statusline" && ./install.sh 2>/dev/null && cd - > /dev/null
  info "installed"
else
  warn "statusline source not found. Run bootstrap-dev.sh first."
fi

if [ "$GLOBAL_ONLY" = true ]; then
  echo -e "\n${GREEN}Global setup complete.${NC}"
  exit 0
fi

# ============================================================
# Step 2: Track Selection
# ============================================================
section "2/7" "Track Selection"

TRACKS=("csr-supabase" "csr-fastify" "csr-fastapi" "ssr-htmx" "ssr-nextjs" "data" "executive" "full")

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
if [ "$GSD" = false ] && [ "$TRACK" != "executive" ]; then
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
mkdir -p "$PROJ"/{commands/{uzys,ecc,imm},rules,skills,agents,hooks}
mkdir -p docs/decisions

# ============================================================
# Step 5: Install Track-Specific Components
# ============================================================
section "4/7" "Track Components ($TRACK)"

# --- Track → Rule Mapping ---
COMMON_RULES="git-policy change-management"
DEV_RULES="test-policy commit-policy ship-checklist code-style error-handling"
UI_RULES="design-workflow"

declare -A TRACK_EXTRA_RULES
TRACK_EXTRA_RULES[csr-supabase]="tauri shadcn api-contract"
TRACK_EXTRA_RULES[csr-fastify]="tauri shadcn api-contract database"
TRACK_EXTRA_RULES[csr-fastapi]="tauri shadcn api-contract database"
TRACK_EXTRA_RULES[ssr-htmx]="htmx seo"
TRACK_EXTRA_RULES[ssr-nextjs]="nextjs seo shadcn"
TRACK_EXTRA_RULES[data]="pyside6 data-analysis"
TRACK_EXTRA_RULES[executive]=""
TRACK_EXTRA_RULES[full]="tauri shadcn api-contract database htmx seo nextjs pyside6 data-analysis"

# Determine which rules to install
RULES_TO_INSTALL="$COMMON_RULES"
if [ "$TRACK" != "executive" ]; then
  RULES_TO_INSTALL="$RULES_TO_INSTALL $DEV_RULES"
fi
# UI rules for tracks with UI
case "$TRACK" in
  csr-*|ssr-*|full) RULES_TO_INSTALL="$RULES_TO_INSTALL $UI_RULES" ;;
esac
RULES_TO_INSTALL="$RULES_TO_INSTALL ${TRACK_EXTRA_RULES[$TRACK]}"

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

# imm: commands (UI tracks only)
case "$TRACK" in
  csr-*|ssr-*|full)
    for cmd in "$TEMPLATES/commands/imm/"*.md; do
      [ -f "$cmd" ] && safe_copy "$cmd" "$PROJ/commands/imm/$(basename "$cmd")"
    done
    ;;
esac

# --- ECC Cherry-pick ---
safe_copy_dir "$TEMPLATES/skills/continuous-learning-v2" "$PROJ/skills/continuous-learning-v2"
safe_copy "$TEMPLATES/skills/spec-scaling/SKILL.md" "$PROJ/skills/spec-scaling/SKILL.md"
safe_copy "$TEMPLATES/agents/code-reviewer.md" "$PROJ/agents/code-reviewer.md"
safe_copy "$TEMPLATES/agents/security-reviewer.md" "$PROJ/agents/security-reviewer.md"

# --- Hooks ---
safe_copy "$TEMPLATES/hooks/session-start.sh" "$PROJ/hooks/session-start.sh"
safe_copy "$TEMPLATES/hooks/protect-files.sh" "$PROJ/hooks/protect-files.sh"
chmod +x "$PROJ/hooks/session-start.sh" "$PROJ/hooks/protect-files.sh"

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
  npx get-shit-done-cc@latest 2>/dev/null && info "installed" || warn "failed"
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

# V1: Core files exist
for f in "$CLAUDE_HOME/CLAUDE.md" "$CLAUDE_HOME/agents/reviewer.md"; do
  [ -f "$f" ] && info "Global: $(basename "$f")" || { fail "Missing: $f"; ERRORS=$((ERRORS+1)); }
done

# V8: Global CLAUDE.md ≤ 200 lines
LINE_COUNT=$(wc -l < "$CLAUDE_HOME/CLAUDE.md" 2>/dev/null || echo "999")
if [ "$LINE_COUNT" -le 200 ]; then
  info "Global CLAUDE.md: ${LINE_COUNT} lines (≤200)"
else
  fail "Global CLAUDE.md: ${LINE_COUNT} lines (>200 limit!)"
  ERRORS=$((ERRORS+1))
fi

# V2: Executive check
if [ "$TRACK" = "executive" ]; then
  if [ ! -d "$PROJ/commands/uzys" ] || [ -z "$(ls -A "$PROJ/commands/uzys" 2>/dev/null)" ]; then
    info "Executive: agent-skills commands not installed (correct)"
  else
    fail "Executive: uzys commands should not be installed"
    ERRORS=$((ERRORS+1))
  fi
fi

# V9: ECC cherry-pick
[ -d "$PROJ/skills/continuous-learning-v2" ] && info "ECC: CL-v2 skill" || { fail "Missing: CL-v2"; ERRORS=$((ERRORS+1)); }
[ -f "$PROJ/agents/code-reviewer.md" ] && info "ECC: code-reviewer" || { fail "Missing: code-reviewer"; ERRORS=$((ERRORS+1)); }
[ -f "$PROJ/agents/security-reviewer.md" ] && info "ECC: security-reviewer" || { fail "Missing: security-reviewer"; ERRORS=$((ERRORS+1)); }

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
echo -e "  Commands: uzys($(ls "$PROJ/commands/uzys/"*.md 2>/dev/null | wc -l | tr -d ' ')) ecc($(ls "$PROJ/commands/ecc/"*.md 2>/dev/null | wc -l | tr -d ' ')) imm($(ls "$PROJ/commands/imm/"*.md 2>/dev/null | wc -l | tr -d ' '))"
echo -e "  Skills: $(find "$PROJ/skills" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ') skills"
echo -e "  Agents: $(ls "$PROJ/agents/"*.md 2>/dev/null | wc -l | tr -d ' ') project + 3 global"
echo -e "  GSD: $([ "$GSD" = true ] && echo "yes" || echo "no")"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo -e "  1. Start Claude Code: ${CYAN}claude${NC}"
echo -e "  2. Begin workflow:    ${CYAN}/uzys:spec${NC}"
echo ""
