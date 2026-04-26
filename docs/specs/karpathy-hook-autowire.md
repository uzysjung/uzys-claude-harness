# SPEC: karpathy-coder hook auto-wire (v0.6.0)

> **Status**: Accepted (2026-04-26)
> **Predecessor**: `docs/specs/new-tracks-pm-growth.md` (Accepted, v0.5.0 ship)
> **Trigger**: v0.5.0 SPEC §3.4 OQ1 — karpathy-coder pre-commit hook 자동 와이어링 결정. 사용자 결정 (2026-04-26): A 경로 (`.claude/settings.json` PreToolUse hook) 채택 + opt-in prompt + 자동 활성화.
> **Target Tag**: v0.6.0
> **Issue Tracking**: disabled
> **External Validation**: deep-research 14 sources (`docs/research/karpathy-hook-autowire-2026-04-26.md` 참조). upstream `enforcement-patterns.md`은 incremental adoption (L1→L4) + manual configuration 권장 — **본 SPEC은 opt-in prompt + 사용자 명시 동의 후 자동 활성화로 정합**.

---

## 1. Objective

v0.5.0에서 plugin install까지만 제공된 `karpathy-coder`의 **pre-commit hook 자동 등록 (A 경로)** 구현. CLAUDE.md P1-P4 선언적 원칙의 enforcement layer를 install 흐름과 통합.

**3가지 결과**:

1. **A 경로 자동 등록**: `karpathy-coder` plugin install 성공 시 `.claude/settings.json` PreToolUse hook entry를 자동 추가.
2. **Opt-in 강제**: 사용자 명시 동의 없이 hook 등록 금지 — install 시 prompt 또는 `--with-karpathy-hook` 플래그.
3. **regression 0**: 기존 437 vitest + 11×5 매트릭스 + 8 자동 hook (session-start/protect-files/gate-check 등) 미변경.

## 2. 판단 기준 (불변)

NORTH_STAR §5 4-gate (Trend / Persona / Capability / Lean) + CLAUDE.md Decision Making 메타룰.

### 4-gate 판정

| Gate | 판정 | 근거 |
|------|------|------|
| Trend | ✅ | v0.5.0에서 karpathy-coder 도입. enforcement는 자연스러운 다음 단계 |
| Persona | ✅ | dev Track 사용자 — CLAUDE.md P1-P4 enforcement 직접 가치 |
| Capability | ✅ | 선언적 원칙 → 자동 검출 게이트 layer 격상 |
| Lean | ✅ | settings.json entry 추가만, 기존 hook 패턴 재사용 |

**4/4 Pass** → 진행.

### 완료 조건 (AC)

- **AC1** `OptionFlags`에 `withKarpathyHook: boolean` 추가 + `DEFAULT_OPTIONS` false.
- **AC2** Install pipeline에서 `withKarpathyHook=true` AND `karpathy-coder` plugin install 성공 시 `.claude/settings.json` PreToolUse hook entry 자동 등록. install 실패 시 hook entry 추가 X.
- **AC3** 인터랙티브 prompts에 `--with-karpathy-hook` 옵션 노출 + 라벨/hint.
- **AC4** Hook entry 형식은 기존 패턴 따름 — `bash "$CLAUDE_PROJECT_DIR/.claude/hooks/karpathy-gate.sh"`. matcher: `Write|Edit` (코드 수정 시점).
- **AC5** unit test — withKarpathyHook=true/false × karpathy-coder install 성공/실패 4 case.
- **AC6** regression 0 — 기존 8 hook + 437 tests 미변경 (추가만).

### 판정 절차

1. install pipeline `installer.ts` 수정 → vitest unit test로 검증 (Mock spawn).
2. settings.json 변경은 idempotent — 기존 entry 있으면 중복 추가 X.
3. opt-out (사용자 false 선택) 시 settings.json 변경 0.

## 3. 결정 일람

### 3.1 포함 (In Scope)

