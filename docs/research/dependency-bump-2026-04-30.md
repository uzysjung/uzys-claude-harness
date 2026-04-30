# Dependency major bump — 평가 보고서 (2026-04-30, post v0.8.1)

## Context

`npm outdated` 결과 7건 패키지가 major bump 후보. v0.8.1 ship 직후 평가.

| 패키지 | Current | Latest | Major skip | 사용처 | 위험도 |
|---|---|---|---|---|---|
| @types/node | 22.19.17 | 25.6.0 | 3 | type-only (Node 20 CI) | **low** |
| @biomejs/biome | 1.9.4 | 2.4.13 | 1 | lint/format CI | medium |
| @clack/prompts | 0.7.0 | 1.2.0 | 1 (0.x→1.x) | `src/prompts.ts` interactive | medium |
| cac | 6.7.14 | 7.0.0 | 1 | `src/cli.ts` CLI parser | low-medium |
| typescript | 5.9.3 | 6.0.3 | 1 | type 빌드 + tsup | medium |
| vitest | 2.1.9 | 4.1.5 | 2 | 521 test suite | **high** |
| @vitest/coverage-v8 | 2.1.9 | 4.1.5 | 2 | coverage gate | high (vitest 의존) |

엔진 제약: `engines.node >=20.0.0` (CI: Node 20).

## 위험도 산정 기준

- **low**: type-only / 빌드 도구 부수적. 실패 시 CI 단계에서 즉시 발견, 빠른 rollback 가능
- **medium**: 코드 import/API 호출에 영향. spot fix 가능
- **high**: 다수 호출처 (테스트 framework). 전수 검증 필요

## 단계적 권고 (4 단계)

### Step 1 — Low-risk bump (단일 PR)

`@types/node` 22 → 25 + `@biomejs/biome` 1 → 2

- **@types/node 25**: Node 25 ESM/Web API 타입. 코드는 ES2022 + Node 20 만 사용 → 영향 없음
- **@biomejs/biome 2**: ruleset rename (예: `noNonNullAssertion` 위치 변경). `npm run lint:fix` 자동 마이그레이션 시도 + spot fix
- 검증: `npm run ci` 그린 확인
- 예상 작업: 30분

### Step 2 — CLI deps bump (단일 PR)

`cac` 6 → 7 + `@clack/prompts` 0.7 → 1

- **cac 7**: CHANGELOG 확인 필요. 사용처 `src/cli.ts` 1 file. 인터페이스 그대로면 무영향
- **@clack/prompts 1.0**: 0.x → 1.0 stable. 사용 API (`select`/`multiselect`/`confirm`/`isCancel`) 호환성 우선 확인
- 검증: `tests/cli.test.ts` + interactive smoke test
- 예상 작업: 1-2시간

### Step 3 — TypeScript 6 (단일 PR)

`typescript` 5.9 → 6.0

- TypeScript 6.0 (2026 release): strict 옵션 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) 더 엄격해질 가능성
- tsup 8.x 가 ts 6.x 지원하는지 확인 필요 (tsup 자체 bump도 고려)
- 검증: `npm run typecheck` + 521 test PASS + `npm run build`
- 예상 작업: 2-4시간 (strict error 발견 가능성)

### Step 4 — vitest 4 + coverage-v8 4 (단일 PR, 함께 bump)

`vitest` 2 → 4 + `@vitest/coverage-v8` 2 → 4

- **두 단계 major** (3.0 + 4.0 누적). 521 test 전수 영향
- vitest 3.x 주요 변경: config schema, projects API, browser mode
- vitest 4.x: 기본값 변경 + plugin API
- 검증: 521 test PASS + coverage threshold 충족
- 예상 작업: 4-8시간 (test config + matcher 마이그레이션)

## 우선순위 권고

1. **Step 1, 2** — 다음 sprint 또는 post-Phase D HITO 직후 처리
2. **Step 3** — TypeScript 6.0 ecosystem 안정 후 (tsup/biome/vitest 모두 ts6 지원 확인 후 1-2 release 대기)
3. **Step 4** — vitest 4.x release notes 검토 후 별도 SPEC 작성 권장

## Non-Goals (이번에 안 함)

- 전 패키지 일괄 bump — Step 4 vitest가 깨지면 rollback 영향 큼
- v0.8.x 패치에 dependency bump 포함 — 별도 minor (v0.9.0) 또는 별 release
- Node 22+ 강제 — engines.node 변경은 사용자 영향 큼 (별 SPEC)

## Reference

- npm outdated 결과: 2026-04-30 측정
- 현재 vulnerabilities: 0건 (`npm audit --omit=dev`)
- v0.8.1 ship 직후 baseline
