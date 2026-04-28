# Plan: v0.7.0 CLI multi-select + Codex slash 통일

> **Linked SPEC**: `docs/specs/cli-multi-select.md` (Accepted, Major CR 2026-04-28)
> **Linked Todo**: `docs/plans/cli-multi-select-todo.md`
> **Created**: 2026-04-28
> **Target tag**: v0.7.0 (BREAKING)
> **Complexity**: Complex (BREAKING + multi-file + 3 묶음)

---

## Sprint Contract

### 범위 (In Scope)

SPEC §3.1 F1~F15. 3 묶음:
- (1) CLI multi-select: `CliMode` (5 enum) → `CliTargets` (sorted readonly array of 3 base × 7 combination)
- (2) Codex slash 통일: `~/.codex/prompts/uzys-{6 phase}.md` 글로벌 opt-in (`--with-codex-prompts` flag)
- (3) docs 일괄: README/USAGE/REFERENCE/CHANGELOG (BREAKING 마이그레이션 가이드)

### 제외 (Out of Scope)

SPEC §3.2 그대로. 핵심:
- baseline `.claude/` 미생성 (별도 SPEC)
- `.factory/`, `.goose/` 제어 (외부 도구 동작)
- CLI alias 즉시 제거 (v0.8+)
- Codex prompts default-on (opt-in 강제)
- OpenCode slash 통일 (이미 작동)
- Codex plugin 번들 (OQ8 후속)

### 완료 기준

SPEC §2 AC1~AC7 모두 Pass + v0.7.0 태그 push.

### 제약 조건

- vitest threshold 유지 — lines/funcs/stmt 90 / branches 88
- 기존 451 tests — alias 변환 위해 일부 fixture 갱신 허용 (수정만)
- 기존 8 ALWAYS_HOOKS / manifest / external assets / Codex/OpenCode transform 함수 자체 변경 X
- DO NOT CHANGE 영역 (`docs/SPEC.md`, `karpathy-hook-autowire`, `codex-compat`, `opencode-compat`) 미수정

---

## Phase 분해 (SPEC §4 mirror)

### Phase 1 — Type 전환

**목표**: `CliBase` + `CliTargets` + `parseCliTargets` 헬퍼.

| ID | 작업 | 파일 |
|----|------|------|
| P1-T1 | `CliBase` type union (`"claude" \| "codex" \| "opencode"`) + 가드 함수 | `src/types.ts` |
| P1-T2 | `CliTargets` type alias = `ReadonlyArray<CliBase>` (sorted) + `InstallSpec.cli` 필드 변경 | `src/types.ts` |
| P1-T3 | `parseCliTargets(input: string \| string[]): { targets: CliTargets; warnings: string[] }` — repeatable + alias 변환 + invalid reject | `src/cli-targets.ts` (신규) |
| P1-T4 | `tests/cli-targets.test.ts` 신규 — 7 combination + 2 alias + invalid 8 case | 신규 |

**Phase 1 검증**: typecheck + unit tests PASS.

### Phase 2 — Prompt 변환

| ID | 작업 | 파일 |
|----|------|------|
| P2-T1 | `selectCli` `select` → `multiselect` (3 base 체크박스) + default `["claude"]` + required: true | `src/prompts.ts` |
| P2-T2 | `interactive.ts` `cli: result` 적용 (`Promise<CliTargets \| null>`) | `src/interactive.ts` |
| P2-T3 | unit test — multiselect 결과 array 직렬화 | `tests/interactive.test.ts` |

### Phase 3 — flag 파싱

| ID | 작업 | 파일 |
|----|------|------|
| P3-T1 | `InstallOptions.cli` type `string` → `string \| string[]` + cac registration `{ type: [String] }` | `src/commands/install.ts` |
| P3-T2 | `installAction` — `parseCliTargets(options.cli)` 호출 + warnings stderr emit | `src/commands/install.ts` |
| P3-T3 | unit test — `--cli claude --cli codex` repeatable + `--cli both` alias + warning capture | `tests/install.test.ts`, `tests/cli.test.ts` |

### Phase 4 — Pipeline 분기