| ID | 작업 | 근거 |
|----|------|------|
| **F1** | `OptionFlags.withKarpathyHook` + `DEFAULT_OPTIONS.withKarpathyHook = false` | AC1 — opt-in 보수적 default |
| **F2** | 인터랙티브 `OPTION_DEFS`에 `withKarpathyHook` entry — label "karpathy-coder pre-commit hook", hint "PreToolUse Write\|Edit on Python 3+" | AC3 |
| **F3** | `--with-karpathy-hook` CLI flag (cac arg parser) | AC3 |
| **F4** | `installer.ts` — withKarpathyHook=true 시 hook script 복사 + settings.json PreToolUse entry merge (idempotent) | AC2, AC4 |
| **F5** | Hook script 위치 — `templates/hooks/karpathy-gate.sh` cherry-pick (plugin install 경로 의존성 회피, OQ1 참조) | install 시점 plugin path 모름 → 자체 호스팅 |
| **F6** | Pre-condition — Python 3 미설치 시 hook entry 등록하되 install summary에 warn 추가 | OQ2 참조 |
| **F7** | Unit test — 4 case (withKarpathyHook×karpathy install 성공/실패) | AC5 |
| **F8** | README/USAGE 갱신 — opt-in 옵션 안내 + 활성화 후 동작 + **upstream 4 enforcement level 가이드** (deep-research B 정신 반영) | UX + upstream 의도 정합 |
| **F9** | `docs/research/karpathy-hook-autowire-2026-04-26.md` 작성 — deep-research 14 sources 결과 보존 (Trend/Persona/Capability/Lean 외부 검증 근거) | P7 Fact vs Opinion + 후속 ADR 검토 자료 |

### 3.2 제외 (Non-Goals)

- **B 경로** (`.git/hooks/pre-commit` 직접 install) — 사용자 git workflow 직접 변경. Husky 의존도 없는 Python/data Track에서 부담.
- **C 경로** (Husky) — Node.js 의존성 추가, 일부 Track (data Python-only) 부담.
- **GitHub Actions CI gate 자동 추가** — 사용자 CI 정책 영향.
- **Default-on 활성화** — opt-in 강제 (Non-Goals → 기본값 false).
- **karpathy-coder plugin install 자체 동작 변경** — v0.5.0 entry 그대로.
- **Python 3 자동 설치** — 사용자 환경 변경 X. 부재 시 warn만.
- **Multi-track 다른 hook 자동 등록** — 본 SPEC은 karpathy-coder 한정.

### 3.3 DO NOT CHANGE

- `docs/SPEC.md` (v28.0.0 Foundation 트랙) — 본 SPEC과 분리.
- `docs/specs/new-tracks-pm-growth.md` (v0.5.0 SPEC) — Non-Goals 정신 유지 (자동 활성화 X, opt-in O).
- 기존 8 ALWAYS_HOOKS — `session-start.sh`, `protect-files.sh`, `gate-check.sh`, `agentshield-gate.sh`, `mcp-pre-exec.sh`, `spec-drift-check.sh`, `checkpoint-snapshot.sh`, `hito-counter.sh`. 추가만 허용.
- `~/.claude/`, `~/.codex/`, `~/.opencode/` (D16 보호).
- karpathy-coder plugin entry (`src/external-assets.ts`) — condition/method 변경 X.

### 3.4 판단 보류 (Open Questions)

- ~~**OQ1**~~ → **Closed (a)** hook script `templates/hooks/karpathy-gate.sh` cherry-pick + `cherrypicks.lock` 등록.
- ~~**OQ2**~~ → **Closed (a)** Python 3 부재 시 hook 등록 + graceful exit + warn (실제 동작 조건부).
- ~~**OQ3**~~ → **Closed** matcher = `Write|Edit` — pre-commit 의미 + Claude Code 컨텍스트만 작동.
- ~~**OQ4**~~ → **Closed** settings.json merge 신규 helper `src/settings-merge.ts` (mcp-merge.ts 패턴 참조, hooks 구조 다름).

(2026-04-26 사용자 결정 — "설치 때 자동 추가하고 실제 동작" → OQ1-4 모두 잠정안 채택.)

## 4. Phase 분해

| Phase | 산출 | 검증 | 의존 |
|-------|------|------|------|
| **P1** Type + Option | `OptionFlags.withKarpathyHook` + `DEFAULT_OPTIONS` + `OPTION_DEFS` + `--with-karpathy-hook` flag | typecheck + unit test | — |
| **P2** Hook script cherry-pick | `templates/hooks/karpathy-gate.sh` 추가 + `.dev-references/cherrypicks.lock` 등록 | shellcheck + 파일 존재 | P1 |
| **P3** Settings merge helper | `src/settings-merge.ts` (또는 inline in installer.ts) — idempotent PreToolUse entry add | unit test 4 case | P2 |
| **P4** Install pipeline 통합 | `installer.ts` — withKarpathyHook=true AND karpathy install 성공 시 hook entry add | integration test | P3 |
| **P5** Docs + dogfood | README/USAGE 갱신 + Mock dogfood (settings.json entry 검증) | grep + unit test | P4 |
| **P6** Review & Ship | reviewer 5축 + ship-checklist + v0.6.0 태그 | review report + tag | P5 |

## 5. Testing Strategy

### 5.1 환경 (Test Parity)

