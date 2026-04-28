# SPEC: Codex `.codex/prompts/` project-scoped pre-positioning (v0.7.1)

> **Status**: Accepted (2026-04-29)
> **Predecessor**: v0.7.0 (CLI multi-select + Codex slash 글로벌 opt-in)
> **Trigger**: 사용자 — "글로벌 안 건드리고 Codex slash 작동 가능한가?"
> **Target Tag**: v0.7.1 (non-breaking)
> **Issue Tracking**: disabled

---

## 1. Objective

`<project>/.codex/prompts/uzys-{6 phase}.md`를 install 시 자동 생성. 글로벌 `~/.codex/prompts/` 영향 0. upstream Codex 지원 시 자동 작동 — **future-proof**.

**3가지 결과**:
1. **Project-scoped pre-positioning**: `--cli codex` 포함 시 `<projectDir>/.codex/prompts/uzys-*.md` 6 file 자동 생성. opt-in 아님 (글로벌 영향 0이라 default OK).
2. **Reviewer followup (1번 묶음)**: v0.7.0 reviewer MEDIUM/LOW 정리 — `CliMode` `@deprecated` 마크, SORT_ORDER 중복 해소, comma-separated 입력 에러 메시지 개선.
3. **upstream watch**: README/USAGE에 Codex `#9848` (project-scoped prompts) 인용 + 지원 시 자동 작동 안내.

## 2. 판단 기준

### 4-gate 판정

| Gate | 판정 |
|------|------|
| Trend | ✅ Codex Issue #9848 — upstream pending. project-scoped 채택 추세 |
| Persona | ✅ Codex 사용자 — 글로벌 영향 회피 |
| Capability | ✅ free upgrade 패턴 (현재 미작동, 미래 작동) |
| Lean | ✅ `runCodexTransform`에 1 step 추가만. 기존 transform 함수 재사용 |

**4/4 Pass**.

### 완료 조건 (AC)

- **AC1** `runCodexTransform`이 `<projectDir>/.codex/prompts/uzys-{spec,plan,build,test,review,ship}.md` 6 file 생성. `--cli codex` 포함 시.
- **AC2** Source는 `templates/commands/uzys/<phase>.md` (single source 유지) → `renderCodexPrompt` 변환 (v0.7.0 함수 재사용).
- **AC3** 글로벌 `~/.codex/prompts/` 영향 0. (기존 `--with-codex-prompts` opt-in 경로는 그대로 유지 — 즉시 효과 원하는 사용자 위해).
- **AC4** Reviewer followup (v0.7.0 후속):
  - `CliMode` / `isCliMode` `@deprecated` JSDoc 마크
  - `SORT_ORDER` 중복 해소 (cli-targets.ts → prompts.ts import)
  - `parseCliTargets` comma-separated 입력 에러 메시지에 "use --cli X --cli Y" 힌트 추가
- **AC5** README + USAGE 갱신 — `.codex/prompts/` 자동 생성 안내 + upstream #9848 인용
- **AC6** regression 0 — 기존 508 vitest + matrix 11×7=77 + invariant 9 = 86 모두 PASS. `~/.codex/prompts/` 글로벌 opt-in (`--with-codex-prompts`) 그대로 작동

## 3. 결정 일람

### 3.1 포함 (In Scope)

| ID | 작업 | 영역 |
|----|------|------|
| F1 | `runCodexTransform` step 5 추가 — `.codex/prompts/uzys-*.md` 6 file 생성 | `src/codex/transform.ts` |
| F2 | `CodexTransformReport.promptFiles: string[]` 추가 | `src/codex/transform.ts` |
| F3 | install renderer Phase 3에 `.codex/prompts/uzys-*` row 추가 | `src/commands/install.ts` |
| F4 | `CliMode` / `isCliMode` `@deprecated` JSDoc + `CLI_MODES` 사용처 정리 | `src/types.ts`, `src/commands/install.ts` |
| F5 | `SORT_ORDER` 중복 해소 — `src/cli-targets.ts`에 export → `prompts.ts` import | `src/cli-targets.ts`, `src/prompts.ts` |
| F6 | `parseCliTargets` comma-separated 에러 메시지 — "If you meant multiple, use --cli A --cli B" 힌트 | `src/cli-targets.ts` |
| F7 | unit test — F1~F6 (transform 6 file 생성, 에러 메시지 힌트, deprecated 마크) | `tests/codex/transform.test.ts`, `tests/cli-targets.test.ts` |
| F8 | README/USAGE — `.codex/prompts/` 자동 생성 안내 + upstream #9848 link + Codex가 미지원이라 수동 symlink 안내(선택) | docs |
| F9 | CHANGELOG v0.7.1 entry | docs |

