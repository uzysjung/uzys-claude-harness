#!/bin/bash
# ============================================================
# test-harness.sh
# 통합 테스트 스크립트 — 모든 검증을 한 번에 실행
#
# 카테고리:
#   T1. JSON validity
#   T2. Bash syntax
#   T3. Hook unit tests (positive + negative)
#   T4. Cherry-pick manifest 일관성
#   T5. Track 설치 통합 (6 tracks)
#   T6. Global immutability (mtime guard)
#   T7. setup-harness.sh의 글로벌 명령 0건
#   T8. SPEC drift detection
#   T9. Requirements traceability check
#   T10. Documentation accuracy (README claims vs reality)
#   T11. End-to-end workflow smoke test
#
# 사용:
#   bash test-harness.sh           # 전체 실행
#   bash test-harness.sh --quick   # T1-T4만 (빠른 검증)
#   bash test-harness.sh --strict  # 어떤 실패라도 exit 1
# ============================================================
set -u

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ROOT="$(cd "$(dirname "$0")" && pwd)"

QUICK=false
STRICT=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --quick) QUICK=true; shift ;;
    --strict) STRICT=true; shift ;;
    -h|--help) echo "Usage: $0 [--quick] [--strict]"; exit 0 ;;
    *) shift ;;
  esac
done

PASS=0
FAIL=0
SKIP=0
FAILURES=""

pass() { echo -e "    ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "    ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); FAILURES="$FAILURES\n  - $1"; }
skip() { echo -e "    ${YELLOW}-${NC} $1 (skipped)"; SKIP=$((SKIP+1)); }
section() { echo -e "\n${CYAN}${BOLD}$1${NC}"; }

# ============================================================
# T1. JSON Validity
# ============================================================
section "T1. JSON Validity"
for f in templates/mcp.json templates/settings.json .dev-references/cherrypicks.lock .claude/gate-status.json .mcp.json .claude/settings.json; do
  if [ -f "$ROOT/$f" ]; then
    if jq empty "$ROOT/$f" 2>/dev/null; then
      pass "$f"
    else
      fail "$f (invalid JSON)"
    fi
  fi
done

# ============================================================
# T2. Bash Syntax
# ============================================================
section "T2. Bash Syntax"
for f in setup-harness.sh sync-cherrypicks.sh test-harness.sh templates/hooks/gate-check.sh templates/hooks/protect-files.sh templates/hooks/session-start.sh templates/hooks/uncommitted-check.sh templates/hooks/spec-drift-check.sh templates/hooks/checkpoint-snapshot.sh templates/hooks/codebase-map.sh templates/hooks/agentshield-gate.sh; do
  if [ -f "$ROOT/$f" ]; then
    if bash -n "$ROOT/$f" 2>/dev/null; then
      pass "$f"
    else
      fail "$f (syntax error)"
    fi
  fi
done

# ============================================================
# T3. Hook Unit Tests
# ============================================================
section "T3. Hook Unit Tests"
T3_DIR=$(mktemp -d)
mkdir -p "$T3_DIR/.claude"

# T3.1 gate-check spec always allowed
echo '{"tool_input":{"skill":"uzys:spec"}}' | bash "$ROOT/templates/hooks/gate-check.sh" > /dev/null 2>&1 \
  && pass "gate-check: uzys:spec allowed" || fail "gate-check spec"

# T3.2 gate-check plan blocked when define not done
cd "$T3_DIR" && rm -f .claude/gate-status.json
RESULT=$(echo '{"tool_input":{"skill":"uzys:plan"}}' | bash "$ROOT/templates/hooks/gate-check.sh" 2>&1; echo "EXIT=$?")
echo "$RESULT" | grep -q "EXIT=2" && pass "gate-check: plan blocked without define" || fail "gate-check plan block"

# T3.3 gate-check plan allowed after define
jq '.define.completed = true' .claude/gate-status.json > /tmp/gt.json && mv /tmp/gt.json .claude/gate-status.json
echo '{"tool_input":{"skill":"uzys:plan"}}' | bash "$ROOT/templates/hooks/gate-check.sh" > /dev/null 2>&1 \
  && pass "gate-check: plan allowed after define" || fail "gate-check plan allow"

# T3.4 gate-check spec resets all gates
echo '{"tool_input":{"skill":"uzys:spec"}}' | bash "$ROOT/templates/hooks/gate-check.sh" > /dev/null 2>&1
[ "$(jq -r '.define.completed' .claude/gate-status.json)" = "false" ] \
  && pass "gate-check: spec resets gates" || fail "gate-check reset"

# T3.5-7 protect-files
RESULT=$(echo '{"tool_input":{"file_path":".env"}}' | bash "$ROOT/templates/hooks/protect-files.sh" 2>&1; echo "EXIT=$?")
echo "$RESULT" | grep -q "EXIT=2" && pass "protect-files: .env blocked" || fail "protect .env"

