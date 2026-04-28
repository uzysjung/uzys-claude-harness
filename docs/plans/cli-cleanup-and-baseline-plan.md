# Plan: v0.8.0 BREAKING — CLI alias 제거 + Codex baseline 옵션 + npx skills 제어

> **Linked SPEC**: `docs/specs/cli-cleanup-and-baseline.md` (Accepted, 2026-04-29)
> **Linked Todo**: `docs/plans/cli-cleanup-and-baseline-todo.md`
> **Target tag**: v0.8.0 (BREAKING)
> **Complexity**: Standard~Complex (multi-file, BREAKING 2 + research P4)

---

## Sprint Contract

### 범위
SPEC §3.1 F1~F11. 3 묶음:
- (1) CLI alias 제거 — `--cli both`/`--cli all` invalid + `CliMode` 삭제
- (2) `.claude/` 조건부 생성 — `--cli claude` 미포함 시 미생성
- (3) `.factory/.goose/` 제어 — research 후 flag (a) 또는 .gitignore (b)

### 제외
SPEC §3.2 그대로.

### 완료 기준
SPEC §2 AC1~AC8 모두 Pass + v0.8.0 태그.

### 제약
- vitest threshold 90/88/90/90 유지
- DO NOT CHANGE 영역 미수정
- 기존 cli-multi-select.md / codex-project-prompts.md 회귀 0
- 글로벌 미수정

---

## Phase 분해

### Phase 1 — Alias 제거 (F1, F2, F3)

| ID | 작업 |
|----|------|
| P1-T1 | `src/cli-targets.ts` `parseCliTargets` — `both`/`all` alias 분기 + warning emit 제거. invalid input으로 fall through |
| P1-T2 | `src/types.ts` — `CliMode`/`CLI_MODES`/`isCliMode` 삭제 |
| P1-T3 | `src/commands/install.ts` — `CliMode`/`isCliMode` 사용처 정리 (`CliMode_` re-export 등) |
| P1-T4 | `tests/cli-targets.test.ts` — alias case 갱신 (both/all → invalid reject 검증) |
| P1-T5 | `tests/install.test.ts` — `it.each` table에서 both/all → "alias removed" reject 검증으로 변경 |

### Phase 2 — Baseline 조건부 (F4, F5, F6)

| ID | 작업 |
|----|------|
| P2-T1 | `src/installer.ts` `runInstall` — `targets.includes("claude")` false 시 baseline copy + `.claude/` skip. envFiles, mcp 등 영향 검토 |
| P2-T2 | `BaselineReport` — `claudeBaselineSkipped: boolean` 또는 `categories?: undefined`로 표현 |
| P2-T3 | `src/commands/install.ts` Phase 1 헤더 — claude 미포함 시 `(skipped — Codex/OpenCode only)` 표시 |
| P2-T4 | `src/commands/install.ts` `formatOptions` — claude 미포함 시 ".claude/" 미표시 |
| P2-T5 | unit test — claude 미포함 시 .claude/ 미생성 검증 (3 combination) |

### Phase 3 — 매트릭스 갱신 (F7)

| ID | 작업 |
|----|------|
| P3-T1 | `tests/installer-cli-matrix.test.ts` — `expectedFor()`에 `claudeBaseline` 필드 추가. `targets.includes("claude")` 기반 조건 |
| P3-T2 | per scenario 검증에 `expect(existsSync(.claude/CLAUDE.md)).toBe(exp.claudeBaseline)` 추가 |
| P3-T3 | invariant — `[codex]`/`[opencode]`/`[codex,opencode]` 3 case에서 `.claude/` 미생성 검증 |
| P3-T4 | regression — `[claude]`/`[claude,codex]`/`[claude,opencode]`/`[claude,codex,opencode]` 4 case는 기존 그대로 (.claude/ 생성) |

### Phase 4 — npx skills 분석 + 제어 (F8, F9)

