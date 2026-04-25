# ADR-003: CLI 재작성 — TypeScript + Node + clack 채택

- **Status**: Proposed (2026-04-25) — `docs/specs/cli-rewrite.md` Phase G 완료 시 Accepted 전환 예정
- **Date**: 2026-04-25
- **PR**: TBD (본 SPEC 동시 PR)
- **Related**: `docs/specs/cli-rewrite.md`, `docs/decisions/ADR-001-phase2-entry-criteria.md`, `docs/decisions/ADR-002-codex-hook-gap.md`

## Context

`scripts/setup-harness.sh` (1453줄) + `scripts/test-harness.sh` + `install.sh` (3개 bash 스크립트)는 다음 누적 부담:

1. **인터랙티브 UX 가시성 부족** — `read -p` + `< /dev/tty 2>/dev/null` 패턴 7회. TTY 미존재 시 stderr에 "Device not configured" 노이즈. **사용자가 입력 대기 시점을 모름** — 터미널이 멈춘 것처럼 보임 (현장 보고).
2. **단일 파일 비대화** — code-style.md 800줄 상한의 1.8배. 18 함수 + 60 분기.
3. **타입 안전성 부재** — shellcheck 정적 분석 한계. SC2015 (`A && B || C` is not if-then-else) 다수 경고. 실수 회귀 검출 어려움.
4. **테스트 도구 빈약** — bats 옵션이나 실효 미사용. 회귀는 `test-harness.sh`(또 다른 bash)로만 잡음.
5. **분배 부담** — `bash <(curl -fsSL ...)` 진입. 사용자 환경마다 동작 차이 (BSD vs GNU sed/date 등).

`https://github.com/pbakaus/impeccable` 등 유사 use case(멀티 IDE 자산 분배 CLI)는 JS/TS + npx로 구현. 본 프로젝트도 같은 방향이 적절.

## Decision

본 CLI를 **TypeScript + Node + `@clack/prompts` 기반 단일 npm 패키지**로 완전 재작성한다. bash 진입 3종 폐기. 호환 wrapper 없음 (cutover).

### D1. 언어 — TypeScript on Node 20+

- **strict 모드** (`tsconfig.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`)
- 타입은 SSOT — `templates/` 자산 매니페스트, Track 정의, AC 체크 결과 모두 타입화
- TS 직접 실행 안 함. `tsup` 번들 → 단일 `dist/index.js` (Node 호환). 사용자 측 TS 컴파일러 불필요

### D2. 인터랙티브 prompt — `@clack/prompts`

- 표준 prompt 컴포넌트: `intro`, `select`, `multiselect`, `text`, `confirm`, `outro`, `spinner`, `note`
- TTY 미존재 환경에서 자동 비대화 fallback (clack 내부 처리)
- prompt 시 `> ` 커서 + 색상으로 입력 대기 시점 시각화 — 본 ADR이 해결하려는 핵심 UX 문제
- 대안 검토:
  - `inquirer.js` — 성숙하나 prompt 표시가 단조롭고 multiselect 깜빡임 있음
  - `prompts` (terkelg/prompts) — 가볍지만 활발한 유지 부족
  - 직접 구현 — Non-Goals (P2 Simplicity)

### D3. 인자 파싱 — `commander` (Phase A 실측 후 확정 가능)

- `cac` 도 후보. 결정 전 30분 spike — 두 lib에 동일 명령(`install --track tooling`) 구현 후 빌드 크기 / 가독성 비교
- 부속 명령: `install`, `update`, `add-track`, `test`, `--help`, `--version`. 인자 없음 = 인터랙티브

### D4. 빌드 도구 — `tsup` (esbuild 기반)

- 단일 `dist/index.js` 산출. `bin` 항목으로 `claude-harness` 바이너리 노출
- 외부 의존성 번들링 (`--noExternal`) — 사용자 측 `npm install` 부담 0
- 대안: `esbuild` 직접 (구성 더 많이 필요), `bun build` (Bun 의존)

### D5. 테스트 — `Vitest`, 커버리지 ≥ 90%

- 단위 테스트: arg 파서, state detection, MCP TOML 변환 등 순수 함수
- 통합 테스트: 실 임시 디렉토리(`fs.mkdtempSync`)에 install → 파일 존재 검증
- prompt 모킹: clack의 `__interceptors` 또는 stdin/stdout 스트림 wrap
- **커버리지 게이트**: lines + branches + functions 모두 **≥ 90%** (사용자 지시, 2026-04-25). v8 provider + 커버리지 미달 시 CI exit 1 + Ship 차단
- `vitest.config.ts` `coverage.thresholds.lines/branches/functions = 90`

### D6. 분배 — GitHub Releases 1차 (npm publish 후속)

