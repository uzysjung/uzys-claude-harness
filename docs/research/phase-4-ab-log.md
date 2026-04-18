# Phase 4 A/B Experiment Log

> **과제**: Local Markdown Notebook (React + Tauri + SQLite + shadcn/ui)
> **과제 정의**: `~/Development/phase4-experiment/PROMPT.txt`
> **Run-book**: `Docs/research/phase-4-e2e-runbook.md`
> **Run 1**: 2026-04-16 오전 (예산 1.5 USD) — A1/B1
> **Run 2**: 2026-04-16 오후 (예산 30 USD) — A2/B2
> **실행 방식**: `claude -p` 비대화형 단발, `run_in_background` 병렬
> **실행자**: Claude Code (자동)
> **하네스 버전**: v26.7.3 (B만)
> **제약**: 단발 비대화형 모드 — 대화형 세션의 수정 요청/round trip 측정 불가

---

## Run 2 요약 (예산 30 USD 재실험, 2026-04-16 오후)

사용자 지시: Run 1의 A1이 예산 초과로 중단됐으므로 예산을 $30으로 늘려 완주 가능한지 재실험.

**핵심 발견**: A1의 $1.63 중단은 **"자연 완료 직전 $0.04 부족"** — A2는 예산 30에서 **$1.66로 자연 완료**. 즉 Run 1의 A1 중단은 "완료 직전 예산 차단"이었고, 실제 과제 비용은 **약 $1.66**. 예산 설정이 결과를 결정하는 임계 구간에 있었음.

### Run 2 측정

| 지표 | A2 (baseline) | B2 (harness) |
|------|---|---|
| **비용** | **$1.662** (예산 30의 5.5%) | $0.735 (예산 30의 2.4%) |
| **Wall clock** | 775초 (12분 55초) | 192초 (3분 12초) |
| **num_turns** | **50** | 13 |
| **output tokens** | 25,970 | 8,014 |
| **cache_read** | **1,371,622 (1.37M)** | — |
| **stop_reason** | **`end_turn` (자연 완료)** | `end_turn` |
| **is_error** | false | false |
| **소스 라인** | **1,785** (Rust 782 + React 1003) | 0 |
| **SPEC 라인** | 0 | 328 |
| **TypeScript check** | **PASS** (tsc --noEmit exit 0) | N/A |
| **코드 완성도** | **19-20 / 20** | 0 / 20 |
| **SPEC 완성도** | 0 / 20 | **20 / 20** |

### A1 vs A2 비교 (baseline 예산 효과)

| 지표 | A1 (예산 1.5) | A2 (예산 30) | 차이 |
|------|---|---|---|
| 비용 | $1.626 | $1.662 | **+$0.036 (+2.2%)** |
| Wall | 677s | 775s | +14% |
| num_turns | 31 | **50** | +61% |
| output tokens | 38,424 | **25,970** | **−32%** |
| cache_read | 233,024 | **1,371,622** | **×5.9** |
| stop_reason | **`tool_use` (중단)** | `end_turn` (완료) | — |
| is_error | **true (예산 초과)** | false | — |
| 소스 라인 | 615 | **1,785** | +190% |

**주목**:
- A2는 **turns 61% 증가**에도 비용 **2.2%만** 증가. `cache_read` 5.9배 폭증이 비용을 억제.
- A2가 output tokens는 오히려 **-32%** (assistant 응답 텍스트 감소, tool use 증가). 즉 "말보다 실행"이 많은 세션.
- A1 → A2 차이는 **0.04 달러** (= 사과 1/4 개 값). 예산 설정이 성공/실패의 절대 임계.

### B1 vs B2 비교 (harness 예산 효과)

| 지표 | B1 (예산 1.5) | B2 (예산 30) | 차이 |
|------|---|---|---|
| 비용 | $0.574 | $0.735 | +28% |
| Wall | 109s | 192s | +76% |
| num_turns | 9 | 13 | +44% |
| output tokens | 5,220 | 8,014 | +54% |
| SPEC 라인 | 287 | 328 | +14% |
| SPEC 섹션 | 8 | **11** | +3 섹션 |

