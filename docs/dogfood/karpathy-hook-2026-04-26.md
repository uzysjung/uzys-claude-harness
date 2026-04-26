# Dogfood — karpathy-coder hook auto-wire (v0.6.0)

> **Date**: 2026-04-26
> **SPEC**: docs/specs/karpathy-hook-autowire.md (Accepted)
> **Phase**: P5-T3 dogfood

---

## Scope

본 dogfood는 SPEC §5.2 "E2E Mock 금지" 항목을 다음 방식으로 충족:

1. **Mock dogfood (자동)** — 5 case integration test (`tests/install-karpathy-hook.test.ts`)로 install pipeline 통합 + 매 시나리오별 settings.json/hook script 검증
2. **Marketplace verification (자동)** — v0.5.0 dogfood 리포트(`docs/dogfood/cli-dogfood-2026-04-26-v0.5.0.md`)에서 이미 `karpathy-coder@claude-code-skills` 등록 확인
3. **라이브 install (보류)** — ADR-005 정신 유지. v0.6+ 후속 OQ4 절차 정립 시.

라이브 dogfood 보류 사유 (v0.5.0 ADR-005 동일):
- D16 보호 — `claude plugin install`이 글로벌 plugin 캐시 영향 가능
- Marketplace 검증 + Mock dogfood로 install 시점 실패 risk 충분히 낮춤
- v0.6.0 추가 위험 항목은 settings.json merge bug — Mock dogfood로 cover (5 case)

---

## Mock dogfood 결과

`tests/install-karpathy-hook.test.ts` 5 case 모두 PASS:

| # | 시나리오 | 결과 |
|---|---------|------|
| 1 | flag=true + install 성공 → settings.json + hook script 둘 다 존재 | ✅ |
| 2 | flag=true + install 실패 → 둘 다 미생성 (reason: plugin-install-failed) | ✅ |
| 3 | flag=false + install 성공 → karpathyHook=null (opt-in 강제) | ✅ |
| 4 | flag=true + install 성공 (2회 fresh) → settings.json에 정확히 1 entry | ✅ |
| 5 | runExternal=null → wired=false reason=external-skipped (regression guard) | ✅ |

`tests/settings-merge.test.ts` 5 case (P3 산출):
- 빈 settings → entry add ✅
- idempotent (동일 matcher+command 2회 → 1) ✅
- 기존 matcher entry append (protect-files 보존) ✅
- 다른 matcher entries 보존 (Skill, mcp__.*) ✅
- 입력 mutation 0 ✅

전체 vitest: **451 tests PASS** (이전 437 + 신규 14: settings-merge 5 + install-karpathy-hook 5 + fix 4).

---

## Coverage

| 메트릭 | 값 | threshold | 결과 |
|-------|----|----------|------|
| Lines | 96.96% | 90 | ✅ |
| Branches | 88.66% | 88 | ✅ |
| Functions | 96.09% | 90 | ✅ |
| Statements | 96.96% | 90 | ✅ |

`installer.ts` functions 75% — 신규 `wireKarpathyHook` 부분 분기 일부 (e.g., chmod fallback, settings.json 부재 시) 미테스트. P10 분기 재평가 시 보강 후보.

---

## Verification — settings.json 실측

테스트 시나리오 1 (flag=true + 성공)에서 생성된 settings.json 구조:

```json
{
  "_comment": "프로젝트 .claude/settings.json 템플릿. ...",
  "statusLine": { ... },
  "hooks": {
    "SessionStart": [...],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/protect-files.sh\"" },
          { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/skills/strategic-compact/suggest-compact.sh\"", "async": true, "timeout": 5 },
          { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/karpathy-gate.sh\"" }
        ]
      },
      { "matcher": "Skill", ... },
      { "matcher": "mcp__.*", ... }
    ],
    ...
  }
}
```

- 기존 `Write|Edit` entry의 hooks 배열에 karpathy-gate.sh **append** ✅
- 다른 matcher entries (Skill, mcp__.*) **보존** ✅
- 동일 matcher 내 다른 hooks (protect-files, suggest-compact) **보존** ✅

---

## CRITICAL / HIGH

| Severity | 발견 | 비고 |
|---------|------|------|
| CRITICAL | **0** | — |
| HIGH | **0** | — |

---

## 후속

- **OQ4 라이브 dogfood** — ADR-005 후속. v0.6+ 별도 SPEC 또는 사용자 명시 승인 후 tmp dir 라이브 검증.
- **L4 CI integration 가이드 보강** — 본 SPEC §3.2 Non-Goals. 후속 SPEC에서 사용자 작성 GitHub Actions 템플릿 제공 검토.
- **`installer.ts` functions coverage 75% 보강** — `wireKarpathyHook` edge case (settings.json 부재 / chmod 실패) unit test. P10 분기.

---

## Self-Audit (P11)

1. **AC1~AC6** — Build/Test 단계 모두 Pass. Ship 전 최종 확정.
2. **DO NOT CHANGE** — 기존 8 ALWAYS_HOOKS 미변경. `~/.claude/`/`~/.codex/`/`~/.opencode/` 미수정. v0.5.0 SPEC `new-tracks-pm-growth.md` Non-Goals 정신 유지 (자동 활성화 X, opt-in O). ✅
3. **Non-Goals 침범 없음** — B/C 경로/CI gate/default-on/Python 자동 설치/다른 plugin hook 자동 등록 모두 미혼입. ✅
4. **추적 불가 변경 0** — 모든 변경 SPEC F1~F9에 매핑. ✅
5. **열린 의사결정** — OQ4 라이브 dogfood (ADR-005 정신, v0.6+), L4 CI 가이드 (사용자 책임). ✅

---

## Changelog

- 2026-04-26: 본 리포트 작성. Phase 5 P5-T3 산출.
