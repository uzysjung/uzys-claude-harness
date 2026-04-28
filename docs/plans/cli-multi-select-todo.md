# Todo: v0.7.0 CLI multi-select + Codex slash

> **Linked plan**: `docs/plans/cli-multi-select-plan.md`
> **Linked SPEC**: `docs/specs/cli-multi-select.md`
> **Target tag**: v0.7.0 (BREAKING)

---

## Phase 1 — Type 전환

- [ ] **P1-T1** `src/types.ts` — `CliBase` union (`"claude"|"codex"|"opencode"`) + `isCliBase` 가드
- [ ] **P1-T2** `src/types.ts` — `CliTargets = ReadonlyArray<CliBase>` (sorted) + `InstallSpec.cli` 변경
- [ ] **P1-T3** `src/cli-targets.ts` 신규 — `parseCliTargets(input): { targets, warnings }` (repeatable + alias 변환 + invalid reject)
- [ ] **P1-T4** `tests/cli-targets.test.ts` 신규 — 8 case (7 combination + 2 alias + invalid)

---

## Phase 2 — Prompt 변환

- [ ] **P2-T1** `src/prompts.ts` `selectCli` `select` → `multiselect` (3 base + default `["claude"]` + required: true)
- [ ] **P2-T2** `src/interactive.ts` cli 결과 → CliTargets 직렬화
- [ ] **P2-T3** `tests/interactive.test.ts` — multiselect 결과 array

---

## Phase 3 — flag 파싱

- [ ] **P3-T1** `src/commands/install.ts` `InstallOptions.cli: string \| string[]` + cac `{ type: [String] }`
- [ ] **P3-T2** `installAction` — `parseCliTargets(options.cli)` + warnings stderr emit
- [ ] **P3-T3** `tests/install.test.ts`, `tests/cli.test.ts` — repeatable + alias warning

---

## Phase 4 — Pipeline 분기

- [ ] **P4-T1** `src/installer.ts` 모든 `cli === "..."` 분기를 `targets.includes("...")`로 변환 (Codex / OpenCode transform 호출 분기)
- [ ] **P4-T2** `src/commands/install.ts` `formatCliPhaseTitle(targets)` + Summary `CLIs` `targets.join(" · ")`
- [ ] **P4-T3** integration regression — 7 combination per Track 1개 smoke

---

## Phase 5 — 매트릭스 테스트

- [ ] **P5-T1** `tests/installer-cli-matrix.test.ts` — 11 × 7 = 77 시나리오 + invariant
- [ ] **P5-T2** invariant `TRACKS.length=11 × COMBINATIONS=7 = 77` 명시
- [ ] **P5-T3** regression — 기존 5 mode 시나리오 부분집합 검증

---

## Phase 6 — Codex prompts (Major CR)

- [ ] **P6-T1** `src/types.ts` `OptionFlags.withCodexPrompts: boolean` + DEFAULT false
- [ ] **P6-T2** `src/prompts.ts` `OPTION_DEFS` entry 추가 (label + hint)
- [ ] **P6-T3** `src/commands/install.ts` `--with-codex-prompts` cac flag
- [ ] **P6-T4** `src/interactive.ts` `toOptionFlags` 매핑
- [ ] **P6-T5** `src/codex/prompts.ts` 신규 — `renderCodexPrompt({source, phase}): string` (front matter description + body, slash rename)
- [ ] **P6-T6** `src/codex/opt-in.ts` `runCodexOptIn` 분기 — `withCodexPrompts=true` 시 `~/.codex/prompts/uzys-*.md` 6 file 복사 (idempotent)
- [ ] **P6-T7** `CodexOptInReport.promptsInstalled: { enabled, count }` 추가
- [ ] **P6-T8** `tests/codex/prompts.test.ts` 신규 — `renderCodexPrompt` 4 case
- [ ] **P6-T9** `tests/codex/opt-in.test.ts` 확장 — `withCodexPrompts` 4 case (true/false × source 존재/부재)

---

## Phase 7 — Docs

- [ ] **P7-T1** `docs/USAGE.md` "Multi-CLI 설치" 섹션 (7 combination 예제 + alias deprecation)
- [ ] **P7-T2** `docs/USAGE.md` "Codex slash 통일" 섹션 (`--with-codex-prompts` opt-in + Claude vs Codex slash 차이)
- [ ] **P7-T3** `README.md` / `README.ko.md` — Quick start `--cli` repeatable + 마이그레이션 1줄 + USAGE link
- [ ] **P7-T4** `docs/REFERENCE.md` — Track/CLI 표 갱신 + alias deprecation
- [ ] **P7-T5** `CHANGELOG.md` v0.7.0 BREAKING entry + 마이그레이션 코드 블록
- [ ] **P7-T6** `docs/dogfood/v0.7.0-2026-04-XX.md` Mock dogfood — multiselect + flag repeatable + Codex prompts opt-in 시나리오

---

## Phase 8 — Review & Ship

- [ ] **P8-T1** reviewer subagent 5축 리뷰 — CRITICAL = 0
- [ ] **P8-T2** `npm run ci` PASS — typecheck + lint + test:coverage(90/88/90/90) + build
- [ ] **P8-T3** `package.json` 0.6.6 → 0.7.0 + CHANGELOG 확정
- [ ] **P8-T4** ship-checklist 통과
- [ ] **P8-T5** Self-Audit 5항목
- [ ] **P8-T6** PR → squash merge → v0.7.0 태그 + push

---

## 완료 조건

- [ ] SPEC AC1~AC7 모두 Pass
- [ ] Phase 1~8 모든 task 완료
- [ ] regression 0
- [ ] vitest 451 → 470+ / coverage threshold 충족
- [ ] v0.7.0 태그 push
