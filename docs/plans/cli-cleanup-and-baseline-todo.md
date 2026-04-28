# Todo: v0.8.0 BREAKING — CLI alias 제거 + Codex baseline 옵션 + npx skills 제어

> **Linked plan**: `docs/plans/cli-cleanup-and-baseline-plan.md`
> **Linked SPEC**: `docs/specs/cli-cleanup-and-baseline.md`
> **Target tag**: v0.8.0 (BREAKING)

---

## Phase 1 — Alias 제거

- [ ] **P1-T1** `src/cli-targets.ts` parseCliTargets — `both`/`all` alias 분기 + warning emit 제거 (invalid input fall through)
- [ ] **P1-T2** `src/types.ts` — `CliMode`/`CLI_MODES`/`isCliMode` 삭제
- [ ] **P1-T3** `src/commands/install.ts` — `CliMode`/`isCliMode` import + `CliMode_` re-export 정리
- [ ] **P1-T4** `tests/cli-targets.test.ts` — alias case 갱신 (both/all → invalid reject + error 메시지 검증)
- [ ] **P1-T5** `tests/install.test.ts` it.each — both/all alias case 갱신 또는 제거

---

## Phase 2 — Baseline 조건부

- [ ] **P2-T1** `src/installer.ts` runInstall — `targets.includes("claude")` false 시 baseline copy + `.claude/` 디렉토리 생성 skip. envFiles, mcp 등 영향 검토
- [ ] **P2-T2** `BaselineReport` — `claudeBaselineSkipped: boolean` 또는 categories 처리 갱신
- [ ] **P2-T3** `src/commands/install.ts` Phase 1 헤더 — claude 미포함 시 `(skipped)` 표시
- [ ] **P2-T4** `formatOptions` 또는 Summary — claude 미포함 시 `.claude/` 미표시
- [ ] **P2-T5** unit test — claude 미포함 3 combination에서 `.claude/CLAUDE.md` 미생성 검증

---

## Phase 3 — 매트릭스 갱신

- [ ] **P3-T1** `tests/installer-cli-matrix.test.ts` `expectedFor()` — `claudeBaseline` 필드 추가
- [ ] **P3-T2** per scenario — `expect(existsSync(.claude/CLAUDE.md)).toBe(exp.claudeBaseline)` 추가
- [ ] **P3-T3** invariant — 3 case (`[codex]`, `[opencode]`, `[codex,opencode]`) `.claude/` 미생성 검증
- [ ] **P3-T4** regression — 4 case (claude 포함) `.claude/` 생성 그대로 PASS

---

## Phase 4 — npx skills 분석 + 제어

- [ ] **P4-T1** `npx skills add --help` 또는 GitHub 검색 — single-CLI install flag 존재 여부 조사
- [ ] **P4-T2** 결과 분기:
  - (a) flag 발견 → `src/external-installer.ts` `installSkill` 호출에 flag 추가
  - (b) 미발견 → `.gitignore`에 `.factory/` `.goose/` 자동 추가 (env-files.ts 확장)
- [ ] **P4-T3** unit test — flag 적용 또는 .gitignore 검증
- [ ] **P4-T4** `docs/USAGE.md` — `.factory/.goose/` 안내 + 제어 방법 명시

---

## Phase 5 — Docs

- [ ] **P5-T1** `CHANGELOG.md` v0.8.0 dual BREAKING entry + 마이그레이션 코드 블록
- [ ] **P5-T2** `README.md` / `README.ko.md` — Breaking changes 섹션 + alias 제거 + .claude/ 조건부 안내
- [ ] **P5-T3** `docs/USAGE.md` — Multi-CLI 섹션 갱신 (alias 제거 + .claude/ 조건부 + .factory/.goose/)
- [ ] **P5-T4** `docs/dogfood/v0.8.0-2026-04-XX.md` — Mock dogfood 리포트

---

## Phase 6 — Review & Ship

- [ ] **P6-T1** reviewer subagent 5축 리뷰 — CRITICAL = 0
- [ ] **P6-T2** `npm run ci` PASS — typecheck + lint + test:coverage(90/88/90/90) + build
- [ ] **P6-T3** `package.json` 0.7.1 → 0.8.0
- [ ] **P6-T4** ship-checklist 통과
- [ ] **P6-T5** Self-Audit 5항목
- [ ] **P6-T6** PR → squash merge → v0.8.0 태그

---

## 완료 조건

- [ ] SPEC AC1~AC8 모두 Pass
- [ ] Phase 1~6 모든 task 완료
- [ ] regression 0 (cli-multi-select.md / codex-project-prompts.md 회귀 0)
- [ ] vitest threshold 충족
- [ ] v0.8.0 태그 push
