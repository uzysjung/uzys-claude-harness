# Plan: karpathy-coder hook auto-wire (v0.6.0)

> **Linked SPEC**: `docs/specs/karpathy-hook-autowire.md` (Accepted, 2026-04-26)
> **Linked Todo**: `docs/plans/karpathy-hook-autowire-todo.md`
> **Linked Research**: `docs/research/karpathy-hook-autowire-2026-04-26.md`
> **Created**: 2026-04-26
> **Status**: Plan
> **Target tag**: v0.6.0
> **Complexity**: Standard (multi-file, 신기능, ~6 src/test/template/docs)

---

## Sprint Contract

### 범위 (In Scope)

SPEC §3.1 F1~F9. 요약:
- `OptionFlags.withKarpathyHook` opt-in (default false)
- `--with-karpathy-hook` CLI flag + 인터랙티브 prompt
- `templates/hooks/karpathy-gate.sh` cherry-pick + `cherrypicks.lock` 등록
- `src/settings-merge.ts` PreToolUse entry add (idempotent)
- installer 통합 — withKarpathyHook=true AND karpathy install 성공 시 hook entry 자동 추가
- README/USAGE — 4 enforcement level 가이드 (deep-research 반영)
- v0.6.0 태그

### 제외 (Out of Scope)

SPEC §3.2. 핵심:
- B 경로 (`.git/hooks/pre-commit`), C 경로 (Husky)
- GitHub Actions CI gate 자동 추가
- Default-on
- Python 3 자동 설치
- 다른 plugin hook 자동 등록

### 완료 기준

SPEC §2 AC1~AC6 모두 Pass + v0.6.0 태그 push.

### 제약 조건

- vitest threshold 유지 — lines/funcs/stmt 90 / branches 88
- 기존 437 tests 미수정 (추가만)
- `~/.claude/`, `~/.codex/`, `~/.opencode/` 미수정
- 기존 8 ALWAYS_HOOKS 미변경

---

## Phase 분해 (SPEC §4 mirror)

### Phase 1 — Type + Option

**목표**: opt-in 옵션 + flag + 인터랙티브 prompt 인프라.

| ID | 작업 | 파일 | 검증 |
|----|------|------|------|
| P1-T1 | `OptionFlags.withKarpathyHook: boolean` + `DEFAULT_OPTIONS.withKarpathyHook = false` | `src/types.ts` | typecheck + tests/types.test.ts 갱신 |
| P1-T2 | `OPTION_DEFS` entry — label "karpathy-coder pre-commit hook (opt-in)", hint "Claude Code Write\|Edit gate. Python 3 권장" | `src/prompts.ts` | 인터랙티브 multiselect에서 노출 |
| P1-T3 | `--with-karpathy-hook` CLI flag (cac arg parser) | `src/cli.ts` 또는 `src/commands/install.ts` | flag 파싱 → OptionFlags 매핑 |

### Phase 2 — Hook script cherry-pick

**목표**: `karpathy-gate.sh` 자체 호스팅 + 동기화 인프라.

| ID | 작업 | 파일 | 검증 |
|----|------|------|------|
| P2-T1 | `templates/hooks/karpathy-gate.sh` 생성 — alirezarezvani/claude-skills@<commit>의 hooks/karpathy-gate.sh cherry-pick | 신규 | 파일 존재 + shellcheck PASS |
| P2-T2 | `.dev-references/cherrypicks.lock`에 `karpathy-coder/hooks/karpathy-gate.sh` entry 등록 | 갱신 | grep |

**graceful exit 검증**: `command -v python3` 부재 시 exit 0 + warn (commit 차단 X).

### Phase 3 — Settings merge helper

**목표**: `.claude/settings.json` PreToolUse entry idempotent merge.

| ID | 작업 | 파일 | 검증 |
|----|------|------|------|
| P3-T1 | `src/settings-merge.ts` 신규 — `addPreToolUseHook(settings, matcher, hookCommand)` 함수 | 신규 | unit test |
| P3-T2 | unit test 4 case — `tests/settings-merge.test.ts` | 신규 | empty hooks → add / 기존 entry 있음 → idempotent / 다른 matcher 보존 / 다른 PreToolUse hook 보존 |

### Phase 4 — Install pipeline 통합

**목표**: withKarpathyHook=true AND karpathy install 성공 시 hook entry 등록.

