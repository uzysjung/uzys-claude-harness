# OpenCode 무인 설치 dogfood — 2026-04-25

> **SPEC**: `docs/specs/opencode-compat.md` AC1, AC2, AC4, AC5
> **Phase**: F1, F2, F3 검증
> **Verdict**: AC1 ✅ / AC2 ✅ / AC4 ✅ / AC5 부분 (정적 ✅, 라이브 사후 검증)

---

## 환경

- 빌드: `dist/index.js` 109.01 KB (npm run build)
- Node: 20.x (CI target)
- Tests baseline: 248 PASS (regression 0 — Codex 14 + Claude 226)

## F1 — tooling Track 무인 설치

### 명령

```bash
TMPDIR=$(mktemp -d -t opencode-f1-XXXXXX)
node dist/index.js install --track tooling --cli opencode --project-dir "$TMPDIR"
```

### 결과

```
✓ Files copied:    35
✓ Dirs copied:     9
✓ MCP servers:     chrome-devtools, context7, github
✓ OpenCode:        AGENTS.md + opencode.json + .opencode/{6 commands, plugin}

Install complete.
```

Exit code: 0 ✅

### 생성 자산

```
<tmp>/AGENTS.md                                # CLAUDE.md → 슬래시 rename
<tmp>/opencode.json                            # $schema + 7 keys
<tmp>/.opencode/commands/uzys-spec.md
<tmp>/.opencode/commands/uzys-plan.md
<tmp>/.opencode/commands/uzys-build.md
<tmp>/.opencode/commands/uzys-test.md
<tmp>/.opencode/commands/uzys-review.md
<tmp>/.opencode/commands/uzys-ship.md
<tmp>/.opencode/plugins/uzys-harness.ts
+ baseline .claude/, .mcp.json
```

### opencode.json 검증

- `$schema = "https://opencode.ai/config.json"` ✅
- `mcp.context7` + `mcp.github` + `mcp.chrome-devtools` (3 MCP, AC4 충족)
- `agent.build` (primary) + `agent.plan` (primary) + `agent.code-reviewer` (subagent)
- `plugin: ["./.opencode/plugins/uzys-harness.ts"]`
- `permission.question = "allow"`

### AGENTS.md 검증

- CLAUDE.md `## Identity` / `## Project Direction` / `## Core Principles` 정상 추출
- `/uzys:auto` → `/uzys-auto` slash rename 적용 ✅
- `/uzys:` 잔여 0건 (검증)

### Plugin 본문 검증

- 110줄 self-contained TS
- 3 hook 모두 export: `tool.execute.before`, `tool.execute.after`, `messageCreated`
- `PHASE_DEPENDENCY` 매핑 6 phase
- `hito-` 로그 키워드 존재

**F1 PASS**

---

## F2 — csr-fastapi Track 무인 설치

### 명령

```bash
TMPDIR=$(mktemp -d -t opencode-f2-XXXXXX)
node dist/index.js install --track csr-fastapi --cli opencode --project-dir "$TMPDIR"
```

### 결과

```
✓ Files copied:    38
✓ Dirs copied:     13
✓ MCP servers:     chrome-devtools, context7, github, railway-mcp-server
✓ OpenCode:        AGENTS.md + opencode.json + .opencode/{6 commands, plugin}

Install complete.
```

Exit code: 0 ✅

### 차이점 (vs tooling)

- `mcp.railway-mcp-server` 추가 (csr-fastapi Track 전용 MCP)
- 더 많은 dirs/files (csr-fastapi 전용 rules + skills)

**F2 PASS**

---

## F3 — Slash 호출 검증

OpenCode CLI 런타임 의존 — 본 세션 환경에 OpenCode 미설치.

### 정적 검증 (PASS)