### 3.2 제외 (Non-Goals)

- **`--with-codex-prompts` opt-in 제거** — v0.7.0 글로벌 path 그대로 유지. 즉시 효과 원하는 사용자용
- **CLI alias 제거** — v0.8.0 별도 SPEC
- **`.factory/.goose/` 제어** — v0.8.0 별도
- **`.claude/` Codex 단독 dead weight** — v0.8.0 별도
- **Codex symlink 자동 생성** — `<project>/.codex/prompts/` ↔ `~/.codex/prompts/` 글로벌 symlink는 D16 위반 risk

### 3.3 DO NOT CHANGE

- `~/.claude/`, `~/.codex/`, `~/.opencode/` 글로벌 영역 (D16)
- `docs/SPEC.md` (Phase 1 Finalization, v28.0.0)
- 기존 `cli-multi-select.md` (v0.7.0 ship)
- `karpathy-hook-autowire.md`, `codex-compat.md`, `opencode-compat.md`
- 기존 8 ALWAYS_HOOKS, manifest, external assets catalog

### 3.4 Open Questions

모두 잠정 채택 (v0.7.1 patch라 OQ 최소화):
- OQ1: `.codex/prompts/` 자동 생성 default — `--cli codex` 포함 시 자동. opt-out 옵션 미제공 (필요 없음).
- OQ2: 기존 `--with-codex-prompts` 글로벌 opt-in 유지 — 즉시 효과 사용자용. v0.8+ upstream #9848 지원 확인 후 deprecation 검토.

## 4. Phase 분해

| Phase | 산출 | 검증 |
|-------|------|------|
| **P1** Codex transform 확장 | F1, F2 — `.codex/prompts/` 6 file 생성 | unit test |
| **P2** Install renderer | F3 — Phase 3 row 추가 | smoke test |
| **P3** Reviewer followup | F4, F5, F6 | unit test (deprecated, error message) |
| **P4** Docs | F8, F9 | grep |
| **P5** Review & Ship | reviewer + ship | tag |

## 5. Testing Strategy

CLI tool. DB 없음. vitest threshold 90/88/90/90 유지.

E2E:
- 매트릭스 11×7=77 — `.codex/prompts/` 자동 생성 검증 (`--cli codex` 포함 combination)
- regression 0 — 508 → 510+ tests

## 6. Boundaries

### Always
- 글로벌 `~/.codex/` 영향 0 (project-scoped pre-positioning 만)
- `--with-codex-prompts` opt-in path 그대로 유지
- vitest threshold 충족

### Never
- 글로벌 영역 자동 수정
- DO NOT CHANGE SPEC 침범

## 7. Risks

| Risk | 완화 |
|------|------|
| upstream #9848 미해결 시 .codex/prompts/ 작동 X | "free upgrade" 명시. 현재는 mention 또는 글로벌 opt-in 안내 |
| transform 단계 추가로 install 시간 증가 | 6 file write — negligible |

## 8. Migration

v0.7.0 → v0.7.1 — non-breaking. `--cli codex` 포함 시 자동으로 `.codex/prompts/uzys-*.md` 6 file 추가 생성. 글로벌 opt-in (`--with-codex-prompts`)도 그대로.

---

## Changelog

- 2026-04-29: 초안 작성 + Accepted. v0.7.0 followup MEDIUM/LOW + project-scoped pre-positioning 묶음.
