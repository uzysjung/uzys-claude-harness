#!/bin/bash
# ============================================================
# bootstrap-dev.sh
# 이 하네스 시스템을 개발하기 위한 Claude Code 환경 셋팅
# 
# 용도: Claude Code가 REQUIREMENTS.md를 구현할 때 필요한 
#       도구/MCP/플러그인을 먼저 설치하는 스크립트
# 실행: bash bootstrap-dev.sh
# ============================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Harness Dev Environment Bootstrap${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# ============================================================
# Step 1: 기본 도구 확인
# ============================================================
echo -e "${YELLOW}[1/5] 기본 도구 확인${NC}"

check_cmd() {
  if command -v "$1" &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} $1 $(command -v $1)"
  else
    echo -e "  ${RED}✗${NC} $1 — 설치 필요"
    return 1
  fi
}

check_cmd node || { echo -e "${RED}Node.js 22+ 필요. https://nodejs.org${NC}"; exit 1; }
check_cmd npm
check_cmd npx
check_cmd git
check_cmd claude || { echo -e "${RED}Claude Code 필요. https://code.claude.com${NC}"; exit 1; }

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 22 ]; then
  echo -e "  ${RED}✗${NC} Node.js $NODE_VER → 22+ 필요"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js v$(node -v | sed 's/v//') (≥22 OK)"

echo ""

# ============================================================
# Step 2: MCP 서버 설치 (구현 시 필요한 것)
# ============================================================
echo -e "${YELLOW}[2/5] MCP 서버 설치${NC}"

# GitHub MCP — 두 private 리포(std-dev-boilerplate, dyld-vantage) 접근에 필수
echo -n "  GitHub MCP..."
claude mcp add github -- npx -y @modelcontextprotocol/server-github 2>/dev/null && echo -e " ${GREEN}✓${NC}" || echo -e " ${YELLOW}이미 설치됨${NC}"

# Context7 — 외부 라이브러리 문서 참조
echo -n "  Context7..."
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest 2>/dev/null && echo -e " ${GREEN}✓${NC}" || echo -e " ${YELLOW}이미 설치됨${NC}"

# claude-code-statusline — 상태표시줄
echo -n "  statusline..."
if [ ! -d ".dev-references/claude-code-statusline" ]; then
  git clone --depth 1 https://github.com/kcchien/claude-code-statusline.git .dev-references/claude-code-statusline 2>/dev/null
  cd .dev-references/claude-code-statusline && ./install.sh 2>/dev/null && cd - > /dev/null
  echo -e " ${GREEN}✓${NC}"
else
  echo -e " ${YELLOW}이미 설치됨${NC}"
fi

echo ""

# ============================================================
# Step 2.5: settings.json 설정
# ============================================================
echo -e "${YELLOW}[2.5/5] settings.json 설정${NC}"

SETTINGS_FILE="$HOME/.claude/settings.json"
mkdir -p "$HOME/.claude"

if [ -f "$SETTINGS_FILE" ]; then
  echo -e "  ${YELLOW}기존 settings.json 발견. 수동 확인 필요:${NC}"
  echo -e "  ${CYAN}아래 설정이 포함되어 있는지 확인하세요:${NC}"
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
  echo -e "  ${GREEN}✓${NC} settings.json 생성"
fi

echo -e "  필수 설정:"
echo -e "    ${CYAN}\"defaultMode\": \"bypassPermissions\"${NC}"
echo -e "    ${CYAN}\"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS\": \"1\"${NC}"
echo -e "    ${CYAN}\"teammateMode\": \"tmux\"${NC}"

echo ""

# ============================================================
# Step 3: 구현에 참조할 플러그인/스킬 사전 설치
# Claude Code가 이것들의 구조를 파악해서 setup-harness.sh를 작성해야 함
# ============================================================
echo -e "${YELLOW}[3/5] 참조용 플러그인/스킬 설치${NC}"
echo -e "  ${CYAN}(Claude Code가 구조를 파악하기 위해 먼저 설치)${NC}"

# agent-skills — 워크플로우 뼈대. 스킬 구조를 읽어서 커맨드 연계 설계에 참조
echo -n "  agent-skills 플러그인..."
claude plugin marketplace add addyosmani/agent-skills 2>/dev/null || true
claude plugin install agent-skills@addy-agent-skills 2>/dev/null && echo -e " ${GREEN}✓${NC}" || echo -e " ${YELLOW}이미 설치됨 또는 수동 설치 필요${NC}"

# Anthropic 공식 스킬 — document-skills 구조 참조
echo -n "  Anthropic skills..."
claude plugin marketplace add anthropics/skills 2>/dev/null || true
claude plugin install document-skills@anthropic-agent-skills 2>/dev/null && echo -e " ${GREEN}✓${NC}" || echo -e " ${YELLOW}이미 설치됨 또는 수동 설치 필요${NC}"

# Impeccable — 디자인 워크플로우 구조 참조
echo -n "  Impeccable..."
npx skills add pbakaus/impeccable 2>/dev/null && echo -e " ${GREEN}✓${NC}" || echo -e " ${YELLOW}이미 설치됨${NC}"

