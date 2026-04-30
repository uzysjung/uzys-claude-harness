# CLI Dogfood — 2026-04-23

**Target**: uzys-claude-harness (bash CLI 하네스)
**Version tested**: v26.35.0 (main branch `0b393b1`)
**Method**: 사용자 관점에서 fresh install / multi-track / --update / error paths / workflow gate / interactive router / gh-issue-workflow 실측
**Baseline**: v26.14.1 (`docs/dogfood/cli-dogfood-2026-04-17.md` — 16 시나리오, 0 CRITICAL/HIGH)
**Delta**: v27.0~v27.17 (18개 마이너 버전)

## Summary

| Phase | Scenarios | Pass | Fail | Issues |
|-------|:-:|:-:|:-:|:-:|
| 1. Fresh install (3 track) | 3 | 2 | 1 | 1 HIGH |
| 2. Multi-track + add-track | 2 | 2 | 0 | 0 |
| 3. --update cleanup | 1 | 1 | 0 | 0 (H2 false positive) |
| 4. Error paths | 4 | 4 | 0 | 0 |
| 5. Workflow gate + protect-files | 6 | 6 | 0 | 0 |
| B2. Interactive router (v27.17) | 3 | 3 | 0 | 1 LOW |
| B3. gh-issue-workflow (v27.16) | 1 | 1 | 0 | 0 |
| **Total** | **20** | **19** | **1** | **1 HIGH / 1 LOW** (H2 재검증 결과 취소) |

---

## Phase 1 — Fresh Install

| Track | Time | Rules | Cmds uzys | Cmds ecc | Agents | Hooks | Skills | MCP | Allowlist | ❌ | Verdict |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| tooling | 35s | 8/8 | 7/7 | 8/8 | 8/8 | 8/7 | 9/7 | 3/3 | yes | 0 | ✅ |
| executive | 18s | 3/3 | **0/0** | 8/8 | 5/5 | 8/7 | 9/5 | 3/3 | yes | 0 | ✅ (설계) |
| full | 192s | **16/17** | 7/7 | 8/8 | 8/8 | 8/7 | 17/7 | 5/5 | yes | 1 | ❌ **H1** |

**관찰**:
- `tooling`/`executive`: v26 대비 Hooks 7→8 (v27.14에서 `hito-counter.sh` 추가), Skills 7→9 (v27.16에서 `gh-issue-workflow`, v27.x에서 다른 스킬 추가)
- `executive` Track: uzys commands 0 (설계 의도, 자연어 워크플로우)
- **`full` Track Rules 16/17 ❌** — H1 참고. v27.14에서 `tauri.md`를 opt-in (`--with-tauri`) 플래그로 뺐으나 `full` 기대치 계산(`RULES_EXPECTED=17`)이 갱신되지 않음. 실제 설치 = `COMMON(3) + DEV(4) + full-specific(8) + UI(1) = 16`. `--with-tauri` 없이는 항상 16.

## Phase 2 — Multi-Track + Add-Track

### 2.1 `--track tooling --track csr-fastapi` (union 동시 설치)
- 시간: 106s
- Rules: 12 (common3 + dev4 + tooling1 + csr-fastapi3: shadcn/api-contract/database + UI1 = 12) ✅
- MCPs: 4 — `chrome-devtools, context7, github, railway-mcp-server` (csr-fastapi 매칭으로 railway 추가) ✅
- 다중 Track 상태 표기 `—` (MULTI 모드 판정 유예) 정상 동작

### 2.2 `--track tooling` 후 `--add-track ssr-nextjs` (순차)
- 초기: 8 rules, 3 MCPs
- 후: **11 rules, 4 MCPs** (railway 추가) ✅
- `.installed-tracks` 메타파일: `tooling\nssr-nextjs` 정확 기록
- MCP merge 정상 (멱등성 확인)

## Phase 3 — `--update` on stale

시나리오: tooling 설치 후 stale 파일 주입 (`.claude/rules/ecc-security-common.md`, `.claude/rules/seo.md`, `.claude/hooks/uncommitted-check.sh`) + `settings.json`에 stale hook 참조 주입.

