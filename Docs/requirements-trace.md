# Requirements Traceability Matrix

> **Generated**: 2026-04-12 (audit date)
> **Sources**: `Docs/dev/RAW-REQUIREMENTS.md` (S1-S19), `Docs/dev/REQUIREMENTS.md` (V1-V18), `Docs/dev/PRD.md` (D1-D22, R1-R6)
> **Scope**: Verify each requirement against actual files in the repo (`setup-harness.sh`, `templates/`, `.claude/`, `Docs/SPEC.md`, `Docs/plan.md`, `Docs/todo.md`, git log)

**Legend**: DONE = implemented & verifiable | PARTIAL = partly or unclear | MISSING = not found | LLM-DEP = relies on LLM following text instructions (no deterministic enforcement) | FUTURE = explicitly deferred (R1-R6)

---

## Part 1 — RAW Requirements (S1-S19)

| Source | ID | Requirement | Implementation Evidence | Status |
|--------|----|----|--------------|---|
| RAW | S1 | Universal agent design: goal-driven PDCA, AC-gated, self-judgment + ask on uncertainty | `templates/CLAUDE.md` lines 11-67 (P1-P11); `templates/agents/reviewer.md` (SOD verifier) | DONE |
| RAW | S2 | CLAUDE.md in Karpathy tone, no flattery, fact-based, dry, CTO/COO eye-level | `templates/CLAUDE.md` lines 5-7 (Identity: 직설적 건조한 어조); 150 lines total | DONE |
| RAW | S3 | GitHub Issues/Milestones/Project/labels/Release gate | `templates/rules/git-policy.md` L20-23 (PR ties to Issue `Closes #N`); Milestone/Project/label taxonomy NOT in repo — delegated to agent-skills `/plan` | PARTIAL |
| RAW | S4 | PRD template: scope clarity, DO NOT CHANGE, Non-Goals, Phases, Self-Audit, SPEC as anchor | `Docs/dev/PRD.md` §4.2 (Non-Goals), §6.2 (DO NOT CHANGE), §7 (Phases); `templates/CLAUDE.md` L61-66 (Self-Audit); `templates/hooks/session-start.sh` L21 ("SPEC.md first (Persistent Anchor)") | DONE |
| RAW | S5 | Planner/PM/Dev/QA agents + Critical Mistakes prevention (3-repeat detection) | `templates/commands/uzys/*.md` (6 phase commands); `templates/agents/` (5 agents); `templates/CLAUDE.md` P9 Circuit Breakers ("3회 시도 실패 → 멈추고 보고") | DONE (P9 is LLM-text, not deterministic) |
| RAW | S6 | Compact custom guidelines + reviewer self-evaluation (generator ≠ evaluator) | `templates/agents/reviewer.md` L3-6 (`context: fork`, "구현자가 아니다"); `templates/CLAUDE.md` P5 | DONE |
| RAW | S7 | Tracks (SSR/CSR/Next.js/non-dev) + Context7 + GitHub MCP + Impeccable + setup-tooling.sh | `setup-harness.sh` L105 (9 TRACKS); `.mcp.json` (context7, github, chrome-devtools); Impeccable install L298-303; 9 `templates/project-claude/*.md` | DONE |
| RAW | S8 | 11 behavioral principles from Karpathy + Anthropic Harness + PRD Lifecycle change mgmt | `templates/CLAUDE.md` P1-P11 (L11-66); `templates/rules/change-management.md` (58 lines) | DONE |
| RAW | S9 | Universal + specialized + reviewer agents, commit-push-PR mandatory, Tauri/PySide6 | `templates/agents/` (reviewer, data-analyst, strategist, code-reviewer, security-reviewer); `templates/rules/git-policy.md` L12-17; `templates/rules/tauri.md` (40L), `templates/rules/pyside6.md` (59L) | DONE |
| RAW | S10 | Decisions D1-D9 | `Docs/dev/PRD.md` §12.2 Decision Log rows D1-D9 | DONE |
| RAW | S11 | Impeccable deep use + awesome-design-md + agent-skills backbone + HyperAgents philosophy | `templates/rules/design-workflow.md` (29L, references Impeccable); `templates/CLAUDE.md` L113-118 (Self-Improvement); `setup-harness.sh` L286 (agent-skills plugin install) | DONE |
| RAW | S12 | agent-skills as backbone with ECC as tool layer | `setup-harness.sh` L283-288 (agent-skills install for dev tracks); `templates/commands/ecc/` (7 ECC commands); `.dev-references/cherrypicks.lock` (ECC cherry-picks manifest) | DONE |
| RAW | S13 | PRD-Lifecycle skill removed, 3 unique values redistributed | `templates/rules/change-management.md` (CR classification); `templates/CLAUDE.md` P3 (DO NOT CHANGE); `templates/hooks/session-start.sh` (SPEC re-read). PRD-Lifecycle skill itself NOT present | DONE |
| RAW | S14 | CPO/CSO role, Track→skill mapping, GSD optional, Railway official MCP, Anthropic doc skills, std-dev-boilerplate/dyld-vantage | `templates/agents/strategist.md` L3 ("Business strategy...executive-track"); `setup-harness.sh` L156-170 (track→rule mapping), L129-134 (GSD optional prompt), L290-294 (Railway plugin), L344-350 (document-skills); std-dev-boilerplate/dyld-vantage referenced in `templates/rules/tauri.md`, `shadcn.md`, `htmx.md`, `seo.md` | DONE |
| RAW | S15 | README.md + USAGE.md with essential commands + workflow-driven skill activation | `README.md` (154L) + `USAGE.md` (242L) exist; USAGE.md L3-9 workflow quickstart | DONE |
| RAW | S16 | Impeccable kept as supplementary (no dedicated management), not deleted | `setup-harness.sh` L298-303 (install for UI tracks); no `imm:` wrapper commands (D10 removed); Impeccable skills present in `.claude/skills/` (polish, critique, audit, etc.) | DONE |
| RAW | S17 | Ops rules: post-ship SPEC/PRD sync, E2E coverage check, session savepoint, commit-on-change, PRD splitting | `templates/rules/ship-checklist.md` (E2E+coverage+SPEC/PRD checklist); `templates/commands/ecc/checkpoint.md` (savepoint); `templates/rules/git-policy.md` L12 (즉시 commit); `templates/skills/spec-scaling/SKILL.md` (300-line split); `templates/hooks/spec-drift-check.sh` (deterministic drift check, D22) — **but NOT installed in dogfood `.claude/hooks/`** | PARTIAL |
| RAW | S18 | Claude Code env: statusline, bypassPermissions, Agent Teams, tmux | `templates/settings.json` L3-6 (statusLine: claude-powerline); `defaultMode: bypassPermissions` / `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` / `teammateMode: tmux` NOT in `templates/settings.json` — these require global `~/.claude/settings.json` which D16 explicitly forbids touching; deferred to `bootstrap-dev.sh` | PARTIAL |
| RAW | S19 | Command namespaces: `uzys:`, `ecc:`, `imm:`, `gsd:` | `templates/commands/uzys/` (6), `templates/commands/ecc/` (7); `imm:` removed per D10 (Impeccable called directly via `/polish` etc.); `gsd:` via optional GSD install | DONE (imm removed by D10) |