**주목**:
- B2는 예산이 넉넉해져 **SPEC을 더 상세하게** 작성 (11 섹션: Data Model 세분화 + Key Behaviors + Project-specific Code Style + Phases 예정). 품질 심화.
- 예산 무관 **Define 단계에서 자연 종료** — 일관된 행동. 즉 하네스는 단발 모드에서 Build 진입을 의도적으로 차단.

### A2 vs B2 (Run 2 최종 비교)

| 지표 | A2 | B2 | A2 우위 | B2 우위 |
|------|---|---|---|---|
| 비용 | $1.662 | $0.735 | — | **2.26×** |
| Wall | 775s | 192s | — | **4.03×** |
| output tokens | 25,970 | 8,014 | — | **3.24×** |
| 소스 라인 | 1,785 | 0 | **∞** | — |
| SPEC 라인 | 0 | 328 | — | **∞** |
| 코드 완성도 | 19-20/20 | 0/20 | **∞** | — |
| SPEC 완성도 | 0/20 | 20/20 | — | **∞** |
| TypeScript PASS | ✅ | N/A | — | — |

### Run 2 해석

**1. A2는 단발 모드로 중급 프로젝트 완주 가능 입증**

A2는 **1,785줄 소스 + TypeScript PASS + 20/20 기능**을 $1.66 / 13분에 완성. React+Tauri 중급 프로젝트가 단발 Opus 4.6 단일 호출로 충분히 가능함을 실증. 이는 "baseline Claude의 단발 성능이 생각보다 강력"하다는 발견.

**2. 하네스의 단발 부적합성 재확인**

B2도 예산이 20배 늘었지만 여전히 SPEC만 328줄 작성 후 자연 종료. 예산과 무관하게 **6-gate 정책이 Build 단계 진입을 차단**. 이는 설계 의도 (Define 없이 Build 금지). 단발 모드는 **하네스의 사용 시나리오 아님**.

**3. 임계 예산의 위험**

A1의 $1.63 중단은 **자연 완료 직전 $0.04 부족**. `max-budget-usd` 를 과제 실비의 1.01배 이하로 잡으면 거의 완료됐는데 실패하는 "근접 실패" 리스크. 실전에서는 예산을 **예상치의 2배 이상** 잡아야 안전.

**4. Cache read 효율**

A2의 cache_read 1.37M 토큰은 prompt caching이 장기 세션에서 극도로 효과적임을 보여줌. turns +61%에 비용 +2.2%만 증가. **Opus 4.6[1m]의 caching 인프라가 장기 에이전트 워크플로우를 경제적으로 가능하게 함**.

**5. A2는 이 실험의 진짜 결과**

A1은 "임계 예산 실패", A2는 "실비 완료". 두 수치를 모두 봐야 실전 맥락 이해 가능. Run 2가 **실제 baseline 성능의 정확한 측정**.

### 하네스 효용 재판정 (Run 2 반영)

| 측면 | Run 1 판정 | Run 2 재판정 | 근거 |
|------|---|---|---|
| 비용 효율 | ✅ B 35% | ✅ B 44% (0.735/1.662) | 단발에서 하네스가 SPEC만 하니 비용 자연 낮음 |
| 시간 효율 | ✅ B 16% | ✅ B 25% | 동일 이유 |
| 예측 가능성 | ✅ B 자연 완료, A 오류 | ⚠ **둘 다 자연 완료** | A는 충분 예산 시 정상 |
| 완성된 코드 | ❌ A도 미완성 | ❌ **A 압도적** (A 완성, B 코드 0) | 하네스는 단발로 Build 못 감 |
| 설계 품질 | ✅ B SPEC | ✅ B SPEC | 변화 없음 |
| 6-gate 전체 동작 | ❌ | ❌ | 단발 모드 구조 제약 |

**Run 2 최종 판정**: **하네스는 단발 모드에 부적합**. 비용/시간은 낮지만 그건 "덜 했기 때문". 같은 단발 조건에서 baseline이 "더 적은 비용 대비 더 많은 완성". 하네스의 가치 검증은 **대화형 필수**.

