# Plan: Phase 4b 실행

> **Linked SPEC**: `Docs/SPEC.md`
> **Created**: 2026-04-14
> **Status**: Plan
> **Predecessor**: D16 (templates/global/ 폐기), D17 (Decision Meta-Rule) 완료됨

---

## Sprint Contract

### 범위 (In Scope)

**제거 (남은 8개 파일 + 2개 글로벌 MCP 호출)**
- `templates/rules/commit-policy.md`
- `templates/rules/ecc-testing.md`
- `templates/commands/ecc/projects.md`
- `templates/skills/continuous-learning-v2/agents/{observer.md, observer-loop.sh, session-guardian.sh, start-observer.sh}`
- `templates/skills/continuous-learning-v2/scripts/test_parse_instinct.py`
- `setup-harness.sh`의 `claude mcp add railway-mcp-server`
- `setup-harness.sh`의 `claude mcp add supabase`

**추가 (7개 공통 도구)**
- `templates/skills/deep-research/` (ECC cherry-pick)
- `templates/skills/market-research/` (ECC cherry-pick, executive 한정)
- find-skills (vercel-labs, npx skills add)
- agent-browser (vercel-labs, npm -g)
- playwright (UI 한정 → 공통 이동)
- chrome-devtools (.mcp.json)
- claude-powerline (.claude/settings.json statusLine)

**신규 인프라 (4개)**
- `templates/mcp.json` (Track별 조합 템플릿)
- `templates/settings.json` (statusLine + hooks via $CLAUDE_PROJECT_DIR)
- `.dev-references/cherrypicks.lock` (모든 cherry-pick 매니페스트)
- `sync-cherrypicks.sh` (동기화 스크립트)

**setup-harness.sh 변경**
- `.mcp.json` 생성 단계 추가
- `.claude/settings.json` 생성 ($CLAUDE_PROJECT_DIR 사용, 절대 경로 제거)
- 공통 도구 설치 (find-skills, agent-browser, playwright 이동)
- 글로벌 `claude mcp add` 2개 제거

### 제외 (Out of Scope)

- F1-F5 (향후): Tauri iOS/AOS, npm/pip audit 자동, 토큰 모니터링, KB repo, config 외부화
- 자동 sync (CI/cron)
- harness-audit, eval-harness (Phase 5+)
- **`~/.claude/` 일체 수정** (구조적 차단됨)

### 완료 기준

1. 8개 파일 제거 + 2개 글로벌 mcp add 호출 제거 검증
2. 7개 공통 도구가 모든 dev Track에 설치됨 검증
3. 신규 4개 인프라 파일 작성 + 동기화 스크립트 동작
4. setup-harness.sh self-dogfood 통과 (글로벌 미수정 자동 검증 포함)
5. README/USAGE/PRD/CLAUDE.md 동기화
6. 전체 커밋 + 푸시 + v26.2.0 태그

### 제약 조건

- bash 3.2 호환 유지 (case statement, jq + bash 폴백)
- safe_copy 패턴 유지
- 매니페스트와 실제 파일 일관성
- 글로벌 미수정 (자동 검증 포함)

---

## Phase 분해

### Phase A: Foundation (병렬 가능)

**목표**: 인프라 4개 + cherry-pick 2개 추가.

- **A1** `.dev-references/cherrypicks.lock` 매니페스트 작성
  - 모든 cherry-pick (CL-v2, strategic-compact, code-reviewer, security-reviewer, ecc-git-workflow, deep-research, market-research) 등록
  - source repo, commit SHA, src_path, dst_path, src_hash, modified flag
- **A2** `sync-cherrypicks.sh` 작성
  - 매니페스트 읽기 → 각 source repo pull → 변경 감지 → diff/auto-update/conflict 처리
  - bash 3.2 호환
- **A3** ECC `deep-research` 스킬 cherry-pick
  - `.dev-references/ecc/.agents/skills/deep-research/SKILL.md` → `templates/skills/deep-research/SKILL.md`
- **A4** ECC `market-research` 스킬 cherry-pick (executive 한정)
  - `.dev-references/ecc/.agents/skills/market-research/SKILL.md` → `templates/skills/market-research/SKILL.md`
- **A5** `templates/mcp.json` 작성
  - 공통: chrome-devtools, context7, github
  - Track별 조건부는 setup-harness.sh가 동적 추가
- **A6** `templates/settings.json` 작성
  - statusLine: claude-powerline
  - hooks: $CLAUDE_PROJECT_DIR (절대 경로 제거)
  - committable

**Acceptance**:
- [ ] cherrypicks.lock에 7+ 항목 등재
- [ ] sync-cherrypicks.sh 모의 실행 동작
- [ ] templates/skills/deep-research/SKILL.md 존재
- [ ] templates/skills/market-research/SKILL.md 존재
- [ ] templates/mcp.json 유효 JSON
- [ ] templates/settings.json에 $CLAUDE_PROJECT_DIR 사용

---

### Phase B: Removal (Phase A와 병렬 가능)

**목표**: 불필요 8개 파일 제거.