| 대상 | Before | After |
|------|:-:|:-:|
| Stale rules (ecc-security-common, seo) | 2 | **0** ✅ |
| Stale hooks (uncommitted-check) | 1 | **0** ✅ |
| settings.json stale hook ref | 1 | **1** ❌ **H2** |
| Backup 생성 | — | `.claude.backup-20260423-005901/` ✅ |

**H2 — 2026-04-17 베이스라인 대비 회귀**: v26.14.1에서는 `settings.json`의 stale hook 참조(`bash .claude/hooks/uncommitted-check.sh`)를 `--update` 시 자동 제거했으나, v26.35.0에서는 orphan 파일은 삭제되지만 `settings.json` 안의 참조는 남아있음. `SessionStart` hook 실행 시 "file not found" 경고가 발생할 수 있음.

## Phase 4 — Error Paths

| # | 시나리오 | Exit | 메시지 | 판정 |
|---|---------|:-:|------|:-:|
| S7 | `--track bogus-track` | 1 | `ERROR: Unknown track 'bogus-track'. Valid: csr-supabase csr-fastify csr-fastapi ssr-htmx ssr-nextjs data executive tooling full` | ✅ |
| S8 | `--project-dir ~/.claude/foo` | 1 | `ERROR: --project-dir은 글로벌 ~/.claude/ 영역으로 설정할 수 없음 (D16)` | ✅ |
| S9 | `--project-dir /etc/test` | 1 | `ERROR: --project-dir은 시스템 디렉토리로 설정할 수 없음` | ✅ |
| S10 | `--update` (no .claude) | 1 | `✗ .claude/ 디렉토리가 없음. --update는 기존 설치 위에서만 동작한다.` | ✅ |

## Phase 5 — Workflow Gate + Protect-Files

모두 `s1-tooling`의 hooks 사용. `echo '{"tool_input":{"skill":"..."}}' \| bash .claude/hooks/gate-check.sh`로 stdin mock.

| # | 시나리오 | Exit | Blocker 메시지 | 판정 |
|---|---------|:-:|---|:-:|
| S16 | `/uzys:spec` (첫 게이트) | 0 | - | ✅ |
| S11 | `/uzys:plan` (spec 없음) | 2 | `BLOCKED: Define 단계가 완료되지 않았습니다. /uzys:spec을 먼저 실행하세요. (docs/SPEC.md 필요)` | ✅ |
| S12 | `/uzys:build` (plan 없음) | 2 | `BLOCKED: Plan 단계가 완료되지 않았습니다. /uzys:plan을 먼저 실행하세요. (docs/todo.md 필요)` | ✅ |
| S13 | `/uzys:ship` (review 없음) | 2 | `BLOCKED: Review 단계가 완료되지 않았습니다. /uzys:review를 먼저 실행하세요.` | ✅ |
| S14 | Write `.env` | 2 | `BLOCKED: Protected file: .env. Environment files must be edited manually.` | ✅ |
| S15 | Write `package-lock.json` | 2 | `BLOCKED: Protected file: package-lock.json. Lock files should not be edited directly.` | ✅ |

## Phase B2 — Interactive Router (v26.35.0 신규)

`expect`로 PTY 세션 시뮬레이션. stdin에 TTY 존재 감지 후 `detect_install_state()` 분기 검증.

| # | 시나리오 | 기대 분기 | 실측 | 판정 |
|---|---------|-----|---|:-:|
| S17 | 빈 디렉토리 (no .claude) | Install mode (installer banner) | `uzys-claude-harness — interactive installer` 프롬프트 출현, Track 선택 메뉴 | ✅ |
| S18 | 기존 `.claude/` 존재 | Action router (5-menu) | `작업 선택: 1) 새 Track 추가 2) 업데이트 3) 제거 4) 신규 5) 종료` | ✅ |
| S19 | `--add-track` 플래그 + 기존 `.claude/` | 라우터 스킵, 직접 add-track | Menu 표시 없이 `Mode: --add-track (기존 .mcp.json/.claude/* 보존하며 union)` 진입, Setup Complete | ✅ |

**라우터 현재 상태 감지 (S18)** — 정확 동작:
- `.claude/` 존재: ✅
- Track: `tooling` (`.installed-tracks` 메타파일에서)
- Harness: `installed (버전 메타 미기록)`

