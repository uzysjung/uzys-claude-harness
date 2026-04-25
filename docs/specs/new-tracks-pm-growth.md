# SPEC: 신규 Track 2개 + karpathy-coder (v0.5.0)

> **Status**: Accepted (2026-04-25)
> **Predecessor**: `docs/specs/cli-rewrite-completeness.md` (Accepted, v0.4.0 ship)
> **Trigger**: 사용자 결정 (`docs/dev/session-2026-04-25-tracks-handoff.md` §1) — Persona 확장(PM/Growth Marketing) + karpathy-coder 검증 도구 통합.
> **Target Tag**: v0.5.0
> **Issue Tracking**: disabled (opt-in 미명시)

---

## 1. Objective

CLI installer Track을 9 → **11**로 확장하고, dev Track 공통 enforcement 도구 1종(`karpathy-coder`)을 외부 자산 catalog에 추가한다.

**3가지 결과**:

1. **Persona 커버리지 확대**: `project-management`(PM/Scrum/Jira), `growth-marketing`(Growth Lead/Content) Persona가 첫 설치만으로 즉시 가동 가능한 baseline 확보.
2. **Code-quality enforcement 자동화 시드**: `karpathy-coder` plugin (4 Python tool + reviewer agent + `/karpathy-check` + pre-commit hook)을 dev Track 공통 자산으로 catalog 등재. CLAUDE.md P1-P4 선언적 원칙을 **검출 도구 layer**로 보강.
3. **regression 0 보존**: 기존 9 Track × 5 mode (45) + invariant 6 매트릭스 100% 유지.

## 2. 판단 기준 (불변)

CLAUDE.md Decision Making 메타룰 + NORTH_STAR §5 4-gate(Trend / Persona / Capability / Lean)를 모든 신규 자산 entry에 적용. **4/4 미만 → 제외**.

### 완료 조건 (AC)

- **AC1** `src/types.ts` `TRACKS`가 11종이 되며, `src/prompts.ts` `TRACK_LABELS`에 신규 2 Track 라벨 포함.
- **AC2** 두 신규 Track baseline manifest entries가 `src/manifest.ts`에 추가되어 `bash tests/test-harness.sh` 또는 vitest `tests/installer-track-matrix.test.ts`에서 PASS.
- **AC3** `src/external-assets.ts`에 8 entries 변경 (신규 7 + 기존 `business-growth-skills` condition 확장 1):
  - 신규: `pm-skills`, `product-skills`, `marketing-skills`, `content-creator`, `demand-gen`, `research-summarizer`, **`karpathy-coder`**
  - condition 확장: `business-growth-skills` (기존 `executive`+`full` → +`growth-marketing`)
- **AC4** 매트릭스 테스트 11 Track × 5 CLI mode = **55 시나리오** + invariant 6 = **61 PASS** (기존 51 → 61).
- **AC5** `README.md` / `README.ko.md` / `docs/USAGE.md` / `docs/REFERENCE.md`에 11 Track 표 + 자산 추가 반영.
- **AC6** **regression 0** — 기존 9 Track × 5 mode = 45 시나리오, 기존 vitest 413 tests 모두 보존(추가만 허용, 기존 케이스 미수정).

### 판정 절차

1. 각 신규 자산에 4-gate 판정 표 기록 (§3.5).
2. 산출물은 **파일/라인 수/커밋 SHA**로 검증 (자기주장 불가).
3. 미달 항목은 Non-Goals 이월 또는 범위 수정 CR.

## 3. 결정 일람

### 3.1 포함 (In Scope)