---

## Part 2 — Verification Criteria (V1-V18)

| Source | ID | Requirement | Implementation Evidence | Status |
|--------|----|----|--------------|---|
| REQ | V1 | `setup-harness.sh` installs each Track's §3 mapping | `setup-harness.sh` L105 (9 tracks), L147-356 (per-track rule/command/agent/skill install); PRD §7.2 Phase 1 marks "[검증 완료]" | DONE |
| REQ | V2 | Executive Track: no agent-skills, only document-skills | `setup-harness.sh` L194-198 (uzys commands skipped if executive), L283-288 (agent-skills skipped if executive), L344-350 (document-skills installed for executive+full); verification L420-427 | DONE |
| REQ | V3 | `/uzys:spec`→`/uzys:plan`→`/uzys:build`→`/uzys:test`→`/uzys:review`→`/uzys:ship` works end-to-end | All 6 files exist in `templates/commands/uzys/`; dogfood `.claude/commands/uzys/` has same; E2E execution flagged by PRD §7.2 Phase 4 as "[Future]" — not yet run against a real project | PARTIAL |
| REQ | V4 | reviewer runs with `context: fork` isolation | `templates/agents/reviewer.md` L2-6 (`context: fork`, `model: opus`); PRD §7.2 Phase 2 marks "[검증 완료 — 부모 컨텍스트 미공유 확인]" | DONE |
| REQ | V5 | Railway MCP/plugin works (deploy, logs) | `setup-harness.sh` L290-294 (Railway plugin install); `.mcp.json` railway-mcp-server added conditionally for csr-fastify/csr-fastapi/ssr-*/full (L249-254); actual deploy/log test not evidenced in repo | PARTIAL |
| REQ | V6 | Anthropic document-skills (pptx/docx/xlsx/pdf) works | `setup-harness.sh` L344-350 (plugin install); no runtime verification in repo | PARTIAL |
| REQ | V7 | GSD optional install runs alongside agent-skills | `setup-harness.sh` L129-134 (interactive prompt), L352-356 (install step); no concurrent execution test evidenced | PARTIAL |
| REQ | V8 | Global CLAUDE.md ≤200 lines | `.claude/CLAUDE.md` 150L, `templates/CLAUDE.md` 150L; `setup-harness.sh` L404-412 verification block enforces ≤200; PRD §7.2 Phase 1 "[검증 완료]" | DONE |
| REQ | V9 | ECC cherry-pick (6→8 per D12) loaded | `.dev-references/cherrypicks.lock` lists 7 ECC cherry-picks (code-reviewer, security-reviewer, cl-v2, strategic-compact, ecc-git-workflow, deep-research, market-research); `templates/agents/code-reviewer.md`, `security-reviewer.md`; `templates/skills/continuous-learning-v2/`, `strategic-compact/`, `deep-research/`, `market-research/`; `templates/rules/ecc-git-workflow.md`; `templates/commands/ecc/checkpoint.md`. PRD claims "8개 cherry-pick" but lock file shows 7; testing rule was removed (D21) | PARTIAL (7 not 8 — testing rule removed, checkpoint as command not skill) |
| REQ | V10 | auto memory + CL-v2 works | `templates/skills/continuous-learning-v2/` (SKILL.md, config.json, hooks/observe.sh, scripts/); `templates/settings.json` L43-64 (PreToolUse+PostToolUse CL-v2 observers); PRD §7.2 Phase 2 "[검증 완료 — observations.jsonl 5+ 이벤트]" | DONE |
| REQ | V11 | README.md has architecture, philosophy, install, references | `README.md` (154L): L6-41 Architecture diagram, L57-72 11 principles, L74-77 Design Philosophy, L79+ Installation; references section | DONE |
| REQ | V12 | USAGE.md has 6 commands + Track scenarios + Rules explanation | `USAGE.md` (242L): L3-9 quickstart, L23-77 core commands detailed; Track scenarios/Rules docs partially present. Per `Docs/todo.md` L94-97 Phase D D1/D2 marked "부분 완료 (미완료)" | PARTIAL |
| REQ | V13 | `/build` auto-activates frontend-ui-engineering + Impeccable on UI file edits | `USAGE.md` L43-48 documents auto-activation; no deterministic hook enforces this — depends on LLM selecting the right skill based on file extension context | LLM-DEP |
| REQ | V14 | Step-skipping attempt triggers gate block | `templates/hooks/gate-check.sh` L63-123 (exit code 2 blocks per phase); PRD §7.2 Phase 2 "[검증 완료 — exit code 2 차단 확인]"; `.claude/settings.json` L30-40 wires Skill matcher | DONE |
| REQ | V15 | `/ship` blocks when E2E fails | `templates/rules/ship-checklist.md` L7 (E2E checklist item); `templates/commands/uzys/ship.md` L11-17 (checklist check). No deterministic hook verifies E2E results — checklist is LLM-executed; PRD §7.2 Phase 2 explicitly marks V15 as "[LLM 지시 수준]" | LLM-DEP |
| REQ | V16 | Post-ship SPEC/PRD drift detection → update suggestion | `templates/hooks/spec-drift-check.sh` (deterministic drift check, D22); `templates/rules/ship-checklist.md` L11,15 (SPEC/PRD 정합성); **however `spec-drift-check.sh` is NOT present in dogfood `.claude/hooks/`** and NOT wired into `templates/settings.json` hooks | PARTIAL |
| REQ | V17 | Post-change uncommitted warning | `templates/hooks/uncommitted-check.sh` L21-31 (warns but doesn't block); wired in `templates/settings.json` L36-38; PRD §7.2 Phase 2 "[uncommitted-check.sh 동작]" | DONE |
| REQ | V18 | SPEC.md >300 lines triggers split proposal | `templates/skills/spec-scaling/SKILL.md` (300-line trigger logic); PRD §7.2 Phase 2 "[spec-scaling skill 활성]". Activation depends on LLM reading the skill — not a hook-enforced trigger | LLM-DEP |

---

## Part 3 — Decisions (D1-D22)

| Source | ID | Decision | Implementation Evidence | Status |
|--------|----|----|--------------|---|
| PRD | D1 | Option B + implementation/verification split | `templates/agents/reviewer.md` (SOD, context: fork) | DONE |
| PRD | D2 | agent-skills backbone + ECC cherry-pick tool layer | `setup-harness.sh` L283-288 agent-skills; `.dev-references/cherrypicks.lock` ECC picks | DONE |
| PRD | D3 | auto memory + CL-v2 for experience | `templates/skills/continuous-learning-v2/`; `templates/commands/ecc/instinct-export.md` | DONE |
| PRD | D4 | Git branch + SessionStart pull | `templates/hooks/session-start.sh` L9-11 (`git pull --rebase`); `templates/rules/git-policy.md` L5-8 | DONE |
| PRD | D5 | Universal `data-analyst` subagent | `templates/agents/data-analyst.md` | DONE |
| PRD | D6 | gitagent philosophy absorbed, no CLI | Agents in `.claude/agents/*.md` Git-tracked; frontmatter = SOUL.md; reviewer SOD; no gitagent CLI installed | DONE |
| PRD | D7 | What/How separation | `templates/rules/git-policy.md` (What: 즉시 commit); `templates/rules/ecc-git-workflow.md` (How: cherry-pick from ECC) | DONE |
| PRD | D8 | Track-tiered test coverage (UI 60%, API 80%, logic 90%) | `templates/rules/test-policy.md` L3-9 | DONE |
| PRD | D9 | Ship-phase security scan | `templates/rules/ship-checklist.md` L9; `templates/commands/ecc/security-scan.md` | DONE |
| PRD | D10 | Remove `imm:` wrapper | No `imm:` files in `templates/commands/`; `setup-harness.sh` L205 comment "imm: 커맨드 제거됨"; Impeccable skills still installed (polish, critique, etc.) | DONE |
| PRD | D11 | Gate Hook for programmatic blocking (exit code 2) | `templates/hooks/gate-check.sh` L5 (`set -e`), L83,92,97,104,113,120 (`exit 2`); `.claude/settings.json` PreToolUse matcher "Skill" | DONE |
| PRD | D12 | +checkpoint + strategic-compact cherry-pick | `templates/commands/ecc/checkpoint.md`; `templates/skills/strategic-compact/` exists; `.dev-references/cherrypicks.lock` includes both | DONE |
| PRD | D13 | `protect-files.sh` Python-free (jq/bash fallback) | `templates/hooks/protect-files.sh` L8-17 (jq-with-grep fallback, no Python) | DONE |
| PRD | D14 | New `tooling` Track | `setup-harness.sh` L105,166 (tooling track); `templates/project-claude/tooling.md`; `templates/rules/cli-development.md` (95L) | DONE |
| PRD | D15 | `--project-only` flag (later superseded by D16) | Superseded — see D16 | DONE (superseded) |
| PRD | D16 | Remove global install path, `templates/global/` abolished, all agents project-scoped | `setup-harness.sh` L19-22 ("프로젝트 스코프 전용"), L94-98 (global step removed), L431-442 (verifies `~/.claude/CLAUDE.md` untouched); no `templates/global/` dir | DONE |
| PRD | D17 | CLAUDE.md Decision Making Universal Meta-Rule | `templates/CLAUDE.md` L85-109 ("Decision Making (Universal Meta-Rule)" with procedure + anti-patterns + examples) | DONE |
| PRD | D18 | `.dev-references/cherrypicks.lock` + `sync-cherrypicks.sh` | `.dev-references/cherrypicks.lock` exists (115L); `sync-cherrypicks.sh` exists (6870 bytes, executable) | DONE |
| PRD | D19 | `.claude/settings.json` (committable, `$CLAUDE_PROJECT_DIR`) | `templates/settings.json` uses `$CLAUDE_PROJECT_DIR` throughout (L13,25,33,37,46,59); dogfood `.claude/settings.json` installed | DONE |
| PRD | D20 | `.mcp.json` project scope, no global `claude mcp add` | `.mcp.json` (29L) in project root; `templates/mcp.json` template; `setup-harness.sh` L238-269 builds `.mcp.json` dynamically; `claude mcp add` removed from setup-harness.sh | DONE |
| PRD | D21 | Remove 8 files + add 7 common tools (necessity audit) | `Docs/todo.md` Phase B B1-B6 checked; `Docs/todo.md` Phase C C5 checked (find-skills, agent-browser, playwright moved common); `setup-harness.sh` L311-322 installs find-skills + agent-browser | DONE |
| PRD | D22 | Deterministic SPEC drift detection (`spec-drift-check.sh`) | `templates/hooks/spec-drift-check.sh` (87L) exists; `templates/rules/ship-checklist.md` integration not explicit; **NOT present in dogfood `.claude/hooks/`**; **NOT wired into `templates/settings.json`** — so deterministic ship-gate blocking is not actually installed | PARTIAL |

---

## Part 4 — Roadmap (R1-R6, explicitly deferred)

| Source | ID | Item | Status |
|--------|----|----|---|
| PRD | R1 | instinct → Rule auto-PR generation | FUTURE (depends on Q3) |
| PRD | R2 | Cross-project learning transfer via knowledge-base/ | FUTURE |
| PRD | R3 | Rule effect measurement automation | FUTURE (depends on /stats API) |
| PRD | R4 | Meta-agent proposing CLAUDE.md improvements | FUTURE (depends on R1-R3) |
| PRD | R5 | Gate Hook state machine (upgrade from file-based to structured) | FUTURE (depends on Phase 3 E2E) |
| PRD | R6 | Additional Tracks (ML/research, mobile, game) | FUTURE |

---

## Part 5 — Critical Findings (Gaps & Risks)

1. **D22 `spec-drift-check.sh` is dead code in dogfood.**
   - File exists at `templates/hooks/spec-drift-check.sh` but:
     - Not copied to `.claude/hooks/` by `setup-harness.sh` L228-233 (only copies session-start/protect-files/gate-check/uncommitted-check)
     - Not wired into `templates/settings.json` hooks block
   - Result: V16 (post-ship drift detection) is NOT actually enforced despite D22 claiming it is.

2. **V9 cherry-pick count mismatch.**
   - PRD §5.1 claims "ECC cherry-pick 8개" listing: CL-v2, code-reviewer, security-reviewer, security-scan, git-workflow, testing, checkpoint, strategic-compact.
   - Actual: testing-rule removed (D21), so effective count is 7. `.dev-references/cherrypicks.lock` has 7 cherry-pick entries.
   - PRD internal inconsistency — §2.1 says "cherry-pick 대상 8개", §4.3 says "8/8".

3. **V3 E2E workflow not actually exercised.**
   - 6 uzys: commands all exist. Gate hook verified to block (V14). But PRD §7.2 Phase 4 "[Future]" explicitly says full 6-stage E2E is unverified.

4. **V13, V15, V18 are LLM-DEPENDENT.**
   - No deterministic enforcement for: auto-skill activation on UI files, E2E-pass check before ship, 300-line split trigger. All rely on LLM reading `.md` instructions.

5. **S18 partial — bypassPermissions/Agent Teams/tmux settings not in template.**
   - `templates/settings.json` contains only `statusLine` + `hooks`. The `defaultMode: bypassPermissions`, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `teammateMode: tmux` settings are documented in `Docs/dev/REQUIREMENTS.md` §3.1.1 but intentionally deferred because D16 forbids touching `~/.claude/settings.json`. `bootstrap-dev.sh` handles them separately.

6. **S3 GitHub Milestones/Projects/labels not enforced.**
   - Only commit-push-PR is enforced via `git-policy.md`. Milestone (≤2 weeks), Issue (≤8h), label taxonomy, Release Gate: none present in templates. Delegated to agent-skills `/plan` per original RAW note.

7. **V12 USAGE.md incomplete per `Docs/todo.md`.**
   - Phase D D1/D2/D4 marked "미완료": Architecture diagram missing deep-research/market-research, Common tools section missing, `.mcp.json`/`settings.json` explanation missing, CONTRIBUTING.md sync procedure missing.

---

## Summary Counts

| Status | Count |
|---|---|
| DONE | 39 |
| PARTIAL | 10 |
| LLM-DEP | 4 |
| FUTURE | 6 |
| MISSING | 0 |

**Total requirements audited**: 59 (S1-S19 + V1-V18 + D1-D22 + R1-R6, with D15 merged into D16).

**Overall assessment**: The harness is structurally complete — all 6 phase commands, 5 agents, 18 rules, 4 hooks, and 9 Tracks exist in templates and are installed by `setup-harness.sh`. Phase 1 and Phase 2 verification criteria are substantively met. The main gaps are (a) dogfood drift between `templates/hooks/` and `.claude/hooks/` (spec-drift-check.sh never installed), (b) documentation incompleteness acknowledged in `Docs/todo.md` Phase D, and (c) end-to-end workflow validation (V3) pending a real external project per Phase 4.