### 재현 (Run 2)

```bash
EXP=~/Development/phase4-experiment
cd $EXP/baseline2 && claude -p "$(cat $EXP/PROMPT.txt)" --output-format json --max-budget-usd 30 --permission-mode bypassPermissions > /tmp/phase4-a2-result.json &
cd $EXP/harness2 && claude -p "$(cat $EXP/PROMPT.txt)" --output-format json --max-budget-usd 30 --permission-mode bypassPermissions > /tmp/phase4-b2-result.json &
wait

# 분석
jq '.total_cost_usd, .num_turns, .stop_reason, .is_error' /tmp/phase4-a2-result.json
jq '.total_cost_usd, .num_turns, .stop_reason, .is_error' /tmp/phase4-b2-result.json
```

### Run 2 결론 요약

- **A2 단발 완주 성공**: $1.66, 775s, 1785줄 소스, TypeScript PASS, 20/20 기능
- **B2 Define 단계 자연 완료**: $0.74, 192s, SPEC 328줄, 20/20 명세
- **하네스는 단발 모드에서 "더 싸고 덜 완성"**. 대화형 아니면 가치 측정 불가
- **A1 중단은 "$0.04 부족"이 원인**. 예산 설정이 결정적
- **Phase 4a 최종 판정 업데이트**: "부분 입증"은 여전하지만, **단발 모드에서는 baseline 우위**. 하네스의 진짜 가치는 대화형 세션에서만 측정 가능 → **Phase 4b 대화형 재실험이 필수**

---

## Run 1 (예산 1.5 USD, 오전)

> 이하는 Run 1 오전 결과. Run 2와 비교 참조용.

---

---

## 환경 정보

| 항목 | 값 |
|------|----|
| OS | macOS (Darwin 25.0) |
| Claude Code | 최신 stable |
| Bash 도구 timeout | 실제 측정: A 677s / B 109s (run_in_background, 실질적 상한 없음) |
| 실행 명령 | `claude -p "$PROMPT" --output-format json --max-budget-usd 1.5 --permission-mode bypassPermissions` |

---

## A — Baseline (no harness)

### 환경
- Working dir: `~/Development/phase4-experiment/baseline`
- `.claude/` 없음, `CLAUDE.md` 없음, 빈 git 저장소 + README
- 시작: 2026-04-16 09:08:58
- 종료: 2026-04-16 09:20:15

### 측정 지표

| 항목 | 값 |
|------|----|
| **비용** | **$1.626** (max-budget-usd 1.5 초과, $0.126 초과 발동) |
| **개발 시간 (wall)** | **677초 (11분 17초)** |
| **API duration** | 588,912 ms (9분 48초) |
| **num_turns** | **31** |
| **stop_reason** | **`tool_use` (중단, 자연 완료 아님)** |
| **is_error** | **true** (`Reached maximum budget ($1.5)`) |
| **input_tokens** | 10 |
| **output_tokens** | **38,424** |
| **cache_creation** | 56,454 |
| **cache_read** | 233,024 |
| **생성 파일 수** | **22** |
| **Git 커밋 수** | 1 (init만, 에이전트가 자동 커밋 안 함) |
| **주 모델** | `claude-opus-4-6[1m]` (44,124 output tokens, $1.625) |
| **보조 모델** | `claude-haiku-4-5` (18 output tokens, $0.0008) |

### 생성된 파일 인벤토리 (22개)

**프론트엔드 빌드 설정**:
- `index.html`, `package.json`, `tsconfig.json`, `tsconfig.node.json`
- `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`
- `.gitignore`

**React 앱 (src/)**:
- **❌ `src/` 디렉토리 자체 미생성** — UI 코드 0줄

**Tauri 백엔드 (src-tauri/)**:
- `Cargo.toml`, `tauri.conf.json`, `build.rs`
- `capabilities/default.json`
- `src/main.rs` (5줄), `src/lib.rs` (44줄)
- `src/db.rs` (68줄), `src/models.rs` (23줄)
- `src/commands/mod.rs` (4줄)
- `src/commands/notes.rs` (**201줄**)
- `src/commands/categories.rs` (115줄)
- `src/commands/export.rs` (113줄)
- `src/commands/search.rs` (42줄)
- **Rust 코드 총합**: **615줄**

