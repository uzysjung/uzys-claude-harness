# CLI Rewrite Dogfood — 2026-04-25

> **SPEC**: `docs/specs/cli-rewrite.md` Phase G
> **ADR**: `docs/decisions/ADR-003-cli-rewrite-typescript.md` (Accepted)
> **Branch**: `feat/cli-rewrite-phase-g`
> **Bundle**: `dist/index.js` 102.56 KB ESM
> **Predecessor (deleted)**: `scripts/setup-harness.sh` 1453 LOC bash

## SPEC AC 검증

| AC | 결과 | 증거 |
|----|------|------|
| **AC1** `npx ... install --track <T>` 무인 1 Track | ✅ | 9/9 dogfood (아래) |
| **AC2** clack prompt 가시화 + `/dev/tty` stderr 0 | ✅ | `node dist/index.js </dev/null` → 메시지 + exit 2, 노이즈 0 |
| **AC3** 9 Track fresh install 9/9 | ✅ | **9/9 PASS (이번 dogfood)** |
| **AC4** Vitest 30+ tests, 커버리지 ≥ 90% | ✅ | 198 tests, lines 96.78% / branches 91.27% / functions 97.05% |
| **AC5** 모듈 ≤ 300줄 / 총 ≤ 2000줄 | ✅ | src 14 모듈, 최대 247줄 (manifest.ts), 총 ~1300줄 |
| **AC6** templates / .claude / 글로벌 미변경 | ✅ | `git diff` 0 변경 |
| **AC7** `npx` 실행 가능 | ✅ | `npx -y github:uzysjung/uzys-claude-harness#main install ...` 동작 |

## 9 Track 라이브 dogfood

각 Track 별 임시 디렉토리에 `node dist/index.js install --track <T>` 무인 실행:

| # | Track | exit | `.claude/CLAUDE.md` | `.mcp.json` | `.installed-tracks` |
|---|-------|------|---------------------|-------------|---------------------|
| 1 | tooling | 0 | ✓ | ✓ | tooling |
| 2 | csr-supabase | 0 | ✓ | ✓ | csr-supabase |
| 3 | csr-fastify | 0 | ✓ | ✓ | csr-fastify |
| 4 | csr-fastapi | 0 | ✓ | ✓ | csr-fastapi |
| 5 | ssr-htmx | 0 | ✓ | ✓ | ssr-htmx |
| 6 | ssr-nextjs | 0 | ✓ | ✓ | ssr-nextjs |
| 7 | data | 0 | ✓ | ✓ | data |
| 8 | executive | 0 | ✓ | ✓ | executive |
| 9 | full | 0 | ✓ | ✓ | full |

**9/9 PASS**.

## 디자인 명시성 (사용자 보고 대응)

### Before (bash 1453 LOC)

```
[INFO] Tracks: tooling
[INFO] Files copied: 35
[INFO] Dirs copied: 9
... (read -p prompts mixed with /dev/tty: Device not configured stderr noise)
```

### After (TypeScript + design.ts)

```
› Install — tooling

  Tracks:          tooling
  CLI:             both
  Target:          /tmp/x

✓ Files copied:    35
✓ Dirs copied:     9
✓ MCP servers:     chrome-devtools, context7, github
✓ Codex:           AGENTS.md + .codex/{config.toml, 3 hooks} + 6 skills

Install complete.
```

- **Header** (`›` arrow + bold cyan title) — 시각 위계 명확
- **Key-value alignment** — 16자 좌측 정렬
- **Status symbols** — `✓` green / `⚠` yellow / `✗` red / `•` cyan
- **NO_COLOR 존중** — 비-TTY 환경에선 plain text fallback

인터랙티브 prompt는 `@clack/prompts`가 ↑↓ 화살표 + Space 토글 + Enter 확정으로 입력 대기 시점 시각화. **사용자가 "추가 옵션 텍스트만 나오고 터미널이 멈춘 것처럼 보임" 라고 보고한 핵심 문제 직접 해소**.

## CI 결과

| 단계 | 결과 |
|------|------|
| typecheck | tsc --noEmit PASS |
| lint | biome PASS |
| test | **198 tests pass** (18 파일) |
| coverage | lines 96.78% / branches 91.27% / functions 97.05% / statements 96.78% |
| build | dist/index.js 102.56 KB ESM single bundle |
| 9 Track dogfood | 9/9 PASS |

## 모듈 인벤토리 (AC5)

```
src/
├── cli.ts              52  (cac CLI builder + defaultAction)
├── design.ts           63  (ANSI helper + symbols + layout)
├── fs-ops.ts           62  (copy / backup / skeleton / ensureDir)
├── index.ts            4   (bin entrypoint)
├── installer.ts        139 (orchestrator + Codex 통합)
├── interactive.ts      155 (clack flow + 5-action 분기)
├── manifest.ts         247 (9 Track 매니페스트 데이터)
├── mcp-merge.ts        122 (TSV 파서 + base 보존 + Track-aware 추가)
├── prompts.ts          100 (clack 어댑터)
├── router.ts           64  (5-action 메뉴 빌더)
├── state.ts            76  (.installed-tracks + legacy 추정)
├── track-match.ts      26  (bash glob 호환)
├── types.ts            50  (TRACKS 9, CLI_MODES, OptionFlags)
├── codex/
│   ├── agents-md.ts    64  (CLAUDE.md → AGENTS.md)
│   ├── config-toml.ts  95  (placeholder + [mcp_servers.X])
│   ├── skills.ts       72  (uzys command → SKILL.md)
│   ├── transform.ts    125 (5단 오케스트레이터)
│   └── trust-entry.ts  45  (멱등 trust 등록)
└── commands/
    └── install.ts      170 (specFromOptions + installAction)
```

총: **18 파일 / 1731 LOC** (test 미포함). 단일 파일 최대 247줄 (manifest.ts) — 모두 ≤ 300줄.

## 결론

**Phase G 완료 + 사용자 보고 핵심 문제 해소**. ADR-003 Status: Proposed → **Accepted**.

후속:
- 본 PR(#TBD) 머지 + v0.2.0 또는 v28.0.0 태그 결정 (Foundation 통합 시점)
- npm publish 결정 (별도 ADR — 외부 영입 시점)
- Phase 1 Finalization SPEC AC3 HITO baseline 경과 후 v28.0.0 (Foundation 완료 선언)