CLI tool 확장. DB / 외부 서비스 의존 없음.

| 영역 | 전략 |
|------|------|
| Prod DB | N/A |
| 테스트 DB | N/A |
| 외부 의존 (plugin install) | unit test mock spawn — `karpathy-coder` install 성공/실패 시뮬레이션 |
| Python 3 (hook 실행) | 자동 검증 X — 사용자 환경 의존, 본 SPEC은 hook 등록까지만 |

vitest threshold 유지 — lines/funcs/stmt 90 / branches 88.

### 5.2 E2E (Mock 금지 항목)

| 플로우 | 성공 기준 |
|--------|----------|
| `--with-karpathy-hook` install + karpathy-coder install 성공 | settings.json PreToolUse `Write\|Edit` entry에 `karpathy-gate.sh` 포함 |
| `--with-karpathy-hook` 미지정 install | settings.json hook entry 미추가 (regression 0) |

### 5.3 Test Types

- **Unit**: `OptionFlags` 직렬화, settings-merge idempotent, hook script 존재 검증.
- **Integration**: `installer.ts` 4 case (withKarpathyHook×install 성공/실패).
- **E2E (Mock)**: 11×5 매트릭스 — 기존 회귀 0.

### 5.4 Naming

- `should add karpathy hook entry when withKarpathyHook=true and install succeeds`
- `should NOT add hook entry when withKarpathyHook=false`
- `should NOT add hook entry when karpathy plugin install fails`
- `should be idempotent — second install with same flag does not duplicate entry`

## 6. Boundaries

### Always
- opt-in 강제. `withKarpathyHook` default false.
- Hook 등록은 install 성공 후에만.
- settings.json 변경은 idempotent (중복 entry X).
- vitest threshold 유지.

### Ask First
- B/C 경로 (`.git/hooks` 직접 install / Husky) 검토.
- karpathy-coder 외 다른 plugin hook 자동 등록 패턴 확장.
- matcher 범위 변경 (`Write|Edit` → `*`).

### Never
- 기존 8 ALWAYS_HOOKS 변경.
- karpathy-coder plugin entry condition 변경 (v0.5.0 SPEC §3.3 보호).
- Python 3 자동 설치/사용자 환경 수정.
- main 직접 commit.

## 7. Risks

| Risk | 완화 |
|------|------|
| Hook script (`karpathy-gate.sh`) cherry-pick — upstream drift | `.dev-references/cherrypicks.lock` 등록 + `sync-cherrypicks.sh` 재사용 |
| Python 3 부재 시 hook 실행 실패 → 사용자 commit 차단? | `karpathy-gate.sh` 자체가 `command -v python3` 체크 + graceful exit (non-blocking warn). L3은 upstream도 "warn, doesn't reject" 비차단 설계 |
| settings.json 손상 — merge bug | unit test 4 case + idempotent 검증 |
| 사용자 default-on 기대 vs 본 SPEC opt-in | README "Why opt-in" 섹션 + 활성화 절차 명시 |
| **upstream `enforcement-patterns.md`은 manual configuration 권장 — 자동 와이어링 우려** | opt-in prompt 강제로 사용자 명시 동의 + USAGE.md 4 level 가이드로 incremental adoption 안내. 자동 와이어링이 아니라 "사용자 명시 yes 후 wiring 자동화" 정신 |
| **pre-commit hook 알려진 failure modes** ([jyn.dev](https://jyn.dev/pre-commit-hooks-are-fundamentally-broken/)) — workflow obstruction, rebase failure | A 경로(`.claude/settings.json` PreToolUse)는 git pre-commit과 다름 — Claude Code Write/Edit 시점에만 작동. git rebase 등 외부 영향 없음 |

## 8. Revision & Escalation

- **Revision 상한**: Phase 내 자동 수정 ≤ 2회.
- **Escalation**: OQ1-4 자동 해결 불가 / settings.json merge 회귀 발견 / cherry-pick 동기화 실패.
- **Abort**: `~/.claude/`, `~/.codex/`, `~/.opencode/` mtime 변동 / 기존 8 hook 회귀 / `docs/specs/new-tracks-pm-growth.md` Non-Goals 침범 (default-on 우발 시).

---

## Changelog

- 2026-04-26: 초안. 사용자 결정 (A 경로) + v0.5.0 SPEC §3.4 OQ1 처리. Pre-SPEC 접수 4 OQ 명시 (잠정안 포함).
- 2026-04-26: deep-research 14 sources 검증 후 Accepted. Risks §7 보강 (upstream manual 권장 ↔ opt-in mitigation). F8/F9 추가 (USAGE 4 level 가이드 + research 보존).