- **B1** `templates/rules/commit-policy.md` 제거
- **B2** `templates/rules/ecc-testing.md` 제거
- **B3** `templates/commands/ecc/projects.md` 제거
- **B4** `templates/skills/continuous-learning-v2/agents/` 디렉토리 제거 (4 파일)
- **B5** `templates/skills/continuous-learning-v2/scripts/test_parse_instinct.py` 제거

**Acceptance**:
- [ ] 8개 파일 모두 미존재
- [ ] CL-v2 핵심 동작 유지 (observe.sh, instinct-cli.py)

---

### Phase C: setup-harness.sh 대수술 (Phase A 이후)

**목표**: 설치 흐름 재구성.

- **C1** 글로벌 `claude mcp add` 2개 제거 (railway, supabase)
- **C2** `.mcp.json` 생성 단계 추가 (Track별 조립, jq 사용)
- **C3** `.claude/settings.json` 생성 (settings.local.json 대체, $CLAUDE_PROJECT_DIR)
- **C4** DEV_RULES에서 `commit-policy ecc-testing` 제거
- **C5** 공통 도구 설치 추가 (find-skills, agent-browser, playwright 이동)
- **C6** ECC cherry-pick 추가 (deep-research → 전체, market-research → executive)

**Acceptance**:
- [ ] `grep "claude mcp add" setup-harness.sh` 결과 0건
- [ ] 빈 디렉토리에서 setup-harness.sh 실행 시 .mcp.json 생성
- [ ] .claude/settings.json에 $CLAUDE_PROJECT_DIR 사용 (절대 경로 없음)
- [ ] DEV_RULES 출력에 commit-policy/ecc-testing 미포함

---

### Phase D: Documentation (E 이후)

**목표**: 문서 동기화.

- **D1** README.md — Architecture, Common tools, Cherry-pick sync 섹션
- **D2** USAGE.md — Common tools 시나리오, .mcp.json/settings.json 설명
- **D3** PRD.md — D18-D20 추가, Phase 4b Complete
- **D4** CONTRIBUTING.md (또는 README) — sync 절차
- **D5** project-claude 9종 — Rules 목록에서 commit-policy/ecc-testing 제거

---

### Phase E: Self-dogfood (B+C 이후)

**목표**: 변경 반영 + 자동 검증.

- **E1** `.claude/rules/`, `.claude/commands/` 일부 정리
- **E2** setup-harness.sh 재실행 (`--track tooling`)
- **E3** 자동 검증
  - 글로벌 미수정 (mtime)
  - 8개 제거 확인
  - 7개 추가 확인
  - .mcp.json, .claude/settings.json 존재
  - cherrypicks.lock 매니페스트 정합성
- **E4** 모의 hook 테스트 (gate-check, protect-files, $CLAUDE_PROJECT_DIR 해석)

---

### Phase F: Commit + Tag

- **F1** 전체 변경 git add
- **F2** Phase별 분할 커밋 권장 (A/B → C → E → D → F)
- **F3** push
- **F4** v26.2.0 태그

---

## 의존성 그래프

```
Phase A (Foundation) ──┐
                       ├──► Phase C (setup-harness)
Phase B (Removal)    ──┘         │
                                 ▼
                          Phase E (Self-dogfood)
                                 │
                                 ▼
                          Phase D (Documentation)
                                 │
                                 ▼
                          Phase F (Commit + Tag)
```

A, B 병렬 가능. C는 A 이후. E는 B+C 이후. D는 E 이후 (실제 상태 반영). F는 마지막.

---

## 리스크 & 완화

| 리스크 | 완화 |
|--------|------|
| `$CLAUDE_PROJECT_DIR`가 hook에서 미동작 | 모의 테스트 + 안 되면 절대 경로 폴백 |
| .mcp.json 형식 오류 → MCP 안 뜸 | jq로 검증 후 작성 |
| sync-cherrypicks.sh가 ECC 디렉토리 변경 추적 못 함 | 매니페스트에 path 절대 명시 |
| ECC market-research 위치(.agents/skills/) 차이 | 매니페스트에 src 경로 명시 |
| dogfood 재설치 시 .claude/CLAUDE.md 손실 | safe_copy로 보존 |

---

## 산출물

### 신규 (~7개)
- `templates/skills/deep-research/SKILL.md`
- `templates/skills/market-research/SKILL.md`
- `templates/mcp.json`
- `templates/settings.json`
- `.dev-references/cherrypicks.lock`
- `sync-cherrypicks.sh`
- `CONTRIBUTING.md` (또는 README sync 섹션)

### 수정 (~10개)
- `setup-harness.sh` (Phase C 대규모)
- `README.md`, `USAGE.md`, `Docs/dev/PRD.md`, `Docs/SPEC.md`
- `Docs/plan.md`, `Docs/todo.md`
- `templates/project-claude/*.md` 9종

### 삭제 (8개 파일 + 2개 호출)
- Phase B + Phase C-1 항목

---

## Done Criteria

- [ ] Phase A-F 전부 완료
- [ ] 글로벌 미수정 자동 검증 통과 (mtime 변화 0초)
- [ ] 매니페스트와 실제 파일 일관성
- [ ] v26.2.0 태그 푸시 완료