| ID | 작업 | 파일 |
|----|------|------|
| P4-T1 | `installer.ts` 분기 `cli === "codex" \|\| ... \|\| "both"` → `targets.includes("codex")` 변환 | `src/installer.ts` |
| P4-T2 | `commands/install.ts` Phase 3 헤더/Summary `formatCliPhaseTitle(targets)` + `CLIs` 출력 `targets.join(" · ")` | `src/commands/install.ts` |
| P4-T3 | regression test — 단일 mode / multi mode 7 combination per Track 1개 (smoke) | integration |

### Phase 5 — 매트릭스 테스트

| ID | 작업 | 파일 |
|----|------|------|
| P5-T1 | `installer-cli-matrix.test.ts` — 11 Track × 7 CLI combination = 77 + invariant 갱신 | `tests/installer-cli-matrix.test.ts` |
| P5-T2 | invariant test — `TRACKS.length=11 × COMBINATIONS=7 = 77` 명시 | 동 |
| P5-T3 | regression — 기존 5 mode (claude/codex/opencode/both/all) 시나리오가 새 7 combination 부분집합으로 PASS | matrix |

### Phase 6 — Codex prompts (Major CR)

**목표**: `~/.codex/prompts/uzys-*.md` 글로벌 opt-in 복사.

| ID | 작업 | 파일 |
|----|------|------|
| P6-T1 | `OptionFlags.withCodexPrompts: boolean` + `DEFAULT_OPTIONS.withCodexPrompts = false` | `src/types.ts` |
| P6-T2 | `OPTION_DEFS`에 entry — label "Codex slash commands (~/.codex/prompts/uzys-*.md, opt-in)", hint "Codex `/uzys-spec` slash 등록. 글로벌 D16 opt-in" | `src/prompts.ts` |
| P6-T3 | `--with-codex-prompts` cac flag 등록 | `src/commands/install.ts` |
| P6-T4 | `interactive.ts` `toOptionFlags` 매핑 | `src/interactive.ts` |
| P6-T5 | `src/codex/prompts.ts` (신규) — `renderCodexPrompt({ source, phase }): string`. uzys command md → Codex prompt md (front matter description + body) 변환 | 신규 |
| P6-T6 | `runCodexOptIn` 분기 — `withCodexPrompts=true` 시 `~/.codex/prompts/uzys-*.md` 6 file 복사 (idempotent + opt-in 강제) | `src/codex/opt-in.ts` |
| P6-T7 | `CodexOptInReport.promptsInstalled: { enabled, count }` 추가 | `src/codex/opt-in.ts` |
| P6-T8 | unit test — `renderCodexPrompt` 4 case (with/without claude frontmatter, slash rename) | `tests/codex/prompts.test.ts` (신규) |
| P6-T9 | integration test — `runCodexOptIn` `withCodexPrompts=true` 시 6 file 생성 + idempotent (2회 호출 시 동일 결과) | `tests/codex/opt-in.test.ts` 확장 |

### Phase 7 — Docs

| ID | 작업 | 파일 |
|----|------|------|
| P7-T1 | `docs/USAGE.md` — "Multi-CLI 설치" 섹션 신규 (7 combination 예제 + alias deprecation 경고) | `docs/USAGE.md` |
| P7-T2 | `docs/USAGE.md` — "Codex slash 통일" 섹션 신규 (`--with-codex-prompts` opt-in 절차 + `~/.codex/prompts/` 위치 + Claude `/uzys:spec` vs Codex `/uzys-spec` 차이) | 동 |
| P7-T3 | `README.md` / `README.ko.md` — Quick start `--cli` repeatable 예제 + 마이그레이션 1줄 안내 + USAGE link | `README.md`, `README.ko.md` |
| P7-T4 | `docs/REFERENCE.md` — Track/CLI 표 갱신 + alias deprecation 명시 | `docs/REFERENCE.md` |
| P7-T5 | `CHANGELOG.md` v0.7.0 BREAKING entry + 마이그레이션 코드 블록 | `CHANGELOG.md` |
| P7-T6 | dogfood Mock — multiselect prompt + flag repeatable + `--with-codex-prompts` 시나리오 자동 검증 (vitest cover) + 리포트 `docs/dogfood/v0.7.0-2026-04-XX.md` | 신규 |

