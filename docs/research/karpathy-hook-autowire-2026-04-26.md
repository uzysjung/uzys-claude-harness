# Research — karpathy-coder hook auto-wire 외부 검증

> **Date**: 2026-04-26
> **Linked SPEC**: `docs/specs/karpathy-hook-autowire.md`
> **Purpose**: SPEC §2 4-gate 4/4 자체 판정의 외부 정보 검증. SPEC §F9 산출.

---

## Methodology

3개 sub-question parallel WebSearch + 2개 deep-read (jyn.dev, karpathy `enforcement-patterns.md`). 14 unique sources. Confidence: High — upstream 1차 출처 직접 확인.

## 핵심 발견

### Q1. Real adoption

- `alirezarezvani/claude-skills` repo: **5,200+ GitHub stars** ([source](https://github.com/alirezarezvani/claude-skills))
- karpathy-coder = 232 skills 중 1개. 별도 사용 metric 없음.
- karpathy-coder hook을 **자동 와이어링하는 installer/플러그인 사례 발견 안 됨**.
- Karpathy 4 원칙 자체는 community 인기 — youtube ([PzhTLHQfdRE](https://www.youtube.com/watch?v=PzhTLHQfdRE)), llm-wiki 등.

### Q2. Industry pattern

Claude Code 공식 ([hooks-guide](https://code.claude.com/docs/en/hooks-guide), [plugins README](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)):

- 마켓플레이스 plugin **auto-install**: 미지원 — feature request ([Issue #28310](https://github.com/anthropics/claude-code/issues/28310))
- 마켓플레이스 **auto-update via settings.json**: 미지원 — feature request ([Issue #51350](https://github.com/anthropics/claude-code/issues/51350))
- 사용자 직접 `/plugin` TUI 활성화가 표준
- `"disableAllHooks": true` opt-out 메커니즘 존재

→ auto-wire는 industry pattern 부재. **공식 도구도 미구현**.

### Q3. Failure modes

[jyn.dev — "pre-commit hooks are fundamentally broken"](https://jyn.dev/pre-commit-hooks-are-fundamentally-broken/):

- Workflow Obstruction — 작업 저장 차단
- Rebase Catastrophic Failure — 리베이스 중 hook이 의도 외 분기에서 실행
- Index vs Working Tree Mismatch
- Cascading Verification Problems

저자 권장: **pre-push hook 또는 CI**. pre-commit은 좁은 use case로 한정.

> **본 SPEC 적합성**: 본 SPEC A 경로(`.claude/settings.json` PreToolUse)는 git pre-commit과 다름 — Claude Code Write/Edit 시점에만 작동, git rebase 영향 없음. jyn.dev 비판의 핵심 failure modes는 회피.

### Q4. Alternative approaches

| 도구 | 특징 | 우리 케이스 |
|------|------|-----------|
| Lefthook (Go) | 10× 빠름, polyglot, YAML | 의존성 추가 — Lean 위반 |
| Husky (JS) | npm 통합, IDE 지원 | data Track Python-only에 부적합 |
| pre-commit (Python) | 환경 격리, 가장 풍부 | 자체 reliability 문제 |
| **A 경로 (.claude/settings.json)** | Claude Code 컨텍스트만 | Claude Code 내장 기능 — 추가 의존성 0 |

2026 권장 ([pkgpulse 2026](https://www.pkgpulse.com/blog/husky-vs-lefthook-vs-lint-staged-git-hooks-nodejs-2026), [Andy Madge 2026](https://www.andymadge.com/2026/03/10/git-hooks-comparison/)): husky+lint-staged 또는 Lefthook. 그러나 우리는 git pre-commit이 아니라 Claude Code 컨텍스트 — 비교 직접 X.

### Q5. Upstream 권장사항 ⭐ (결정적)

[karpathy-coder enforcement-patterns.md](https://github.com/alirezarezvani/claude-skills/blob/main/engineering/karpathy-coder/references/enforcement-patterns.md) 명시:

| Level | 방식 | 와이어링 |
|-------|------|---------|
| L1 Passive | plugin install | 자동 |
| L2 Active review | `/karpathy-check` 수동 | 사용자 |
| **L3 Automated gate** (= 본 SPEC 목표) | Husky / `.claude/settings.json` PostToolUse / `.pre-commit-config.yaml` | **수동** |
| L4 CI integration | GitHub Actions | 수동 |

핵심 인용:
- "Teams should **experience them before enforcing** them"
- "Don't go straight to L4 without team buy-in"
- 자동 설치 기반 와이어링 언급 없음 — 모든 통합은 explicit user action 필요
- L3 자체가 "warn, doesn't reject" 비차단 설계

## 4-gate 재평가

| Gate | 자체 판정 | 외부 검증 | 본 SPEC 정합성 |
|------|---------|---------|------|
| Trend | ✅ | upstream "manual 권장" + Claude Code 공식 미지원 | **opt-in 강제로 정합** — 자동 와이어링 X, 사용자 명시 yes 후 wiring |
| Persona | ✅ | 자동 hook에 대한 비판 + dev 부담 signals | **opt-in으로 default OFF — 사용자 부담 0** |
| Capability | ✅ | L3은 warn-only — 강제력 약함 | **검출 도구의 자동 게이트 격상** — warn-only도 가치 있음 (작성 시점 즉시 피드백) |
| Lean | ✅ | cherry-pick + helper + flag 추가 비용 | **opt-in prompt + 자동 활성화 = 사용자 일손 lean. 코드는 ~150줄 (settings-merge + cherry-pick + unit test)** |

**자체 4/4 → 재판정 4/4** — 단, 정합성 확보 조건 충족 시:
1. opt-in 강제 (default OFF + install prompt)
2. 자동 와이어링은 사용자 yes 응답 후에만
3. USAGE.md에 4 enforcement level 가이드 (incremental adoption 안내)
4. L3 비차단 설계 유지 (graceful exit)

## 결정

**Modified Go** — 본 SPEC 진행하되 다음 조건 충족:

1. **opt-in 강제** (SPEC AC1: `DEFAULT_OPTIONS.withKarpathyHook = false`)
2. **install 시 prompt** (SPEC F2/F3)
3. **사용자 yes 후에만** hook entry 등록 + cherry-pick
4. **USAGE.md 4 level 가이드** (SPEC F8 보강)
5. **L3 비차단 — Python 3 부재 시 graceful exit** (SPEC F6, OQ2)

이 5 조건 충족 시 upstream `enforcement-patterns.md` 의도와 정합. 사용자 명시 동의가 "team buy-in"의 개인 단위 등가.

## Sources (14)

1. [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) — marketplace 5,200+ stars
2. [enforcement-patterns.md](https://github.com/alirezarezvani/claude-skills/blob/main/engineering/karpathy-coder/references/enforcement-patterns.md) — upstream 결정적 출처 ⭐
3. [Claude Code hooks-guide](https://code.claude.com/docs/en/hooks-guide) — 공식 hook 문서
4. [Claude Code Issue #28310](https://github.com/anthropics/claude-code/issues/28310) — auto-install plugin (미지원)
5. [Claude Code Issue #51350](https://github.com/anthropics/claude-code/issues/51350) — marketplace auto-update (미지원)
6. [jyn.dev — pre-commit broken](https://jyn.dev/pre-commit-hooks-are-fundamentally-broken/) — failure modes
7. [pre-commit Issue #1338](https://github.com/pre-commit/pre-commit/issues/1338) — auto-install hook types
8. [pre-commit Issue #1817](https://github.com/pre-commit/pre-commit/issues/1817) — apply changes + retry
9. [pkgpulse 2026 — git hooks](https://www.pkgpulse.com/blog/husky-vs-lefthook-vs-lint-staged-git-hooks-nodejs-2026)
10. [Andy Madge 2026 — Git Hook Frameworks](https://www.andymadge.com/2026/03/10/git-hooks-comparison/)
11. [DEV — Lefthook benefits vs husky](https://dev.to/quave/lefthook-benefits-vs-husky-and-how-to-use-30je)
12. [Karpathy-Skill YouTube](https://www.youtube.com/watch?v=PzhTLHQfdRE) — community signal
13. [tweag agentic-coding-handbook](https://tweag.github.io/agentic-coding-handbook/examples-scripts/pre-commitator/SETUP/) — pre-commit setup
14. [Adam Johnson — pre-commit fail hook](https://adamj.eu/tech/2024/01/24/pre-commit-fail-hook/) — custom pattern

---

## Changelog

- 2026-04-26: 본 research 작성. 사용자 요청 (`/deep-research`)으로 SPEC 진행 전 외부 정보 검증. 결과 — Modified Go (opt-in + 5 조건 충족 시 4/4 정합).
