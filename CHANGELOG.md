# Changelog

All notable changes to **uzys-claude-harness**.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v26.17.0] — 2026-04-18

### Added
- `Reference.md` — single catalog of all installed assets (Plugins / Skills / MCP / Agents / Cherry-pick / own) with trust tier (✅ official / 🟢 vetted third-party / 🟡 community), per-track applicability, exact install commands
- `README.md` link to Reference.md prominent at top of References section

### Security
- AgentShield CRITICAL 1 + HIGH 2 false positives resolved (`--no-verify` text in git-policy → "hook 검증 우회 플래그", "Goal-backward" in plan-checker → "Outcome-driven")
- `.claude/settings.local.json` untracked + added to `.gitignore`
- `git filter-repo` history rewrite: removed 6 commits referencing `settings.local.json`, anonymized `uzysjung@gmail.com` → `uzysjung@users.noreply.github.com` across all 67 tags + main
- `git config --local user.email` set to noreply (auto-applied to future commits)

## [v26.16.1] — 2026-04-18

### Changed
- `/uzys:plan` skill: added Plan Depth section with 3-tier guidance (Trivial → skip / Standard → milestones / Complex → detailed). Reflects Anthropic best practices "*if you can describe the diff in one sentence, skip the plan*". Stops forcing fine-grained decomposition on Opus-class models.

## [v26.16.0] — 2026-04-18

### Added
- **data Track 5 external skills**: polars + dask (K-Dense), python-resource-management + python-performance-optimization (wshobson), Anthropic data plugin (visualization)
- **CLAUDE.md Project Direction section** — codifies ECC.tools dependency, continuous-learning + Ralph loop autonomy, lean-by-design principles

### Decisions (skipped)
- pandas-pro skill: conflicts with our `polars 우선` policy
- awesome-llm-apps/data-analyst agent: our self-authored data-analyst is deeper (DuckDB+Trino+sklearn+PyTorch+XGBoost+MLflow+PySide6)
- K-Dense seaborn: covered by Anthropic data plugin

## [v26.15.0] — 2026-04-18

### Added
- `setup-harness.sh` end-of-flow ECC plugin prompt (interactive only, all tracks):
  - Q1: install ECC project-scoped? [y/N]
  - Q2: prune unused items? [y/N]
- `prune-ecc.sh --copy-only` flag (copy without prune)
- prune-ecc.sh now shows DELETED + KEPT file lists (categorized by skills/agents/commands)

## [v26.14.1] — 2026-04-18

### Removed
- `codebase-map.sh` hook (Claude can use Glob/Grep directly — was redundant)
- `change-management.md` Session Protocol section (duplicated CLAUDE.md Context Management)

### Changed
- `/uzys:spec` skill: added Pre-SPEC required questions block — Test Environment Parity (Prod DB, test strategy, external deps) + Critical E2E flows + Design Context (DESIGN.md/.impeccable.md for UI tracks)

## [v26.14.0] — 2026-04-18

### Added
- `setup-harness.sh --update` flag with two cleanup mechanisms:
  - **Orphan prune**: removes files in `.claude/{rules,agents,commands/uzys,hooks}` not present in templates (auto-cleans deprecated stuff in old installs)
  - **Stale hook ref cleanup**: removes `settings.json` hook entries pointing to non-existent files

### Changed
- Rule slim-down 21 → 17 files (~1,800 → 903 lines, -50%)
  - Deleted: `ecc-security-common`, `model-routing`, `seo`, `ecc-performance-common`
  - Compressed: `code-style`, `error-handling`, `git-policy`, `design-workflow`, `gates-taxonomy`, `cli-development`
  - Rationale: only enforce non-obvious project-specific invariants; linter/config files own everything else
- Hook auto-registration 9 → 6 (removed `uncommitted-check.sh`; demoted `spec-drift-check`/`checkpoint-snapshot`/`codebase-map` to on-demand utilities)

## [v26.12.0] — 2026-04-17

### Added
- `templates/track-mcp-map.tsv` — externalized Track→MCP mapping. New MCPs need only a single TSV row, no `setup-harness.sh` edit
- `Docs/research/repo-deep-research-2026-04-17.md` — 5-axis self-research across reviewer agents

### Changed
- `setup-harness.sh` `.mcp.json` assembly switched from inline case statements to TSV-driven loop with `jq --arg`/`--argjson`

## [v26.11.0] — 2026-04-17

### Added
- Multi-Track install — `--track tooling --track csr-fastapi` (union)
- `--add-track` flag — add a track to an existing install (preserves `.mcp.json`/`.claude/*`)
- Helper functions: `any_track`, `has_dev_track`, `all_executive`

## [v26.10.0] — 2026-04-16

### Changed (BREAKING for old installs)
- ECC plugin replaced by **Track-based cherry-picks** (`.dev-references/cherrypicks.lock`). Existing global ECC users should run `claude plugin uninstall everything-claude-code@everything-claude-code` after migration
- `prune-ecc.sh` (new) for project-local ECC copy + selective prune (89 user-defined KEEP items)

## Earlier history

Tags v26.0.0 through v26.9.x: foundational work — 6-gate workflow, 11 principles, initial Track set, security hardening, reviewer subagent (SOD), agent-skills integration. See `git log` for details.

[Unreleased]: https://github.com/uzysjung/uzys-claude-harness/compare/v26.17.0...HEAD
[v26.17.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.17.0
[v26.16.1]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.16.1
[v26.16.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.16.0
[v26.15.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.15.0
[v26.14.1]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.14.1
[v26.14.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.14.0
[v26.12.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.12.0
[v26.11.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.11.0
[v26.10.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.10.0