| ID | 작업 | 근거 | 4-gate |
|----|------|------|--------|
| **F1** | `TRACKS` 9 → 11 (`project-management`, `growth-marketing`) + `TRACK_LABELS` 확장 | 핸드오프 §1 사용자 결정 Q1/Q2 | Trend(Persona 확장)/Persona(PM·Growth)/Capability(베이스 manifest)/Lean(추가만). 4/4 |
| **F2** | `manifest.ts` baseline entries — 두 Track executive-style (no test/commit policy) | 핸드오프 §2 baseline 성격 | 4/4 |
| **F3** | `templates/project-claude/project-management.md` + `growth-marketing.md` 신규 | 핸드오프 §3 변경 영역 | 4/4 |
| **F4** | `external-assets.ts` 8 entries — §3.5 4-gate 표 참조 | 핸드오프 §2 자산 목록 + karpathy-coder 추가 | 8/8 entries 4/4 |
| **F5** | `tests/installer-cli-matrix.test.ts` 9×5 → 11×5 = **55** 확장 + invariant 6 보존 | AC4 | 4/4 |
| **F6** | `tests/installer-track-matrix.test.ts` 신규 Track × 외부 자산 매핑 unit test | AC3 검증 | 4/4 |
| **F7** | `tests/installer-9-track.test.ts` → `installer-11-track.test.ts` 갱신 (or 동일 파일 11 확장) | regression 0 | 4/4 |
| **F8** | `README.md` + `README.ko.md` + `docs/USAGE.md` + `docs/REFERENCE.md` Track 표 갱신 | AC5 | 4/4 |
| **F9** | dogfood 실측 1회 — 신규 2 Track 중 1개 라이브 install (`growth-marketing` 권장 — 자산 수 5종으로 매트릭스 부담 큰 쪽) | E2E Mock 금지 (test-policy.md Dev-Prod Parity 정신) | 4/4 |

### 3.2 제외 (Non-Goals)

- **karpathy-coder 자동 와이어링** — `.claude/settings.json` pre-commit hook 자동 활성화 / Husky 자동 설정 / GitHub Actions CI gate 자동 추가. plugin install만 제공, 활성화는 사용자 책임 (OQ1 참조).
- **기존 9 Track baseline 변경** — 기존 manifest/template 수정 금지 (DO NOT CHANGE).
- **다른 외부 자산 추가** — 본 SPEC 8 entry 외 추가 자산은 별도 SPEC.
- **Phase 1 Finalization (`docs/SPEC.md`) 작업** — v28.0.0은 별도 트랙. 본 SPEC은 v0.5.0.
- **CLAUDE.md 본문 수정** — P10 주기 외에는 제안만.
- **`product-skills` Track baseline 격상** — has-dev-track + project-management 조건 외부 자산으로만 등재 (manifest baseline 아님).
- **multi-language Track 라벨** — 한글 라벨은 `prompts.ts`만, 매뉴얼 다국어화는 별도.

### 3.3 DO NOT CHANGE

- `docs/SPEC.md` (Phase 1 Finalization, v28.0.0 트랙) — 본 SPEC과 분리.
- `docs/NORTH_STAR.md` — Persona 명시 변경 X (Track 추가는 Phase 2 진입 효율 안에서 자연스러움).
- 기존 9 Track baseline manifest entries (`src/manifest.ts` 기존 라인).
- `templates/codex/`, `src/codex/transform.ts` (Codex 호환 영역).
- `~/.claude/`, `~/.codex/`, `~/.opencode/` (D16 보호).
- `templates/hooks/` 기존 hook 로직.
- `tests/test-harness.sh` 147 assertions 현 PASS 유지.

### 3.4 판단 보류 (Open Questions)

- **OQ1**: `karpathy-coder` pre-commit hook 자동 와이어링 — 본 SPEC에서는 plugin install까지만. 활성화 자동화는 별도 ADR로? **기본 답**: 사용자 책임(`references/enforcement-patterns.md` 안내). 추가 자동화는 v0.6+ 검토.
- **OQ2**: `business-growth-skills` condition 확장 시 기존 `executive`+`full` Track에서 동일하게 설치되는지 unit test로 보장 — F4 entry는 condition 합집합으로 표현(예: `any-track` tracks 배열에 `growth-marketing` 추가).
- **OQ3**: `pm-skills` + `product-skills` 둘 다 `project-management` Track에 들어감. executive-style baseline + dev-style 도구 혼재 — 사용자에게 양쪽 도구 공존 안내 필요? **잠정**: README/USAGE에 안내 문구 1줄.
- **OQ4**: 신규 Track 2개 dogfood — 둘 다? 1개? **잠정**: F9 — 자산 수 큰 `growth-marketing` 1개 라이브. `project-management`는 매트릭스 통과로 충분.

### 3.5 외부 자산 4-gate 판정 표 (AC3 8 entries)

NORTH_STAR §5 4-gate (Trend / Persona / Capability / Lean). **4/4** 모두 Pass인 경우만 포함.