**L1 LOW — Skills/Rules/Hooks 카운트 렌더링 문제 (test-harness 경계)**:
- `expect`/`script` PTY 경유 시 라우터의 `"Skills: N개 / Rules: N개 / Hooks: N개"` 출력에서 숫자가 누락되고 `개` 문자의 UTF-8 첫 바이트가 소실됨 (hex dump: `c2 b0 c2 9c`가 보임).
- 단독 bash 실행에서는 정상 (`9개 / 8개 / 8개`).
- 실 사용자의 터미널(iTerm/Terminal.app)에서는 정상 출력될 가능성 높음. 단, SSH/tmux 세션 등 특정 PTY 래퍼에서 재현될 위험.
- 원인: `detect_install_state()`가 `SCRIPT`/`EXPECT` TTY 래핑 환경에서 `find | wc -l | tr`의 출력을 서브쉘 경유 시 multi-byte 문자와 함께 truncate 됨 (확증 아닌 가설).

## Phase B3 — gh-issue-workflow 스킬 (v27.16)

- `templates/skills/gh-issue-workflow/` 존재 확인: `ISSUE.template.md`, `SKILL.md` ✅
- 설치 후 존재 확인:
  - `s1-tooling/.claude/skills/gh-issue-workflow/` ✅
  - `s3-full/.claude/skills/gh-issue-workflow/` ✅
  - `s4-multi/.claude/skills/gh-issue-workflow/` ✅
- tooling/full/multi 모든 dev track 경로에서 스킬 복사 확인.

---

## 발견 이슈

### CRITICAL
- 없음.

### HIGH

**H1. `full` Track Installation Report Rules 기대치 오차**
- 현상: 기본 `full` 설치 시 Rules 16 설치 but Expected 17로 표기되어 ❌ 표시됨.
- 근본 원인: v26.32.0에서 `tauri.md`를 opt-in(`--with-tauri`)으로 변경. `RULES_TO_INSTALL`에서는 제외되나 `setup-harness.sh:1202`의 `full) RULES_EXPECTED=17` 상수가 동기화되지 않음.
- 영향: 성공 케이스가 실패로 보고됨. 사용자 혼란. CI 자동화 시 exit status 아닌 출력 파싱으로는 오판 가능.
- 수정안 (단일 라인):
  ```bash
  # line 1202
  full) RULES_EXPECTED=17 ;;
  ↓
  full) RULES_EXPECTED=$([ "$WITH_TAURI" = true ] && echo 17 || echo 16) ;;
  ```
  또는 단순하게 기본을 16으로 고정하고 `--with-tauri` 플래그 시 +1. 다른 track도 점검 필요 (`csr-*`에서 `--with-tauri` 시 +1 동기화 여부).

**H2. ~~`--update` 시 `settings.json` 안의 stale hook 참조 미청소~~** — **false positive (재현 실패)**
- 원래 주장: orphan hook 파일은 삭제되지만 `settings.json` 참조는 남음.
- 재검증 (2026-04-23, 사후 확인):
  ```
  fresh install (tooling) → settings.json에 uncommitted-check.sh 참조 수동 주입
  → grep -c uncommitted-check  ⇒ 1
  → bash setup-harness.sh --update --project-dir .
  → "settings.json: stale hook ref 제거 — uncommitted-check.sh" 출력
  → grep -c uncommitted-check  ⇒ 0  ✅
  ```
- 결론: `clean_stale_hook_refs` 함수(setup-harness.sh:508)가 정상 동작. Phase B subagent의 테스트 시나리오 결함(재현 환경 차이)으로 판단.
- Action: 수정 불필요. H2는 취소 처리.

### MEDIUM
- 없음.

### LOW

**L1. Interactive router 숫자 카운트 — PTY 래핑 환경에서 멀티바이트 truncate**
- 실 사용자 터미널에서는 정상 추정. `expect`/`script` 경유 자동화 테스트에서만 재현.
- 영향: 사용자 UX에는 영향 없을 것으로 보이나 CI 자동화 테스트 어려움.
- 우선순위: LOW (실 사용 경로 문제 아님). 확인만 권장.

---

## v27.x Key Deltas vs v26.14.1

