# OpenCode 호환 매트릭스 — 2026-04-25

> **Source**: Context7 `/anomalyco/opencode` + `/websites/opencode_ai_plugins`. SPEC `docs/specs/opencode-compat.md` AC + ADR-004 v1 입력.
> **비교 기준**: Codex 매트릭스(`docs/research/codex-compat-matrix-2026-04-24.md` 형식 답습) + 이번 OpenCode 리서치.

---

## 1. CLI/구조 비교

| 측면 | Claude Code (SSOT) | Codex 1차 | OpenCode 2차 |
|------|--------------------|-----------|--------------|
| Config 포맷 | `.claude/`, `.mcp.json` (JSON) | `~/.codex/config.toml` + 프로젝트 `.codex/config.toml` (TOML) | `opencode.json` (JSON, Claude와 가장 가까움) |
| Project guide | `CLAUDE.md` | `AGENTS.md` (글로벌+프로젝트 2단) | `AGENTS.md` (Codex와 동일) |
| Custom rules | `.claude/rules/*.md` | `AGENTS.md` 계층 merge (`child_agents_md` flag) | `instructions: ["path/*.md"]` 키 (`opencode.json`) — glob + 원격 URL 지원 |
| Slash 커맨드 | `.claude/commands/uzys/*` (`/uzys:*` 콜론 가능) | namespace 미지원 → `/uzys-spec` (Phase B 결정) | namespace 미지원 가정 → `/uzys-spec` (실측 후 확정) |
| MCP | `.mcp.json` `mcpServers.<name>` | `[mcp_servers.X]` TOML | `mcp.<name>` (JSON, 1:1 가까움) |
| Skills | `.claude/skills/`, `~/.claude/skills/` | `~/.codex/skills/` (`$CODEX_HOME/skills`) | **community plugin `opencode-skills`** 또는 자체 plugin (1차 자체) |
| 글로벌 디렉토리 | `~/.claude/` | `~/.codex/` (opt-in 한정) | `~/.opencode/` 또는 `OPENCODE_CONFIG_DIR` — **본 SPEC 미수정** |
| Subagent (SOD) | `Task` 도구 + agent 분리 | `multi_agent` flag (`spawn_agent / wait_agent / close_agent`) | `agent.<n>.mode = "subagent"` (`opencode.json`) |

## 2. Hook lifecycle 비교

| Claude Hook | Codex 매핑 | OpenCode 매핑 | 차이 |
|-------------|-----------|---------------|------|
| `PreToolUse` | `[notify]` 단일 후크에서 분기 (포맷 변환) | **`tool.execute.before(input, output)`** | OpenCode가 직접 1:1, 인자 시그니처 명확 |
| `PostToolUse` | `[notify]` 분기 동일 | **`tool.execute.after(input, output)`** 또는 **`toolExecuted(tool, output)`** | 두 개 옵션, `toolExecuted`가 Bus 이벤트 기반 |
| `UserPromptSubmit` | `[notify]` 분기 (HITO 카운터) | **`messageCreated(message, output)`** filter `message.role === "user"` | 메시지 단위 직접 후크. `event.message.updated`도 가능 |
| `Stop` (세션 idle) | (없음 — Codex는 별도 이벤트 노출 안 함) | **`event(({event})=>{})` filter `event.type === "session.idle"`** | OpenCode가 더 풍부 |
| `SessionStart` | (Codex 미노출) | **`sessionCreated(session, output)`** | OpenCode 단독 노출 |
| Compaction | (Claude 자체 처리) | (Codex 자체) | **`experimental.session.compacting`** (실험적) |
| Custom tool | `.mcp.json` 또는 in-process | (Codex `[mcp_servers]`) | **`tool: { [name]: tool({...}) }`** plugin export |

**결론**: OpenCode plugin lifecycle은 Claude hook 3종 모두에 대해 **shell wrapper 우회 불필요**. 직접 1:1 또는 1:N 매핑 가능.

## 3. Plugin Context 시그니처

```typescript
import type { Plugin, PluginInput, Hooks } from "@opencode-ai/plugin"

const MyPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  const { project, client, $, directory, worktree } = input
  // project.id  — 프로젝트 식별자
  // client      — OpenCode HTTP 클라이언트 (event subscribe, permission reply 등)
  // $           — Bun-style shell ($`command`)
  // directory   — 워킹 디렉토리
  // worktree    — git worktree 경로
  return {
    "tool.execute.before": async (input, output) => { /* PreToolUse */ },
    "tool.execute.after":  async (input, output) => { /* PostToolUse */ },
    messageCreated:        async (message, output) => { /* UserPromptSubmit */ },
    event:                 async ({ event }) => { /* session.idle 등 */ },
  }
}

export default MyPlugin
```

## 4. Event Bus (event 후크)

OpenCode가 노출하는 주요 이벤트:

- `session.idle`, `session.status`, `session.error`
- `message.updated`, `message.part.updated`
- `permission.asked`
- (확장 가능 — 버전별 차이)

본 SPEC에서 사용:
- `session.idle` → 세션 종료 검출 (HITO 통계 마무리 옵션)
- `message.updated` → user role 필터로 prompt 카운트 (백업 경로 — `messageCreated`가 1차)

## 5. Plugin 로드 메커니즘

| 위치 | 적용 |
|------|------|
| `opencode.json` `plugins: ["./path/to/plugin.ts"]` | 프로젝트 스코프 — 1차 채택 |
| `OPENCODE_CONFIG_DIR/plugins/*.ts` | 글로벌 — **본 SPEC 미사용** (D16) |
| npm `@opencode-ai/plugin-*` | 패키지 형태 — 후속 ADR (OQ5) |

## 6. 갭 / 한계

| 갭 | 영향 | 완화 |
|----|------|------|
| `tool.execute.before/after` 인자가 Claude의 `tool_input`/`tool_response`와 정확히 동일 형식인지 미확인 | 매핑 시 필드 변환 필요 | Phase E1 실측 + ADR-004 v2에 표준 변환 함수 정의 |
| `messageCreated` 가 user prompt 외 system message도 fire 하는지 미확인 | HITO 오집계 위험 | `message.role === "user"` 필터 + `message.type` 검증 |
| Slash 커맨드 namespace (`uzys:` 콜론) OpenCode 허용 여부 미확인 | 1차 가정 `uzys-spec` (Codex 일관) | Phase B2 실측 |
| `experimental.session.compacting` 안정성 | 실험 단계 — 본 SPEC에서 사용 안 함 | 1차는 미채택 |

## 7. 결론

- **호환성**: Codex 1차 대비 **상위** — Hook lifecycle 직접 매핑 가능, shell wrapper 불필요.
- **재사용**: AGENTS.md 구조는 Codex 산출물 90%+ 그대로. transform 패턴(`src/codex/`)도 90%+ 답습 가능.
- **신규**: Plugin (TS/JS) 1개 + `opencode.json` 스키마 + slash prefix 결정 (실측).

Phase A → B 진입 가능.

---

## 참고 (1차 출처)

- `/websites/opencode_ai_plugins` (Context7) — Plugin docs
- `/anomalyco/opencode` (Context7) — SDK Plugin type, event subscribe API
- 인용 코드 예시는 본 매트릭스 §3에 인용

## Changelog

- 2026-04-25: 초안 작성. SPEC `docs/specs/opencode-compat.md` Phase A1/A2 산출.
