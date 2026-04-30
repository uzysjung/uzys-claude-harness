# ADR-007: Versioning Convention 명시 + Drift Period 정리 (2026-04-18 ~ 2026-04-30)

- **Status**: Accepted
- **Date**: 2026-04-30
- **PR**: (single-maintainer, 사용자 직접 승인)
- **Supersedes**: 없음
- **Related**: `.claude/rules/git-policy.md` Versioning Convention 섹션, `docs/SPEC.md` §4 Phase F

## Context

2026-04-30 v0.8.1 ship 직후 Foundation 완료 메타 ship에서 `v28.0.0` 태그 push. 사용자 지적: "Major는 당해년도, 2026 = v26.x.x".

### 사실 정리 (git tag 기록)

| 시기 | 태그 | 컨벤션 준수? |
|---|---|---|
| 2026-04-17 | v26.14.1, v26.15.0 | ✅ Pass |
| 2026-04-18 | v26.16.0, v26.16.1, v26.17.0 | ✅ Pass |
| 2026-04-18 (같은 날) | **v27.0.0** (TypeScript CLI rewrite BREAKING) | ❌ **위반 시작점** |
| 2026-04-18 ~ 04-25 | v27.1.0 ~ v27.19.0 (19건) | ❌ 누적 위반 |
| 2026-04-30 | v28.0.0 (Foundation 완료) | ❌ 위반 누적 |

### 위반 원인

1. **SemVer 사고 침투**: 2026-04-18 TypeScript CLI rewrite (BREAKING)에서 `v26.17.0` → `v27.0.0`으로 Major bump. SemVer 일반 관행대로 BREAKING = Major 적용. 컨벤션은 "Year 변경 시점에만 Major" — 위반.
2. **SPEC/문서 본문 텍스트 침투**: SPEC §4 Phase F에 "v28.0.0 태그" 텍스트 작성됨 (2026-04-23). 2026-04-30 ship 시 이를 그대로 따름 — 컨벤션 검증 누락.
3. **Pre-tag checklist 부재**: ship 전 컨벤션 검증 단계가 없었음.

## Decision

### 1. 버전 컨벤션 (영구)

**형식**: `vMAJOR.MINOR.PATCH`

- **Major = `year - 2000`** (CalVer-like)
  - 2025 = `v25.x.x`
  - 2026 = `v26.x.x`
  - 2027 = `v27.x.x`
- **Minor**: feature bump. BREAKING change여도 같은 year 내에서는 Minor만 bump
- **Patch**: bug fix only

**Year 변경 시점에만 Major bump**. SemVer-식 BREAKING → Major 적용 **금지**.

### 2. Drift Period 일괄 Rename (2026-04-30 실행)

위반 누적된 21개 태그를 일괄 rename. 매핑 규칙: `v27.X.Y → v26.(X+18).Y`, `v28.0.0 → v26.38.0`.

| 기존 | → | 정정 | 기존 | → | 정정 |
|---|---|---|---|---|---|
| v27.0.0 | → | v26.18.0 | v27.13.0 | → | v26.31.0 |
| v27.1.0 | → | v26.19.0 | v27.13.1 | → | v26.31.1 |
| v27.2.0 | → | v26.20.0 | v27.14.0 | → | v26.32.0 |
| v27.3.0 | → | v26.21.0 | v27.15.0 | → | v26.33.0 |
| v27.5.0 | → | v26.23.0 (점프 보존) | v27.16.0 | → | v26.34.0 |
| v27.8.0 | → | v26.26.0 | v27.17.0 | → | v26.35.0 |
| v27.9.0 | → | v26.27.0 | v27.18.0 | → | v26.36.0 |
| v27.10.0 | → | v26.28.0 | v27.19.0 | → | v26.37.0 |
| v27.11.0 | → | v26.29.0 | **v28.0.0** | → | **v26.38.0** |
| v27.12.0 | → | v26.30.0 | | | |
| v27.12.1 | → | v26.30.1 | | | |