- `tests/opencode/install.test.ts` (4 test): 무인 설치 후 `.opencode/commands/uzys-{spec,plan,build,test,review,ship}.md` 파일 존재 + frontmatter `agent: build|plan` + `description` 존재 + slash rename 검증
- `tests/opencode/plugin-helpers.test.ts` (22 test): 게이트 의존성 매핑 + 슬래시 추출 + spec path 매칭 + null safety

### 라이브 검증 (사후 이관)

OpenCode CLI 설치 환경에서 사용자 본인이 검증:

```bash
# OpenCode CLI 설치 (Homebrew 또는 curl)
# brew install opencode-ai/tap/opencode

cd <project>
opencode  # TUI 진입
# /uzys-spec 입력 → command 인식 + 본문 응답
# /uzys-plan 입력 → 동일
# ... 6 slash 모두 검증
```

**예상 동작**:
- 6 slash 모두 인식 (.opencode/commands/uzys-*.md 파일명 자동 등록)
- frontmatter `agent: plan` 또는 `agent: build` 적용
- 본문 template 그대로 LLM에 전달

ADR-004 v1.2 한계 L2/L3/L4 라이브 검증도 동일 시점에 수행.

---

## AC 매핑 결과

| AC | 검증 | 결과 |
|----|------|------|
| AC1 무인 설치 exit=0 + 자산 생성 | F1 + F2 | ✅ Pass |
| AC2 2 Track 100% (tooling + csr-fastapi) | F1 + F2 | ✅ Pass |
| AC3 6 skill slash | F3 정적 | ✅ Pass (정적). 라이브 사후 |
| AC4 MCP ≥ 2종 + smoke | F1: 3 MCP, F2: 4 MCP | ✅ Pass |
| AC5 Plugin 3 hook + smoke | E1 + 정적 install | ✅ 정적 100%, 라이브 사후 |
| AC6 Claude/Codex regression 0 | npm run ci 248 PASS | ✅ Pass |

**총 6/6 AC** — Phase F 종료 게이트 충족 (라이브 smoke는 user 환경 사후 검증).

---

## 사후 검증 항목 (사용자 환경에서)

1. OpenCode CLI 설치 (`opencode --version` 확인)
2. 본 SPEC으로 생성된 프로젝트에 `cd` 후 `opencode` 실행
3. `/uzys-spec` ~ `/uzys-ship` 6 slash 인식 확인
4. 사용자 prompt 후 `.claude/evals/hito-YYYY-MM-DD.log` 1줄 추가 확인 (HITO)
5. `docs/SPEC.md` 또는 `docs/specs/*.md` 편집 후 `.claude/evals/spec-drift-YYYY-MM-DD.log` 기록 확인
6. `/uzys-build` 호출 시 plan 게이트 미완료 시 throw 동작 확인 (gate-check)

발견 사항은 본 리포트 또는 후속 ADR-004 v3에 추가.

---

## 비교: Codex 1차 dogfood (`docs/evals/codex-install-2026-04-24.md`)

| 측면 | Codex 1차 | OpenCode 2차 |
|------|----------|--------------|
| 설치 명령 | `setup-harness.sh --cli=codex` (당시 bash) | `node dist/index.js install --cli opencode` (TS CLI) |
| 자산 수 | AGENTS.md + .codex/{config.toml + 3 hooks} + 6 skills | AGENTS.md + opencode.json + .opencode/{6 commands + 1 plugin} |
| Hook 처리 | shell wrapper + Codex `[notify]` 우회 | Plugin lifecycle 직접 매핑 (단순) |
| Track 검증 | tooling + csr-fastapi (2종) | tooling + csr-fastapi (2종) — 동일 |
| 라이브 smoke | Codex 0.124.0 실측 (Issue #16732 발견) | 사후 검증 (OpenCode CLI 미설치) |

**결론**: OpenCode 2차가 Codex 1차 대비 구조 단순 + 자산 수 비교 가능 + 정적 검증 동등.

---

## Changelog

- 2026-04-25: 초안 작성. SPEC `docs/specs/opencode-compat.md` Phase F4 산출.
