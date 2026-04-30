# Session Handoff — 2026-04-25

> **Outgoing**: Phase 1 Finalization 진행 중 + **Codex 호환 1차 완료** (v26.37.0) + **CLI rewrite 완료** (v0.2.0, 2026-04-25).
> **Incoming**: Phase D HITO baseline 수집 경과 대기 (3/7일, 목표 ≥ 2026-04-30) → v26.38.0 (Foundation 완료 선언).
>
> **2026-04-25 추가**: 본 세션에서 bash setup-harness.sh (1453 LOC) 폐기 + TypeScript CLI 재작성 (`@uzysjung/claude-harness` v0.2.0). PR #11~19 (9 PR / 7 Phase). 사용자 보고 핵심 문제(인터랙티브 입출력 명시성 + `/dev/tty` 노이즈) 해결.

---

## 1. 본 세션 (2026-04-23 ~ 2026-04-25) 완료 작업

### Phase 1 Finalization (`docs/SPEC.md`)

| 산출 | PR | Tag |
|------|----|----|
| ADR-001 + Phase 2 Entry 결정 (OQ1-3) | #2 | — |
| Phase E readiness — Track 9/9 PASS, requirements-trace v27.x Part 6 | #2 | — |
| 중간 태그 (Phase E 산출 마무리) | — | **v26.36.0** |

### Codex 호환 풀 하네스 복제 1차 (`docs/specs/codex-compat.md`)

| Phase | PR | 산출 |
|-------|----|------|
| A 초안 + 호환 매트릭스 + ADR-002 v1 | #3 | SPEC 작성 |
| A revision (Codex 0.124.0 실측) | #4 | ADR-002 v2 — Hook 갭 소멸 |
| B `templates/codex/` 스캐폴드 | #5 | 14 파일 |
| C `scripts/claude-to-codex.sh` 변환 | #6 | 5-단 transform |
| D `setup-harness.sh --cli` + 인터랙티브 | #7 | T23 9 assertion |
| E + F ADR Accepted + 2 Track dogfood | #8 | tooling + csr-fastapi 검증 |
| G README en/ko + CHANGELOG | #9 | 사용자 가이드 |
| **v26.37.0 태그** | — | **Codex 1차 완료** |

**SPEC AC1~AC6 전부 Pass.** ADR-002 Accepted.

---

## 2. 후속 진행 사항

### 2.1 v26.38.0 — Foundation 완료 선언 (Phase 1 Finalization)

**조건**: `docs/SPEC.md` AC1~AC5 모두 Pass + Ship checklist 통과.