| ID | 작업 |
|----|------|
| P4-T1 | `npx skills add` CLI 옵션 조사 — `--target`, `--single-cli`, `--scope` 등 single-CLI install flag 존재 여부 |
| P4-T2 | 결과 분기: |
| | (a) flag 발견 → `external-installer.ts` 호출에 flag 추가 |
| | (b) 미발견 → `.gitignore`에 `.factory/`, `.goose/` 자동 추가 (`env-files.ts` 또는 신규 routine) |
| P4-T3 | unit test — flag 적용 또는 .gitignore 추가 검증 |
| P4-T4 | docs/USAGE.md — `.factory/.goose/` 자동 생성 + 제어 안내 |

### Phase 5 — Docs (F11)

| ID | 작업 |
|----|------|
| P5-T1 | `CHANGELOG.md` v0.8.0 dual BREAKING entry — alias 제거 + baseline 조건부 |
| P5-T2 | `README.md` / `README.ko.md` "Breaking changes" 섹션 |
| P5-T3 | `docs/USAGE.md` — Multi-CLI 섹션 alias 제거 + .claude/ 조건부 + .factory/.goose/ 안내 갱신 |
| P5-T4 | dogfood 리포트 `docs/dogfood/v0.8.0-2026-04-XX.md` — Mock dogfood 결과 (매트릭스 + alias reject) |

### Phase 6 — Review & Ship

| ID | 작업 |
|----|------|
| P6-T1 | reviewer subagent 5축 리뷰 — CRITICAL 0 |
| P6-T2 | `npm run ci` PASS — typecheck + lint + test:coverage(threshold) + build |
| P6-T3 | `package.json` 0.7.1 → 0.8.0 |
| P6-T4 | ship-checklist 통과 |
| P6-T5 | Self-Audit 5항목 |
| P6-T6 | PR → squash merge → v0.8.0 태그 |

---

## 의존성 그래프

```
P1 (Alias) ──┐
P2 (Baseline) ─┴─→ P3 (Matrix) ─┐
P4 (npx skills) ───────────────┴─→ P5 (Docs) ─→ P6 (Ship)
```

병행: P1, P2, P4 동시 가능. P3는 P2 후. P5는 P1~P4 모두 후.

---

## Revision & Escalation

- **Revision 상한**: Phase 내 자동 수정 ≤ 2회
- **Escalation 트리거**:
  - npx skills CLI flag 미발견 + .gitignore도 부적절 → 사용자 결정 대기
  - 매트릭스 시간 ≥ 2분
  - regression 발견
- **Abort 조건**:
  - DO NOT CHANGE SPEC 침범
  - 글로벌 mtime 변동
  - main 직접 commit

---

## Risks (SPEC §7 mirror)

| Risk | 완화 |
|------|------|
| dual BREAKING 사용자 부담 | CHANGELOG + README + v0.7.0 deprecation warning |
| `.claude/` 미생성 시 metafile 위치 | OQ2 잠정 — claude 미포함 시 metafile 생성 X |
| npx skills 외부 도구 제어 불가 | flag 미발견 시 .gitignore fallback |
| `CliMode` 사용처 누락 | typecheck로 강제 정리 |

---

## OQ 처리 (SPEC §3.4 mirror)

| OQ | 결정 | 처리 시점 |
|----|------|----------|
| OQ1 alias 입력 처리 | invalid reject + force migration | P1 |
| OQ2 metafile 위치 | --cli claude 미포함 시 metafile 생성 X | P2 |
| OQ3 .factory/.goose/ 제어 | research 결과 분기 (a) flag / (b) .gitignore | P4 |
| OQ4 마이그레이션 가이드 | dual breaking 명시 | P5 |

---

## Changelog

- 2026-04-29: 초안. SPEC §4 Phase mirror. 약 23 task (P1: 5 + P2: 5 + P3: 4 + P4: 4 + P5: 4 + P6: 6 — Wait, 28). 정확히는: P1 5 + P2 5 + P3 4 + P4 4 + P5 4 + P6 6 = 28 task.
