# Reference — 외부/내부 자산 카탈로그

이 프로젝트가 **참조하거나 설치하는** 모든 외부/내부 자산의 단일 카탈로그.
출처(공식/검증/community), 적용 Track, 설치 명령, 신뢰 등급을 정리.

> 자동 설치는 `setup-harness.sh --track <track>` 시점에 일어난다.
> 옵션 항목은 대화형 `[y/N]` 프롬프트로 별도 확인.

## 신뢰 등급

| Tier | 의미 | 예 |
|------|------|---|
| ✅ **공식** | Anthropic 또는 stack vendor 공식 | Anthropic skills, Railway, Supabase, MCP servers |
| 🟢 **검증된 third-party** | 알려진 기여자/조직, 활발히 maintained | vercel-labs, addyosmani, K-Dense, wshobson, trailofbits |
| 🟡 **Community** | 개인/소규모, 사용 전 내용 검토 권장 | pbakaus, testdino-hq, alirezarezvani, yonatangross |

## Track 약어

`csr-*` (csr-supabase, csr-fastify, csr-fastapi) / `ssr-*` (ssr-htmx, ssr-nextjs) / `data` / `executive` / `tooling` / `full` (= 모든 dev track union)

---

## 1. Plugins (`claude plugin install`)

| 이름 | 출처 | Tier | Track | 설치 명령 | 용도 |
|------|------|:-:|------|---------|------|
| **agent-skills** | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 🟢 | dev tracks | `claude plugin install agent-skills@addy-agent-skills` | spec-driven development 8단계 워크플로우 |
| **railway-plugin** | [railwayapp/railway-plugin](https://github.com/railwayapp/railway-plugin) | ✅ | dev tracks | `claude plugin install railway-plugin@railway-plugin` | Railway 배포/로그/환경변수 |
| **railway-skills** | [railwayapp/railway-skills](https://github.com/railwayapp/railway-skills) | ✅ | csr-*, ssr-*, full | `claude plugin install railway@railway-skills` | Railway 프로젝트/서비스/배포 관리 (railway-mcp 짝) |
| **supabase agent-skills** | [supabase/agent-skills](https://github.com/supabase/agent-skills) | ✅ | csr-supabase, full | `claude plugin install supabase@supabase-agent-skills` | Auth/Realtime/Storage/RLS |
| **postgres-best-practices** | supabase/agent-skills | ✅ | csr-supabase, full | `claude plugin install postgres-best-practices@supabase-agent-skills` | Postgres 쿼리 최적화 |
| **document-skills** | [anthropics/skills](https://github.com/anthropics/skills) | ✅ | executive, full | `claude plugin install document-skills@anthropic-agent-skills` | docx/pptx/xlsx/pdf/canvas-design 등 |
| **c-level-skills** | [alirezarezvani/c-level-skills](https://github.com/alirezarezvani/c-level-skills) | 🟡 | executive, full | `claude plugin install c-level-skills@c-level-skills` | CEO/CTO 의사결정 프레임워크 |
| **finance-skills** | [alirezarezvani/finance-skills](https://github.com/alirezarezvani/finance-skills) | 🟡 | executive, full | `claude plugin install finance-skills@finance-skills` | 재무 모델링/분석 |
| **data plugin** | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) | ✅ | data, full | `claude plugin install data@knowledge-work-plugins` | SQL 탐색 + matplotlib/seaborn/plotly visualization |

### Optional Plugins (대화형 프롬프트)

| 이름 | 출처 | Tier | 트리거 | 용도 |
|------|------|:-:|------|------|
| **everything-claude-code (ECC)** | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) | 🟢 | 설치 후 `[y/N]` 프롬프트 | 전체 ECC 번들 (글로벌). 이후 `prune-ecc.sh`로 project-local 정제 |
| **trailofbits-skills** | [trailofbits/skills](https://github.com/trailofbits/skills) | 🟢 | dev track 인터랙티브 `[y/N]` | CodeQL + Semgrep 보안 정적 분석 |
| **GSD (Get Shit Done)** | [npm get-shit-done-cc](https://www.npmjs.com/package/get-shit-done-cc) | 🟡 | `--gsd` 플래그 | 대형 프로젝트 오케스트레이션 |

---

## 2. Skills (`npx skills add`)

| 이름 | 출처 | Tier | Track | 설치 명령 | 용도 |
|------|------|:-:|------|---------|------|
| **impeccable** | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | 🟡 | csr-*, ssr-*, full | `npx skills add pbakaus/impeccable --yes` | 디자인 워크플로우 (`/teach`, `/shape`, `/polish` 등) |
| **playwright-skill** | [testdino-hq/playwright-skill](https://github.com/testdino-hq/playwright-skill) | 🟡 | dev tracks | `npx skills add testdino-hq/playwright-skill --yes` | Playwright E2E 테스트 |
| **find-skills** | [vercel-labs/skills](https://github.com/vercel-labs/skills) | 🟢 | dev tracks | `npx skills add vercel-labs/skills --skill find-skills --yes` | 적합한 스킬 검색/추천 |
| **architecture-decision-record** | [yonatangross/orchestkit](https://github.com/yonatangross/orchestkit) | 🟡 | dev tracks | `npx skills add yonatangross/orchestkit --skill architecture-decision-record --yes` | ADR 템플릿/작성 |
| **react-best-practices** | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | 🟢 | csr-*, ssr-nextjs, full | `npx skills add vercel-labs/agent-skills --skill react-best-practices --yes` | React 패턴 |
| **shadcn/ui** | [shadcn/ui](https://github.com/shadcn-ui/ui) | ✅ | csr-*, ssr-nextjs, full | `npx skills add shadcn/ui --yes` | shadcn 컴포넌트 |
| **web-design-guidelines** | vercel-labs/agent-skills | 🟢 | csr-*, ssr-*, full | `npx skills add vercel-labs/agent-skills --skill web-design-guidelines --yes` | 웹 UI 가이드라인 |
| **next-skills** | [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills) | 🟢 | ssr-nextjs, full | `npx skills add vercel-labs/next-skills --yes` | Next.js 패턴 |
| **polars** | [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills) | 🟢 | data, full | `npx skills add K-Dense-AI/scientific-agent-skills --skill polars --yes` | polars lazy/expression deep guide |
| **dask** | K-Dense-AI/scientific-agent-skills | 🟢 | data, full | `npx skills add K-Dense-AI/scientific-agent-skills --skill dask --yes` | larger-than-RAM 분산 (선택) |
| **python-resource-management** | [wshobson/agents](https://github.com/wshobson/agents) | 🟢 | data, full | `npx skills add https://github.com/wshobson/agents --skill python-resource-management --yes` | context manager / ExitStack / async cleanup |
| **python-performance-optimization** | wshobson/agents | 🟢 | data, full | `npx skills add https://github.com/wshobson/agents --skill python-performance-optimization --yes` | cProfile / line_profiler / memory_profiler / py-spy |

---

## 3. MCP Servers (`.mcp.json`)

`.mcp.json`은 프로젝트 스코프로 자동 생성되며, `templates/track-mcp-map.tsv` 기반으로 Track별 조건부 추가.

### 모든 dev track 공통

| MCP | 출처 | Tier | 명령 |
|-----|------|:-:|------|
| **context7** | [Upstash](https://github.com/upstash/context7-mcp) | ✅ | `npx -y @upstash/context7-mcp@latest` |
| **github** | [modelcontextprotocol](https://github.com/modelcontextprotocol/servers/tree/main/src/github) | ✅ | `npx -y @modelcontextprotocol/server-github` |
| **chrome-devtools** | [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | ✅ | `npx -y chrome-devtools-mcp@latest` |

### Track 조건부 (track-mcp-map.tsv 데이터-driven)

| MCP | Track | 명령 |
|-----|------|------|
| **railway-mcp-server** | csr-supabase, csr-fastify, csr-fastapi, ssr-htmx, ssr-nextjs, full | `npx -y @railway/mcp-server` |
| **supabase** | csr-supabase, full | `npx -y @supabase/mcp-server` |

> **신규 MCP 추가**: `templates/track-mcp-map.tsv`에 1줄 추가 → setup-harness.sh 수정 불필요.

---

## 4. Agents (자체 + ECC cherry-pick)

| 에이전트 | 모델 | 출처 | 용도 |
|---------|:-:|------|------|
| **reviewer** | opus | 자체 | SOD 검증 (5축 리뷰). context fork |
| **data-analyst** | opus | 자체 | Python/DuckDB/Trino/ML/PySide6 |
| **strategist** | opus | 자체 | 제안서/DD/PPT/경쟁분석 |
| **code-reviewer** | sonnet | ECC | 일상 코드 리뷰 (CRITICAL→LOW) |
| **security-reviewer** | sonnet | ECC | OWASP Top 10 + 시크릿 탐지 |
| **silent-failure-hunter** | sonnet | ECC | swallowed error / bad fallback 탐지 |
| **build-error-resolver** | sonnet | ECC | TS/build 에러 fix |
| **plan-checker** | sonnet | 자체 | docs/plan.md ↔ todo.md ↔ SPEC.md 정합성 |

---

## 5. Cherry-picked Sources

`.dev-references/cherrypicks.lock` (21건). ECC + GSD에서 발췌해 `templates/`에 복사.
`sync-cherrypicks.sh`로 upstream drift 감지.

| 카테고리 | 항목 |
|---------|------|
| Skills (templates/skills/) | continuous-learning-v2, strategic-compact, deep-research, market-research, eval-harness, verification-loop, e2e-testing, agent-introspection-debugging, python-patterns, python-testing, nextjs-turbopack, investor-materials, investor-outreach |
| Agents (templates/agents/) | code-reviewer, security-reviewer, silent-failure-hunter, build-error-resolver |
| Commands (templates/commands/ecc/) | e2e, eval, harness-audit |
| Rules (templates/rules/) | gates-taxonomy (← GSD) |

---

## 6. 자체 작성 자산

### Skills (templates/skills/)
spec-scaling — SPEC.md > 300줄 시 분리 제안 (자체 작성)

### Commands (templates/commands/uzys/)
spec, plan, build, test, review, ship, auto — 6-gate 워크플로우 + Ralph 루프 진입

### Rules (templates/rules/)
17 파일. CLAUDE.md와 짝. `Docs/SPEC.md`에서 트랙별 적용 조건 정의.

### Hooks (templates/hooks/)
8 파일. 자동 등록 5 (session-start/protect-files/gate-check/agentshield-gate/mcp-pre-exec) + on-demand 3 (spec-drift-check/checkpoint-snapshot/codebase-map).
*v26.16.1 기준. codebase-map은 v26.14.1에서 자동 등록 해제.*

### Hooks (자체 작성)
- `prune-ecc.sh` — ECC plugin 프로젝트 스코프 복사 + 89 KEEP 외 제거
- `setup-harness.sh` — 모든 설치 orchestrator
- `test-harness.sh` — JSON validity / hook unit / track install / multi-track / update mode E2E (5초 quick / 8분 full)
- `sync-cherrypicks.sh` — cherry-pick 출처 drift 감지
- `install.sh` — `curl | bash` 원격 설치 entry

---

## 7. 설치 결정 흐름

```
$ bash setup-harness.sh --track <track> --project-dir .
  ↓
[Prerequisites] Node 22+ / git / claude / jq
  ↓
[Track 선택] (또는 --track으로 명시)
  ↓
[필수 설치] addy agent-skills + Impeccable + Playwright + find-skills + agent-browser + ADR
  ↓
[Track 조건부]
  - csr-*: react-best-practices + shadcn + tauri-aware rule + supabase(csr-supabase만)
  - ssr-htmx: htmx rule
  - ssr-nextjs: next-skills + nextjs rule
  - data: polars + dask + python-resource/performance + Anthropic data plugin
  - executive: c-level + finance + document-skills
  - tooling: cli-development rule
  ↓
[Optional 프롬프트]
  - ECC plugin 프로젝트 스코프 설치? [y/N]
    → y면 prune-ecc.sh 호출 → DELETED/KEPT 목록 표시
  - Trail of Bits security? [y/N] (dev track만)
  ↓
[.mcp.json 생성] track-mcp-map.tsv 기반 조건부 union
  ↓
[Installation Report] ✅/❌ 카운트 표
```

---

## 8. 보안 / 신뢰 정책

- **MCP allowlist**: `.mcp-allowlist` 파일에 화이트리스트 작성 시 `mcp-pre-exec.sh` 훅이 차단 강제. 미작성 시 모든 MCP 호출 통과.
- **글로벌 ~/.claude/ 보호**: `setup-harness.sh --project-dir`이 `~/.claude/*`/`/etc/*` 등 시스템 경로 차단 (D16).
- **`.env` / credentials 수정 차단**: `protect-files.sh` 훅이 `.env`, lock 파일, 인증서 경로 차단.
- **`--no-verify` 차단**: gate-check.sh가 `--no-verify`/`--force` 플래그 사용 시 경고 (`git-policy.md`).

---

## 9. 라이선스 / 책임

각 외부 출처의 라이선스를 따른다 (대부분 MIT/Apache 2.0). 본 카탈로그는 통합 가이드일 뿐 외부 자산의 동작/보안에 대한 보증을 제공하지 않는다. `setup-harness.sh` 실행 전 신뢰 등급(특히 🟡 Community) 검토 권장.