- 1차 (Phase F): GitHub Releases에 `dist/index.js` 또는 tarball 게시. 사용자는 `npx github:uzysjung/uzys-claude-harness install` 또는 `curl -L .../index.js | node`
- 2차 (Phase F+1, 별도 ADR): npm 공식 게시 — `npx @uzys/claude-harness` 표준 진입
- 단독 dogfood 사용자엔 1차로 충분. npm 공개는 외부 영입 시점에 결정 (현재 Non-Goals)

### D7. 폐기 — bash 3종 즉시 제거 (Phase F)

- `install.sh`, `scripts/setup-harness.sh`, `scripts/test-harness.sh` 삭제
- README / CHANGELOG에 새 진입 명시: `npx ...`
- 호환 wrapper 작성 안 함 (사용자 명시: cutover)

## Consequences

### Positive

- **인터랙티브 UX 명시화** — clack로 입력 대기 시각화. stderr 노이즈 0. **사용자가 보고한 핵심 문제 해결**.
- **타입 + 테스트** — TS strict + Vitest 80% 커버리지. shellcheck로 못 잡던 회귀 컴파일/테스트가 잡음.
- **모듈화** — 1453줄 단일 파일을 6~10개 모듈(≤ 300줄 각)로 분리. 유지보수성 ↑
- **분배 단순화** — `npx` 진입. BSD/GNU sed 차이 같은 환경 변수 0
- **impeccable 모델 검증** — 유사 use case 선례 있음

### Negative

- **5~7일 재작성 비용** — 본 SPEC Phase A~G. 다른 Phase 1 Finalization 작업(AC3 HITO baseline) 병행되지만 wall-clock 대기라 기회비용 적음
- **Node 의존성 추가** — 사용자가 Node ≥ 20 보유해야. dogfood 사용자엔 이미 보유 (MCP 서버 npx 사용 중)
- **새 회귀 위험** — 1453줄 bash 로직을 TS로 옮기는 과정에서 누락 가능. Phase G dogfood 9/9 PASS로 차단
- **CLAUDE.md Project Direction 1 ("ECC 의존, 자체 구현 최소화") 위반 가능성** — 자체 CLI는 자체 구현 늘리는 방향. 다만 install/setup은 ECC가 다루는 영역이 아니므로 정당화 가능

### Neutral

- `claude-to-codex.sh` (247줄, 단순) 는 본 SPEC OQ4에서 결정. 호출 또는 포팅 둘 다 무관

## Alternatives

### A. Bash 유지 + 리팩터 (1453줄 → 모듈 sourcing)

분할: `lib/state.sh`, `lib/install.sh`, `lib/codex.sh` 등 source.

**기각 사유**:
- D1~D5 효익 0 (타입/테스트 도구 빈약 유지)
- 사용자가 보고한 인터랙티브 UX 문제 미해결 (`read -p` 그대로면 노이즈도 그대로)
- 작업량은 절약되나 본질 문제 미해결

### C. Deno (TS 직접 실행)

- 단일 binary 가능, TS 표준 지원

**기각 사유**: Node 생태계(@clack/prompts, vitest, tsup)와 호환 부담. Deno 패키지 매니저 비표준. 사용자 측 deno install 추가 부담.

### D. Python (uv 호환)

- `uvx @uzys/claude-harness` 가능. typer + rich + questionary 조합

**기각 사유**: 본 프로젝트의 타깃 사용자(Claude Code/Codex CLI 사용자)는 Node 친화적. Python 의존성 추가는 부담 증가. 또 prompt 라이브러리가 clack 만큼 모던하지 않음 (questionary는 inquirer 클론).

### E. Go (single binary, no runtime)

- 가장 가벼운 분배 (binary 1개)

**기각 사유**: TUI 라이브러리(bubbletea)는 풀스크린 스타일. 라인 기반 prompt가 본 SPEC의 요구. 또 Go 빌드/배포 파이프라인 (cross-compile, GoReleaser)이 추가 학습 비용. 단독 dogfood 단계엔 과도.

### F. Bun TS

- 빠른 개발 + npm 호환

**기각 사유**: Bun 의존성을 사용자에게 강제할 이유 없음. 빌드는 `tsup`(esbuild)로 충분. 개발 측 Bun 도입은 별도 ADR로 후속 가능 (현재 Node로도 충분).

## Follow-up Actions

1. SPEC `docs/specs/cli-rewrite.md` 동시 PR 작성 (본 ADR 포함)
2. Phase A 착수 시 OQ3 (빌드 도구), OQ5 (테스트 러너), OQ6 (인자 파서) 30분 spike 후 확정
3. Phase F (빌드 + 분배) 시 OQ1 (npm vs GH Releases) 결정 → ADR-003 본문 D6 갱신
4. Phase G dogfood 9/9 PASS 후 ADR-003 Status: Proposed → Accepted
5. 본 SPEC 완료 후 후속 ADR 후보:
   - ADR-004 — npm publish 결정 (외부 영입 시점)
   - ADR-005 — Windows 지원 (현재 macOS+Linux 1차)
