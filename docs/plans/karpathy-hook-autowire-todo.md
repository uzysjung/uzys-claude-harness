# Todo: karpathy-coder hook auto-wire (v0.6.0)

> **Linked plan**: `docs/plans/karpathy-hook-autowire-plan.md`
> **Linked SPEC**: `docs/specs/karpathy-hook-autowire.md`
> **Target tag**: v0.6.0

---

## Phase 1 — Type + Option

- [ ] **P1-T1** `src/types.ts` — `OptionFlags.withKarpathyHook: boolean` + `DEFAULT_OPTIONS.withKarpathyHook = false`
- [ ] **P1-T2** `src/prompts.ts` — `OPTION_DEFS`에 entry 추가 (label "karpathy-coder pre-commit hook (opt-in)", hint "Claude Code Write\|Edit gate · Python 3 권장")
- [ ] **P1-T3** `src/cli.ts` 또는 `src/commands/install.ts` — `--with-karpathy-hook` flag 파싱 + OptionFlags 매핑

**Phase 1 검증**: `npx tsc --noEmit` PASS + tests/types.test.ts 갱신 후 PASS.

---

## Phase 2 — Hook script cherry-pick

- [ ] **P2-T1** `templates/hooks/karpathy-gate.sh` 신규 — alirezarezvani/claude-skills의 `engineering/karpathy-coder/hooks/karpathy-gate.sh` cherry-pick (graceful exit 패턴 검증)
- [ ] **P2-T2** `.dev-references/cherrypicks.lock`에 entry 등록 — source URL + commit hash + 대상 path

**Phase 2 검증**: shellcheck PASS + Python 3 부재 시 graceful exit 시뮬레이션.

---

## Phase 3 — Settings merge helper

- [ ] **P3-T1** `src/settings-merge.ts` 신규 — `addPreToolUseHook(settings: SettingsJson, matcher: string, hookCommand: string): SettingsJson` (idempotent)
- [ ] **P3-T2** `tests/settings-merge.test.ts` 신규 — 4 case:
  - empty hooks → entry add
  - 기존 동일 entry → idempotent (중복 X)
  - 다른 matcher entry 보존
  - 다른 PreToolUse hook entry 보존

**Phase 3 검증**: vitest unit test 4 case PASS.

---

## Phase 4 — Install pipeline 통합

- [ ] **P4-T1** `installer.ts` (또는 `external-installer.ts`) — install report에서 karpathy-coder install 결과 추적. `spec.options.withKarpathyHook === true && karpathy-coder install 성공` 시 settings.json 갱신
- [ ] **P4-T2** `karpathy-gate.sh` 복사 — manifest entry 또는 별도 routine으로 `templates/hooks/karpathy-gate.sh` → `<projectDir>/.claude/hooks/karpathy-gate.sh`
- [ ] **P4-T3** `tests/install-karpathy-hook.test.ts` 신규 — 4 case:
  - flag=true + install 성공 → settings.json + hook script 둘 다 존재
  - flag=true + install 실패 → 둘 다 미생성
  - flag=false + install 성공 → 둘 다 미생성
  - flag=true + install 성공 (2회 실행) → idempotent (중복 entry X)

**Phase 4 검증**: integration test 4 case PASS.

---

## Phase 5 — Docs + Mock dogfood

- [ ] **P5-T1** `docs/USAGE.md` — "karpathy-coder Enforcement (4 level)" 섹션 신규:
  - L1 Passive (plugin install 자동)
  - L2 Active review (`/karpathy-check`)
  - L3 Automated gate (3 옵션 — A `.claude/settings.json` / B Husky / C `.pre-commit-config.yaml`. 본 installer는 A 자동화)
  - L4 CI integration (GitHub Actions 사용자 작성)
  - L3 활성화 절차 + Python 3 안내 + L3 비차단 (warn-only) 명시
- [ ] **P5-T2** `README.md` / `README.ko.md` — `--with-karpathy-hook` 한 줄 안내 (Common tools 섹션 또는 Optional features) + `docs/USAGE.md` link
- [ ] **P5-T3** `docs/dogfood/karpathy-hook-2026-04-26.md` Mock dogfood:
  - flag=true install → settings.json PreToolUse `Write|Edit` entry 검증
  - flag=true install 2회 → idempotent
  - hook script 권한 (`chmod +x`) 검증

**Phase 5 검증**: docs grep + dogfood 리포트 CRITICAL=0.

---

## Phase 6 — Review & Ship

- [ ] **P6-T1** `/uzys:review` 또는 reviewer subagent — 5축 리뷰 CRITICAL = 0
- [ ] **P6-T2** `npm run ci` PASS — typecheck + lint + test:coverage(90/88/90/90) + build
- [ ] **P6-T3** `package.json` 0.5.0 → 0.6.0 + `CHANGELOG.md` v0.6.0 entry
- [ ] **P6-T4** ship-checklist (`rules/ship-checklist.md`) 모든 항목 PASS
- [ ] **P6-T5** Self-Audit 5항목 기록
- [ ] **P6-T6** PR 생성 → squash merge → v0.6.0 태그 + push

---

## 완료 조건

- [ ] SPEC AC1~AC6 모두 Pass
- [ ] Phase 1~6 모든 task 완료
- [ ] regression 0 (기존 437 tests + 8 ALWAYS_HOOKS 보존)
- [ ] v0.6.0 태그 push

---

## OQ 처리 (Closed)

| OQ | 결정 | 처리 시점 |
|----|------|----------|
| OQ1 hook script 호스팅 | cherry-pick (templates/hooks/karpathy-gate.sh) | P2-T1 |
| OQ2 Python 3 부재 | 등록 + warn (graceful exit) | P2-T1 cherry-pick 시 검증 |
| OQ3 matcher | `Write\|Edit` | P3-T1 helper signature |
| OQ4 settings merge | 신규 helper `src/settings-merge.ts` | P3-T1 |

---

## 발견 시 추가 (placeholder)

- [ ] (Build 단계 발견 시 추가)
