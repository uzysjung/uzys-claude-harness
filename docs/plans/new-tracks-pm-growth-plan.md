# Plan: 신규 Track 2개 + karpathy-coder (v0.5.0)

> **Linked SPEC**: `docs/specs/new-tracks-pm-growth.md` (Accepted, 2026-04-25)
> **Linked Todo**: `docs/plans/new-tracks-pm-growth-todo.md`
> **Created**: 2026-04-25
> **Status**: Plan
> **Target tag**: v0.5.0
> **Complexity**: Complex (multi-file, cross-cutting, 신규 Track 2개 + 자산 8 entries + 매트릭스 갱신)

---

## Sprint Contract

### 범위 (In Scope)

SPEC §3.1 F1~F9. 요약:

- TRACKS 9 → 11 (`project-management`, `growth-marketing`)
- 두 Track baseline manifest + project-claude 템플릿
- external-assets 8 entries (신규 7 + condition 확장 1)
- 매트릭스 테스트 9×5=45 → 11×5=55 + invariant 6 = 61
- README/USAGE/REFERENCE 갱신
- dogfood 1회 (`growth-marketing` 라이브)
- v0.5.0 ship

### 제외 (Out of Scope)

SPEC §3.2 그대로. 핵심:
- karpathy-coder 자동 와이어링 (pre-commit hook 자동 활성화 등)
- 기존 9 Track baseline 변경
- Phase 1 Finalization (v26.38.0) 작업
- product-skills baseline 격상

### 완료 기준

SPEC §2 AC1~AC6 모두 Pass + v0.5.0 태그 push.

### 제약 조건

- vitest threshold 유지 — lines/funcs/stmt **90** / branches **89**
- 기존 vitest 413 tests 미수정 (추가만 허용)
- 기존 9 Track 매트릭스 45 시나리오 + invariant 6 보존
- DO NOT CHANGE 영역 미수정 (SPEC §3.3)

---

## Phase 분해 (SPEC §4 mirror)

### Phase 1 — Track 확장

**목표**: 11 Track 식별자 + 라벨 + baseline manifest + project-claude 템플릿.

**Task**:

| ID | 작업 | 파일 | 검증 |
|----|------|------|------|
| P1-T1 | `Track` union에 `project-management` + `growth-marketing` 추가 | `src/types.ts` | typecheck PASS, TRACKS 길이 11 |
| P1-T2 | `TRACK_LABELS` 신규 2 라벨 + interactive prompts 추가 | `src/prompts.ts` | unit test (label snapshot) |
| P1-T3 | baseline manifest entries — `project-management` (executive-style: rules pm-baseline + skills 비어있음 or pm-skills 자리만 마련) | `src/manifest.ts` | manifest validation |
| P1-T4 | baseline manifest entries — `growth-marketing` (executive-style) | `src/manifest.ts` | manifest validation |
| P1-T5 | project-claude 템플릿 — `templates/project-claude/project-management.md` 신규 | 신규 | 파일 존재 |
| P1-T6 | project-claude 템플릿 — `templates/project-claude/growth-marketing.md` 신규 | 신규 | 파일 존재 |
| P1-T7 | router/state — Track 식별자 추가 (필요 시) | `src/router.ts`, `src/state.ts` | 기존 unit test PASS |

**검증**: `pnpm test:unit` 또는 `vitest run` PASS.

### Phase 2 — External assets

**목표**: catalog 8 entries 변경.

**Task**:

| ID | 작업 | Condition | 검증 |
|----|------|-----------|------|
| P2-T1 | `pm-skills` entry 신규 | `any-track: [project-management]` | unit test track-matrix |
| P2-T2 | `product-skills` entry 신규 | `any-track: [csr-*, ssr-*, tooling, data, full, project-management]` (has-dev-track + project-management) | unit test |
| P2-T3 | `marketing-skills` entry 신규 | `any-track: [growth-marketing]` | unit test |
| P2-T4 | `business-growth-skills` condition 확장 | `any-track: [executive, full, growth-marketing]` (기존 executive+full 보존 + growth-marketing 추가) | unit test (executive/full 회귀 X) |
| P2-T5 | `content-creator` entry 신규 | `any-track: [growth-marketing]` | unit test |
| P2-T6 | `demand-gen` entry 신규 | `any-track: [growth-marketing]` | unit test |
| P2-T7 | `research-summarizer` entry 신규 | `any-track: [growth-marketing]` | unit test |
| P2-T8 | **`karpathy-coder`** entry 신규 | `has-dev-track` | unit test — 모든 dev Track에 등장, executive에 없음 |

**검증 핵심**: `business-growth-skills` 회귀 0 (P2-T4). vitest matrix.

**`condition: has-dev-track`** 표현 — 기존 catalog `addy-agent-skills` 패턴(L119) 재사용.

### Phase 3 — 매트릭스 테스트

**목표**: 11×5=55 + invariant 6 = **61 PASS**.

**Task**:

| ID | 작업 | 파일 | 검증 |
|----|------|------|------|
| P3-T1 | `installer-cli-matrix.test.ts` — TRACKS 11 × CLI mode 5 = 55 시나리오 확장 | `tests/installer-cli-matrix.test.ts` | 55 PASS + invariant 6 PASS |
| P3-T2 | `installer-track-matrix.test.ts` — 두 Track × 외부 자산 매핑 케이스 추가 | 신규 또는 기존 확장 | unit test |
| P3-T3 | `installer-9-track.test.ts` → `installer-11-track.test.ts` rename + 11 케이스 | rename | unit test |
| P3-T4 | regression 0 검증 — 기존 45 시나리오 동일 결과 + 기존 vitest 413 tests 추가만 (수정 X) | grep diff | git diff 검토 |