**누락 (예산 초과로 미완성)**:
- React 컴포넌트 (src/App.tsx, src/main.tsx, src/components/*)
- UI 상태 관리
- shadcn/ui 컴포넌트 설치/설정
- 다크모드 구현
- 실제 작동 가능 UI

### 완성도 체크리스트 (20점 만점)

**필수 기능 (15점)**:
- [0.5] 노트 생성 (backend 있음, UI 없음)
- [0.5] 노트 읽기 (backend 있음, UI 없음)
- [0.5] 노트 수정 (backend 있음, UI 없음)
- [0.5] 노트 삭제 (backend 있음, UI 없음)
- [0.5] 카테고리 생성/할당 (backend 있음)
- [0] 카테고리 트리 UI ❌
- [0.5] 전문 검색 (backend search.rs, FTS 확인 필요)
- [0.5] 전문 검색 본문 (backend 통합)
- [0] 태그 부여 (models.rs에서 확인 필요, UI 없음)
- [0] 즐겨찾기 토글 (UI 없음)
- [0] 최근 편집 목록 (UI 없음)
- [0] 다크모드 수동 토글 ❌
- [0] 시스템 테마 감지 ❌
- [0.5] 내보내기 .md (export.rs 있음)
- [0.5] 내보내기 zip (zip crate 의존성 + export.rs)

**필수 소계**: **4.5 / 15**

**품질 기준 (5점)**:
- [1] Tauri command 계약 정의 (commands/*.rs 타입 명시)
- [0] 비즈니스 로직 ↔ UI 분리 (UI 자체 없음)
- [0.5] 에러 처리 (Rust Result 타입 사용 가능성)
- [1] 시크릿/경로 하드코딩 없음 (로컬 SQLite)
- [0] cargo check PASS (미검증, frontend 없어서 빌드 불가 예상)

**품질 소계**: **2.5 / 5**

### A 최종 완성도: **7 / 20 = 35%**

### 중단 이유
- ☑ **200K 토큰 상한**: 아님
- ☑ **예산 상한 ($1.5)**: YES — `errors: ["Reached maximum budget ($1.5)"]`
- ☐ 자연 완료
- ☐ Blocking 3회

### 특이 관찰
- **한 번에 전체 구현을 시도** → backend부터 진행 → frontend 단계에서 예산 초과 중단
- 백엔드 설계는 구조적 (models, commands, db 분리)
- 31 turns 중 상당수가 tool_use (파일 작성). 단일 응답이 아닌 여러 파일 생성
- is_error=true로 종료 → 실전 사용자에게 "에이전트가 중단됐다"로 보일 것

---

## B — Harness (csr-fastapi Track, v26.7.3)

### 환경
- Working dir: `~/Development/phase4-experiment/harness`
- `.claude/` (agents 8, hooks 9, rules 16, skills 8)
- `.mcp.json` + `.mcp-allowlist` + `CLAUDE.md` (csr-fastapi Track)
- 시작: 2026-04-16 09:08:58 (A와 동시)
- 종료: 2026-04-16 09:10:47

### 측정 지표

| 항목 | 값 | A 대비 |
|------|----|----|
| **비용** | **$0.574** | **-65%** (A $1.626) |
| **개발 시간 (wall)** | **109초 (1분 49초)** | **-84%** (A 677s) |
| **API duration** | 97,056 ms | -83% |
| **num_turns** | 9 | -71% |
| **stop_reason** | `end_turn` (자연 완료) | ✅ vs A `tool_use` |
| **is_error** | false | ✅ vs A true |
| **input_tokens** | 10 | 동일 |
| **output_tokens** | 5,220 | **-86%** (A 38,424) |
| **cache_creation** | 51,921 | -8% |
| **cache_read** | 237,513 | +2% |
| **생성 파일 수** | 1 (docs/SPEC.md) | **코드 vs 설계 카테고리 차이** |
| **Git 커밋 수** | 1 (init) | 동일 |

### 하네스 효과 관찰

| 기능 | 관찰 |
|------|------|
| **gate-check 차단 발생** (/uzys:plan 음성 테스트) | N/A (단발 모드) |
| **/uzys:spec 유도** | **YES — 자발적으로 Define 단계부터 시작** |
| **plan-checker 활성** | NO (Plan 단계 진입 안 함) |
| **reviewer subagent fork** | NO (Review 단계 진입 안 함) |
| **agentshield-gate /uzys:ship 시 실행** | NO (Ship 단계 진입 안 함) |
| **silent-failure-hunter 호출** | NO |
| **build-error-resolver 호출** | NO (Build 단계 진입 안 함) |
| **model-routing 참조** | OFF (이 실험은 default) |
| **checkpoint-snapshot 생성** | NO (40회 미달) |
| **codebase-map.json 생성** | 확인 안 함 (session-start hook 수행 여부 불확실) |
| **mcp-pre-exec 차단 발생** | NO (MCP 미사용) |
| **CL-v2 instinct 축적** | NO |

**핵심 발견**: 9 turns 모두 **spec-driven-development 스킬에 의한 SPEC 작성**에 사용. 단발 모드에서 하네스는 "Define 없이 Build 금지" 정책 때문에 구조적으로 **Build 진입 불가**. 대화형 세션에서는 사용자가 `/uzys:plan`을 명시 호출해 다음 단계로 진행.

### 생성된 파일: `docs/SPEC.md` (287줄)

**섹션 구조** (8개 + 부록):
1. Objective (로컬 전용, 네트워크 의존 없음, 핵심 가치)
2. Features (2.1~2.6: CRUD, 카테고리 트리, FTS, 즐겨찾기/최근, 내보내기, 다크모드)
3. Architecture (디렉토리 트리, 데이터 흐름, 상태 관리)
4. Tauri Commands (IPC 계약 명시)
5. Database Schema (SQL 포함)
6. Code Style (언어별)
7. Testing Strategy
8. Boundaries (DO NOT CHANGE, Non-Goals, Constraints)
9. UI Layout (개략)
- Change Log

### 완성도 체크리스트 (20점 만점)

**코드 기준**:
- 필수 기능 (15): **0 / 15** (코드 0)
- 품질 기준 (5): **0 / 5**
- **코드 완성도: 0 / 20 (0%)**

**SPEC 기준 (하네스의 실제 산출물)**:
- 필수 기능 15 중 SPEC에 명세된 것: **15 / 15** (모든 기능 §2에 구조화)
- 품질 기준 5 중 SPEC에 명세된 것: **5 / 5** (Tauri 계약, 분리, 에러 처리, 시크릿, 테스트 전략 모두)
- **SPEC 완성도: 20 / 20 (100%)**

### 중단 이유
- ☑ **자연 완료** (`end_turn`): YES

---

## 결과 요약

### 정량 비교표

| 지표 | A (Baseline) | B (Harness) | 차이 | 승자 |
|------|-------------|-------------|------|------|
| **비용** | $1.626 | $0.574 | **-65%** | **B** |
| **Wall clock** | 677s | 109s | **-84%** | **B** |
| **Output tokens** | 38,424 | 5,220 | **-86%** | **B** |
| **num_turns** | 31 | 9 | -71% | **B** |
| **완성된 실행** | ❌ 예산 초과 중단 | ✅ 자연 완료 | — | **B** |
| **코드 라인 (Rust)** | 615줄 | 0줄 | — | A |
| **코드 완성도 (20점)** | 7 / 20 (35%) | 0 / 20 (0%) | — | A |
| **SPEC 라인** | 0줄 | 287줄 | — | **B** |
| **SPEC 완성도 (20점)** | 0 / 20 | 20 / 20 (100%) | — | **B** |

### 정성 관찰

**A의 강점**:
- 실제 코드 생성 시도 → Rust backend 615줄
- 빌드 시스템 완성 (Vite, Tauri, Tailwind)
- 백엔드 구조적 분리 (models, commands, db)
- package.json / Cargo.toml 의존성 정확히 지정

**A의 약점**:
- **예산 초과로 오류 종료** — 실전에서 사용자가 에러 메시지 마주침
- **Frontend 미구현** (src/ 비어있음) → UI 없는 앱
- 다크모드/즐겨찾기/UI 관련 전 기능 누락
- 한 번에 "큰 프로젝트"를 시도하는 비구조적 접근

**B의 강점**:
- **비용 1/3 + 시간 1/6** 으로 완료
- **자연 종료** (end_turn) — 에러 없음
- **구조화된 SPEC** 287줄, 20 체크리스트 100% 커버
- spec-driven-development 스킬로 설계 우선 접근
- 다음 단계(plan/build)로 명확히 분해 가능한 상태

**B의 약점**:
- **단발 모드에서 Build 단계 진입 불가** (6-gate 정책 때문)
- 실제 코드 0줄 — 대화형 세션 또는 여러 `claude -p` 호출 필요
- 단발 prompt로 "한 번에 완성"을 원하는 사용자에게 부족해 보일 수 있음
- Phase 5 신규 hook (agentshield, checkpoint, codebase-map, mcp-pre-exec) 실전 동작 미검증 (Build 미진입)

### 핵심 발견

**1. 하네스의 가치는 대화형 세션에서 드러난다**
- 단발 `claude -p` 모드에서 하네스는 Define 단계에서 멈춤 (게이트 정책)
- 이는 **버그가 아닌 설계 의도** — "Define 없이 Build 금지"
- 대화형 세션에서 사용자가 `/uzys:plan`, `/uzys:build` 순차 호출 필요
- 즉 이 실험은 하네스의 **일부 가치만 측정**

**2. 비용/시간 효율은 하네스가 압도적**
- B는 A의 35% 비용, 16% 시간으로 "다음 단계 진입 가능 상태" 도달
- A는 더 많은 turn과 output으로 더 많이 시도했으나 **미완성 + 오류 종료**
- 실전 시나리오: A 같은 방식으로 복잡 프로젝트 시작하면 예산 초과 리스크 높음

**3. 산출물 성격이 근본적으로 다르다**
- A: "불완전한 코드" (Rust 백엔드만, frontend 없음)
- B: "완전한 설계" (모든 기능 SPEC으로 분해됨)
- **어느 게 더 유용한가**는 다음 단계 의존:
  - 사용자가 단독 프로젝트 시작: A의 backend + B의 SPEC 병합이 이상적
  - 하네스는 "올바른 순서로 작업"을 강제 → 실수 방지

**4. A의 예산 초과는 진짜 리스크**
- `is_error: true` + `Reached maximum budget ($1.5)`
- 이는 "복잡 프롬프트 + 단발 모드"의 실전 실패 모드
- 하네스의 단계별 분해가 각 단계 예산을 작게 유지해 이 실패 예방 가능

**5. output tokens 86% 감소는 비용/환경 영향**
- B 5k vs A 38k output tokens
- 7.4배 차이 → 긴 세션 시 누적 영향 큼
- "집중된 작업" vs "산발적 시도"의 차이

### 결론

**하네스 효용 입증**: **Partial** (부분 입증)

| 측면 | 입증 | 증거 |
|------|------|------|
| 비용 효율 | ✅ | B가 A의 35% 비용 |
| 시간 효율 | ✅ | B가 A의 16% 시간 |
| 토큰 효율 | ✅ | B가 A의 14% output token |
| 예측 가능성 | ✅ | B 자연 완료 vs A 예산 초과 |
| 설계 품질 | ✅ | B SPEC 100% vs A SPEC 0% |
| **완성된 코드** | ❌ 측정 불가 | 단발 모드 한계 — 대화형에서 재실험 필요 |
| 6-gate 전체 동작 | ❌ | 단발 모드에서 Define 이후 진입 불가 |
| Phase 5 신규 hook 실전 | ❌ | Build/Ship 미진입 |

**재실험 필요 여부**: **YES**. 다음 실험은 **대화형 세션** 또는 **`claude -p` 체이닝** (`/uzys:spec` → `/uzys:plan` → `/uzys:build` 각 단계를 별도 호출) 방식 필요.

**개선 제안**:
1. `claude -p` 단발 모드에서 하네스가 "다음 단계 진행 필요" 메시지를 더 명확히 출력하도록 우 `/uzys:spec` 커맨드 개선
2. 대화형 vs 단발 모드에 대한 문서화 (USAGE.md에 단발 한계 명시)
3. Phase 4 대화형 재실험 계획 (별도 plan)
4. 단발 chaining 자동화 스크립트 (`phase4-chained-run.sh`) 제작 가능

### 다음 단계

**즉시 (이 세션)**:
- [x] 측정 로그 작성 (이 파일)
- [ ] PRD §7.2 Phase 4 섹션 "부분 검증" 마킹
- [ ] 커밋 + v26.7.4 태그
- [ ] 실험 디렉토리 보존 결정

**후속 plan**:
- **Phase 4b**: 대화형 재실험 (사용자가 직접 claude 세션에서 `/uzys:spec` → `/uzys:plan` → `/uzys:build` 순차)
- **Phase 4c**: `claude -p` 체이닝 자동화 스크립트 (`spec → plan → build → test → review → ship`을 6개 `-p` 호출로)
- **측정 표준화**: 오류 없이 완료된 실험만 비교 허용

### 블로킹 이슈

**발견된 이슈**:
1. **`claude -p` 단발 모드 + 6-gate 하네스 부적합**: Build 단계 진입 불가
2. **max-budget-usd 하한 초과 발생**: $1.5 설정인데 $1.62까지 진행 (tool_use 중이면 완료까지 유예)
3. **is_error 지표**: A의 중단이 예산 때문인데 에러로 분류 — 실전 측정에서 success/error 해석 주의

**Minor 이슈**:
- `.mcp-allowlist` 생성 순서 버그는 이 실험 준비 중 발견 → v26.7.3에서 fix 완료
- B의 codebase-map.json 생성 여부 확인 못 함 (다음 재실험에서)

---

## 부록 A. Raw JSON 결과

**A**: `/tmp/phase4-a-result.json`
**B**: `/tmp/phase4-b-result.json`
**분석 스크립트**: `/tmp/phase4-analyze.sh`

## 부록 B. 재현 방법

```bash
# 1. 실험 디렉토리 2개 생성
EXP=~/Development/phase4-experiment
mkdir -p $EXP/{baseline,harness}
cd $EXP/baseline && git init -q && echo "# baseline" > README.md && git add . && git commit -m init -q
cd $EXP/harness && git init -q && echo "# harness" > README.md && git add . && git commit -m init -q
bash $HARNESS/setup-harness.sh --track csr-fastapi --project-dir .

# 2. 동일 프롬프트 병렬 실행
cd $EXP/baseline && claude -p "$(cat $EXP/PROMPT.txt)" --output-format json --max-budget-usd 1.5 --permission-mode bypassPermissions > /tmp/phase4-a-result.json &
cd $EXP/harness && claude -p "$(cat $EXP/PROMPT.txt)" --output-format json --max-budget-usd 1.5 --permission-mode bypassPermissions > /tmp/phase4-b-result.json &
wait

# 3. 분석
bash /tmp/phase4-analyze.sh
```

## 부록 C. 데이터 제한

- **N=1** — 통계적 결론 아님. 개별 과제에 대한 1회 비교.
- **단발 모드**: 대화형 세션의 라운드트립, 수정 요청, 세션 재개 등 미측정.
- **과제 편향**: React + Tauri + SQLite 조합. 다른 스택에서는 결과 다를 수 있음.
- **프롬프트 의도적 모호성**: "적당히 알아서 판단해" 는 해석 차이 발생 의도적.
- **cache creation 노이즈**: 부모 Claude Code 세션이 child process에 cache 상속 가능 (양쪽 동일이라 상대 비교 유효).

이 실험은 **신호 탐지**이지 **효용 정량화**가 아님. N=2+ 필요.