### Phase 8 — Review & Ship

| ID | 작업 | 검증 |
|----|------|------|
| P8-T1 | reviewer subagent (context: fork) — 5축 리뷰 | CRITICAL = 0 |
| P8-T2 | `npm run ci` — typecheck + lint + test:coverage(90/88/90/90) + build | log |
| P8-T3 | `package.json` 0.6.6 → 0.7.0 + CHANGELOG 확정 | bump |
| P8-T4 | ship-checklist (`rules/ship-checklist.md`) 모든 항목 PASS | log |
| P8-T5 | Self-Audit 5항목 | 리포트 |
| P8-T6 | PR 생성 → squash merge → v0.7.0 태그 + push | tag |

---

## 의존성 그래프

```
P1 (Type) → P2 (Prompt) → P3 (Flag) → P4 (Pipeline) → P5 (Matrix)
                                                              ↘
P1 → P6 (Codex prompts F12~F15) ──────────────────────────────→ P7 (Docs) → P8 (Review & Ship)
```

병행 가능:
- P2/P3는 P1 후 동시 가능
- P6는 P1 후 시작 가능 (P5와 병행)
- P7는 P5+P6 둘 다 끝나면 시작

---

## Revision & Escalation

- **Revision 상한**: Phase 내 자동 수정 ≤ 2회.
- **Escalation 트리거**:
  - 77 매트릭스 시간 ≥ 2분
  - alias warning이 stdout 오염
  - Codex prompts global mtime 영향 (D16 위반 risk)
  - 기존 451 vitest 회귀
- **Abort**:
  - DO NOT CHANGE SPEC 침범 (`karpathy-hook-autowire`, `codex-compat`, `opencode-compat`)
  - `~/.claude/` mtime 변동 (글로벌 영향)
  - main 직접 commit

---

## Risks (SPEC §7 mirror)

| Risk | 완화 |
|------|------|
| BREAKING change → 기존 사용자 install 실패 | alias 1 release 유지 + warning. CHANGELOG 마이그레이션 가이드 |
| 매트릭스 시간 +71% | parametric vitest. 시간 ≥ 2분 escalation |
| Codex prompts global 침범 | opt-in 강제 (`withCodexPrompts` default false) + idempotent. 사용자 명시 yes 후에만 |
| 0 multi-select | clack `required: true` — 빈 선택 cancel |
| Codex prompts와 SKILL.md 병존 → 사용자 혼란 | USAGE.md에 두 형식 차이 명시. slash 권장, mention fallback |

---

## OQ 처리 (SPEC §3.4 mirror — 모두 Closed)

| OQ | 결정 | 처리 시점 |
|----|------|----------|
| OQ1 flag repeatable | `--cli` repeatable + `--cli both`/`all` deprecated alias | P3 |
| OQ2 backwards compat | v0.7.0 BREAKING + alias warning. v0.8+ 제거 | P3 (warning) + 후속 ADR |
| OQ3 baseline `.claude/` | 본 SPEC 범위 외 — 별도 SPEC | — |
| OQ4 InstallSpec.cli serialization | sorted array | P1-T2 |
| OQ5 Codex prompts source | 잠정 (a) — `templates/commands/uzys/<phase>.md` 동적 변환 | P6-T5 |
| OQ6 skill 형식 deprecation | v0.8+ 별도 ADR. v0.7.0은 병존 | — |

---

## 완료 조건

- [ ] SPEC AC1~AC7 모두 Pass
- [ ] Phase 1~8 모든 task 완료
- [ ] regression 0 (기존 11 Track baseline + 8 hooks + 27 external assets 보존)
- [ ] vitest 451 → 470+ tests / coverage threshold 충족
- [ ] v0.7.0 태그 push

---

## Changelog

- 2026-04-28: 초안. SPEC §4 Phase mirror + Major CR Phase 6 (Codex prompts) 삽입. 약 35 task (P1: 4 + P2: 3 + P3: 3 + P4: 3 + P5: 3 + P6: 9 + P7: 6 + P8: 6).