**합계**: 21건 (v27.x 20개 + v28.0.0).

### 3. 정정 절차

1. GitHub release delete (cleanup-tag) 21건
2. local tag 정리 (`git tag -d`)
3. remote tag 정리 (`git push origin :tagname`)
4. 새 tag 생성 (동일 commit SHA에 새 이름)
5. tag push
6. GitHub release recreate (기존 release notes 보존)

**commit history는 rewrite 안 함** — `--force` push 없음, commit message 내 v27.x.x 인용은 historical record로 보존.

### 4. 문서 cross-reference 정정

- `CHANGELOG.md` — v27.x → v26.x 일괄 정정
- `docs/SPEC.md` §4 — "v28.0.0 태그" → "v26.38.0 태그" 정정
- `docs/evals/` 보고서 본문 — 모든 v27.x / v28.0.0 인용 정정
- `docs/research/` — 동일
- `memory/cli-rewrite-active.md` — 동일

### 5. Pre-tag Checklist 도입 (`.claude/rules/git-policy.md` Versioning 섹션)

모든 ship 전:

1. `git tag -l | sort -V | tail -5` 마지막 정상 태그 확인
2. 당해년도 매핑 검증 — `date +%Y` % 100 = 현재 Major
3. SPEC/ADR/문서 본문 미래 태그 텍스트 발견 시 컨벤션 검증 후 따를 것
4. 위반 의심 시 ship 중단 + 사용자 컨펌

## Alternatives

| 대안 | 기각 사유 |
|------|----------|
| v28만 → v26.18.0 정정 (옵션 A) | v27.x 19개 위반 그대로 잔존. 향후 history 추적 시 일관성 깨짐 |
| 컨벤션 변경 (CalVer 폐기 + SemVer 채택) | 사용자 명시 컨벤션 위반. 본 ADR이 기존 컨벤션 정당화 |
| 시퀀셜 압축 매핑 (점프 제거) | 누적 ship 순서가 git log + history 일관성과 어긋남. 직접 수식 (`+18`)이 추적 단순 |
| commit history rewrite (`git filter-repo`) | force-push 위험 + 외부 영향 ≈ 0 이라도 commit SHA 변화 시 cherry-pick 등 ref 깨짐 |

## Consequences

### Positive

- **컨벤션 일관성**: v25 → v26 → v27 (2027) 자연스러운 진행
- **Pre-tag checklist 강제**: 향후 동일 위반 방지
- **Single source of truth**: `.claude/rules/git-policy.md` Versioning 섹션 + 본 ADR

### Negative

- **GitHub release URL 변경**: 21개 release URL이 `v27.x` → `v26.x` 변경. 외부 링크가 만약 어디든 있다면 broken (외부 사용자 0 확인 — 영향 ≈ 0)
- **commit message 내 historical reference**: 본 ADR 이후에도 commit message 본문엔 "v27.x" 텍스트 잔존 (rewrite 안 함). 추적 시 ADR-007 참조 필요

### Neutral

- **package.json version (TypeScript CLI v0.x)**: 별도 trace, 본 정정과 무관 (v0.8.1 그대로)
- **Phase 1 Foundation 완료 의미**: v28.0.0 → v26.38.0 으로 변경되어도 ship 의미 동일

## Verification

본 ADR 적용 후 다음 검증:

1. `git tag -l | sort -V` — v27.x / v28.0.0 0건, v26.x 38건
2. `gh release list` — v26.x 38건 (v27.x / v28.0.0 0건)
3. `grep -rn "v27\.\|v28\.0" docs/ CHANGELOG.md` — 정정 후 0건 (또는 archive 사유 명시 + ADR-007 참조만)
4. `npm run ci` — PASS

## Follow-up

- 본 ADR 게시 후 `.claude/rules/git-policy.md` Versioning 섹션이 SSOT
- 향후 ship 자동화 시 pre-tag checklist를 hook으로 강제 (선택)
