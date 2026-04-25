# Todo: OpenCode 2차 Phase A~G

> **Linked plan**: `docs/plans/opencode-compat-plan.md`
> **Linked SPEC**: `docs/specs/opencode-compat.md`

---

## Phase A — Compat 매트릭스 + ADR-004 초안

- [x] **A1** OpenCode plugin lifecycle 정밀 리서치 (Context7) — Plugin/PluginInput/Hooks 타입 + 6 hook + event bus 확인
- [x] **A2** 호환 매트릭스 — `docs/research/opencode-compat-matrix-2026-04-25.md` (147줄, Codex/OpenCode 비교 + 갭 4종)
- [x] **A3** ADR-004 v1 초안 (Status: Proposed) — `docs/decisions/ADR-004-opencode-plugin-mapping.md` (3 hook 매핑 + L1~L5 실측 항목)

**Phase A 게이트**: A1~A3 완료 + **사용자 검토 대기**.

---

## Phase B — 구조 설계

- [x] **B1** `templates/opencode/` 스캐폴드 — AGENTS.md.template + opencode.json.template + `.opencode/commands/uzys-{spec,plan,build,test,review,ship}.md` (6 stub) + `.opencode/plugins/uzys-harness.ts` (stub) + README.md
- [x] **B2** Slash prefix — `uzys-spec` 채택 (OQ2 Closed). 근거: OpenCode 파일명=커맨드명, 콜론 namespace 미공식, Codex 일관성, filesystem 호환
- [x] **B3** `opencode.json` 스키마 고정 — $schema + instructions + mcp + command + agent + plugin + permission

**Phase B 게이트**: OQ2 Closed ✅. 사용자 검토 대기.

---

## Phase C — Transform 구현

- [x] **C1** `src/opencode/transform.ts` — orchestrator. AGENTS.md + opencode.json + 6 commands + plugin stub 출력
- [x] **C2** `src/opencode/commands.ts` — 6 uzys command 정규화 (frontmatter description+agent, slash rename). Codex skills.ts 패턴 답습
- [x] **C3** `src/opencode/opencode-json.ts` — template + `.mcp.json` → `mcp.<name>` 1:1 변환
- [x] **C4** TS 빌드 + 198 → 218 test (+20), regression 0, branch coverage 91.06% (≥90%), build 102.55 KB

**Phase C 게이트**: `npm run ci` PASS ✅.

---

## Phase D — Setup integration

- [x] **D1** TS CLI `--cli` 옵션 확장 — types.ts CLI_MODES `["claude","codex","opencode","both","all"]`. installer.ts에 OpenCode transform 분기 + InstallReport에 `opencode` 필드 추가. install.ts CLI 옵션 help + display 갱신
- [x] **D2** 인터랙티브 모드 — prompts.ts selectCli에 "OpenCode (anomalyco)" + "All (Claude+Codex+OpenCode)" 옵션 추가 (interactive.ts는 selectCli 호출만 하므로 자동 반영)
- [x] **D3** Install pipeline 통합 테스트 — `tests/opencode/install.test.ts` (4 test): tooling+opencode, tooling+all, claude (no OpenCode), both (no OpenCode)

**Phase D 게이트**: AC1 임시 검증 ✅. tests 218 → 226 (+8), CI PASS.

---

## Phase E — Plugin 작성

- [x] **E1** `templates/opencode/.opencode/plugins/uzys-harness.ts` (110줄, self-contained) + `src/opencode/plugin-helpers.ts` (95줄, 테스트 미러) — 3 hook 모두 구현
- [~] **E2** Plugin 정적 smoke 통과 (tsc + 22 unit test + install.test.ts plugin 본문 검증). 라이브 smoke (OpenCode CLI 런타임 의존)는 **Phase F dogfood로 이관**
- [x] **E3** ADR-004 Accepted (2026-04-25 사용자 승인). 라이브 smoke는 Phase F 또는 사용자 환경에서 사후 검증

**Phase E 게이트**: AC5 부분 충족 (정적 검증 100%, 라이브 smoke Phase F 이관). **사용자 승인 대기**.

---

## Phase F — Dogfood 2 Track

- [x] **F1** tooling Track 무인 설치 — exit=0, 35 files + 9 dirs + 3 MCP + plugin/commands 9개. AC1+AC4 Pass
- [x] **F2** csr-fastapi Track 무인 설치 — exit=0, 38 files + 13 dirs + 4 MCP (railway 추가). AC2 Pass (2/2)
- [~] **F3** 6 slash 호출 검증 — 정적 (test 26개) PASS. **라이브** (OpenCode CLI 런타임)는 사용자 환경 사후 검증으로 이관
- [x] **F4** 무인 로그 리포트 — `docs/evals/opencode-install-2026-04-25.md` (AC 6/6 표 + Codex 1차 비교)

**Phase F 게이트**: AC2 + AC4 ✅. AC5 정적 100% (라이브 smoke는 사용자 사후). **사용자 검토 대기**.

---

## Phase G — 문서화 + 청소

- [x] **G1** README.md "OpenCode CLI support" 섹션 (Codex 섹션 직후, ~80줄: 설치 / 자산 / Hook 매핑 표 / Slash / 한계 / 참고)
- [x] **G2** README.ko.md "OpenCode CLI 지원" 섹션 (영문 G1과 동일 구조)
- [x] **G3** USAGE.md "OpenCode 시나리오" 섹션 (Install 단독 / All 동시 / Plugin 디버깅 3 시나리오)
- [x] **G4** stale 청소 — README.md 9곳 + README.ko.md 10곳 + USAGE.md 7곳 = **26곳** 모두 `claude-harness install` 또는 generic으로 치환. claude-to-codex.sh 2곳 → `src/codex/transform.ts`
- [x] **G5** CHANGELOG v0.3.0 섹션 — Phase A~G 요약 + Hook 매핑 + CLI 옵션 + Test/Coverage + DO NOT CHANGE

**Phase G 게이트**: 시각 검토 + 사용자 검토 대기. CI 248 PASS, stale 0건 확인.

---

## AC 추적 매핑

| AC | 검증 Task | 증거 위치 |
|----|----------|----------|
| AC1 무인 설치 exit=0 | D3, F1 | F4 리포트 |
| AC2 2 Track 100% | F1, F2 | F4 리포트 |
| AC3 6 skill slash | C2, F3 | F4 리포트 |
| AC4 MCP 2종 + smoke | C3, F1 | F4 리포트 |
| AC5 Plugin 3 hook + smoke | E1, E2 | F4 리포트 + ADR-004 |
| AC6 Claude/Codex regression 0 | C4, D3 | npm run ci 로그 |

---

## Open OQ 추적

- [x] **OQ2** Slash prefix → `uzys-spec` 채택 (Phase B2, 2026-04-25)
- [x] **OQ5** Plugin 배포 형식 → 1차 로컬 번들 채택 (`templates/opencode/.opencode/plugins/`). npm publish는 후속 ADR (Codex OQ8 동일 패턴)
- [x] **OQ6** opencode-skills 커뮤니티 plugin 의존 → 1차 자체 구현 채택 (uzys 자산만 정확히 노출). 의존은 후속 검토

---

## 완료 조건

- [x] AC1~AC6 모두 Pass (AC5는 정적 100% + 라이브 사후)
- [x] Phase A~G 체크박스 완료 (G 포함)
- [x] ADR-004 Status: Accepted (2026-04-25)
- [x] OQ2/OQ5/OQ6 모두 결정 (1차 결정 — 후속 ADR 여지 명시)
- [x] v0.3.0 ship 진입 (gate-status build/verify/review = true, ship 진행 중)
