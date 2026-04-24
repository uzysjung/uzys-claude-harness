#!/usr/bin/env bash
# scripts/claude-to-codex.sh — Claude Code SSOT → Codex 프로젝트 자산 변환
#
# Usage:
#   scripts/claude-to-codex.sh OUTPUT_DIR [--source-dir DIR] [-v|--verbose]
#
# OUTPUT_DIR: Codex 프로젝트 파일을 배치할 대상 디렉토리 (AGENTS.md + .codex/ 생성)
# --source-dir: 본 repo 루트. 기본값은 스크립트 기준 상위 디렉토리.
#
# 생성 파일:
#   <OUTPUT_DIR>/AGENTS.md                   (templates/CLAUDE.md 기반)
#   <OUTPUT_DIR>/.codex/config.toml          (templates/codex/config.toml.template)
#   <OUTPUT_DIR>/.codex/hooks/*.sh           (templates/hooks/ 포팅)
#   <OUTPUT_DIR>/.codex-skills/uzys-*/SKILL.md  (templates/commands/uzys/*.md 포팅)
#
# 참조:
#   - docs/specs/codex-compat.md Phase C
#   - docs/decisions/ADR-002-codex-hook-gap.md v2 D1~D5

set -eu
set -o pipefail

# ---------- Arg parsing ----------
OUTPUT_DIR=""
SOURCE_DIR=""
VERBOSE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --source-dir)
      [ -z "${2:-}" ] && { echo "ERROR: --source-dir requires value" >&2; exit 1; }
      SOURCE_DIR="$2"; shift 2
      ;;
    -v|--verbose) VERBOSE=1; shift ;;
    -h|--help)
      sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    -*)
      echo "ERROR: unknown flag: $1" >&2; exit 1
      ;;
    *)
      if [ -z "$OUTPUT_DIR" ]; then
        OUTPUT_DIR="$1"
      else
        echo "ERROR: unexpected arg: $1" >&2; exit 1
      fi
      shift
      ;;
  esac
done

[ -z "$OUTPUT_DIR" ] && { echo "ERROR: OUTPUT_DIR required. See --help." >&2; exit 1; }

if [ -z "$SOURCE_DIR" ]; then
  SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
fi

CLAUDE_MD="$SOURCE_DIR/templates/CLAUDE.md"
TEMPLATE_DIR="$SOURCE_DIR/templates/codex"
CMDS_DIR="$SOURCE_DIR/templates/commands/uzys"
HOOKS_DIR="$SOURCE_DIR/templates/hooks"
MCP_JSON="$SOURCE_DIR/.mcp.json"

# Pre-flight checks
for required in "$CLAUDE_MD" "$TEMPLATE_DIR/AGENTS.md.template" "$TEMPLATE_DIR/config.toml.template"; do
  [ -f "$required" ] || { echo "ERROR: source missing: $required" >&2; exit 1; }
done

mkdir -p "$OUTPUT_DIR/.codex/hooks"

log() { [ "$VERBOSE" = 1 ] && echo "    $*" >&2 || true; }
info() { echo "$*" >&2; }

# ---------- 1. AGENTS.md ----------
info "[1/5] AGENTS.md"

# Resolve project name + absolute path
if command -v realpath >/dev/null 2>&1; then
  PROJECT_ABS="$(realpath "$OUTPUT_DIR")"
else
  PROJECT_ABS="$(cd "$OUTPUT_DIR" && pwd)"
fi
PROJECT_NAME="$(basename "$PROJECT_ABS")"

# Extract sections from CLAUDE.md to temp files (multiline-safe)
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

extract_section() {
  src="$1"; heading="$2"; dst="$3"
  awk -v h="^## ${heading}" '
    $0 ~ h { flag=1; next }
    flag && /^## / { exit }
    flag { print }
  ' "$src" > "$dst"
}

extract_section "$CLAUDE_MD" "Identity" "$TMP_DIR/id.txt"
extract_section "$CLAUDE_MD" "Project Direction" "$TMP_DIR/di.txt"
extract_section "$CLAUDE_MD" "Core Principles" "$TMP_DIR/pr.txt"

# Substitute multiline placeholders via awk (portable)
awk -v name="$PROJECT_NAME" \
    -v id_file="$TMP_DIR/id.txt" \
    -v di_file="$TMP_DIR/di.txt" \
    -v pr_file="$TMP_DIR/pr.txt" '
  function inject(f,   line) {
    while ((getline line < f) > 0) print line
    close(f)
  }
  {
    gsub(/\{PROJECT_NAME\}/, name)
    if (index($0, "{IDENTITY_SECTION}")) { inject(id_file); next }
    if (index($0, "{PROJECT_DIRECTION_SECTION}")) { inject(di_file); next }
    if (index($0, "{CORE_PRINCIPLES_SECTION}")) { inject(pr_file); next }
    print
  }
' "$TEMPLATE_DIR/AGENTS.md.template" > "$TMP_DIR/agents.md"

# Slash rename: /uzys: → /uzys-
sed 's|/uzys:|/uzys-|g' "$TMP_DIR/agents.md" > "$OUTPUT_DIR/AGENTS.md"
log "wrote $OUTPUT_DIR/AGENTS.md"

# ---------- 2. config.toml ----------
info "[2/5] .codex/config.toml"
sed -e "s|{PROJECT_NAME}|$PROJECT_NAME|g" \
    -e "s|{PROJECT_DIR}|$PROJECT_ABS|g" \
    "$TEMPLATE_DIR/config.toml.template" > "$OUTPUT_DIR/.codex/config.toml"
