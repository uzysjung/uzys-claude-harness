# Claude Code Agent Harness

멀티 역할(CEO/CTO/CISO/CPO/CSO/데이터 사이언티스트)과 멀티 트랙 기술 스택을 위한 Claude Code 하네스 시스템. agent-skills를 워크플로우 뼈대로, ECC cherry-pick을 도구 레이어로, 11개 행동 원칙을 기반으로 동작한다.

## Architecture

**프로젝트 스코프 전용**. 글로벌 `~/.claude/`는 절대 건드리지 않음.

```
┌─────────────────────────────────────────────────────────────┐
│                Project (.claude/)                            │
│  CLAUDE.md (11 Principles + Decision Meta-Rule + Gates)     │
│  agents/ (reviewer, data-analyst, strategist + ECC 2개)     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  commands/    │  │  rules/      │  │  skills/     │      │
│  │  uzys:* (6)  │  │  git-policy  │  │  CL-v2 (ECC) │      │
│  │  ecc:*  (8)  │  │  test-policy │  │  spec-scaling │      │
│  │              │  │  [track...]  │  │  strategic-  │      │
│  │              │  │              │  │  compact     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  agents/     │  │  hooks/      │                         │
│  │  code-review │  │  session-    │                         │
│  │  security-   │  │  start.sh   │                         │
│  │  reviewer    │  │  protect.sh │                         │
│  │  (ECC)       │  │  gate.sh   │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│              Plugins & External Tools                        │
│  agent-skills (Addy Osmani) — Workflow backbone              │
│  Railway — Deployment                                        │
│  Impeccable — Design quality                                 │
│  Anthropic document-skills — pptx/docx/xlsx/pdf              │
│  ECC AgentShield — Security scan                             │
│  GSD (optional) — Large project orchestration                │
└─────────────────────────────────────────────────────────────┘
```

## Tracks

| Track | Stack | Role |
|-------|-------|------|
| `csr-supabase` | Supabase + Edge Functions + React + shadcn/ui + Tauri | Developer |
| `csr-fastify` | Railway + Fastify + React + shadcn/ui + Tauri | Developer |
| `csr-fastapi` | Railway + FastAPI + React + shadcn/ui + Tauri | Developer |
| `ssr-htmx` | Railway + FastAPI + Jinja2 + HTMX + Tailwind/daisyUI | Developer |
| `ssr-nextjs` | Railway + Next.js + React + shadcn/ui | Developer |
| `data` | Python + DuckDB + Trino + ML/DL + PySide6 | Data Scientist |
| `executive` | PPT/Excel/Word/PDF/Proposals/DD | CPO/CSO/CTO |
| `tooling` | Bash + Markdown + CLI tools (meta-projects) | Tool/Harness Developer |
| `full` | Union of all | All roles |

## Core Principles

11 behavioral principles derived from Karpathy's LLM observations, Anthropic Harness Design, and real-world agent operations:

1. **Think Before Acting** — No assumptions. Confirm when ambiguous.
2. **Simplicity First** — Unmentioned = out of scope.
3. **Surgical Changes** — Touch only what's needed. DO NOT CHANGE protection.
4. **Goal-Driven Execution** — Verifiable success criteria.
5. **Separate Eval from Gen** — Implementation ≠ verification (SOD via reviewer subagent).
6. **Long-Running Management** — Phase + human gates.
7. **Fact vs Opinion** — Sources required.
8. **Sprint Contract** — Agree on "done" before starting.
9. **Circuit Breakers** — 3 failures → stop and report.
10. **Harness Maintenance** — Start simple, add only when needed, remove quarterly.
11. **Perimeter Not Blueprint** — Define what+why+boundaries, let agent decide how.

### Design Philosophy

- **HyperAgents**: Meta-improvement editable with human gate. Experience accumulation via auto memory + CL-v2 instincts.
- **gitagent SOD**: Agent definitions version-controlled. Reviewer ≠ implementor. Memory in Git.
- **agent-skills**: 6-gate workflow (Define→Plan→Build→Verify→Review→Ship) as the backbone.

## Installation

### Prerequisites

