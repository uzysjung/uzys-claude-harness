# SPEC: CLI 완전 재작성 — Bash → TypeScript (Node, clack 기반)

> **Status**: Accepted (2026-04-25, 사용자 승인 완료)
> **Trigger**: 1453줄 단일 bash 파일(`scripts/setup-harness.sh`) + 비대화형 환경 stderr 노이즈(`/dev/tty: Device not configured` 7회) + 인터랙티브 prompt 가시성 불명(터미널이 멈춘 것처럼 보임) → 사용자 신뢰 저하.
> **Predecessor**: 본 SPEC 적용 후 `scripts/setup-harness.sh` / `scripts/test-harness.sh` / `install.sh` 폐기.
> **Relation**: `docs/SPEC.md` (Phase 1 Finalization, AC3 wall-clock 진행 중) 와 **독립 스펙**. spec-scaling 룰에 따라 `docs/specs/` 하위.
> **Related**: `docs/specs/codex-compat.md` (Codex 호환 1차, v27.19.0 완료) — 본 작업은 Codex 호환 인프라(`scripts/claude-to-codex.sh`, `templates/codex/`)는 **그대로 유지**하되 진입 CLI만 재작성.

---

## 1. Objective

기존 bash 진입 CLI 3종(`install.sh`, `scripts/setup-harness.sh`, `scripts/test-harness.sh`)을 **TypeScript + Node + clack 기반 단일 npm 패키지**로 완전 재작성한다. 핵심 결과는:

1. **명시적 인터랙티브 UX** — clack 표준 prompt 사용. 입력 대기 시점이 시각적으로 명확하고, stderr 노이즈가 prompt 가시성을 흐리지 않는다.
2. **타입 안전 + 테스트** — TypeScript strict 모드 + Vitest 단위/통합 테스트. shellcheck로는 잡히지 않는 회귀를 컴파일/테스트가 잡는다.
3. **모듈화** — 1453줄 단일 파일을 책임별 모듈(arg 파싱, state 감지, prompt, 설치 단계, 변환, 검증)로 분리. 각 모듈 ≤ 300줄.
4. **분배 단일화** — `npx @uzys/claude-harness` 1개 진입점. `bash <(curl...)` 와 다중 wrapper 폐기.

## 2. 판단 기준 (불변)

NORTH_STAR §5 4-gate 적용. 본 작업은 신규 범주(자체 CLI 패키지)를 **추가**하므로 Lean gate에 특히 주의.

### 완료 조건 (AC)

- **AC1 — 진입점**: `npx @uzys/claude-harness install` 명령으로 9 Track 중 **임의 1개** 무인 설치 성공 (exit=0 + 필수 파일 존재). 인터랙티브 진입은 `npx @uzys/claude-harness`(인자 없음).
- **AC2 — 인터랙티브 명시성**: clack `intro/select/text/confirm/outro` 사용. prompt 표시 시 입력 대기 표시(↑↓ 화살표 또는 텍스트 입력 cursor) 명확. **`/dev/tty: Device not configured` 같은 stderr 노이즈 0건** (TTY 미존재 시 clack가 자동으로 비대화 fallback).
- **AC3 — 9 Track + Codex 호환 보존**: 9 Track 무인 fresh install 9/9 PASS (현 v27.19.0 등가). `--cli codex` 경로도 작동(내부에서 `scripts/claude-to-codex.sh` 호출 또는 TS 포팅).
- **AC4 — 테스트**: Vitest 테스트 ≥ 30개 (단위 + 통합). **커버리지 ≥ 90%** (CLI 본체, lines + branches + functions). 90% 미달 시 ship 차단.
- **AC5 — 리팩터 후 라인 수**: 단일 모듈 ≤ 300줄, 총합 ≤ 2000줄(타입 정의 + 테스트 별도).
- **AC6 — DO NOT CHANGE 무손**: `templates/`, `.claude/`, `docs/`, `~/.claude/`, `~/.codex/` 미변경. 본 SPEC은 진입 CLI만 교체.
- **AC7 — 분배**: GitHub Releases 또는 npm publish 중 1개 채택해 **`npx @uzys/claude-harness@latest`** 즉시 실행 가능.

### 판정 절차

1. AC별 증거 = 파일 경로 + 커밋 SHA + 테스트 결과 + 실측 로그
2. 에이전트 자기주장 불가 — 무인 9 Track 설치 결과를 `docs/evals/cli-rewrite-YYYY-MM-DD.md`에 기록
3. 미달 항목은 Non-Goals 이월 또는 SPEC revision CR

## 3. 결정 일람

### 3.1 포함 (In Scope)

