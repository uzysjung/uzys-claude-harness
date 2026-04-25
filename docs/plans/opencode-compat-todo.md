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

- [ ] **B1** `templates/opencode/` 스캐폴드 (AGENTS.md / opencode.json.template / .opencode/command/ / plugin/)
- [ ] **B2** Slash prefix 실측 결정 (OQ2 — `uzys-spec` vs `uzys:spec`)
- [ ] **B3** `opencode.json` 스키마 고정 ($schema + mcp + command + agent + instructions)

**Phase B 게이트**: OQ2 Closed.

---

## Phase C — Transform 구현

- [ ] **C1** `src/opencode/transform.ts` — SSOT → 4 output 변환
- [ ] **C2** `src/opencode/skills.ts` — 6 uzys skill 정규화 (Codex 90%+ 공유)
- [ ] **C3** `src/opencode/mcp.ts` — `.mcp.json` → `mcp.<name>` 매핑
- [ ] **C4** TS 빌드 + 192 → 200+ test PASS, regression 0

**Phase C 게이트**: `npm run ci` PASS.

---

## Phase D — Setup integration

- [ ] **D1** TS CLI `--cli=opencode` + `--cli=all` 추가
- [ ] **D2** 인터랙티브 모드 OpenCode 분기
- [ ] **D3** Install pipeline 통합 테스트 (tests/opencode-install.test.ts)

**Phase D 게이트**: AC1 임시 검증.

---

## Phase E — Plugin 작성

- [ ] **E1** `templates/opencode/plugin/uzys-harness.ts` (3 hook 매핑)
- [ ] **E2** OpenCode CLI 설치 + plugin 로드 smoke test
- [ ] **E3** ADR-004 v2 Accepted (사용자 승인)

**Phase E 게이트**: AC5 충족.

---

## Phase F — Dogfood 2 Track

- [ ] **F1** tooling Track 무인 설치 + plugin 로드
- [ ] **F2** csr-fastapi Track 무인 설치 + plugin 로드
- [ ] **F3** 6 slash 호출 검증 (`/uzys-spec` ~ `/uzys-ship`)
- [ ] **F4** 무인 로그 리포트 — `docs/evals/opencode-install-2026-04-XX.md`

**Phase F 게이트**: AC2 + AC5 Pass.

---

## Phase G — 문서화 + 청소

- [ ] **G1** README.md "OpenCode CLI support" 섹션
- [ ] **G2** README.ko.md 동일 동기화
- [ ] **G3** USAGE.md OpenCode 시나리오 (Install / Add Track / Plugin debug)
- [ ] **G4** stale `setup-harness.sh` 청소 (en 9곳 + ko 10곳)
- [ ] **G5** CHANGELOG v0.3.0(잠정) 섹션

**Phase G 게이트**: 시각 검토 + Phase 1 Self-Audit.

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

- [ ] **OQ2** Slash prefix → Phase B (B2) 결정
- [ ] **OQ5** Plugin 배포 형식 → Phase B 또는 E (1차 로컬)
- [ ] **OQ6** opencode-skills 커뮤니티 plugin 의존 → Phase B (1차 자체 구현)

---

## 완료 조건

- [ ] AC1~AC6 모두 Pass
- [ ] Phase A~G 체크박스 완료
- [ ] ADR-004 Status: Accepted
- [ ] OQ2 Closed (OQ5/OQ6는 후속 ADR 가능)
- [ ] v0.3.0(잠정) 태그 후보 + push
