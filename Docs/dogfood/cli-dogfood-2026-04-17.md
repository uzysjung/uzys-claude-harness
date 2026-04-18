# CLI Dogfood — 2026-04-17

**Target**: uzys-claude-harness (bash CLI 하네스)
**Version tested**: v26.14.1 + `9735f0d`
**Method**: 사용자 관점에서 fresh install / multi-track / --update / error paths / workflow gate 실측

## Summary

| Phase | Scenarios | Pass | Fail | Issues |
|-------|:-:|:-:|:-:|:-:|
| 1. Fresh install (3 track) | 3 | 3 | 0 | 0 |
| 2. Multi-track + add-track | 2 | 2 | 0 | 0 |
| 3. --update cleanup | 1 | 1 | 0 | 0 |
| 4. Error paths | 4 | 4 | 0 | 0 |
| 5. Workflow gate + protect-files | 6 | 6 | 0 | 0 |
| **Total** | **16** | **16** | **0** | **0 CRITICAL/HIGH** |

발견된 MEDIUM/LOW 이슈 아래 별도 섹션.

---

## Phase 1 — Fresh Install

| Track | Time | Agents | Hooks | Rules | Cmds uzys | MCP | Allowlist | ❌ | Verdict |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| tooling | 36s | 8 | 7 | 8 | 7 | yes | yes | 0 | ✅ |
| executive | 14s | 5 | 7 | 3 | **0** | yes | yes | 0 | ✅ (의도) |
| full | 84s | 8 | 7 | 17 | 7 | yes | yes | 0 | ✅ |

**관찰**:
- executive Track은 uzys commands 0개. 자연어 워크플로우라 6-gate 미적용 — 설계 의도.
- Track별 HOOKS_EXP=7 일관. Agents dev tracks 8 / executive 5 올바름.

## Phase 2 — Multi-Track + Add-Track

### 2.1 `--track tooling --track csr-fastapi` (union 동시 설치)
- 시간: 59s
- Rules: 13 (COMMON 3 + DEV 4 + UI 1 + tooling 1 + csr-fastapi 4)
- MCPs: `chrome-devtools, context7, github, railway-mcp-server` (csr-fastapi 매칭으로 railway 추가)

### 2.2 `--track tooling` 후 `--add-track ssr-nextjs` (후 추가)
- 초기: 8 rules, 3 MCPs (railway 없음)
- 후: **11 rules, 4 MCPs** (railway 추가)
- MCP merge 정상 (`if .mcpServers[$name] == null then` 멱등)

**관찰**: 2.2 전체 시간 99s. 2회 setup 돌아서 긴 편이나 add-track 시나리오 본래 2단계라 정상.

## Phase 3 — `--update` on stale

시뮬: 오래된 버전 설치 재현 (예전 파일 + settings.json 참조 주입) → `--update`로 자동 cleanup 검증.

| 대상 | Before | After |
|------|:-:|:-:|
| Stale rules (ecc-security/seo/model-routing/ecc-performance) | 4 | **0** |
| Stale hooks (uncommitted-check/codebase-map) | 2 | **0** |
| settings.json stale hook refs | 2 | **0** |

출력 예시:
```
✓ .claude/rules: 4 orphan(s) pruned — ecc-performance-common.md ecc-security-common.md model-routing.md seo.md
✓ .claude/hooks: 2 orphan(s) pruned — codebase-map.sh uncommitted-check.sh
✓ settings.json: stale hook ref 제거 — codebase-map.sh
✓ settings.json: stale hook ref 제거 — uncommitted-check.sh
```

**Verdict**: ✅ A + B 완전 동작.

## Phase 4 — Error Paths

| 시나리오 | Exit | 메시지 | 판정 |
|---------|:-:|------|:-:|
| `--track bogus-track` | 1 | `ERROR: Unknown track 'bogus-track'. Valid: csr-supabase csr-fastify csr-fastapi ssr-htmx ssr-nextjs data executive tooling full` | ✅ 명확 |
| `--project-dir ~/.claude` | 1 | `ERROR: --project-dir은 글로벌 ~/.claude/ 영역으로 설정할 수 없음 (D16)` | ✅ 명확 |
| `--update` without `.claude/` | 1 | `✗ .claude/ 디렉토리가 없음. --update는 기존 설치 위에서만 동작한다.` | ✅ 명확 |
| `--project-dir /etc` | 1 | `ERROR: --project-dir은 시스템 디렉토리로 설정할 수 없음` | ✅ 명확 |

## Phase 5 — Workflow Gate + Protect-Files

| # | 시나리오 | Exit | Blocker 메시지 | 판정 |
|---|---------|:-:|---|:-:|
| W1 | /uzys:spec (첫 게이트) | 0 | - | ✅ |
| W2 | /uzys:plan (define=false) | 2 | `BLOCKED: Define 단계가 완료되지 않았습니다. /uzys:spec을 먼저 실행하세요. (docs/SPEC.md 필요)` | ✅ |
| W3 | /uzys:plan (define=true) | 0 | - | ✅ |
| W4 | /uzys:build (plan=false) | 2 | `BLOCKED: Plan 단계가 완료되지 않았습니다. /uzys:plan을 먼저 실행하세요. (docs/todo.md 필요)` | ✅ |
| W5 | /uzys:ship (모든 게이트 완료) | 0 | - | ✅ |
| W6 | `.env` 수정 시도 | 2 | `BLOCKED: Protected file: .env. Environment files must be edited manually.` | ✅ |

---

## 발견 이슈

### MEDIUM

**M1. executive Track 설치 후 uzys commands 0개 — 사용자 혼동 여지**
- 현상: `Commands uzys: 0` 표시. 실제 보고표는 executive 분기 처리로 Expected 0 vs Found 0 → ✅ 표시.
- 개선안: executive Track Installation Report에 "Commands uzys: (executive 미적용)" 같은 명시 문구 추가

**M2. `--add-track` 99s (tooling+ssr-nextjs 순차 설치)**
- 현상: 2회 setup 돌아 네트워크 호출 중복. 불가피.
- 개선안: 문서에 "add-track은 2회 네트워크 호출 발생" 안내

### LOW

- 없음.

---

## Verdict

**CLI 하네스 전반적 동작 견고**. CRITICAL/HIGH 이슈 없음. MEDIUM 2건은 설계 의도 또는 불가피. 사용자가 CLI 경로를 밟을 때 에러 메시지/게이트/cleanup 동작 모두 예상대로.

**강점**:
- Fresh install 3종 모두 ❌ 0 (이번 세션 v26.14.1 드리프트 수정 후)
- Multi-track union + add-track 멱등성 확인
- --update A(orphan) + B(stale hook) 실전 동작 검증
- 4종 에러 패스 명확한 메시지 + exit 1
- 6단계 게이트 + 파일 보호 훅 정상

**개선 여지** (선택):
- M1 executive 보고 문구 (작은 UX)

## Commands used

| Phase | 명령 |
|-------|------|
| 1 | `bash setup-harness.sh --track <t> --project-dir .` |
| 2.1 | `bash setup-harness.sh --track tooling --track csr-fastapi --project-dir .` |
| 2.2 | `bash setup-harness.sh --track tooling --project-dir .` 후 `--add-track ssr-nextjs` |
| 3 | stale 파일 주입 → `bash setup-harness.sh --update --project-dir .` |
| 4 | `--track bogus-track`, `--project-dir ~/.claude`, `--update` on empty, `--project-dir /etc` |
| 5 | `echo '{"tool_input":{"skill":"<s>"}}' \| bash .claude/hooks/gate-check.sh` |
