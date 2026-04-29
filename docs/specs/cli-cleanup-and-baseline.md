# SPEC: v0.8.0 BREAKING — CLI alias 제거 + Codex baseline 옵션 + npx skills 제어

> **Status**: Accepted (2026-04-29)
> **Predecessor**: v0.7.1 (Codex `.codex/prompts/` project-scoped + reviewer followup)
> **Trigger**: 사용자 — "argument 옵션 제거된 상태에서 문제점을 찾자"
> **Target Tag**: v0.8.0 (BREAKING)
> **Issue Tracking**: disabled

---

## 1. Objective

v0.7.0에서 deprecation warning으로 유예한 **CLI legacy alias 제거** + 그 상태에서 사용자 보고 #2/#3 환경 문제 해결.

**3가지 결과**:

1. **CLI alias 제거 (BREAKING)** — `--cli both`/`--cli all` + `CliMode` legacy type 완전 삭제. v0.7.0 SPEC §3.2 Non-Goals "v0.8+에서 제거" 약속 이행.
2. **`.claude/` baseline 조건부 생성 (#2)** — `--cli claude` 미포함 시 `.claude/` 디렉토리 미생성. Codex/OpenCode 단독 설치 사용자에게 dead weight 제거.
3. **`.factory/`/`.goose/` 자동 생성 제어 (#3)** — `npx skills add` universal install 동작 분석 + 사용자에게 controllable path 제공 (flag 또는 `.gitignore`).

## 2. 판단 기준 (불변)

NORTH_STAR §5 4-gate + CLAUDE.md Decision Making.

### 4-gate 판정

| Gate | 판정 | 근거 |
|------|------|------|
| Trend | ✅ | v0.7.0 deprecation 약속 이행 + 사용자 mental model (multi-select 정합) |
| Persona | ✅ | Codex/OpenCode 단독 사용자 — `.claude/` dead weight 제거 |
| Capability | ✅ | alias 제거로 코드 간결, 단일 truth (CliBase × CliTargets) |
| Lean | ✅ | parseCliTargets alias 분기 제거 + Type 단일화 + baseline 조건 분기 추가 |

**4/4 Pass**.

### 완료 조건 (AC)

- **AC1** `parseCliTargets`에서 `both`/`all` alias 분기 제거. invalid input으로 reject (v0.7.0 deprecation warning 분기 삭제).
- **AC2** `CliMode`/`CLI_MODES`/`isCliMode` legacy type 완전 삭제 — `src/types.ts` + 사용처 모두 정리.
- **AC3** `runInstall` baseline copy 분기 — `spec.cli.includes("claude")` false 시 `.claude/` 디렉토리 + `templates/CLAUDE.md` + manifest 미적용. `.codex/`, `.opencode/`, `.agents/skills/`만 생성.
- **AC4** Codex transform — `.claude/CLAUDE.md` 부재 시 fallback (`templates/CLAUDE.md`에서 직접 읽기, ✅ 이미 transform 자체가 harness templates에서 읽음 — 영향 0 검증).
- **AC5** `npx skills add` universal install 분석 — `--target=codex` 등 single-CLI flag 존재 여부 확인 후 (a) flag 사용 / (b) `.gitignore` 자동 추가 + USAGE 안내 중 결정.
- **AC6** 매트릭스 11×7=77 갱신 — `.claude/` 조건부 생성 검증 분기 추가. 7 combination별 baseline 산출물 표 갱신.
- **AC7** **regression 0** — 기존 509 vitest tests 중 alias 검증 관련 case는 invalid reject로 변경 (수정), 그 외 모두 보존. coverage threshold 90/88/90/90 충족.
- **AC8** CHANGELOG v0.8.0 BREAKING entry + 마이그레이션 가이드 + dual breaking 명시.

## 3. 결정 일람

### 3.1 포함 (In Scope)

| ID | 작업 | 영역 |
|----|------|------|
| **F1** | `parseCliTargets` alias 분기 제거 — `both`/`all` 입력은 invalid (force migration) | `src/cli-targets.ts` |
| **F2** | `CliMode`/`CLI_MODES`/`isCliMode` 삭제 + 사용처 정리 | `src/types.ts`, `src/commands/install.ts`, tests |
| **F3** | `tests/cli-targets.test.ts` alias case 갱신 — `both`/`all` → invalid reject 검증 | tests |
| **F4** | `runInstall` baseline 조건부 — `targets.includes("claude")` false 시 `.claude/` 미생성 | `src/installer.ts` |
| **F5** | `BaselineReport` 갱신 — claudeBaselineSkipped 필드 (또는 categories=null로 표현) | `src/installer.ts` |
| **F6** | install renderer — Phase 1 헤더에 `(skipped — no claude target)` 표시 | `src/commands/install.ts` |
| **F7** | 매트릭스 테스트 — `[codex]`/`[opencode]`/`[codex,opencode]` 3 case에서 `.claude/CLAUDE.md` 미생성 검증 | `tests/installer-cli-matrix.test.ts` |
| **F8** | `npx skills add` universal install 분석 — Codex 사용자 환경에서 `.factory/`/`.goose/` 생성 원인 조사 | research |
| **F9** | 결과에 따라 (a) `npx skills add --target=codex` flag 사용 또는 (b) `.gitignore`에 `.factory/` `.goose/` 자동 추가 | `src/external-installer.ts` 또는 `src/env-files.ts` |
| **F10** | unit + integration test — F4~F9 | tests |
| **F11** | docs/USAGE.md / README.md / CHANGELOG.md — BREAKING 마이그레이션 가이드 + #2/#3 안내 | docs |

### 3.2 제외 (Non-Goals)

- **`--with-codex-prompts` 글로벌 opt-in 제거** — D16 합의 패턴, v0.8+에서 upstream 지원 시 검토. 본 SPEC 범위 외.
- **`.claude/` 옵션 추가** — `--with-claude-baseline` 같은 신규 flag는 over-engineering. 단순 `--cli claude` 포함/미포함으로 결정.
- **multi-CLI 산출물 전체 폐기** — Codex/OpenCode 산출물 생성 로직은 그대로.
- **신규 CLI base 추가** (Aider/Cursor 등) — 별도 SPEC.
- **karpathy hook PostToolUse 전환** (ADR-006 후속) — 별도 SPEC.

### 3.3 DO NOT CHANGE

- 글로벌 `~/.claude/`, `~/.codex/`, `~/.opencode/` (D16)
- 기존 SPEC: `docs/SPEC.md` (v28.0.0), `karpathy-hook-autowire.md`, `codex-compat.md`, `opencode-compat.md`, `cli-multi-select.md` (v0.7.0 ship), `codex-project-prompts.md` (v0.7.1 ship)
- `Codex transform` / `OpenCode transform` 함수 자체 (분기만 변경)
- 8 ALWAYS_HOOKS, manifest, external assets catalog
- `.codex/prompts/` project-scoped pre-positioning (v0.7.1)

### 3.4 Open Questions

- **OQ1** alias 제거 시 `--cli both`/`--cli all` 입력 처리 — invalid reject (force migration). 사용자 명시 합의.
- **OQ2** `.claude/` 미생성 시 `installedTracks` metafile (`.installed-tracks`) 생성 위치 — `.codex/` 또는 `.opencode/` 안? 또는 project root? **잠정**: `--cli claude` 포함 시만 `.claude/.installed-tracks` 생성. 미포함 시 metafile 생성 X (다음 install 시 detect_install_state는 `.claude/` 부재로 자연스럽게 "new" 상태).
- **OQ3** `.factory/.goose/` 제어 방법 — `npx skills add` 형식 조사 결과에 따라 결정. 잠정: `.gitignore` 자동 추가 (가장 lean, 외부 도구 동작 변경 X).
- **OQ4** README/USAGE에 `--cli both`/`--cli all` 마이그레이션 가이드 — v0.7.0 deprecation warning 본 사용자에게 명확한 안내. v0.8.0 ship 시 README "Breaking changes" 섹션 + CHANGELOG.

## 4. Phase 분해

| Phase | 산출 | 검증 | 의존 |
|-------|------|------|------|
| **P1** Alias 제거 (F1, F2, F3) | `parseCliTargets` alias 분기 삭제 + `CliMode` 삭제 + tests fixture invalid reject | typecheck + unit test | — |
| **P2** Baseline 조건부 (F4, F5, F6) | `runInstall` baseline copy 분기 + Phase 1 출력 처리 | integration + unit test | — |
| **P3** 매트릭스 갱신 (F7) | 11×7=77 시나리오 — `.claude/` 미생성 케이스 검증 | matrix run | P2 |
| **P4** npx skills 분석 (F8, F9) | research → flag (a) 또는 .gitignore (b) | research + integration test | — |
| **P5** Docs (F11) | USAGE/README/CHANGELOG 갱신 | grep + reviewer pass | P1, P2, P3, P4 |
| **P6** Review & Ship | reviewer + ship-checklist + v0.8.0 태그 | review + tag | P5 |

병행: P1, P2, P4 동시 가능. P3는 P2 후. P5는 P1~P4 모두 후.

## 5. Testing Strategy

### 5.1 환경 (Test Parity)

CLI tool. DB / 외부 서비스 의존 없음.

vitest threshold 90/88/90/90 유지. 기존 509 → +20 신규 (alias 제거 case 갱신 + baseline 조건 + npx skills 분석).

### 5.2 E2E (Mock 금지 항목)

| 플로우 | 성공 기준 |
|--------|----------|
| `--cli both` 입력 | invalid reject + error (alias 제거) |
| `--cli all` 입력 | invalid reject + error |
| `--cli codex` 단독 (claude 미포함) | `.claude/CLAUDE.md` **미생성** + `.codex/config.toml` 생성 |
| `--cli opencode` 단독 | `.claude/CLAUDE.md` 미생성 + `opencode.json` 생성 |
| `--cli codex --cli opencode` (Claude 제외) | `.claude/` 미생성 + 둘 다 생성 |
| `--cli claude --cli codex` | 기존과 동일 (.claude/ + .codex/ 둘 다 생성) |
| 매트릭스 11×7=77 | 7 combination별 baseline 산출물 정합 |

### 5.3 Test Types

- **Unit**: `parseCliTargets` invalid `both`/`all`, `runInstall` baseline 조건 분기.
- **Integration**: install pipeline 7 combination — `.claude/` 조건부 생성 검증.
- **E2E (Mock)**: 11×7=77 매트릭스 + invariant 갱신.

### 5.4 Naming

- `parseCliTargets — both is invalid (alias removed in v0.8.0)`
- `parseCliTargets — all is invalid`
- `runInstall — codex only — does not create .claude/`
- `runInstall — opencode only — does not create .claude/`
- `runInstall — claude+codex — creates .claude/ as before`

## 6. Boundaries

### Always
- v0.7.0 deprecation warning 본 사용자가 명확히 마이그레이션 알 수 있도록 CHANGELOG + README "Breaking changes" 섹션
- alias 제거 시 invalid reject 메시지 — "v0.8.0에서 제거됨. `--cli claude --cli codex` 사용" 명시
- baseline 조건부 — `--cli claude` 미포함 시 `.claude/` 미생성. `--cli claude` 포함이면 기존과 동일
- vitest threshold 충족
- DO NOT CHANGE 영역 미수정

### Ask First
- 새 CLI base 추가
- baseline 옵션 (`--with-claude-baseline` 같은 신규 flag)
- karpathy hook 정책 변경

### Never
- 글로벌 `~/.claude/`, `~/.codex/`, `~/.opencode/` 수정
- DO NOT CHANGE SPEC 침범
- main 직접 commit

## 7. Risks

| Risk | 완화 |
|------|------|
| BREAKING 2건 동시 (alias 제거 + baseline 분기) → 사용자 마이그레이션 부담 | CHANGELOG dual breaking 명시 + README "Breaking changes" + v0.7.0 deprecation warning이 이미 1 release 거침 (alias) |
| `.claude/` 미생성 시 사용자가 `.claude/CLAUDE.md` 의존 도구 못 씀 | `--cli claude` 포함 시 그대로 작동. multi-CLI 사용자가 명시적으로 선택 |
| `.installed-tracks` metafile 부재 시 다음 install에서 detect_install_state 동작 영향 | `.codex/` 또는 `.opencode/` 존재 시 "existing" detect 가능하도록 fallback (또는 `.claude/` 미생성 시 metafile 생략) |
| `npx skills add` universal install 제어 불가 | 외부 도구 동작 — `.gitignore` 자동 추가가 차선. flag 발견 시 더 깔끔 |
| `CliMode` legacy 타입 사용처 누락 | typecheck로 모두 검출 (compile error로 강제 정리) |

## 8. Revision & Escalation

- **Revision 상한**: Phase 내 자동 수정 ≤ 2회.
- **Escalation 트리거**:
  - npx skills CLI single-CLI flag 미발견 → `.gitignore` fallback 자동 채택 (escalation 없이 진행)
  - 매트릭스 시나리오 2분 이상 증가
  - alias 제거 후 사용자 install 실패 case 추가 발견
- **Abort 조건**:
  - DO NOT CHANGE SPEC 침범
  - `~/.claude/`, `~/.codex/`, `~/.opencode/` mtime 변동
  - 기존 cli-multi-select.md / codex-project-prompts.md (v0.7.x) 회귀

---

## Migration guide (사용자용, v0.8.0 ship 시 README + CHANGELOG)

### Breaking 1: CLI alias 제거

```bash
# v0.7.x (deprecation warning)
$ npx ... install --cli both
[WARN] --cli both is deprecated. Use --cli claude --cli codex (will be removed in v0.8+)
✓ install proceeds with [claude, codex]

# v0.8.0 (제거됨)
$ npx ... install --cli both
✘ ERROR: Invalid --cli value: both. Must be one of: claude | codex | opencode
        v0.8.0에서 'both'/'all' alias 제거됨. 명시적 multi-CLI 형식 사용:
        --cli claude --cli codex
```

### Breaking 2: `.claude/` 조건부 생성

```bash
# v0.7.x (이전 — Codex 단독이어도 .claude/ 생성됨)
$ npx ... install --track tooling --cli codex --project-dir .
# → .claude/ + .codex/ + AGENTS.md 모두 생성

# v0.8.0 (이후 — Codex 단독이면 .claude/ 미생성)
$ npx ... install --track tooling --cli codex --project-dir .
# → .codex/ + AGENTS.md + .agents/skills/ + .codex/prompts/ 만 생성
# → .claude/ 디렉토리 자체 미생성

# Claude 자산도 원하면 명시:
$ npx ... install --track tooling --cli claude --cli codex --project-dir .
# → 기존과 동일 (.claude/ + .codex/ 둘 다)
```

### `.factory/.goose/` 자동 생성 (#3)

`npx skills add` 외부 도구가 multi-CLI universal install을 함. v0.8.0에서:
- (분석 결과에 따라) `npx skills add --target=codex` flag 활용 또는
- `.gitignore`에 `.factory/` `.goose/` 자동 추가 + USAGE 안내

---

## Changelog

- 2026-04-29: 초안 작성 + Accepted. Pre-SPEC 접수 4 OQ 명시 (잠정안). 사용자 합의 — alias 제거 + #2 baseline 조건부 + #3 npx skills 제어 단일 BREAKING release.