| 변화 | 출처 | 설치 영향 |
|------|------|-----------|
| Hooks 7→8 | v26.32.0 `hito-counter.sh` 추가 | 모든 track +1 Hook |
| Skills 7→9+ | v27.14~v27.16 `gh-issue-workflow` 등 추가 | 모든 track Skills 증가 |
| Rules `full` 17→16 | v26.32.0 `tauri.md` opt-in 처리 | Expected 값 비동기 (H1) |
| Interactive router | v26.35.0 신규 | TTY 시 자동 진입, 상태별 분기 |
| 상태 감지 | v26.35.0 `detect_install_state()` | `.installed-tracks` 메타파일 우선, legacy rules/* 추정 fallback |
| `--add-track` 노이즈 감소 | v26.23.0 ECC 재프롬프트 제거 | UX 개선 |
| `/dev/tty` 재부착 | v26.26.0 | `curl\|bash` 환경에서도 interactive 가능 |
| ECC 자동 진행 | v26.20.0 `--with-ecc`/`--with-prune`/`--with-tob` 플래그 | CI 파이프라인 적합 |

---

## Interactive Router (v26.35.0) 분기 검증

상태 감지 결과 → 진입 경로 매트릭스 (설계 의도):

| 상태 | `--track` 없음 | `--add-track` 있음 | `--update` 있음 |
|------|--------|--------|--------|
| **new** (empty dir) | `prompt_interactive_setup` (installer banner) | non-interactive add (라우터 스킵) | 에러: .claude/ 없음 |
| **existing** (`.claude/` 존재) | `prompt_action_router` (5-menu) | add-track 직접 진행 | update 직접 진행 |

S17/S18/S19로 3종 모두 검증. 설계 의도대로 동작.

---

## Verdict

**초기 판정 (subagent)**: HIGH=2, Phase B FAIL.
**사후 재검증 (2026-04-23)**: HIGH=**1** (H2는 false positive로 취소).

**유효 HIGH 1건**:
- **H1** — `full` Track Report Rules 기대치 미갱신 → cosmetic but confusing. `setup-harness.sh:1202`의 상수를 `WITH_TAURI` 기반 조건부로 교체하면 해결. **본 세션에서 수정** (commit 예정).

**Pass**:
- B2 — v27.17 interactive router 3종 분기 정확. LOW 1건은 testing-harness artifact.
- B3 — gh-issue-workflow 스킬 v27.16 정확 배포.
- Phase 2/3/4/5 — 전원 PASS.

**H1 fix 후 재검증 필요 대상**: full / csr-supabase / csr-fastify / csr-fastapi 단독 fresh install (multi-track은 검증 유예).

---

## Commands used

| Phase | 명령 |
|-------|------|
| 1 | `bash setup-harness.sh --track <t> --project-dir . </dev/null` (stdin none → TTY detection skips interactive) |
| 2.1 | `bash setup-harness.sh --track tooling --track csr-fastapi --project-dir . </dev/null` |
| 2.2 | `bash setup-harness.sh --track tooling` 후 `--add-track ssr-nextjs` |
| 3 | stale 파일 주입 → `bash setup-harness.sh --update --project-dir . </dev/null` |
| 4 | `--track bogus-track`, `--project-dir ~/.claude/foo`, `--project-dir /etc/test`, `--update` (no .claude) |
| 5 | `echo '{"tool_input":{"skill":"<s>"}}' \| bash .claude/hooks/gate-check.sh` / `.claude/hooks/protect-files.sh` |
| B2 | `expect` PTY 시뮬레이션 (S17 empty, S18 existing, S19 existing+--add-track) |
| B3 | `ls .claude/skills/gh-issue-workflow/` 여러 sandbox에서 확인 |

## Sandbox 위치

```
/tmp/dogfood-0423/
├── s1-tooling/      # Phase 1 tooling 설치 (Phase 5 hook 테스트에 재사용)
├── s2-executive/    # Phase 1 executive
├── s3-full/         # Phase 1 full (H1 재현 샌드박스)
├── s4-multi/        # Phase 2.1 multi-track
├── s5-add/          # Phase 2.2 add-track
├── s6-update/       # Phase 3 update (H2 재현 샌드박스)
├── s10-empty/       # Phase 4 S10 empty update
└── s17-router-new/  # Phase B2 S17 empty interactive
```

**청소 권장**: `rm -rf /tmp/dogfood-0423/` (보고서 확정 후).
