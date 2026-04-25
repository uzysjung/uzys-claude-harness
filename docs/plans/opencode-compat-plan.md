# Plan: OpenCode 2차 — Phase A~G 분해

> **Linked SPEC**: `docs/specs/opencode-compat.md` (Status: Accepted, 2026-04-25)
> **Linked Todo**: `docs/plans/opencode-compat-todo.md`
> **Independent**: 본 plan은 `docs/SPEC.md`(Phase 1 Finalization)와 무관. 별도 라이프사이클.

---

## 1. Sprint Contract

### 범위 (포함)

- F1~F10 전부 (SPEC §3.1)
- AC1~AC6 검증 증거 일괄 수집 (`docs/evals/opencode-*`)
- ADR-004 작성 (`docs/decisions/ADR-004-opencode-plugin-mapping.md`)
- TS CLI `src/opencode/` 모듈 신설 (Codex 모듈 패턴 답습)

### 범위 (제외)

- Codex 후속 OQ7/OQ8 (별도 처리)
- Plugin npm/jsr publish (1차는 로컬 번들만)
- 외부 사용자 영입
- `~/.opencode/` 글로벌 수정

### 완료 기준

- AC1~AC6 모두 Pass
- 9 Track regression 0 (Claude + Codex)
- Phase G 마지막에 stale `setup-harness.sh` 19곳 청소 묶음 처리
- v0.3.0(잠정) 태그 후보

### 제약 조건

- D16 정신 — 글로벌 미수정
- DO NOT CHANGE (`docs/specs/codex-compat.md`, `templates/codex/`, `src/codex/`, `scripts/claude-to-codex.sh`)
- Codex 1차 192 test 유지

---

## 2. Phase 분해 + Task

### Phase A — Compat 매트릭스 + ADR-004 초안 (0.5일)

| Task | 산출 | AC |
|------|------|-----|
| **A1** OpenCode plugin lifecycle 정밀 리서치 | Context7 `/anomalyco/opencode` + `/websites/opencode_ai_plugins` 인용 노트 | 3 hook(`tool.execute.before`/`after`/`event`) trigger 시점 + 인자 시그니처 + 한계 명시 |
| **A2** 호환 매트릭스 작성 | `docs/research/opencode-compat-matrix-2026-04-25.md` | Codex matrix 표 형식 답습 — Claude Code 자산 11종 × OpenCode 매핑 + 갭 |
| **A3** ADR-004 v1 초안 | `docs/decisions/ADR-004-opencode-plugin-mapping.md` Status: Proposed | Hook 3종 매핑 표 + 한계 + 대체 전략 + Codex ADR-002와 비교 |

**Phase A 종료 게이트**: A1~A3 산출 + 사용자 검토 통과.

### Phase B — 구조 설계 (1일)

| Task | 산출 | AC |
|------|------|-----|
| **B1** `templates/opencode/` 스캐폴드 | `templates/opencode/AGENTS.md`(Codex AGENTS.md 재사용) + `opencode.json.template` + `.opencode/commands/` 디렉토리 + `plugin/` 디렉토리 | OpenCode CLI 0.x 호환 `$schema` 고정 |
| **B2** Slash prefix 실측 결정 (OQ2) | `templates/opencode/.opencode/commands/uzys-spec.md` (또는 `uzys:spec.md`) | OpenCode CLI 실측 — 콜론 허용 여부 확인 후 결정. ADR-004에 기록 |
| **B3** `opencode.json` 스키마 고정 | `templates/opencode/opencode.json.template` | `mcp` + `command` + `agent` + `instructions` 4개 키 검증. `$schema: https://opencode.ai/config.json` |

**Phase B 종료 게이트**: B1~B3 산출 + OQ2 Closed.

### Phase C — Transform 구현 (1.5일)