log "wrote $OUTPUT_DIR/.codex/config.toml"

# ---------- 3. hooks ----------
info "[3/5] .codex/hooks/*.sh"
# Port subset: session-start, hito-counter, gate-check
# protect-files.sh → Codex sandbox 이관 (ADR-002 v2 D3). Skip.
# agentshield-gate.sh / mcp-pre-exec.sh → 후속 Phase (현재 범위 밖)
for hook in session-start hito-counter gate-check; do
  src="$HOOKS_DIR/${hook}.sh"
  dst="$OUTPUT_DIR/.codex/hooks/${hook}.sh"
  if [ -f "$src" ]; then
    # env var rename: CLAUDE_PROJECT_DIR → CODEX_PROJECT_DIR (identifier only)
    # shellcheck disable=SC2016
    sed 's|CLAUDE_PROJECT_DIR|CODEX_PROJECT_DIR|g' "$src" > "$dst"
    chmod +x "$dst"
    log "ported hook ${hook}.sh"
  else
    echo "WARN: source hook not found: $src" >&2
  fi
done

# ---------- 4. skills ----------
info "[4/5] .codex-skills/uzys-*/"
for phase in spec plan build test review ship; do
  src="$CMDS_DIR/${phase}.md"
  dst_dir="$OUTPUT_DIR/.codex-skills/uzys-${phase}"
  mkdir -p "$dst_dir"

  if [ -f "$src" ]; then
    # Detect frontmatter: first line === "---"
    first_line="$(head -n 1 "$src")"
    if [ "$first_line" = "---" ]; then
      # YAML frontmatter present
      desc="$(awk '/^description:/{
        sub(/^description: *"?/, "")
        sub(/"$/, "")
        print
        exit
      }' "$src")"
      body_start="$(awk '/^---$/{n++; if(n==2){print NR+1; exit}}' "$src")"
      [ -z "$body_start" ] && body_start=1
    else
      # No frontmatter: first non-empty line = description, body = full file
      desc="$first_line"
      body_start=1
    fi
    [ -z "$desc" ] && desc="uzys-${phase} phase skill (Codex 포팅)"
    # Escape double-quotes for YAML
    desc_escaped="$(printf '%s' "$desc" | sed 's/"/\\"/g')"

    {
      echo "---"
      echo "name: uzys-${phase}"
      echo "description: \"$desc_escaped\""
      echo "---"
      echo ""
      tail -n "+${body_start}" "$src" | sed 's|/uzys:|/uzys-|g'
    } > "$dst_dir/SKILL.md"
    log "ported skill uzys-${phase}"
  else
    echo "WARN: source command not found: $src" >&2
    # Fallback to Phase B skeleton
    if [ -f "$TEMPLATE_DIR/skills/uzys-${phase}/SKILL.md" ]; then
      cp "$TEMPLATE_DIR/skills/uzys-${phase}/SKILL.md" "$dst_dir/SKILL.md"
    fi
  fi
done

# ---------- 5. MCP servers (merge into config.toml) ----------
info "[5/5] MCP servers → config.toml"
if [ -f "$MCP_JSON" ] && command -v jq >/dev/null 2>&1; then
  tmp_mcp="$TMP_DIR/mcp.toml"
  jq -r '
    .mcpServers // {} | to_entries[] |
    "\n[mcp_servers.\(.key)]\ncommand = \"\(.value.command)\"\nargs = \(.value.args // [] | @json)" +
    (if (.value.env // null) != null and (.value.env | length) > 0 then
      "\nenv = { " + (.value.env | to_entries | map("\(.key) = \"\(.value)\"") | join(", ")) + " }"
     else "" end)
  ' "$MCP_JSON" > "$tmp_mcp"

  # Strip existing [mcp_servers.*] blocks and surrounding comments from template
  tmp_cfg="$TMP_DIR/config.toml"
  awk '
    /^# MCP Servers — / { skip_section=1; next }
    /^# MCP Servers/ && !/—/ { skip_section=1; next }
    skip_section && /^# ====/ { skip_section=0; next }
    /^\[mcp_servers\./ { skip_block=1; next }
    skip_block && /^\[/ && !/^\[mcp_servers\./ { skip_block=0 }
    skip_block { next }
    /^# \[mcp_servers\./ { skip_comment=1; next }
    skip_comment && /^# / { next }
    skip_comment { skip_comment=0 }
    { print }
  ' "$OUTPUT_DIR/.codex/config.toml" > "$tmp_cfg"

  # Append fresh MCP section
  {
    cat "$tmp_cfg"
    echo ""
    echo "# ============================================================"
    echo "# MCP Servers — generated from .mcp.json ($(date +%F))"
    echo "# ============================================================"
    cat "$tmp_mcp"
  } > "$OUTPUT_DIR/.codex/config.toml"

  log "merged MCP servers from $MCP_JSON"
else
  log ".mcp.json not found or jq missing; using template defaults only"
fi

info ""
info "✓ Transform complete → $OUTPUT_DIR"
info "  - AGENTS.md"
info "  - .codex/config.toml"
info "  - .codex/hooks/{session-start,hito-counter,gate-check}.sh"
info "  - .codex-skills/uzys-{spec,plan,build,test,review,ship}/SKILL.md"
info ""
info "Next: setup-harness.sh --cli=codex --project-dir $OUTPUT_DIR (Phase D)"