| ID | Marketplace · pluginId | Condition | Trend | Persona | Capability | Lean | Pass |
|----|-----------------------|-----------|-------|---------|------------|------|------|
| pm-skills | alirezarezvani · `pm-skills@claude-code-skills` | `project-management` | ✅ marketplace 통합됨 | ✅ PM/Scrum 직무 | ✅ Jira/Confluence 6 skill | ✅ entry 1줄 | 4/4 |
| product-skills | alirezarezvani · `product-skills@claude-code-skills` | `has-dev-track` + `project-management` | ✅ 동일 marketplace | ✅ PM/Product Owner/UX | ✅ RICE/PRD/agile 15 skill | ✅ 동일 marketplace 재사용 | 4/4 |
| marketing-skills | alirezarezvani · `marketing-skills@claude-code-skills` | `growth-marketing` | ✅ | ✅ Growth/Marketing | ✅ SEO/CRO/Content 44 skill | ✅ | 4/4 |
| business-growth-skills (확장) | alirezarezvani · `business-growth-skills@claude-code-skills` | `executive`+`full`+`growth-marketing` | ✅ 이미 catalog | ✅ Customer Success/RevOps | ✅ 4 skill 재사용 | ✅ condition 확장만 | 4/4 |
| content-creator | alirezarezvani · `content-creator@claude-code-skills` | `growth-marketing` | ✅ | ✅ Content Strategist | ✅ SEO content + brand voice + framework | ✅ | 4/4 |
| demand-gen | alirezarezvani · `demand-gen@claude-code-skills` | `growth-marketing` | ✅ | ✅ Demand Gen | ✅ multi-channel demand gen + paid + partnership | ✅ | 4/4 |
| research-summarizer | alirezarezvani · `research-summarizer@claude-code-skills` | `growth-marketing` | ✅ | ✅ Marketing/Research | ✅ 시장 조사 요약 | ✅ | 4/4 |
| **karpathy-coder** | alirezarezvani · `karpathy-coder@claude-code-skills` | `has-dev-track` | ✅ Karpathy 출처 우리 CLAUDE.md 인용 + 동일 marketplace | ✅ 시니어 dev — CLAUDE.md identity 일치 | ✅ **검출 도구 4 Python tool + reviewer agent + `/karpathy-check` + pre-commit hook** — 우리 CLAUDE.md P1-P4 선언적 원칙의 enforcement layer | ✅ Python stdlib only, marketplace 이미 통합 | **4/4** |

`karpathy-coder` 차별점 — 우리 CLAUDE.md P1-P4 ≈ Karpathy 4 원칙. 우리는 **선언적 원칙**만, 본 plugin은 **검출 도구 + 자동 게이트**로 enforcement 가능 (`complexity_checker.py`, `diff_surgeon.py`, `assumption_linter.py`, `goal_verifier.py`).

## 4. Phase 분해

| Phase | 산출 | 검증 | 의존성 |
|-------|------|------|--------|
| **P1** Track 확장 | `types.ts` TRACKS 11 + `prompts.ts` 라벨 + `manifest.ts` baseline 2 entries + project-claude 템플릿 2개 | unit test + manifest validation | — |
| **P2** External assets | `external-assets.ts` 8 entries 변경 + 4-gate 판정 주석 | unit test (track-matrix) | P1 |
| **P3** 매트릭스 테스트 | 11×5=55 + invariant 6 = 61 PASS | vitest matrix | P2 |
| **P4** Docs | README/USAGE/REFERENCE 갱신 + dogfood 1회 (`growth-marketing` 라이브 install) | grep 키워드 + dogfood 리포트 CRITICAL/HIGH = 0 | P3 |
| **P5** Review & Ship | `/uzys:review` CRITICAL=0 → ship-checklist → v0.5.0 태그 | review report + tag push | P4 |

병렬: P1과 P2는 분리되나 P2가 P1의 신규 Track 식별자에 의존 → 순차. P3 시작 시 P1+P2 머지 필요.

## 5. Testing Strategy

### 5.1 환경 (Test Parity)

본 SPEC은 **CLI tool 확장**. DB / 외부 서비스 의존 없음.