| AC | 현재 | 차단 |
|----|------|------|
| AC1 Phase 4b 이월 3종 | ✅ | — |
| AC2 v27.17 dogfood C/H=0 | ✅ | — |
| AC3 **HITO 7일 baseline** | ❌ Pending | **wall-clock — 시작일 2026-04-23** |
| AC4 Phase 2 Entry Checklist | 6/7 Pass + 1 Pending | AC3 연결 (#3) |
| AC5 requirements-trace v27.x | ✅ | — |

**ADR-001 OQ1 baseline 종료 기준** (AND): 7일 wall-clock + 세션 ≥ 10회 + feature 분류 ≥ 3종.

**예상 시점**: 2026-04-30 이후.

### 2.2 다음 세션 시작 시 체크 (즉시 실행)

```bash
# 1. HITO 로그 누적 확인
ls -la .claude/evals/hito-*.log
bash scripts/hito-aggregate.sh --summary

# 2. 종료 기준 충족 여부 (ADR-001 OQ1):
# - 7일 경과 (시작일 2026-04-23, 첫 가능 시점 2026-04-30)
# - 세션 수 ≥ 10
# - feature 분류 ≥ 3종 (수동 분류 필요)

# 3. 충족 시:
# - docs/evals/hito-baseline-YYYY-MM-DD.md 작성
# - docs/todo.md AC4 #3 → Pass
# - /uzys:review → /uzys:ship → v26.38.0 태그
```

**현재 진척 (2026-04-25)**:
- 3일 / 7일 (43%, 04-23 ~ 04-25)
- 누적 prompts: 53 (avg 17.6/day)
- 세션 수: ≥ 10 충족 추정 (3일 × 다회)
- feature 분류: 미수행 (수동, 7일 충족 후 일괄)

### 2.3 CLI 재작성 (`docs/specs/cli-rewrite.md`) — **완료 (2026-04-25, v0.2.0)**

**Status**: Accepted → 완료. ADR-003 Accepted.

**Trigger**: `scripts/setup-harness.sh` 1453줄 + 인터랙티브 prompt 입력 대기 시각적 불명 + `/dev/tty: Device not configured` stderr 노이즈.

**핵심 결정** (ADR-003):
- TypeScript on Node 20+ strict
- `@clack/prompts` 인터랙티브
- `tsup` 단일 번들
- **Vitest 커버리지 ≥ 90%** (lines + branches + functions, 사용자 지시 2026-04-25)
- GitHub Releases 1차 → npm 후속
- bash 3종 (`install.sh`, `setup-harness.sh`, `test-harness.sh`) cutover 폐기

**Phase 결과** (총 1세션 내 완료, 추정 6~8일 → 실제 1일):

| Phase | PR | 산출 |
|-------|----|----|
| A 초기화 + 골격 | #12 | TS 프로젝트 + cac CLI + Vitest 90%+ |
| B clack + state | #13 | 5-action 라우터 + 인터랙티브 |
| C install pipeline | #14 | 매니페스트 + .mcp.json 병합 + 백업 |
| D Codex TS 포팅 | #15 | OQ4 Closed (`claude-to-codex.sh` 247→TS 5 모듈) |
| E 9 Track 통합 | #16 | parametric 테스트 + 매니페스트 5종 보강 |
| F bash cutover | #17 | bash 4종 폐기 (1980 LOC), npx wrapper (31 LOC) |
| G 디자인 + dogfood | #18 | `design.ts` + 9/9 라이브 PASS + ADR-003 Accepted |
| Release | #19 | **v0.2.0 태그** |

**핵심 결과**:
- 1453 LOC bash + 280 test-harness + 247 codex script → **1731 LOC TS (18 src 모듈) + 198 tests**
- 커버리지 lines 96.78% / branches 91.27% / functions 97.05%
- **사용자 보고 문제 해결**: 인터랙티브 prompt 입력 대기 시각화 (clack ↑↓ + Space) + `/dev/tty: Device not configured` stderr 노이즈 0건
- 디자인 명시성: bold cyan header + ✓/⚠/✗/• 시각 심볼 + 16자 정렬 + NO_COLOR 존중
- 진입: `bash <(curl .../install.sh)` (호환 wrapper) + `npx -y github:uzysjung/uzys-claude-harness#main install ...` (CI)

**OQ Closed**:
- OQ3 빌드 도구: tsup (esbuild wrapper)
- OQ4 `claude-to-codex.sh` 포팅: TS 채택
- OQ5 테스트 러너: vitest
- OQ6 인자 파서: cac (commander가 ESM 번들 실패하여 전환)

**남은 OQ**:
- OQ1 npm vs GH Releases — 현재 GH Releases 1차, npm은 외부 영입 시 별도 ADR
- OQ2 패키지명 `@uzysjung/claude-harness` — npm publish 결정 시 재검토

### 2.4 Codex 1차 후속 (별도 SPEC 또는 follow-up)

- **OQ7 — Issue #17532 라이브 인터랙티브 세션 hook 검증**
  - 현 dogfood는 비대화형(`codex exec`) 컨텍스트 기준
  - 라이브 검증은 `codex` 인터랙티브 + 실제 model 호출 필요 (API 비용 발생)
  - 우선순위: Low — 본 SPEC AC 영향 없음
- **OQ8 — Plugin 번들 배포 채택 결정**
  - `.codex-plugin/plugin.json` + marketplace 게시 검토
  - 현재는 글로벌 `~/.codex/skills/` opt-in 설치 방식
  - 우선순위: Low — 사용자 결정 대기
- **OpenCode 2차 타깃**
  - 현재 Codex 1차 SPEC `Non-Goals`에 명시
  - 진입 시 `docs/specs/opencode-compat.md` 신규 작성 필요
  - OpenCode plugin API는 풍부하므로 (tool.execute.before/after 등) Codex보다 Hook 호환 단순 가능

### 2.4 정리/클린업 후보

- `templates/codex/hooks/` 스캐폴드 stub `.sh` 파일들 — Phase C `claude-to-codex.sh`가 `templates/hooks/`에서 직접 포팅하므로 stub은 안 쓰임. **제거 검토** (P10 분기 재평가 시).
- 임시 `feat/*` 브랜치 9개 — 전부 머지/삭제 완료 확인.

---

## 3. 핵심 결정 일람 (한눈에)

| 결정 | 출처 | 영향 |
|------|------|------|
| HITO baseline = 7일 AND 세션≥10 AND feature≥3 | ADR-001 OQ1 | Phase D 종료 판정 |
| 외부 사용자 첫 설치 = 이월 허용 | ADR-001 OQ2 | AC4 #5 Pass (이월) |
| dogfood interactive = 3개 (Install/Update/Add) | ADR-001 OQ3 | AC2 종결 |
| Codex Hook = 포맷 변환만 (갭 없음) | ADR-002 v2 | Phase E 스코프 축소 |
| ApplyPatch protect = sandbox로 이관 | ADR-002 v2 D3 | Issue #16732 회피 |
| `~/.codex/` 수정 = opt-in 후에만 | ADR-002 v2 D4 | D16 정신 유지 |
| Claude Code = SSOT, Codex = 파생 | SPEC §SSOT | 유지 비용 최소 |

---

## 4. 주의사항

- **`~/.claude/CLAUDE.md` 글로벌은 절대 건드리지 않음** (D16 보호 — `setup-harness.sh` L73-84 검증).
- `docs/SPEC.md` (Phase 1 Finalization) DO NOT CHANGE — AC1~AC5 영역 수정 전 Major CR 필수.
- Codex 후속 작업 시 `~/.codex/skills/`에 본 세션에서 미설치 (opt-in 거부됨). 라이브 사용 원하면 `setup-harness.sh --cli=codex --track tooling` 으로 임시 디렉토리 생성 후 prompt에서 y 응답.
- 본 세션 dogfood 임시 디렉토리는 정리 완료. 재현 시 `docs/evals/codex-install-2026-04-25.md` 절차 참조.

---

## Changelog

- 2026-04-25: 본 핸드오프 작성. 차기 세션 진입점 = HITO baseline 종료 기준 충족 확인.
