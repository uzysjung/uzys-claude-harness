# uzys-claude-harness

> A Claude Code agent harness — 6-gate workflow + Ralph loop + 9 stack tracks. Lean by design.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/github/v/tag/uzysjung/uzys-claude-harness?label=version)](https://github.com/uzysjung/uzys-claude-harness/releases)
[![Tests](https://img.shields.io/badge/tests-111%20PASS%20%2F%200%20FAIL-brightgreen)](test-harness.sh)

🇰🇷 **한국어 README**: [README.ko.md](./README.ko.md)

## What is this?

A **deterministic harness** around [Claude Code](https://claude.com/claude-code) that:

- Enforces a **6-gate workflow** (`Spec → Plan → Build → Test → Review → Ship`) via hooks
- Supports **9 stack tracks** (csr-supabase / csr-fastify / csr-fastapi / ssr-htmx / ssr-nextjs / data / executive / tooling / full)
- Bundles **vetted plugins, skills, MCP servers, and agents** per track ([Reference.md](./Reference.md))
- Stays **lean** — Rule 17 files / Hook 6 auto-registered. Removes anything obvious or duplicate.
- Self-improves via **continuous-learning + Ralph loop** (SPEC-driven autonomous cycle)
- Project-scoped only. **Global `~/.claude/` is never touched.**

Built for senior engineers / multi-role users (CEO/CTO/CISO/data scientist) who want the same harness across very different stacks.

## Installation

### Step 1 — Pick your Track

| Stack you're building | Track to install |
|----------------------|----------------|
| Python REST API + React frontend | `csr-fastapi` |
| TypeScript REST API + React frontend | `csr-fastify` |
| Realtime / Auth / Postgres (Supabase) | `csr-supabase` |
| SEO + React (SSR) | `ssr-nextjs` |
| Minimal JS (server-rendered + HTMX) | `ssr-htmx` |
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

```bash
bash /path/to/uzys-claude-harness/setup-harness.sh --add-track tooling --project-dir .
```

`--add-track` preserves existing `.claude/*` and merges new MCPs into `.mcp.json` via `jq` (idempotent).

### Update an existing install to the latest harness version

When a new release comes out (check [CHANGELOG.md](./CHANGELOG.md)):

```bash
bash /path/to/uzys-claude-harness/setup-harness.sh --update --project-dir .
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
bash setup-harness.sh --track tooling --project-dir .
```

### Multi-Track in one go (union)

```bash
bash setup-harness.sh --track tooling --track csr-fastapi --project-dir .
```

Use this when you know upfront you need multiple tracks. Faster than two separate runs.

### Optional — install ECC plugin project-scoped

After `setup-harness.sh` finishes (interactive sessions only), it asks:

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

### Other flags

```bash
bash setup-harness.sh --help                 # show full options
bash setup-harness.sh --gsd ...              # include GSD orchestrator (large projects)
```

### Prerequisites

- Node.js 22+
- Git
- Claude Code CLI (`claude`)
- jq (recommended; bash fallback exists)

## Tracks (full reference)

| Track | Stack | Role | Auto-installed |
|-------|-------|------|----------------|
| `csr-supabase` | Supabase + React + shadcn/ui + Tauri | Developer | + Supabase MCP |
| `csr-fastify` | Railway + Fastify + React + shadcn/ui + Tauri | Developer | + Railway MCP |
| `csr-fastapi` | Railway + FastAPI + React + shadcn/ui + Tauri | Developer | + Railway MCP |
| `ssr-htmx` | Railway + FastAPI + Jinja2 + HTMX | Developer | + Railway MCP |
| `ssr-nextjs` | Railway + Next.js + React + shadcn/ui | Developer | + Railway MCP, next-skills |
| `data` | Python + DuckDB + Trino + ML/DL + PySide6 | Data Scientist | + polars/dask/wshobson skills, Anthropic data plugin |
| `executive` | PPT/Excel/Word/PDF + proposals/DD | CPO/CSO/CTO | + document-skills, c-level-skills, finance-skills |
| `tooling` | Bash + Markdown + CLI tools (meta projects) | Tool Developer | + cli-development rules |
| `full` | Union of everything | All | All MCPs + all plugins |

Common to all dev tracks: `addy-agent-skills`, `Impeccable`, `Playwright`, `find-skills`, ADR skill, `context7` MCP, `github` MCP, `chrome-devtools` MCP. Full asset list: [Reference.md](./Reference.md).

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
| [USAGE.md](./USAGE.md) | Day-to-day workflow guide (`/uzys:*` commands, gate flow) |
| [**Reference.md**](./Reference.md) | **Catalog of all installed assets** (Plugins / Skills / MCP / Agents / Cherry-pick) with trust tier and exact install commands |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to add tracks / rules / hooks / commands |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |

## Optional ECC integration

[Everything-Claude-Code (ECC)](https://github.com/affaan-m/everything-claude-code) bundles 300+ skills/agents/commands. The `setup-harness.sh` end-of-flow offers a 2-step prompt:

```
[ECC] Plugin 프로젝트 스코프 설치 (선택사항)
  1. Install ECC project-scoped (copy)? [y/N]
  2. Prune unused items (keep 89 curated)? [y/N]
  → DELETED/KEPT file list shown after prune
```

Run with `claude --plugin-dir .claude/local-plugins/ecc` afterwards. Global `~/.claude/` stays untouched.

## Installation report

After `setup-harness.sh` completes you get a verification table:

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

CI runs `bash test-harness.sh --quick` (≈5s, 85 tests) on every PR.

## Security model

- **MCP allowlist**: `.mcp-allowlist` file gates every MCP call via `mcp-pre-exec.sh` hook
- **D16 protection**: `setup-harness.sh --project-dir` blocks `~/.claude/*`, `/etc/*`, system bins
- **`.env` / credentials shielded**: `protect-files.sh` hook blocks Write/Edit on protected paths
- **Pre-ship security gate**: `agentshield-gate.sh` runs `npx ecc-agentshield scan` before `/uzys:ship`
- See [Reference.md §8](./Reference.md#8-보안--신뢰-정책) for the full security policy

## Project Direction

This harness is built around three commitments (see `templates/CLAUDE.md`):

1. **ECC.tools dependency** — minimal in-house code; orchestrate ECC skills/agents via `/uzys:*`
2. **Ralph loop autonomy** — SPEC-based autonomous cycle via continuous-learning-v2 + `/uzys:auto`
3. **Lean by design** — feature additions only after "is this in ECC already?" check; quarterly P10 audit

## License

MIT — Copyright (c) 2026 Jay (Uzys Jung). See [LICENSE](./LICENSE).

## References

Core design influences (full asset catalog in [Reference.md](./Reference.md)):

- [agent-skills](https://github.com/addyosmani/agent-skills) — 6-gate workflow backbone
- [Everything-Claude-Code](https://github.com/affaan-m/everything-claude-code) — vetted skills/agents/commands
- [Anthropic skills](https://github.com/anthropics/skills) — document workflows (pptx/docx/xlsx/pdf)
- [Impeccable](https://github.com/pbakaus/impeccable) — design quality
- [Railway](https://docs.railway.com) — deployment integration
- [HyperAgents](https://arxiv.org/abs/2603.19461) — self-improvement architecture
- [gitagent](https://github.com/open-gitagent/gitagent) — SOD via reviewer subagent
- Karpathy LLM observations + Anthropic Harness Design — principles 1–11
