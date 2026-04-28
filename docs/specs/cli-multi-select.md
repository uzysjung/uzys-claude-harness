# SPEC: CLI multi-select + Codex slash 통일 (v0.7.0, BREAKING)

> **Status**: Accepted (2026-04-28, **Major CR 2026-04-28** — Codex slash 통일 추가)
> **Predecessor**: v0.6.6 (skills.sh registry 정정 + prune-ecc 절대경로 fix)
> **Trigger**: 사용자 질문 (2026-04-28) — (1) "왜 CLI 선택이 multi-select 아닌가?" (2) "Codex에서 /uzys-* command가 없어. command/plugin 아님?"
> **Target Tag**: v0.7.0 (BREAKING — 0.x이므로 minor에 BREAKING 가능)
> **Issue Tracking**: disabled

## Major CR (2026-04-28) — Codex slash 통일 추가

기존 SPEC §3.2 Non-Goals 변경 + §3.1 F12~F14 추가. 사유:
- Codex skill 형식(`.agents/skills/`)은 `$<name>` mention만 지원, `/<name>` slash 미지원 ([공식 docs](https://developers.openai.com/codex/cli/slash-commands))
- Codex의 `/<name>` slash는 **`~/.codex/prompts/<name>.md` markdown prompt** 형식
- v0.7.0이 이미 BREAKING — Codex slash 통일을 같은 release에 묶음 (사용자 마이그레이션 1회)
- D16 보호: 글로벌 `~/.codex/prompts/`는 opt-in 강제 (`--with-codex-prompts` flag 신규)
- Skill 형식(`.agents/skills/uzys-*/SKILL.md`)도 v0.6.4부터 유지 — `$uzys-spec` mention 호출 가능. 두 형식 병존 (slash + mention)

---

## 1. Objective

(1) CLI 선택을 **multi-select (3 base × 7 combination)**으로 전환 + (2) Codex slash command를 Claude Code와 통일 (`/uzys-spec`).

**4가지 결과**:

1. **인터랙티브**: `select` (5 라벨) → `multiselect` (3 체크박스: claude/codex/opencode).
2. **flag 모드**: `--cli <single>` → `--cli` repeatable. 기존 `--cli both`/`--cli all`은 1 release deprecation alias 유지 → v0.8+에서 제거.
3. **Codex slash 통일** (Major CR): `~/.codex/prompts/uzys-{spec,plan,build,test,review,ship}.md` 6 markdown prompt 글로벌 opt-in 복사. `--with-codex-prompts` 신규 flag (D16 패턴). 기존 `.agents/skills/uzys-*/SKILL.md` (skill 형식, `$uzys-spec` mention)도 병존 — 두 invocation 형식 모두 작동.
4. **regression 0**: 기존 11×5=55 매트릭스가 7-combination 매트릭스로 확장. 기존 단일 mode 시나리오 모두 부분집합으로 보존.

## 2. 판단 기준 (불변)

CLAUDE.md Decision Making + NORTH_STAR §5 4-gate.

### 4-gate 판정 (사전)

| Gate | 판정 | 근거 |
|------|------|------|
| Trend | ✅ | 5 mode → 7 combination = 누락 사용 사례 명확 (claude+opencode, codex+opencode) |
| Persona | ✅ | dev Track 사용자 — multi-CLI 사용자가 직접 조합 선택 가능 |
| Capability | ✅ | both/all 라벨 외울 필요 X. 직관 ↑ |
| Lean | ⚠️ Mixed | BREAKING change + 코드/테스트/docs 다수 변경. 그러나 라벨 단순화로 후속 유지 부담 ↓ |

**3.5/4** — Lean이 Mixed이나 진행 가치 충분. BREAKING 처리에 deprecation 1 release 완충.

### 완료 조건 (AC)

- **AC1** `src/types.ts`: `CliMode` (string union) → `CliTargets` (`Set<CliBase>` 또는 sorted readonly array). 새 type `CliBase = "claude" | "codex" | "opencode"`.
- **AC2** `src/prompts.ts`: `selectCli` `select` → `multiselect` (3 옵션). default = `["claude"]`.
- **AC3** flag mode: `--cli` repeatable. 기존 `--cli both` → `["claude","codex"]` alias + warning. `--cli all` → `["claude","codex","opencode"]` + warning.
- **AC4** install pipeline: 기존 `spec.cli === "codex" || ... === "both"` 분기 → `targets.has("codex")` 등 set membership 체크로 일관 변환. Codex/OpenCode transform 분기 동일 결과 보존.
- **AC5** 매트릭스 테스트 9×5=45 → 11×7=77 + invariant 보존 = **83 PASS**.
- **AC6** **regression 0** — 기존 `claude/codex/opencode/both/all` 시나리오는 새 7 combination 부분집합으로 모두 통과. vitest 451 tests 추가만 허용 (수정은 alias 변환 위해 일부 fixture 갱신 허용).
- **AC7** deprecation warning UX 검증 — `--cli both` 사용 시 stderr에 "deprecated, use `--cli claude --cli codex`" 메시지.

### 판정 절차

1. 코드 변경 후 `npm run ci` PASS.
2. 매트릭스 11×7=77 시나리오 + invariant 모두 PASS.
3. backwards compat — `--cli both`/`--cli all` 입력 시 deprecation warning + 정상 동작.

## 3. 결정 일람

### 3.1 포함 (In Scope)

| ID | 작업 | 영역 |
|----|------|------|
| **F1** | `CliBase` type + `CliTargets` (sorted readonly array of `CliBase`) | `src/types.ts` |
| **F2** | `parseCliTargets(input: string \| string[]): CliTargets` — flag 입력 정규화 + alias 변환 + warning emit | `src/cli-targets.ts` (신규) |
| **F3** | `selectCli` `multiselect` 변환. default `["claude"]`. 0 선택 시 cancel | `src/prompts.ts` |
| **F4** | `--cli` flag repeatable 등록 (cac `{ type: [String] }`) | `src/commands/install.ts` |
| **F5** | install pipeline 분기 `cli === "codex" \|\| ... \|\| "both" \|\| "all"` → `targets.has("codex")` | `src/installer.ts`, `src/commands/install.ts` |
| **F6** | `formatCliPhaseTitle` / Summary `CLIs` 출력 — `targets.join(" · ")` | `src/commands/install.ts` |
| **F7** | `InstallSpec.cli` 필드 — single string → `CliTargets` (sorted readonly array). 직렬화는 array 그대로 | `src/types.ts` |
| **F8** | 매트릭스 테스트 11×7=77 + invariant | `tests/installer-cli-matrix.test.ts` |
| **F9** | 단위 테스트 — `parseCliTargets` 7 combinations + alias + warning + invalid | `tests/cli-targets.test.ts` (신규) |
| **F10** | docs/USAGE.md / README — 새 multi-select UX 안내 + alias deprecation 명시 | docs |
| **F11** | `CHANGELOG.md` v0.7.0 BREAKING 명시 + 마이그레이션 가이드 | docs |
| **F12** | `OptionFlags.withCodexPrompts: boolean` + `DEFAULT_OPTIONS` false. `--with-codex-prompts` flag (cac) + 인터랙티브 prompt entry | `src/types.ts`, `src/prompts.ts`, `src/interactive.ts`, `src/commands/install.ts` |
| **F13** | `templates/codex-prompts/uzys-{phase}.md` 6 markdown prompt — `templates/commands/uzys/<phase>.md` source 재사용 + Codex front matter (description, argument-hint) 변환 | `src/codex/prompts.ts` (신규, render 헬퍼) + `templates/codex-prompts/` 또는 transform 시 동적 생성 |
| **F14** | `runCodexOptIn`에 `withCodexPrompts` 분기 추가 — `~/.codex/prompts/uzys-*.md` 6 file 복사. opt-in 시에만, idempotent | `src/codex/opt-in.ts` |
| **F15** | unit + integration test — F12~F14 (prompts opt-in 4 case + render output 검증) | `tests/codex/prompts.test.ts`, `tests/codex/opt-in.test.ts` 확장 |

### 3.2 제외 (Non-Goals)

- **baseline `.claude/` 미생성** (사용자 #2 issue) — 본 SPEC 범위 외. 별도 SPEC `cli-baseline-skip.md` v0.7.x.
- **`.factory/`, `.goose/` universal install 제어** (사용자 #3) — `npx skills add` 외부 동작. 본 SPEC 범위 외.
- **CLI alias 즉시 제거** — v0.7.0은 deprecation warning 유지. v0.8+에서 제거.
- **새 CLI 추가** — Aider, Cursor 등 추가는 본 SPEC 범위 X.
- **CliTargets order 사용자 지정** — 항상 sorted (claude → codex → opencode 순).
- **Codex prompts default-on 활성화** — `withCodexPrompts` default false (opt-in 강제). v0.5.0 SPEC `karpathy-hook-autowire` opt-in 정신 동일.
- **OpenCode slash 통일** — OpenCode는 이미 `/uzys-spec` 작동 (`.opencode/commands/uzys-*.md`로 정상 등록). 본 Major CR은 Codex 한정.
- **Codex plugin 번들 (.codex-plugin/plugin.json)** — OQ8 후속. 본 SPEC은 prompts directory 방식만.

### 3.3 DO NOT CHANGE

- `docs/SPEC.md` (Phase 1 Finalization, v28.0.0 트랙).
- `docs/specs/karpathy-hook-autowire.md` (v0.6.0 영역).
- `docs/specs/codex-compat.md` (Codex 호환 — `runCodexTransform` 분기 보존).
- `docs/specs/opencode-compat.md` (OpenCode 호환 — `runOpencodeTransform` 분기 보존).
- 기존 8 ALWAYS_HOOKS, manifest, external assets catalog (CLI 무관).
- `~/.claude/`, `~/.codex/`, `~/.opencode/` (D16).

### 3.4 판단 보류 (Open Questions — 사용자 합의 잠정안)

- **OQ1** flag 형식 — `--cli` **repeatable** (`--cli claude --cli codex`) 채택. 기존 `--cli both`/`all`은 1 release deprecation alias.
- **OQ2** backwards compat 기간 — v0.7.0에서 alias 유지 + warning. v0.8+ 별도 SPEC에서 제거.
- **OQ3** baseline `.claude/` 처리 — 본 SPEC 범위 외 (별도 SPEC). Claude 미선택이어도 baseline copy 유지.
- **OQ4** `InstallSpec.cli` serialization — sorted array `["claude", "codex"]`. metafile `.installed-tracks`와 별도 (CLI는 metafile에 없음).
- **OQ5 (Major CR)** Codex prompts source — (a) `templates/commands/uzys/<phase>.md` 동적 변환 (front matter 추가) vs (b) `templates/codex-prompts/uzys-{phase}.md` 별도 cherry-pick. **잠정 (a)** — single source 유지, transform 단계에서 생성.
- **OQ6 (Major CR)** Codex prompts deprecation 시점 — 본 SPEC 0.7.0은 opt-in 추가만. skill 형식(`$<name>`) 폐기는 v0.8+ 별도 ADR.

본 OQ는 **사용자 합의 잠정안 채택** — Build 시 변경 시 Major CR.

## 4. Phase 분해

| Phase | 산출 | 검증 | 의존 |
|-------|------|------|------|
| **P1** Type 전환 | `CliBase` + `CliTargets` + `parseCliTargets` 헬퍼 | typecheck + unit test 7 combination | — |
| **P2** Prompt 변환 | `selectCli` multiselect | unit test (mocked clack) | P1 |
| **P3** flag 파싱 | `--cli` repeatable + alias warning | unit test (cli.test.ts) | P1 |
| **P4** Pipeline 분기 | `installer.ts` `targets.has()` 변환 + Codex/OpenCode transform 분기 보존 | integration test | P3 |
| **P5** 매트릭스 + 단위 테스트 | 77 + invariant + parseCliTargets 7 combination 검증 | vitest run | P4 |
| **P6** Codex prompts (Major CR) | F12: OptionFlags.withCodexPrompts + flag/prompt entry. F13: render 헬퍼 (uzys command md → Codex prompt md + front matter). F14: runCodexOptIn 분기 (~/.codex/prompts/uzys-*.md 복사). F15: unit/integration test | unit + opt-in 4 case | P4 |
| **P7** Docs + CHANGELOG BREAKING 안내 + 마이그레이션 | README/USAGE/REFERENCE/CHANGELOG (multi-select + Codex slash 통합 가이드) | grep + reviewer pass | P5, P6 |
| **P8** Review & Ship | reviewer 5축 + ship-checklist + v0.7.0 태그 | review + tag | P7 |

병행: P3와 P2는 P1 완료 후 동시 가능. P5 docs는 P4 완료 후 시작 가능.

## 5. Testing Strategy

### 5.1 환경 (Test Parity)

CLI tool 확장. DB / 외부 서비스 의존 없음.

| 영역 | 전략 |
|------|------|
| Prod DB | N/A |
| 테스트 DB | N/A |
| 외부 의존 (plugin install) | unit test mock spawn |

vitest threshold 유지 — lines/funcs/stmt 90 / branches 88.

### 5.2 E2E (Mock 금지 항목)

| 플로우 | 성공 기준 |
|--------|----------|
| 11 Track × 7 CLI combination 매트릭스 | 77 시나리오 PASS — 각 combination별 baseline + per-CLI 산출물 검증 |
| `--cli both` deprecation alias | warning emit + 정상 동작 (= `--cli claude --cli codex`와 동일 결과) |
| `--cli all` deprecation alias | 동일 |
| `--cli` 미지정 인터랙티브 | multiselect default `[claude]` |

### 5.3 Test Types

- **Unit**: `parseCliTargets` 7 combination + 2 alias + invalid input. `CliTargets` set membership.
- **Integration**: install pipeline 7 combination per Track 1개 (smoke), Codex/OpenCode transform 분기.
- **E2E (Mock)**: 11×7=77 매트릭스 + invariant.

### 5.4 Naming

- `parseCliTargets — single claude returns ["claude"]`
- `parseCliTargets — repeatable claude+codex returns ["claude","codex"] sorted`
- `parseCliTargets — both alias emits warning + maps to claude+codex`
- `parseCliTargets — all alias emits warning + maps to all 3`
- `parseCliTargets — invalid mode rejects`
- `installer — targets has codex triggers Codex transform`
- `installer — targets has opencode triggers OpenCode transform`
- `installer — targets [codex,opencode] (Claude 제외) — both transforms run, .claude/ baseline 유지`

## 6. Boundaries

### Always
- `parseCliTargets`는 sorted output (consistent ordering).
- alias warning은 stderr (stdout 오염 X).
- 기존 5 mode 입력 모두 정상 동작 (alias 변환).
- vitest threshold 충족.
- Codex/OpenCode transform 함수는 그대로 — 호출 분기만 변경.

### Ask First
- 새 CLI base 추가 (Aider 등).
- alias 즉시 제거 (v0.7.0에서).
- baseline `.claude/` 미생성 정책 변경.

### Never
- 기존 8 ALWAYS_HOOKS / manifest / external assets 변경.
- `~/.claude/`, `~/.codex/`, `~/.opencode/` 글로벌 수정.
- Codex/OpenCode transform 함수 자체 변경 (분기 외).
- main 직접 commit.

## 7. Risks

| Risk | 완화 |
|------|------|
| BREAKING change → 기존 사용자 install 실패 | alias 1 release 유지 + warning 명시. CHANGELOG 마이그레이션 안내 |
| 매트릭스 11×7=77 시간 증가 (45 → 77 = +71%) | parametric vitest 유지. 시간 ≥ 2분이면 escalation |
| `parseCliTargets` 입력 validation 누락 → invalid CLI 통과 | unit test에서 invalid input 반드시 reject 검증 |
| Codex/OpenCode transform 분기 변경 시 기존 SPEC 영향 | DO NOT CHANGE 영역 명시. 분기만 변경, 함수 자체 미터치 |
| CliTargets array vs Set serialization 불일치 | sorted array로 통일. Set은 내부 표현만 (필요 시) |
| 인터랙티브 0 선택 시 동작 미정 | multiselect required: true (clack option) — 빈 선택 cancel 처리 |
| InstallSpec.cli 변경 = 외부 noop API 영향? | 본 모듈은 internal. 외부 노출 없음. 안전 |
| Codex prompts 글로벌 `~/.codex/prompts/` 침범 — D16 위반 우려 | `withCodexPrompts` opt-in 강제 + idempotent. 동일 파일 재복사만 (다른 prompts 미수정). 사용자 명시 동의 후에만 |
| Codex prompts와 `.agents/skills/` 병존 — `$uzys-spec` + `/uzys-spec` 동시 작동 시 사용자 혼란 | USAGE.md에 두 형식 차이 명시. slash가 권장, mention은 fallback |
| Codex prompts source = uzys command md → 변환 시 front matter 충돌 | `--- name: ... ---` block 정규화 (skills.ts 패턴 재사용). render 헬퍼 unit test |

## 8. Revision & Escalation

- **Revision 상한**: Phase 내 자동 수정 ≤ 2회.
- **Escalation 트리거**:
  - 77 매트릭스 시나리오 시간 ≥ 2분 (성능 회귀)
  - alias warning이 stdout 오염
  - 기존 451 vitest 회귀
- **Abort 조건**:
  - `~/.claude/`, `~/.codex/`, `~/.opencode/` mtime 변동
  - DO NOT CHANGE SPEC (`karpathy-hook-autowire`/`codex-compat`/`opencode-compat`) 침범

---

## Migration guide (사용자용, v0.7.0 ship 시 README 발췌)

### Before (v0.6.x)
```bash
# Single CLI
npx ... install --track tooling --cli codex

# Combined (alias)
npx ... install --track tooling --cli both    # claude + codex
npx ... install --track tooling --cli all     # claude + codex + opencode
```

### After (v0.7.0+)
```bash
# Single CLI (변경 없음)
npx ... install --track tooling --cli codex

# Multi-CLI (repeatable)
npx ... install --track tooling --cli claude --cli codex
npx ... install --track tooling --cli claude --cli codex --cli opencode

# 신규 조합 (이전 버전 미지원)
npx ... install --track tooling --cli claude --cli opencode    # Codex 제외
npx ... install --track tooling --cli codex --cli opencode     # Claude 제외
```

### Deprecation
```bash
# 기존 입력은 v0.7.0에서 deprecation warning + 정상 동작
$ npx ... install --cli both
[WARN] --cli both is deprecated. Use --cli claude --cli codex (will be removed in v0.8+)
```

---

## Changelog

- 2026-04-28: 초안 작성 + 사용자 합의 잠정안 채택. Pre-SPEC 접수 4 OQ Closed. Accepted.
- 2026-04-28 (Major CR): Codex slash 통일 추가 (사용자 보고 — `/uzys-*` 미인식 → `~/.codex/prompts/` 통한 slash 등록). F12~F15 추가. §3.2 Non-Goals 갱신 (Codex prompts default-on / OpenCode slash / plugin 번들 명시). §3.4 OQ5-6 추가. §4 Phase P6 (Codex prompts) 삽입 → P5→P8 재번호. §7 Risks 3 항목 추가. Status Accepted (Major CR 직접 합의).