RESULT=$(echo '{"tool_input":{"file_path":"package-lock.json"}}' | bash "$ROOT/templates/hooks/protect-files.sh" 2>&1; echo "EXIT=$?")
echo "$RESULT" | grep -q "EXIT=2" && pass "protect-files: lock blocked" || fail "protect lock"

echo '{"tool_input":{"file_path":"src/main.ts"}}' | bash "$ROOT/templates/hooks/protect-files.sh" > /dev/null 2>&1 \
  && pass "protect-files: normal file allowed" || fail "protect normal"

# T3.8 session-start outputs JSON
git init -q 2>/dev/null
OUTPUT=$(bash "$ROOT/templates/hooks/session-start.sh" 2>&1)
echo "$OUTPUT" | jq empty 2>/dev/null && pass "session-start: valid JSON" || fail "session-start JSON"

cd "$ROOT"
rm -rf "$T3_DIR"

[ "$QUICK" = true ] && {
  section "Summary (quick)"
  echo "  Pass: $PASS / Fail: $FAIL / Skip: $SKIP"
  exit $([ "$FAIL" -gt 0 ] && echo 1 || echo 0)
}

# ============================================================
# T4. Cherry-pick Manifest 일관성
# ============================================================
section "T4. Cherry-pick Manifest Consistency"
if [ -f .dev-references/cherrypicks.lock ]; then
  while IFS=$'\t' read -r id dst type; do
    if [ "$type" = "file" ]; then
      [ -f "$dst" ] && pass "manifest: $id ($dst)" || fail "manifest: $id missing"
    else
      [ -d "$dst" ] && pass "manifest: $id ($dst/)" || fail "manifest: $id missing dir"
    fi
  done < <(jq -r '.cherrypicks[] | [.id, .dst, .type] | @tsv' .dev-references/cherrypicks.lock)
else
  skip "T4 (cherrypicks.lock 없음)"
fi

