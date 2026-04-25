# Session Handoff — 2026-04-25

> **Outgoing**: Phase 1 Finalization 진행 중 + **Codex 호환 1차 완료** (v27.19.0).
> **Incoming**: Phase D HITO baseline 수집 경과 대기 (목표 ≥ 2026-04-30) → v28.0.0 (Foundation 완료 선언).

---

## 1. 본 세션 (2026-04-23 ~ 2026-04-25) 완료 작업

### Phase 1 Finalization (`docs/SPEC.md`)

| 산출 | PR | Tag |
|------|----|----|
| ADR-001 + Phase 2 Entry 결정 (OQ1-3) | #2 | — |
| Phase E readiness — Track 9/9 PASS, requirements-trace v27.x Part 6 | #2 | — |
| 중간 태그 (Phase E 산출 마무리) | — | **v27.18.0** |

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
| **v27.19.0 태그** | — | **Codex 1차 완료** |

**SPEC AC1~AC6 전부 Pass.** ADR-002 Accepted.

---

## 2. 후속 진행 사항

### 2.1 v28.0.0 — Foundation 완료 선언 (Phase 1 Finalization)

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

# 2. 종료 기준 충족 여부:
# - 7일 경과 (시작일 2026-04-23, 첫 가능 시점 2026-04-30)
# - 세션 수 ≥ 10
# - feature 분류 ≥ 3종 (수동 분류 필요)

# 3. 충족 시:
# - docs/evals/hito-baseline-YYYY-MM-DD.md 작성
# - docs/todo.md AC4 #3 → Pass
# - /uzys:review → /uzys:ship → v28.0.0 태그
```

### 2.3 CLI 재작성 (`docs/specs/cli-rewrite.md`) — Phase A 착수 대기

**Status**: Accepted (2026-04-25). PR #11 머지 → Phase A 착수.

**Trigger**: `scripts/setup-harness.sh` 1453줄 + 인터랙티브 prompt 입력 대기 시각적 불명 + `/dev/tty: Device not configured` stderr 노이즈.

**핵심 결정** (ADR-003):
- TypeScript on Node 20+ strict
- `@clack/prompts` 인터랙티브
- `tsup` 단일 번들
- **Vitest 커버리지 ≥ 90%** (lines + branches + functions, 사용자 지시 2026-04-25)
- GitHub Releases 1차 → npm 후속
- bash 3종 (`install.sh`, `setup-harness.sh`, `test-harness.sh`) cutover 폐기

**Phase 분해** (총 6~8일):
- A 초기화 + 골격 (1일)
- B clack prompt + state 감지 (1일)
- C 설치 단계 핵심 (1.5일)
- D Codex 호환 통합 (0.5~1일)
- E 테스트 스위트 90% 커버리지 (1.5일)
- F 빌드 + 분배 + 폐기 (0.5~1일)
- G dogfood + Ship (0.5일)

**다음 세션 진입**:
```bash
# 1. PR #11 (SPEC + ADR-003) 머지 확인
gh pr view 11 --json state

# 2. Phase A 시작 — TS 프로젝트 초기화
git checkout -b feat/cli-rewrite-phase-a
mkdir -p src tests
# package.json, tsconfig.json, biome.json, vitest.config.ts 생성
# 30분 spike: commander vs cac, tsup vs esbuild
```

**병행 관계**: Phase 1 Finalization AC3 HITO baseline은 wall-clock 대기라 본 작업과 직렬 충돌 없음. 본 CLI 재작성 작업이 HITO 측정 자체를 끊지 않음 (Claude Code 사용 그대로).

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
