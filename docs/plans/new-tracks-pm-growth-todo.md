# Todo: 신규 Track 2개 + karpathy-coder (v0.5.0)

> **Linked plan**: `docs/plans/new-tracks-pm-growth-plan.md`
> **Linked SPEC**: `docs/specs/new-tracks-pm-growth.md`
> **Target tag**: v0.5.0

---

## Phase 1 — Track 확장

- [ ] **P1-T1** `src/types.ts` — `Track` union에 `project-management` + `growth-marketing` 추가 (TRACKS 배열 길이 11)
- [ ] **P1-T2** `src/prompts.ts` — `TRACK_LABELS` 신규 2 라벨 + interactive prompts 표시 추가
- [ ] **P1-T3** `src/manifest.ts` — `project-management` baseline (executive-style: rules/skills/agents 매핑)
- [ ] **P1-T4** `src/manifest.ts` — `growth-marketing` baseline (executive-style)
- [ ] **P1-T5** `templates/project-claude/project-management.md` 신규 작성
- [ ] **P1-T6** `templates/project-claude/growth-marketing.md` 신규 작성
- [ ] **P1-T7** `src/router.ts` / `src/state.ts` — 필요 시 Track 식별자 추가 (기존 Track 처리 패턴 따라)

**Phase 1 검증**: `pnpm typecheck` + `pnpm test:unit` PASS.

---

## Phase 2 — External assets (catalog 8 entries)

- [ ] **P2-T1** `pm-skills` entry 신규 — condition `any-track: [project-management]`, marketplace `alirezarezvani/claude-skills`, pluginId `pm-skills@claude-code-skills`
- [ ] **P2-T2** `product-skills` entry 신규 — condition `any-track: [csr-supabase, csr-fastify, csr-fastapi, ssr-htmx, ssr-nextjs, tooling, data, full, project-management]`, pluginId `product-skills@claude-code-skills`
- [ ] **P2-T3** `marketing-skills` entry 신규 — condition `any-track: [growth-marketing]`, pluginId `marketing-skills@claude-code-skills`
- [ ] **P2-T4** `business-growth-skills` condition 확장 — 기존 `[executive, full]` → `[executive, full, growth-marketing]`. 회귀 0 확인.
- [ ] **P2-T5** `content-creator` entry 신규 — condition `any-track: [growth-marketing]`, pluginId `content-creator@claude-code-skills`
- [ ] **P2-T6** `demand-gen` entry 신규 — condition `any-track: [growth-marketing]`, pluginId `demand-gen@claude-code-skills`
- [ ] **P2-T7** `research-summarizer` entry 신규 — condition `any-track: [growth-marketing]`, pluginId `research-summarizer@claude-code-skills`
- [ ] **P2-T8** **`karpathy-coder`** entry 신규 — condition `has-dev-track`, marketplace `alirezarezvani/claude-skills`, pluginId `karpathy-coder@claude-code-skills`. 4 Python tools + reviewer agent + slash command + pre-commit hook.

**Phase 2 검증**: `installer-track-matrix.test.ts` PASS. `business-growth-skills` 기존 executive/full Track 매핑 회귀 0.

---

## Phase 3 — 매트릭스 테스트 (61 PASS)

- [ ] **P3-T1** `tests/installer-cli-matrix.test.ts` — TRACKS 11 × CLI mode 5 = **55 시나리오** + invariant 6 = 61 PASS
- [ ] **P3-T2** `tests/installer-track-matrix.test.ts` — 두 Track × 외부 자산 매핑 케이스 추가
- [ ] **P3-T3** `tests/installer-9-track.test.ts` → `installer-11-track.test.ts` rename + 11 케이스
- [ ] **P3-T4** regression 0 검증 — 기존 vitest 413 tests 추가만 허용 (수정 X). `git diff tests/` 검토

**Phase 3 검증**: `pnpm test:coverage` 통과 + threshold 90/89 유지.

---

## Phase 4 — Docs & dogfood

- [ ] **P4-T1** `README.md` — Track 표 9 → 11 + karpathy-coder 한 줄
- [ ] **P4-T2** `README.ko.md` — 영문 동일 갱신
- [ ] **P4-T3** `docs/USAGE.md` — 신규 Track 시나리오 (PM + Growth Marketing) + pm/product 공존 안내 (OQ3)
- [ ] **P4-T4** `docs/REFERENCE.md` — Track 표 + 외부 자산 표 갱신 (8 entries)
- [x] **P4-T5** dogfood — ~~라이브 install~~ → ADR-005 (Accepted 2026-04-26)로 다운그레이드. marketplace verification (8 plugin id 등록 확인) + Mock dogfood (매트릭스 437 PASS). 리포트 `docs/dogfood/cli-dogfood-2026-04-26-v0.5.0.md`. CRITICAL/HIGH = 0

**Phase 4 검증**: docs grep + dogfood 리포트.

---

## Phase 5 — Review & Ship

- [ ] **P5-T1** `/uzys:review` — 5축 리뷰 CRITICAL = 0
- [ ] **P5-T2** `/uzys:test` — vitest threshold 통과 + 매트릭스 61 PASS 확인
- [ ] **P5-T3** ship-checklist (`rules/ship-checklist.md`) 모든 항목 PASS
- [ ] **P5-T4** `package.json` version bump 0.4.0 → 0.5.0 + CHANGELOG
- [ ] **P5-T5** Self-Audit 5항목 기록 — 리포트 `docs/dogfood/v0.5.0-self-audit.md` 또는 PR description
- [ ] **P5-T6** `/uzys:ship` → v0.5.0 태그 + push

---

## 완료 조건

- [ ] SPEC AC1~AC6 모두 Pass (4-gate 8 entries 4/4 검증)
- [ ] Phase 1~5 모든 task 완료
- [ ] regression 0 (기존 9 Track 45 시나리오 + 413 tests 보존)
- [ ] v0.5.0 태그 push

---

## OQ 처리 매핑

| OQ | 처리 시점 | 결과 |
|----|----------|------|
| OQ1 karpathy hook 자동 활성화 | v0.6+ 별도 ADR | 본 SPEC 범위 외. README enforcement levels 안내만 |
| OQ2 business-growth 합집합 검증 | P2-T4 | unit test 추가 |
| OQ3 pm/product 공존 안내 | P4-T3 | USAGE.md 안내 |
| OQ4 dogfood 범위 | P4-T5 | ~~growth-marketing 1개 라이브~~ → ADR-005로 mock + marketplace verification 다운그레이드. 라이브는 v0.6+ |

---

## 발견 시 추가할 항목 (placeholder)

- [ ] (지금 비워둠 — Build 단계에서 발견되는 작업 추가 시 이 섹션에 기록)