| ID | 작업 | 우선순위 |
|----|------|---------|
| **F1** | TS 프로젝트 초기화 — `package.json` (bin 진입), `tsconfig.json` strict, `biome.json` 또는 `eslint+prettier`, `vitest.config.ts` | P0 |
| **F2** | CLI 골격 — `commander` 또는 `cac` 기반 명령 분해 (`install`, `update`, `add-track`, `test`, `--help`, `--version`). flag 모드 = 인자 있음, 인터랙티브 = 인자 없음 | P0 |
| **F3** | 인터랙티브 prompt — `@clack/prompts` 사용. `intro` → `select`(Track 9개) → `multiselect`(옵션 4종: Tauri/GSD/ECC/ToB) → `select`(CLI: Claude/Codex/Both) → `confirm`(요약) → `outro` | P0 |
| **F4** | State detection 모듈 — `.claude/.installed-tracks` 감지 + legacy `rules/*.md` 시그니처 fallback (현 v27.17 detect_install_state 동등) | P0 |
| **F5** | 5-action 라우터 — 기존 설치 감지 시 (Add/Update/Remove/Reinstall/Exit) clack `select` 메뉴 | P0 |
| **F6** | 설치 단계 — Track별 rules/commands/agents/skills/hooks/MCP 자산 복사 (Node `fs/promises` + `glob`). idempotent. 백업/롤백 포함 | P0 |
| **F7** | `--cli codex` 통합 — 기존 `scripts/claude-to-codex.sh` 호출 또는 TS 포팅(작은 5단 변환). opt-in trust entry 등록 prompt | P1 |
| **F8** | 테스트 스위트 — Vitest 단위(arg 파싱, prompt mock, state detection, transform) + 통합(전체 install 시나리오 9 Track) | P0 |
| **F9** | 빌드 + 분배 — `tsup` 또는 `esbuild`로 단일 `dist/index.js` 번들. `package.json` `bin: { "claude-harness": "./dist/index.js" }`. GitHub Releases 또는 npm 게시 | P1 |
| **F10** | 폐기 — `install.sh`, `scripts/setup-harness.sh`, `scripts/test-harness.sh` 삭제. README/CHANGELOG에 새 진입 명시 | P1 |

### 3.2 제외 (Non-Goals)

- **`templates/` 자산 변환** — bash `templates/hooks/*.sh`, `.claude/hooks/*.sh`는 stdin JSON 표준이므로 **그대로 유지**. shell hook 자체를 TS로 바꾸지 않음.
- **`scripts/claude-to-codex.sh` 강제 폐기** — 247줄 단순 변환 스크립트. TS 호출 또는 그대로 유지 둘 다 허용. 본 SPEC이 강제하지 않음.
- **`scripts/prune-ecc.sh`, `scripts/sync-cherrypicks.sh`** — 운영 보조 스크립트. 본 SPEC 범위 밖.
- **호환성 레이어** — `bash <(curl ...)` 진입 유지/wrapper 금지 (사용자 명시: cutover).
- **GUI / TUI 풀 스크린** — clack 라인 기반 prompt만. blessed/ink 같은 풀스크린 TUI는 과도.
- **외부 사용자 영입** — 단독 dogfood 사용자 기준. npm 게시는 분배 편의지 마케팅 아님.
- **OpenCode 2차** — `docs/specs/codex-compat.md` Non-Goals와 동일.

### 3.3 DO NOT CHANGE

- `docs/SPEC.md` (Phase 1 Finalization) AC1~AC5 — 별도 SPEC 진행 중
- `docs/specs/codex-compat.md` AC1~AC6 — Codex 1차 완료분 무손
- `templates/CLAUDE.md`, `templates/rules/*.md`, `templates/commands/uzys/*.md`, `templates/agents/*.md`, `templates/hooks/*.sh`, `templates/skills/*` — Claude SSOT, 절대 미변경
- `templates/codex/` — Codex 1차 산출물, 미변경
- `.mcp.json` (project root) — Codex transform 입력
- `~/.claude/`, `~/.codex/` 글로벌 (D16 보호)
- `docs/NORTH_STAR.md` §1~5
- 기존 `scripts/claude-to-codex.sh` — 미변경. 새 CLI에서 호출 가능

### 3.4 판단 보류 (Open Questions)

- **OQ1 — npm 게시 vs GitHub Releases**: `npx @uzys/claude-harness` 진입을 위해 npm 게시가 표준이나, GitHub Releases + `npx github:user/repo`도 가능. 단독 dogfood 사용자에겐 Releases가 가벼울 수 있음. → ADR-003에서 결정.
- **OQ2 — 패키지명**: `@uzys/claude-harness` vs `@uzys/uzys-claude-harness` vs `uzys-harness`. → ADR-003.
- **OQ3 — 빌드 도구**: `tsup` vs `esbuild` vs `bun build` (Node 호환 출력). 모두 단일 번들 가능. → Phase A 실측 (가장 빠른 + 안정).
- **OQ4 — `claude-to-codex.sh` TS 포팅 여부**: ✅ Closed — Phase D에서 **TS 포팅 채택** (`src/codex/{agents-md,config-toml,skills,transform,trust-entry}.ts`). cutover 정신 + 단일 의존성(Node only) + 단일 코드베이스. bash 스크립트는 Phase F에서 폐기.
- **OQ5 — Vitest vs Bun test**: Bun test 빠르나 Vitest 호환성 우월. → Phase A에서 시도 후 판정.
- **OQ6 — 인자 파싱 라이브러리**: `commander` (성숙) vs `cac` (가벼움) vs `yargs`. → Phase A.