| ID | 작업 | 파일 | 검증 |
|----|------|------|------|
| P4-T1 | `installer.ts` 또는 `external-installer.ts` — install report에서 karpathy-coder install 결과 추적, 성공 + flag true 시 settings.json 갱신 | `src/installer.ts` | integration test |
| P4-T2 | `templates/hooks/karpathy-gate.sh` 복사 — manifest 또는 별도 routine | `src/manifest.ts` 또는 installer | 파일 검증 |
| P4-T3 | unit test 4 case — `tests/install-karpathy-hook.test.ts` 신규 | 신규 | flag true × install 성공/실패, flag false × 성공/실패 |

### Phase 5 — Docs + Mock dogfood

| ID | 작업 | 파일 | 검증 |
|----|------|------|------|
| P5-T1 | `docs/USAGE.md` "karpathy-coder Enforcement" 섹션 신규 — 4 level + L3 활성화 절차 + Python 3 안내 | 갱신 | grep + level 표 |
| P5-T2 | `README.md` / `README.ko.md` — `--with-karpathy-hook` 한 줄 안내 + USAGE link | 갱신 | grep |
| P5-T3 | Mock dogfood — install + flag true → settings.json 검증. `docs/dogfood/karpathy-hook-2026-04-26.md` | 신규 | dogfood 리포트 |

### Phase 6 — Review & Ship

| ID | 작업 | 검증 |
|----|------|------|
| P6-T1 | reviewer subagent 5축 | CRITICAL = 0 |
| P6-T2 | `npm run ci` PASS — typecheck + lint + test:coverage(90/88/90/90) + build | log |
| P6-T3 | `package.json` 0.5.0 → 0.6.0 + CHANGELOG | bump |
| P6-T4 | `/uzys:ship` → v0.6.0 태그 + push | tag 존재 |

---

## 의존성 그래프

```
P1 → P2 → P3 → P4 → P5 → P6
       ↘    ↗
        병행 가능: P5 docs는 P3/P4 진행 중에도 시작 가능
```

직렬: P1(타입) → P2(스크립트) → P3(merge helper) → P4(통합).
병행: P5 docs는 P3/P4 후반부와 병행 가능.

---

## North Star 4-gate 재확인

SPEC §2에 자체 4/4 + research §4-gate 재평가에서 Modified Go (5 조건 충족 시 4/4) 명시. 본 plan은 그 5 조건 모두 task로 분해:
- opt-in 강제 (P1-T1: default false)
- install prompt (P1-T2)
- yes 후에만 wiring (P4-T1)
- USAGE 4 level (P5-T1)
- 비차단 graceful exit (P2-T1 cherry-pick + Python 3 체크)

---

## Revision & Escalation

- **Revision 상한**: Phase 내 자동 수정 ≤ 2회. 초과 시 escalation.
- **Escalation 트리거**:
  - settings.json merge 회귀 (기존 entry 손상)
  - cherry-pick 동기화 실패 (alirezarezvani repo 가용성)
  - 통합 테스트 4 case 중 1 case라도 flaky
- **Abort 조건**:
  - `~/.claude/`, `~/.codex/`, `~/.opencode/` mtime 변동
  - 기존 8 ALWAYS_HOOKS 회귀
  - SPEC Non-Goals 침범 (default-on 우발 등)

---

## Risks (SPEC §7 mirror + Plan-specific)

| Risk | 완화 |
|------|------|
| settings.json merge bug — 사용자 환경 손상 | unit test 4 case + idempotent 검증 + integration test |
| Python 3 부재 시 hook 실행 실패 | `karpathy-gate.sh` graceful exit (P2-T1 cherry-pick 시 검증) |
| upstream cherry-pick drift | `cherrypicks.lock` + `sync-cherrypicks.sh` 재사용 |
| install 실패 시 hook entry 잔존 | P4-T1에서 install 성공 후에만 wiring (조건부) |
| 사용자 default-on 기대 | README/USAGE에 "opt-in 강제" 명시 + USAGE 4 level 가이드 |
| docs L3 가이드 불완전 | P5-T1 grep 검증 + reviewer pass |

---

## Open Questions (SPEC §3.4 — Closed)

SPEC §3.4 OQ1-4 모두 Closed (사용자 결정 2026-04-26):
- OQ1 (cherry-pick), OQ2 (등록 + warn), OQ3 (`Write|Edit`), OQ4 (신규 settings-merge helper).

---

## Changelog

- 2026-04-26: 초안. SPEC §4 Phase mirror + research 4-gate 재평가 5 조건을 task로 명시. 약 17 task (P1: 3 + P2: 2 + P3: 2 + P4: 3 + P5: 3 + P6: 4).
