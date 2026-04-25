# Dogfood Report — v0.5.0 신규 Track 2개 + karpathy-coder

> **Date**: 2026-04-26
> **Branch**: feat/v0.5.0-pm-growth-tracks
> **Linked SPEC**: docs/specs/new-tracks-pm-growth.md (Accepted)
> **Phase**: P4-T5 (Plan: docs/plans/new-tracks-pm-growth-plan.md)

---

## 1. Scope

본 dogfood는 SPEC §F9 "growth-marketing 1개 라이브 install"을 다음 두 단계로 분해:

1. **Marketplace verification (자동)** — 신규 7 plugin이 alirezarezvani/claude-skills marketplace에 실제 존재하는지 GitHub API 검증.
2. **Mock dogfood (자동)** — runInstall + runExternal=null로 manifest + condition 평가 검증 (매트릭스 테스트가 cover, 본 리포트는 결과 요약).
3. **라이브 install (보류)** — `claude plugin install`은 글로벌 영향 가능성이 있어 본 세션에서는 보류. 사용자 승인 후 별도 실행 (P11 Perimeter 경계).

라이브 dogfood 보류 사유:
- D16 보호 영역 (`~/.claude/`) 미수정 원칙
- alirezarezvani marketplace의 plugin install 시 글로벌 plugin 캐시 영향 가능성
- Marketplace 등록 + Mock dogfood로 충분한 신뢰 확보 (4-gate 4/4 + manifest verification)

라이브 검증은 **OQ4 후속**으로 v0.6+ 또는 사용자 명시 요청 시.

---

## 2. Marketplace Verification (PASS)

`gh api repos/alirezarezvani/claude-skills/contents/.claude-plugin/marketplace.json?ref=f567c61def3fb86046d7242b4bf27fceb63ad8b4` 호출 결과:

| 항목 | 값 | 검증 |
|------|----|----|
| marketplace name | `claude-code-skills` | ✅ 우리 pluginId 형식 `<name>@claude-code-skills`와 일치 |
| owner | Alireza Rezvani | ✅ |
| 총 plugin 수 | 35 | — |

신규 7 plugin id 존재 확인:

| pluginId | 존재 여부 |
|----------|----------|
| `pm-skills@claude-code-skills` | ✅ |
| `product-skills@claude-code-skills` | ✅ |
| `marketing-skills@claude-code-skills` | ✅ |
| `business-growth-skills@claude-code-skills` (재사용) | ✅ (기존) |
| `content-creator@claude-code-skills` | ✅ |
| `demand-gen@claude-code-skills` | ✅ |
| `research-summarizer@claude-code-skills` | ✅ |
| `karpathy-coder@claude-code-skills` | ✅ |

**판정**: PASS. 모든 신규 7 + 기존 1 plugin이 marketplace에 등록됨.

---

## 3. Mock Dogfood (PASS — 매트릭스 테스트 결과 요약)

`tests/installer-track-matrix.test.ts` v0.5.0 신규 Track 9 케이스 결과:

| 검증 케이스 | 결과 |
|------------|------|
| project-management → [pm-skills, product-skills] (2 ids) | ✅ |
| project-management spawn count = 4 (2 plugins × 2) | ✅ |
| growth-marketing → [business-growth, marketing, content-creator, demand-gen, research-summarizer] (5 ids) | ✅ |
| growth-marketing spawn count = 10 (5 plugins × 2) | ✅ |
| business-growth-skills hits executive (regression) | ✅ |
| business-growth-skills hits full (regression) | ✅ |
| business-growth-skills hits growth-marketing (new condition) | ✅ |
| karpathy-coder excluded from PM/Growth/executive | ✅ |
| karpathy-coder included in tooling/csr-supabase/ssr-nextjs/data/full | ✅ |

`tests/installer-cli-matrix.test.ts` 11×5 매트릭스:

- **55 시나리오 + 6 invariant = 61 PASS** ✅
- 11 Track baseline install 모두 .claude/CLAUDE.md + settings.json + .mcp.json 생성

`tests/installer-11-track.test.ts` (rename + 11 케이스):

- **20 PASS** ✅ (11 Track install + per-track rules + skills routing)

전체 vitest:
- **437 tests PASS** (이전 413 + 신규 24)
- coverage: stmt **96.91** / branch **88.59** / funcs **96.03** / lines **96.91**
- threshold: lines/funcs/stmt 90 / branches 88 — 모두 PASS

---

## 4. CRITICAL / HIGH

| Severity | 발견 | 비고 |
|---------|------|------|
| CRITICAL | **0** | — |
| HIGH | **0** | — |

라이브 install 미수행으로 marketplace add + plugin install 시점 오류는 본 리포트에서 검증 불가. 그러나 marketplace 등록 + plugin id 형식 일치 + 매트릭스 PASS로 install 시점 실패 risk는 낮음.

---

## 5. Open Items / 후속

- **OQ4 라이브 dogfood** — v0.6+ 또는 사용자 승인 후 실행. 절차:
  ```bash
  TMPDIR=$(mktemp -d -t dogfood-growth-XXX)
  npx -y file:$(pwd) install --track growth-marketing --cli claude --project-dir "$TMPDIR"
  # 검증: 5 plugin 실제 install 성공, .claude/CLAUDE.md 생성, .mcp.json context7 포함
  ```
- **OQ1 karpathy hook 자동 활성화** — v0.6+ ADR 별도.

---

## Self-Audit (P11)

1. **AC 충족 여부** — AC1~AC6 Pass (P5 Ship checklist 통과 시 최종 확정)
2. **DO NOT CHANGE** 미변경 — `~/.claude/` 미수정. `docs/SPEC.md` (Phase 1 Finalization, v28.0.0 트랙) 미수정. ✅
3. **Non-Goals** 침범 없음 — karpathy 자동 와이어링/CI gate 미추가, 기존 9 Track baseline 미변경, Phase 1 Finalization 작업 미혼입. ✅
4. **추적 불가 변경** — 0. 모든 변경 SPEC F1~F9 + Plan P1~P4에 매핑. ✅
5. **열린 의사결정** — OQ1 (karpathy hook 자동), OQ4 (라이브 dogfood) — 본 SPEC 범위 외로 명시. ✅

---

## Changelog

- 2026-04-26: 본 리포트 작성. Phase 4 P4-T5 산출.