# Railway 플러그인 — 배포 워크플로우 참조
echo -n "  Railway 플러그인..."
claude plugin marketplace add railwayapp/railway-plugin 2>/dev/null || true
claude plugin install railway-plugin@railway-plugin 2>/dev/null && echo -e " ${GREEN}✓${NC}" || echo -e " ${YELLOW}이미 설치됨 또는 수동 설치 필요${NC}"

# Railway MCP
echo -n "  Railway MCP..."
claude mcp add railway-mcp-server -- npx -y @railway/mcp-server 2>/dev/null && echo -e " ${GREEN}✓${NC}" || echo -e " ${YELLOW}이미 설치됨${NC}"

echo ""

# ============================================================
# Step 4: ECC cherry-pick 대상 확인용 클론
# Claude Code가 ECC 리포에서 6개 파일을 식별하기 위해 필요
# ============================================================
echo -e "${YELLOW}[4/5] ECC 리포 클론 (cherry-pick 참조용)${NC}"

ECC_DIR=".dev-references/ecc"
if [ -d "$ECC_DIR" ]; then
  echo -e "  ${YELLOW}이미 존재: $ECC_DIR — pull${NC}"
  cd "$ECC_DIR" && git pull --quiet && cd - > /dev/null
else
  echo -n "  클론 중..."
  mkdir -p .dev-references
  git clone --depth 1 https://github.com/affaan-m/everything-claude-code.git "$ECC_DIR" 2>/dev/null && echo -e " ${GREEN}✓${NC}" || echo -e " ${RED}실패 — 수동 클론 필요${NC}"
fi

# GSD도 참조용 클론
GSD_DIR=".dev-references/gsd"
if [ -d "$GSD_DIR" ]; then
  echo -e "  ${YELLOW}이미 존재: $GSD_DIR — pull${NC}"
  cd "$GSD_DIR" && git pull --quiet && cd - > /dev/null
else
  echo -n "  GSD 클론 중..."
  git clone --depth 1 https://github.com/gsd-build/get-shit-done.git "$GSD_DIR" 2>/dev/null && echo -e " ${GREEN}✓${NC}" || echo -e " ${RED}실패 — 수동 클론 필요${NC}"
fi

# agent-skills도 참조용 클론 (플러그인과 별도로 소스 직접 읽기 위해)
AS_DIR=".dev-references/agent-skills"
if [ -d "$AS_DIR" ]; then
  echo -e "  ${YELLOW}이미 존재: $AS_DIR — pull${NC}"
  cd "$AS_DIR" && git pull --quiet && cd - > /dev/null
else
  echo -n "  agent-skills 클론 중..."
  git clone --depth 1 https://github.com/addyosmani/agent-skills.git "$AS_DIR" 2>/dev/null && echo -e " ${GREEN}✓${NC}" || echo -e " ${RED}실패 — 수동 클론 필요${NC}"
fi

echo ""

# ============================================================
# Step 5: 프로젝트 구조 확인
# ============================================================
echo -e "${YELLOW}[5/5] 프로젝트 파일 확인${NC}"

check_file() {
  if [ -f "$1" ]; then
    echo -e "  ${GREEN}✓${NC} $1"
  else
    echo -e "  ${RED}✗${NC} $1 — 없음"
  fi
}

check_file "REQUIREMENTS.md"
check_file "references/AGENT-GUIDELINES-reference.md"
check_file "references/PRD-LIFECYCLE.md"
check_file "references/PRD-TEMPLATE-standalone.md"

echo ""

# ============================================================
# .gitignore 업데이트
# ============================================================
if ! grep -q ".dev-references" .gitignore 2>/dev/null; then
  echo ".dev-references/" >> .gitignore
  echo -e "  ${GREEN}✓${NC} .gitignore에 .dev-references/ 추가"
fi

# ============================================================
# 완료
# ============================================================
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Bootstrap 완료${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "설치된 것:"
echo -e "  MCP: GitHub, Context7, Railway"
echo -e "  플러그인: agent-skills, Anthropic skills, Railway"
echo -e "  스킬: Impeccable"
echo -e "  참조: .dev-references/ (ECC, GSD, agent-skills 소스)"
echo ""
echo -e "${YELLOW}다음 단계:${NC}"
echo -e "  1. Claude Code 실행: ${CYAN}claude${NC}"
echo -e "  2. 지시: ${CYAN}REQUIREMENTS.md를 읽고 구현해.${NC}"
echo -e "     ${CYAN}references/ 폴더는 참조용.${NC}"
echo -e "     ${CYAN}.dev-references/에 ECC, GSD, agent-skills 소스가 있다.${NC}"
echo -e "     ${CYAN}<YOUR_BOILERPLATE_REPO>와 <YOUR_REFERENCE_REPO>는${NC}"
echo -e "     ${CYAN}GitHub MCP로 접근해서 기존 Rules를 확인해라.${NC}"
echo ""