**검증**: `pnpm test:coverage` 통과 + threshold 유지.

### Phase 4 — Docs & dogfood

**목표**: 사용자 가이드 정합 + 라이브 검증.

**Task**:

| ID | 작업 | 파일 | 검증 |
|----|------|------|------|
| P4-T1 | `README.md` Track 표 9 → 11 갱신 + karpathy-coder 한 줄 언급 | `README.md` | grep |
| P4-T2 | `README.ko.md` 동일 갱신 | `README.ko.md` | grep |
| P4-T3 | `docs/USAGE.md` 신규 Track 시나리오 추가 (PM/Growth Marketing) | `docs/USAGE.md` | grep |
| P4-T4 | `docs/REFERENCE.md` Track 표 + 외부 자산 표 갱신 | `docs/REFERENCE.md` | grep |
| P4-T5 | dogfood 1회 — `growth-marketing` Track 라이브 install (5 자산 + manifest) | 임시 디렉토리 | 리포트 `docs/dogfood/cli-dogfood-2026-04-XX-growth.md`, CRITICAL/HIGH = 0 |

### Phase 5 — Review & Ship

**Task**:

| ID | 작업 | 검증 |
|----|------|------|
| P5-T1 | `/uzys:review` 5축 리뷰 | CRITICAL = 0 |
| P5-T2 | `/uzys:test` 최종 — vitest threshold 통과 + 매트릭스 61 PASS | 리포트 |
| P5-T3 | ship-checklist (rules/ship-checklist.md) | 모든 항목 PASS |
| P5-T4 | `package.json` 0.4.0 → 0.5.0 + CHANGELOG | bump 커밋 |
| P5-T5 | Self-Audit 5항목 기록 | 리포트 |
| P5-T6 | `/uzys:ship` → v0.5.0 태그 + push | tag 존재 |

---

## 의존성 그래프

```
P1 → P2 → P3 → P4 → P5
       ↘    ↗
        병행 가능 P4-T1~T4 (docs)는 P3 완료 전에도 시작 가능
```

직렬: P1(타입/식별자) → P2(자산 catalog) → P3(매트릭스) → P5(ship).
병행: P4 docs 작업은 P2 완료 후 P3과 병행 가능 (자산 명세 확정 후).
P4-T5 dogfood는 P3 완료 후 (매트릭스 PASS 확인 후 라이브).

---

## North Star 4-gate 재확인

SPEC §3.5에 이미 8 entries 4/4 Pass 명시. 본 plan에서는 인용만.

추가 신규 결정 없음 → 4-gate 추가 평가 불필요.

---

## Revision & Escalation

- **Revision 상한**: 각 Phase 내 자동 수정 ≤ 2회. 초과 시 escalation.
- **Escalation 트리거**:
  - OQ1-4 자동 해결 불가 (특히 OQ2 — `business-growth-skills` 합집합 회귀 발견 시)
  - 매트릭스 시나리오 시간 ≥ 1분 추가 (P10 재평가)
  - dogfood CRITICAL 발견
- **Abort 조건**:
  - `~/.claude/`, `~/.codex/`, `~/.opencode/` mtime 변동
  - 기존 9 Track 매트릭스 회귀
  - `docs/SPEC.md` (v26.38.0 트랙) 변경 시도

---

## Risks (SPEC §7 mirror + Plan-specific)

| Risk | 완화 |
|------|------|
| `business-growth-skills` condition 합집합 회귀 (P2-T4) | unit test에서 executive/full/growth-marketing 3 Track 모두 entry hit 확인 |
| 매트릭스 시간 +22% | parametric vitest 유지. P10 재평가 트리거 |
| `karpathy-coder` Python 3 의존 — 일부 Track 환경 미보장 | plugin install 자체는 stdlib 무관. README에 사용자 책임 1줄 |
| dogfood 1회만 — 신규 Track 검증 부족 | P3 매트릭스로 보강. `project-management`는 자산 적어 매트릭스로 충분 |
| `product-skills` (15 skill) 토큰 부담 | `context: fork` 시점 로드. v0.6+ 우려 시 분리 |
| docs 갱신 누락 | P4 grep 검증 + reviewer subagent docs 패스 |

---

## Open Questions (SPEC §3.4 mirror — 본 plan에서 처리 시점)

- **OQ1** karpathy hook 자동 활성화: **본 SPEC 범위 외** (v0.6+). README에 enforcement levels 안내만.
- **OQ2** business-growth condition 합집합 검증: **P2-T4 unit test에서 처리**.
- **OQ3** pm/product 공존 안내: **P4-T3 USAGE.md에서 처리**.
- **OQ4** dogfood 범위: **P4-T5 — `growth-marketing` 1개**. project-management는 매트릭스만.

---

## Changelog

- 2026-04-25: 초안. SPEC §4 Phase 분해를 task 단위로 vertical slicing. 23 task (P1: 7 + P2: 8 + P3: 4 + P4: 5 + P5: 6 — 단, 재검토 시 30+).
