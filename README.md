# Claude Code Agent Harness

멀티 역할(CEO/CTO/CISO/CPO/CSO/데이터 사이언티스트)과 멀티 트랙 기술 스택을 위한 Claude Code 하네스 시스템. agent-skills를 워크플로우 뼈대로, ECC cherry-pick을 도구 레이어로, 11개 행동 원칙을 기반으로 동작한다.

## CLAUDE.md 위치 (canonical 명시)

이 리포지토리에는 4종류 CLAUDE.md가 있음 — 역할 분리:

| 위치 | 역할 | 누가 사용? |
|------|------|----------|
| `/CLAUDE.md` (root) | **이 메타 리포 자체용** (tooling Track) | uzysClaudeUniversalEnv 개발 시 |
| `/.claude/CLAUDE.md` | **이 메타 리포 적용된 글로벌 원칙** (11 Principles + Decision Meta-Rule) | 이 리포에서 작업 시 Claude가 읽음 |
| `/templates/CLAUDE.md` | **신규 프로젝트로 복사되는 원본 템플릿** | `setup-harness.sh`가 신규 프로젝트의 `.claude/CLAUDE.md`로 복사 |
| `/templates/project-claude/<track>.md` | **신규 프로젝트의 root `/CLAUDE.md`로 복사되는 Track별 가이드** | `setup-harness.sh`가 신규 프로젝트 root에 복사 |

**Canonical 원본**: `/templates/CLAUDE.md` 와 `/templates/project-claude/<track>.md`. 메타 리포 자체의 `/CLAUDE.md` + `/.claude/CLAUDE.md`는 메타 작업용이고, 사용자가 직접 편집하지 않음.

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

### Choosing a Track (결정 가이드)

| 상황 | 권장 Track |
|------|----------|
| Python REST API + React 프론트 | `csr-fastapi` |
| TypeScript REST API + React 프론트 | `csr-fastify` |
| 실시간/Auth/PostgreSQL 우선 (Supabase) | `csr-supabase` |
| SEO 필요 + React (SSR) | `ssr-nextjs` |
| 최소 JS (서버 렌더 + HTMX) | `ssr-htmx` |
| 데이터 분석/ML/DL/PySide6 desktop | `data` |
| 제안서/PPT/재무모델 (코드 없음) | `executive` |
| Bash/CLI/Markdown 메타 프로젝트 | `tooling` |
| 둘 이상 동시 (예: tooling + Python) | `--track tooling --track csr-fastapi` (다중) 또는 `full` |

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

# v26.11.0 — 다중 Track (union 설치)
bash setup-harness.sh --track tooling --track csr-fastapi   # 동시 다중 Track (union)
bash setup-harness.sh --add-track csr-fastapi               # 기존 설치에 Track 추가 (.mcp.json jq merge)
```

### Optional: ECC plugin 89 KEEP prune (v26.10.0+)

ECC plugin 통째 156 skills이 컨텍스트 부담일 때 사용자 정의 89개만 남기고 prune:

```bash
# 1. ECC plugin 설치 (글로벌 user scope)
claude plugin install everything-claude-code@everything-claude-code

# 2. project local 복사본 + prune (변경 없음, dry-run 기본)
bash prune-ecc.sh
bash prune-ecc.sh --apply --force   # 실제 적용

# 3. 사용 (매번 17자 입력 부담이면 alias 등록)
claude --plugin-dir .claude/local-plugins/ecc
# 또는 ~/.zshrc / ~/.bashrc 에:
# alias claude-ecc='claude --plugin-dir .claude/local-plugins/ecc'
```

D16 안전 (글로벌 read-only). 다른 프로젝트 영향 없음. ECC plugin 업데이트 후 재실행 필요.

### Plugin Marketplace 신뢰 등급

`setup-harness.sh`가 외부 marketplace에서 plugin을 설치합니다. **버전 핀 없이 최신 다운로드** — 사용 전 신뢰 등급 확인:

| Plugin | Marketplace | 신뢰 등급 | 비고 |
|--------|------------|----------|------|
| `agent-skills` | `addyosmani/agent-skills` | ★★★★ 커뮤니티 | Claude Code workflow 표준 |
| `everything-claude-code` | `affaan-m/everything-claude-code` | ★★★ 커뮤니티 | 156 skills (prune-ecc.sh로 89 KEEP 권장) |
| `railway-plugin` | `railwayapp/railway-plugin` | ★★★★★ 공식 | Railway 공식 |
| `agent-skills (Supabase)` | `supabase/agent-skills` | ★★★★★ 공식 | Supabase 공식 |
| `document-skills` | `anthropics/skills` | ★★★★★ 공식 | Anthropic 공식 |
| `c-level-skills`, `finance-skills` | `alirezarezvani/*` | ★★ 개인 | 개인 계정 — 검토 후 사용 |
| `npx -y @railway/mcp-server` | npm | 버전 핀 부재 | supply chain 위험 인지 |

신뢰 부족 plugin 차단: `--track executive` 사용 또는 setup-harness.sh의 해당 case 분기 수동 제거.

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
> v26.10.0부터 ECC plugin 통째 설치 대신 **Track별 cherry-pick** (4기준 ALL True 항목만). 이전에 설치한 ECC plugin은 사용자가 직접 `claude plugin uninstall everything-claude-code@everything-claude-code`로 정리.
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