| Task | 산출 | AC |
|------|------|-----|
| **C1** TS 모듈 `src/opencode/transform.ts` | input SSOT (CLAUDE.md, `.mcp.json`, `.claude/rules/*`, `.claude/commands/uzys/*`) → output 4종 (AGENTS.md, opencode.json, .opencode/commands/*.md, plugin scaffold) | `src/codex/transform.ts` 패턴 일관 + unit test 6+ |
| **C2** `src/opencode/skills.ts` | 6 uzys skill을 `.opencode/commands/uzys-*.md` 포맷으로 정규화 | Codex `src/codex/skills.ts`와 90%+ 본문 공유 (CLI별 prefix 분기만) |
| **C3** `src/opencode/mcp.ts` | `.mcp.json` → `opencode.json` `mcp.<name>` 변환 | 1:1 매핑 unit test (context7, github 2종 최소) |
| **C4** TS 빌드 + 기존 테스트 보존 | `npm run ci` + `npm run build` | 192 → 200+ tests, 모두 PASS, regression 0 |

**Phase C 종료 게이트**: C1~C4 + npm run ci PASS.

### Phase D — Setup integration (1일)

| Task | 산출 | AC |
|------|------|-----|
| **D1** TS CLI `--cli` 옵션 확장 | `src/cli.ts` + `src/commands/install.ts` — `--cli=opencode` + `--cli=all` 추가 | 기존 `claude / codex / both` regression 0. `--cli=opencode` 단독 실행 + `--cli=all`이 3 CLI 전부 생성 |
| **D2** 인터랙티브 모드 OpenCode 분기 | `src/interactive.ts` — Codex 분기 패턴 답습 | 인터랙티브 prompt에 OpenCode 옵션 추가 + 무인 모드 회귀 0 |
| **D3** Install pipeline 통합 테스트 | `tests/install.test.ts` (또는 신규 `tests/opencode-install.test.ts`) | tooling Track 무인 설치 → AGENTS.md + opencode.json + .opencode/commands/* + plugin 생성 검증 |

**Phase D 종료 게이트**: D1~D3 + AC1 (무인 설치 exit=0) 임시 검증.

### Phase E — Plugin 작성 (1일)

| Task | 산출 | AC |
|------|------|-----|
| **E1** `templates/opencode/plugin/uzys-harness.ts` | JS/TS plugin — 3 hook 매핑 (gate-check / spec-drift / HITO) | OpenCode plugin export 시그니처 준수 + TypeScript 타입 정합 |
| **E2** Plugin 로드 smoke test | OpenCode CLI 설치 후 plugin 로드 → 3 hook fire 확인 | log/stdout으로 hook 발화 증거 + smoke test 자동화 |
| **E3** ADR-004 v2 Accepted | `docs/decisions/ADR-004-opencode-plugin-mapping.md` Status: Proposed → Accepted | 실측 매핑 결과 + 한계 갱신 + 사용자 승인 |

**Phase E 종료 게이트**: E1~E3 + AC5 충족.

### Phase F — Dogfood 2 Track (0.5일)

| Task | 산출 | AC |
|------|------|-----|
| **F1** tooling Track 무인 설치 + plugin 로드 | 임시 디렉토리 fresh install 로그 | exit=0, AGENTS.md + opencode.json + plugin 모두 생성, plugin smoke test PASS |
| **F2** csr-fastapi Track 무인 설치 + plugin 로드 | 동일 | 동일 |
| **F3** 6 slash 호출 검증 | OpenCode 인터랙티브 세션에서 `/uzys-spec` ~ `/uzys-ship` 호출 시도 | 6/6 slash 인식 + skill 본문 응답 확인 |
| **F4** 무인 로그 리포트 | `docs/evals/opencode-install-2026-04-XX.md` | AC2 + AC5 증거 일괄 + Codex와 비교 표 |

**Phase F 종료 게이트**: F1~F4 + AC2 + AC5 Pass.

### Phase G — 문서화 + 청소 (0.5일)

| Task | 산출 | AC |
|------|------|-----|
| **G1** README.md "OpenCode CLI support" 섹션 | Codex 섹션 직후 위치 | 인터랙티브 + 플래그 모드 + 자산 구조 + plugin 안내 + 한계 4종 |
| **G2** README.ko.md 동일 동기화 | 영문 G1 한국어 반영 | 섹션 구조 일치 |
| **G3** USAGE.md OpenCode 시나리오 | 기존 Codex 시나리오 패턴 답습 | 3 시나리오 (Install / Add Track / Plugin debug) |
| **G4** stale `setup-harness.sh` 청소 | README.md 9곳 + README.ko.md 10곳 | 모두 `npx -y github:uzysjung/uzys-claude-harness ...` 또는 `claude-harness ...` 형식으로 치환 |
| **G5** CHANGELOG v0.3.0 (잠정) | `CHANGELOG.md` 신규 섹션 | OpenCode 2차 Phase A~G 요약 + AC1~AC6 결과 + ADR-004 링크 |

**Phase G 종료 게이트**: G1~G5 + 문서 시각 검토 + Phase 1 Self-Audit.

---

## 3. 의존성 그래프

```
A ──→ B ──→ C ──→ D ──┐
                       ├──→ F ──→ G
                  E ───┘
```

- **직렬**: A → B → (C, D) → F → G
- **병렬**:
  - C와 D: B 완료 후 동시 가능 (서로 독립 영역)
  - E: C와 병렬 가능 (transform과 plugin은 독립)

**총 예상**: ~6일 직렬, 병렬 시 ~4일 단축 가능.

---

## 4. North Star 4-gate 점검

`docs/NORTH_STAR.md` §5 Decision Heuristics 적용:

| Gate | 판정 | 근거 |
|------|------|------|
| **Trend** (지속 가치) | Pass | Multi-CLI 호환은 NORTH_STAR 핵심 — Codex 1차 완료 후 OpenCode 2차 자연스러운 연장 |
| **Persona** (사용자 부합) | Pass | CLI 다양성 사용자 = NORTH_STAR primary persona. dogfood 사용자 본인 |
| **Capability** (기술 가능성) | Pass | OpenCode plugin API 풍부 — Codex보다 매핑 단순. 리서치 완료 |
| **Lean** (린한 사이클) | Pass | Codex 1차 산출물 재사용(AGENTS.md, transform 패턴, skills 구조) — 자체 구현 최소 |

**4/4 Pass** — 자동 진행 가능.

---

## 5. Risk 재확인 (SPEC §5 외)

| Risk | 완화 | Phase |
|------|------|-------|
| Phase E plugin smoke test가 OpenCode CLI 설치 환경 필요 | Phase E 시작 전 OpenCode CLI 설치 수동 검증 | E1 사전 |
| Codex regression 0 보장이 CI 미흡 | Phase C에서 `tests/codex/*` 192 test 존재 확인 + Phase D에서 9 Track install matrix 추가 | C4, D3 |
| stale 청소 19곳이 OpenCode 신규 텍스트와 동일 PR에 묶일 때 diff 가독성 저하 | Phase G에서 G1~G3 (OpenCode 추가) + G4 (stale 청소)를 별도 commit으로 분리 (같은 PR 내) | G commit 분리 |

---

## 6. Phase별 산출 위치

```
docs/research/opencode-compat-matrix-2026-04-25.md     [A2]
docs/decisions/ADR-004-opencode-plugin-mapping.md      [A3 v1, E3 v2]
templates/opencode/                                    [B1, B3, E1]
  AGENTS.md
  opencode.json.template
  .opencode/commands/uzys-{spec,plan,build,test,review,ship}.md
  plugin/uzys-harness.ts
src/opencode/                                          [C1, C2, C3]
  transform.ts
  skills.ts
  mcp.ts
src/cli.ts                                             [D1 수정]
src/commands/install.ts                                [D1 수정]
src/interactive.ts                                     [D2 수정]
tests/opencode-*.test.ts                               [C4, D3]
docs/evals/opencode-install-2026-04-XX.md              [F4]
README.md / README.ko.md / docs/USAGE.md               [G1~G4]
CHANGELOG.md                                           [G5]
```

---

## 7. 인간 게이트 (CLAUDE.md P6)

다음 시점에 사용자 승인 필요:
- Phase A 종료 — ADR-004 v1 검토
- Phase B 종료 — OQ2 slash prefix 결정 확인
- Phase E 종료 — ADR-004 v2 Accepted (Plugin 매핑 최종)
- Phase F 종료 — Dogfood 결과 검토
- Phase G 종료 — Ship 직전 최종 승인

각 게이트에서 사용자 명시 승인 없이 다음 Phase 시작 금지.