- Node.js 22+
- Git
- Claude Code CLI
- jq (recommended)

### Quick Start — One-liner 설치

```bash
# 프로젝트 디렉토리에서 바로 설치 (리포 클론 불필요)
curl -fsSL https://raw.githubusercontent.com/uzysjung/uzysClaudeUniversalEnv/main/install.sh | bash -s -- --track csr-fastapi
```

### 또는 소스에서 설치

```bash
# 1. Clone this repo
git clone https://github.com/uzysjung/uzysClaudeUniversalEnv.git

# 2. Set up a project
cd /path/to/your/project
bash /path/to/uzysClaudeUniversalEnv/setup-harness.sh --track csr-fastapi
```

### setup-harness.sh Options

```bash
bash setup-harness.sh                                    # Interactive mode (Track 선택 프롬프트)
bash setup-harness.sh --track csr-fastapi                # Track 직접 지정
bash setup-harness.sh --track ssr-nextjs --gsd            # GSD 오케스트레이터 포함
bash setup-harness.sh --track tooling                     # 메타 프로젝트 (bash, markdown, CLI)
bash setup-harness.sh --track csr-fastapi --model-routing on  # 모델 라우팅 가이드 활성 (opt-in)
```

### 설치 후 자동 검증 테이블

설치 완료 시 10개 카테고리 검증 결과가 자동 출력됩니다:

```
┌─────────────────┬──────────┬──────────┬─────────┐
│ Category        │ Found    │ Expected │ Status  │
├─────────────────┼──────────┼──────────┼─────────┤
│ Rules           │ 16       │ 16       │ ✅      │
│ Commands uzys:  │ 7        │ 7        │ ✅      │
│ Agents          │ 8        │ 8        │ ✅      │
│ Hooks           │ 9        │ 9        │ ✅      │
│ ...             │          │          │         │
└─────────────────┴──────────┴──────────┴─────────┘
```

### Workflow

```bash
claude                  # Claude Code 시작 (session-start hook 자동)
/uzys:spec              # 1. SPEC 작성 (Define)
/uzys:auto              # 2. 나머지 자동 진행 (Plan → Build → Test → Review → Ship)
                        #    SPEC 정합성 Ralph loop — 될 때까지 반복
```

> **Note**: setup-harness.sh는 항상 프로젝트 스코프. 글로벌 `~/.claude/`는 절대 수정하지 않음.
> ECC 플러그인 (`everything-claude-code`) 순정 설치 + cherry-pick 폴백 병행. Rules는 Claude Code 플러그인 제약으로 safe_copy.
> `--model-routing=on` 활성 시 6-gate별 Haiku/Sonnet/Opus 모델 가이드가 참조 가능.

## References

| Source | Contribution |
|--------|-------------|
| [agent-skills](https://github.com/addyosmani/agent-skills) | Workflow backbone (6-gate) |
| [ECC](https://github.com/affaan-m/everything-claude-code) | CL-v2, code-reviewer, security-reviewer, AgentShield |
| [Anthropic skills](https://github.com/anthropics/skills) | pptx/docx/xlsx/pdf |
| [Railway](https://docs.railway.com) | Deployment |
| [Impeccable](https://github.com/pbakaus/impeccable) | Design quality |
| [GSD](https://github.com/gsd-build/get-shit-done) | Optional orchestrator |
| Karpathy LLM observations | Principles 1-4 |
| Anthropic Harness Design | Principles 5-6, 8, 10 |
| [HyperAgents](https://arxiv.org/abs/2603.19461) | Self-improvement architecture |
| [gitagent](https://github.com/open-gitagent/gitagent) | SOD, SOUL.md, Git-native agents |

## Contributing

### Adding Rules

1. Create `templates/rules/your-rule.md`
2. Add track mapping in `setup-harness.sh` (`TRACK_EXTRA_RULES`)
3. Test with `setup-harness.sh --track <relevant-track>`

### Modifying Agents

All agents: `templates/agents/` (글로벌 디렉토리 없음, 전부 프로젝트 스코프 설치)

### Adding Commands

Create `.md` file in `templates/commands/<namespace>/`

## License

MIT