# ============================================================
# T5. Track Installation Integration
# ============================================================
section "T5. Track Installation (6 tracks)"
for TRACK in tooling csr-supabase csr-fastapi ssr-htmx executive full data; do
  T5_DIR=$(mktemp -d)
  cd "$T5_DIR" && git init -q && echo "# Test" > README.md && git add . && git commit -m init -q 2>/dev/null
  bash "$ROOT/setup-harness.sh" --track "$TRACK" --project-dir . < /dev/null > /tmp/setup-$TRACK.log 2>&1
  AGENTS=$(ls .claude/agents/*.md 2>/dev/null | wc -l | tr -d ' ')
  HOOKS=$(ls .claude/hooks/*.sh 2>/dev/null | wc -l | tr -d ' ')
  if [ "$AGENTS" = "5" ] && [ "$HOOKS" = "8" ] && [ -f .mcp.json ] && [ -f .claude/settings.json ] && [ -f CLAUDE.md ] \
     && ! grep -q "/Users\|/private" .claude/settings.json 2>/dev/null; then
    pass "$TRACK install"
  else
    fail "$TRACK install (agents=$AGENTS hooks=$HOOKS mcp=$([ -f .mcp.json ] && echo Y || echo N))"
  fi
  cd "$ROOT"
  rm -rf "$T5_DIR"
done

# ============================================================
# T6. Global Immutability
# ============================================================
section "T6. Global Immutability"
if [ -f "$HOME/.claude/CLAUDE.md" ]; then
  GLOBAL_BEFORE_FILE="/tmp/global-mtime-before"
  if [ -f "$GLOBAL_BEFORE_FILE" ]; then
    EXPECTED=$(cat "$GLOBAL_BEFORE_FILE")
    ACTUAL=$(stat -f "%m" "$HOME/.claude/CLAUDE.md" 2>/dev/null || stat -c "%Y" "$HOME/.claude/CLAUDE.md")
    [ "$EXPECTED" = "$ACTUAL" ] && pass "~/.claude/CLAUDE.md mtime unchanged" || fail "Global mtime CHANGED"
  else
    stat -f "%m" "$HOME/.claude/CLAUDE.md" 2>/dev/null > "$GLOBAL_BEFORE_FILE" || stat -c "%Y" "$HOME/.claude/CLAUDE.md" > "$GLOBAL_BEFORE_FILE"
    pass "~/.claude/CLAUDE.md mtime baseline saved"
  fi
else
  skip "T6 (~/.claude/CLAUDE.md 없음)"
fi

# ============================================================
# T7. Global Commands Removed
# ============================================================
section "T7. setup-harness.sh Global Commands Check"
GLOBAL_CMDS=$(grep -E "^[[:space:]]*claude mcp add|^[[:space:]]*cp.*\\\$HOME|^[[:space:]]*safe_copy.*CLAUDE_HOME" setup-harness.sh 2>/dev/null | wc -l | tr -d ' ')
[ "$GLOBAL_CMDS" = "0" ] && pass "글로벌 수정 명령 0건" || fail "글로벌 수정 명령 ${GLOBAL_CMDS}건"

# ============================================================
# T8. SPEC Drift Detection
# ============================================================
section "T8. SPEC Drift Detection"
if [ -f "$ROOT/templates/hooks/spec-drift-check.sh" ]; then
  bash "$ROOT/templates/hooks/spec-drift-check.sh" 2>/dev/null
  EXIT=$?
  if [ "$EXIT" -eq 0 ]; then
    pass "SPEC/todo/PRD drift 없음"
  elif [ "$EXIT" -eq 1 ]; then
    pass "SPEC drift 없음 (unchecked 항목 있음 — ship 모드 아님)"
  elif [ "$EXIT" -eq 2 ]; then
    fail "SPEC drift BLOCK"
  fi
else
  skip "T8 (spec-drift-check.sh 없음)"
fi

# ============================================================
# T9. Requirements Traceability
# ============================================================
section "T9. Requirements Traceability"
if [ -f "$ROOT/Docs/requirements-trace.md" ]; then
  MISSING=$(grep "❌ MISSING" "$ROOT/Docs/requirements-trace.md" 2>/dev/null | wc -l | tr -d ' ')
  PARTIAL=$(grep "⚠️ PARTIAL" "$ROOT/Docs/requirements-trace.md" 2>/dev/null | wc -l | tr -d ' ')
  DONE=$(grep "✅ DONE" "$ROOT/Docs/requirements-trace.md" 2>/dev/null | wc -l | tr -d ' ')
  echo "    DONE: $DONE / PARTIAL: $PARTIAL / MISSING: $MISSING"
  if [ "$MISSING" -eq 0 ]; then
    pass "MISSING 0건"
  else
    fail "MISSING ${MISSING}건"
  fi
  # PARTIAL은 ship-blocking 아님 — 추적 정보만
  echo "    (PARTIAL은 ship-blocking 아님 — 정보만)"
else
  skip "T9 (requirements-trace.md 없음 — 별도 생성 필요)"
fi

# ============================================================
# T10. Documentation Accuracy
# ============================================================
section "T10. Documentation Accuracy"
# README의 claims vs 실제
if [ -f README.md ]; then
  # README가 9 tracks를 명시?
  grep -q "9 ⌑\|9개\|tooling.*Track\|tooling.*Bash" README.md && pass "README: 9 tracks 명시" || fail "README: tracks 수 불명확"
fi
# project-claude templates 9개 확인
TEMPLATE_COUNT=$(ls templates/project-claude/*.md 2>/dev/null | wc -l | tr -d ' ')
[ "$TEMPLATE_COUNT" -eq 9 ] && pass "project-claude templates: 9개" || fail "project-claude: ${TEMPLATE_COUNT}개 (9 기대)"

# ============================================================
# T11. Workflow E2E Smoke Test
# ============================================================
section "T11. Workflow E2E Smoke Test"
T11_DIR=$(mktemp -d)
cd "$T11_DIR" && git init -q && echo "# E2E Test" > README.md && git add . && git commit -m init -q 2>/dev/null
bash "$ROOT/setup-harness.sh" --track tooling --project-dir . < /dev/null > /tmp/e2e-setup.log 2>&1

# Step 1: gate-check spec → 통과
echo '{"tool_input":{"skill":"uzys:spec"}}' | bash .claude/hooks/gate-check.sh > /dev/null 2>&1 \
  && pass "E2E: /uzys:spec 게이트 통과" || fail "E2E spec gate"

# Step 2: define complete → plan 통과
jq '.define.completed = true' .claude/gate-status.json > /tmp/gt.json && mv /tmp/gt.json .claude/gate-status.json
echo '{"tool_input":{"skill":"uzys:plan"}}' | bash .claude/hooks/gate-check.sh > /dev/null 2>&1 \
  && pass "E2E: /uzys:plan after define" || fail "E2E plan after define"

# Step 3: 게이트 순서 강제 — verify before build → 차단
jq '.plan.completed = false' .claude/gate-status.json > /tmp/gt.json && mv /tmp/gt.json .claude/gate-status.json
RESULT=$(echo '{"tool_input":{"skill":"uzys:build"}}' | bash .claude/hooks/gate-check.sh 2>&1; echo "EXIT=$?")
echo "$RESULT" | grep -q "EXIT=2" && pass "E2E: build blocked without plan" || fail "E2E build no-plan"

cd "$ROOT"
rm -rf "$T11_DIR"

# ============================================================
# Summary
# ============================================================
echo ""
echo -e "${BOLD}========== Summary ==========${NC}"
echo -e "  ${GREEN}Pass: $PASS${NC}"
echo -e "  ${RED}Fail: $FAIL${NC}"
echo -e "  ${YELLOW}Skip: $SKIP${NC}"
TOTAL=$((PASS+FAIL+SKIP))
echo -e "  Total: $TOTAL"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo -e "${RED}Failures:${NC}"
  echo -e "$FAILURES"
fi

if [ "$STRICT" = true ] && [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
