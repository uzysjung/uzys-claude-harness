# Todo: Phase 4b 체크리스트

> **Linked plan**: `Docs/plan.md`
> **Linked SPEC**: `Docs/SPEC.md`

---

## Phase A: Foundation

- [x] **A1** `.dev-references/cherrypicks.lock` 작성
  - [x] sources: ecc, agent-skills, vercel-labs (commit SHA 포함)
  - [x] cherrypicks 7+ 항목 (CL-v2, strategic-compact, code-reviewer, security-reviewer, ecc-git-workflow, deep-research, market-research)
  - [x] 각 항목: src, dst, src_hash, modified flag
- [x] **A2** `sync-cherrypicks.sh` 작성
  - [x] 매니페스트 파싱
  - [x] 각 source repo pull
  - [x] hash 비교 + 변경 감지
  - [x] 무수정/수정 분기 처리
  - [x] bash 3.2 호환 + jq 폴백
  - [x] chmod +x
- [x] **A3** ECC deep-research cherry-pick
  - [x] `.dev-references/ecc/.agents/skills/deep-research/SKILL.md` 확인
  - [x] `templates/skills/deep-research/` 생성
  - [x] 매니페스트에 등재
- [x] **A4** ECC market-research cherry-pick
  - [x] `.dev-references/ecc/.agents/skills/market-research/SKILL.md` 확인
  - [x] `templates/skills/market-research/` 생성
  - [x] 매니페스트에 등재
- [x] **A5** `templates/mcp.json` 작성 (공통 항목)
- [x] **A6** `templates/settings.json` 작성 ($CLAUDE_PROJECT_DIR)

---

## Phase B: Removal

- [x] **B1** `git rm templates/rules/commit-policy.md`
- [x] **B2** `git rm templates/rules/ecc-testing.md`
- [x] **B3** `git rm templates/commands/ecc/projects.md`
- [x] **B4** `git rm -r templates/skills/continuous-learning-v2/agents/`
- [x] **B5** `git rm templates/skills/continuous-learning-v2/scripts/test_parse_instinct.py`
- [x] **B6** CL-v2 핵심 동작 확인 (observe.sh + instinct-cli.py + detect-project.sh)

---

## Phase C: setup-harness.sh 대수술

- [x] **C1** 글로벌 mcp add 제거
  - [x] line 311: railway-mcp-server 제거
  - [x] line 329: supabase 제거
  - [x] grep 검증: `grep "claude mcp add" setup-harness.sh` 결과 0
- [x] **C2** `.mcp.json` 생성 함수 추가
  - [x] 공통 항목 (chrome-devtools, context7, github)
  - [x] Track별 조건부 (railway, supabase)
  - [x] jq로 동적 조립
- [x] **C3** `.claude/settings.json` 생성 (settings.local.json 대체)
  - [x] statusLine: claude-powerline
  - [x] hooks: $CLAUDE_PROJECT_DIR 사용
  - [x] 절대 경로 grep 검증
- [x] **C4** DEV_RULES 수정
  - [x] commit-policy 제거
  - [x] ecc-testing 제거
- [x] **C5** 공통 도구 설치 단계 추가
  - [x] find-skills (vercel-labs)
  - [x] agent-browser (npm -g)
  - [x] playwright (UI Track 한정 → 공통 이동)
- [x] **C6** ECC cherry-pick 추가
  - [x] deep-research → 모든 dev/tooling
  - [x] market-research → executive

---

## Phase E: Self-dogfood

- [x] **E1** `.claude/rules/`, `.claude/commands/` 정리
- [x] **E2** setup-harness.sh 재실행 (`--track tooling`)
- [x] **E3** 자동 검증
  - [x] 글로벌 ~/.claude/CLAUDE.md mtime 미변경
  - [x] 8개 파일 미존재 확인
  - [x] deep-research, find-skills, agent-browser 설치 확인
  - [x] .mcp.json 생성 확인
  - [x] .claude/settings.json 생성 확인 ($CLAUDE_PROJECT_DIR 포함)
- [x] **E4** Hook 동작 테스트
  - [x] echo + bash로 gate-check.sh
  - [x] echo + bash로 protect-files.sh
  - [x] $CLAUDE_PROJECT_DIR 해석 검증

---

## Phase D: Documentation

- [ ] **D1** README.md — **부분 완료**
  - [ ] Architecture 다이어그램에 deep-research, market-research 추가 (미완료)
  - [ ] Common tools 섹션 신규 (미완료)
  - [ ] Cherry-pick sync 섹션 신규 (미완료)
- [ ] **D2** USAGE.md — **부분 완료**
  - [ ] Common tools 시나리오 (미완료)
  - [ ] .mcp.json/settings.json 설명 (미완료)
  - [ ] sync-cherrypicks.sh 사용법 (미완료)
- [x] **D3** PRD.md
  - [x] D18 (cherry-pick 매니페스트), D19 (settings.json 통합), D20 (.mcp.json 도입)
  - [x] Phase 4b Complete 마킹
- [ ] **D4** CONTRIBUTING.md (또는 README) sync 절차 — **미완료**
- [x] **D5** project-claude/*.md 9종 동기화
  - [x] commit-policy 제거
  - [x] ecc-testing 제거
  - [x] 공통 도구 언급

---

## Phase F: Commit + Tag

- [x] **F1** Phase별 분할 커밋
  - [x] Phase A: foundation 커밋
  - [x] Phase B: removal 커밋
  - [x] Phase C: setup-harness.sh 커밋
  - [x] Phase E: dogfood 결과 커밋
  - [x] Phase D: docs 커밋
- [x] **F2** git push
- [x] **F3** v26.2.0 태그 생성 + push

---

## 완료 조건

- [ ] 모든 Phase A-F 체크박스 완료 — **D1/D2/D4 미완료**
- [x] 글로벌 미수정 자동 검증 통과
- [x] 매니페스트와 실제 파일 일관
- [x] v26.2.0 푸시 완료