| 영역 | 전략 |
|------|------|
| Prod DB | N/A (CLI tool) |
| 테스트 DB | N/A |
| 외부 의존성 (plugin marketplace) | unit test에서 method 객체 매칭(Mock 가능). **라이브 install은 P4 dogfood**에서만. |

vitest threshold 유지: lines/funcs/stmt **90** / branches **89** (핸드오프 §6 기준).

### 5.2 E2E (Mock 금지 항목)

| 플로우 | 성공 기준 |
|--------|----------|
| `growth-marketing` Track 1회 라이브 install | 5 외부 자산 모두 install 성공 + Phase row 출력 + `.claude/` 구조 검증 |
| 11 Track × 5 mode 매트릭스 | 55 시나리오 PASS + invariant 6 (예: `~/.claude/` 미수정, manifest 누락 0) |

### 5.3 Test Types

- **Unit**: `external-assets.ts` 8 entry 매칭, `types.ts` TRACKS 길이, condition 평가 함수.
- **Integration**: `installer-track-matrix.test.ts` × 신규 2 Track + `installer-cli-matrix.test.ts` 11×5 매트릭스.
- **E2E**: P4 dogfood 1회 (`growth-marketing` 라이브) → `docs/dogfood/cli-dogfood-2026-04-XX-growth.md` 리포트.

### 5.4 Naming

- `should add project-management track to TRACKS list`
- `should install karpathy-coder when track has dev capability`
- `should not regress existing 9 tracks × 5 modes matrix`
- `should expand business-growth-skills condition to include growth-marketing`

## 6. Boundaries

### Always
- 변경은 신규 추가 + 기존 entry condition 확장만 (1건: `business-growth-skills`).
- 모든 entry에 4-gate 판정 주석 또는 SPEC §3.5 표 reference 포함.
- vitest threshold ≥ 현재값 유지.
- shellcheck/typecheck/lint 통과.

### Ask First
- karpathy-coder pre-commit hook 자동 활성화 (OQ1).
- 신규 자산 추가 (8종 외).
- baseline manifest 격상 (`product-skills` 등을 manifest로 옮기는 결정).
- Track 라벨 다국어화.

### Never
- 기존 9 Track baseline manifest 수정.
- 기존 vitest 413 tests 중 어느 케이스 수정.
- `docs/SPEC.md` (v28.0.0 트랙) 동시 변경.
- `~/.claude/`, `~/.codex/`, `~/.opencode/` 글로벌 수정.

## 7. Risks

| Risk | 완화 |
|------|------|
| `business-growth-skills` condition 확장이 기존 executive/full 설치에 영향 | OQ2 — unit test로 condition 합집합 정상 동작 검증 |
| 11×5 매트릭스 테스트 시간 증가 (45 → 55 = +22%) | parametric vitest 유지, 시간이 1분 이상 늘면 P10 재평가 |
| `karpathy-coder` Python 3 의존 — Track baseline에 Python 없는 경우 도구 실행 실패 | plugin install은 Python 무관. 도구 실행은 사용자 책임. README에 명시 |
| dogfood 1회만으로 신규 Track 검증 부족 | P4에서 1개 라이브 + P3 매트릭스로 보강. `project-management`는 매트릭스로 충분 (자산 수 적음) |
| `product-skills` (15 skill) 토큰 부담 | `context: fork` 시점 로드 (skill 컨벤션). 우려 시 OQ로 분리 |
| 신규 Track Persona 정의가 모호 → manifest baseline 빈약 | F2에서 executive-style 기준 적용. 보강은 사용자 피드백 후 v0.6+ |

## 8. Revision & Escalation

- **Revision 상한**: Phase 내 자동 수정 ≤ 2회. 초과 시 escalation.
- **Escalation**: OQ1-4 자동 해결 불가 / 매트릭스 시나리오 추가/제거 결정 / dogfood CRITICAL 발견.
- **Abort**: `~/.claude/` mtime 변동 감지, 기존 9 Track 매트릭스 회귀, `docs/SPEC.md` 변경.

---

## Changelog

- 2026-04-25: 초안 작성. 입력 — `docs/dev/session-2026-04-25-tracks-handoff.md` §1~7 + 사용자 결정(2026-04-25 세션) `karpathy-coder` 추가. AC3 외부 자산 8 entries (7 신규 + 1 condition 확장).