## 4. Phase 분해

총 예상: **6~8일** (단독 작업, 90% 커버리지 추가 0.5일 반영).

- **Phase A — 프로젝트 초기화 + 골격** (F1, F2, OQ3/5/6 결정): TS 프로젝트 + 빌드 + Vitest + commander/cac 진입점. `--version`, `--help`만 작동. (1일)
- **Phase B — 인터랙티브 prompt + state 감지** (F3, F4, F5): clack 통합. 9 Track select / 옵션 multiselect / 5-action 라우터. 무인 fallback (TTY 없으면 자동 flag 모드 강제). (1일)
- **Phase C — 설치 단계 핵심** (F6): `templates/` → `<project>/.claude/` 복사 로직. Track별 rules/commands/agents/skills/hooks 매핑. `.mcp.json` jq 등가 (Node `JSON` API). 백업/롤백. (1.5일)
- **Phase D — Codex 호환 통합** (F7, OQ4): 기존 `claude-to-codex.sh` 호출 또는 TS 포팅. opt-in trust entry. (0.5~1일)
- **Phase E — 테스트 스위트** (F8): Vitest 단위 + 통합. 9 Track 통합 테스트 (mock fs 또는 실 tmp dir). **커버리지 90%** (lines + branches + functions). (1.5일)
- **Phase F — 빌드 + 분배 + 폐기** (F9, F10): `tsup` 번들. `bin` 진입. npm 게시 또는 GH Releases. 기존 bash 3종 삭제. README/CHANGELOG. (0.5~1일)
- **Phase G — Dogfood + Ship**: 9 Track 실측 fresh install 9/9 PASS + Codex 2 Track + 인터랙티브 사용자 검증 + ADR-003 Accepted. (0.5일)

병렬 관계:
- A → B → C 직렬
- D는 C와 병행 가능 (자산 분리)
- E는 모든 Phase에서 점진 추가 (TDD)
- F는 E 완료 후
- G는 F 완료 후

## 5. 위험 & 완화

| Risk | 완화 |
|------|------|
| 5~7일 작업 중 SPEC scope creep | Phase별 PR + AC 체크박스. Phase G까지 ECC 같은 외부 시스템 호출 추가 금지 |
| Node 의존성으로 사용자 환경 깨짐 | Vendored bundle (`tsup --noExternal`)로 의존성 zero. Node ≥ 20 명시. |
| clack 라이브러리 BC break (마이너 버전) | `package.json` 버전 핀. `latest`가 아닌 `^x.y` 고정 |
| 기존 bash 폐기 후 회귀 발견 | Phase G dogfood 9/9 통과 전엔 v28 태그 안 함. main 머지는 PR 단위로 작게. 회귀 시 revert 가능 |
| `claude-to-codex.sh` 호출 vs 포팅 결정 지연 | Phase D 시작 시 30분 spike — 둘 다 만들어 비교 후 채택 |
| npm 게시 인증 비용 | OQ1 → GitHub Releases도 옵션. dogfood 단계에선 `npx github:uzysjung/uzys-claude-harness#release` 형태로 가능 |
| TUI prompt가 Windows에서 깨짐 | macOS + Linux 1차. Windows는 Phase G 이후 ADR로 검토 (현재 사용자 macOS 단독) |

## 6. Self-Audit Hooks

각 Phase 완료 시 `CLAUDE.md` P11 Self-Audit 5항목 실행:

1. AC 충족 여부 항목별 Pass/Fail
2. DO NOT CHANGE 미변경 확인 (`git diff` 검증)
3. Non-Goals 침범 없음 확인 (특히 `templates/` 변경 0)
4. 요청에 추적 불가한 변경 유무
5. 열린 의사결정 / 후속 작업

결과는 `docs/evals/cli-rewrite-phase-<X>-YYYY-MM-DD.md` 에 기록.

## 7. 사용자 승인 기록

2026-04-25 사용자 승인. Status: Draft → **Accepted**.

승인 시점 결정:
- Sprint Contract (§1 + §2 AC + §3.2 Non-Goals) 동의
- Phase 분해 (§4) 동의
- **추가 강화**: Vitest 커버리지 80% → **90%** (사용자 직접 지시)
- ADR-003 동시 진행 동의

남은 OQ:
- OQ1 npm vs GH Releases — Phase F까지 보류 (디폴트: GH Releases 1차 → npm 후속, ADR-003 D6)
- OQ2 패키지명 — Phase F에서 결정
- OQ3/5/6 (빌드 도구 / 테스트 러너 / 인자 파서) — Phase A 30분 spike 후 확정
- OQ4 `claude-to-codex.sh` 포팅 — Phase D 진입 시 결정

Phase A 착수 (다음 세션).

---

## Changelog

- 2026-04-25: 초안 작성. 근거 — 사용자 1번 답변(인터랙티브 입출력 명시성 부족) + 4번 답변(완전 재작성, 명확한 SPEC). 호환 전략 신경 쓰지 않음(사용자 3번 답변).
