# Todo: Phase 4b 체크리스트

> **Linked plan**: `Docs/plan.md`
> **Linked SPEC**: `Docs/SPEC.md`

---

## Phase A: Foundation

- [ ] **A1** `.dev-references/cherrypicks.lock` 작성
  - [ ] sources: ecc, agent-skills, vercel-labs (commit SHA 포함)
  - [ ] cherrypicks 7+ 항목 (CL-v2, strategic-compact, code-reviewer, security-reviewer, ecc-git-workflow, deep-research, market-research)
  - [ ] 각 항목: src, dst, src_hash, modified flag
- [ ] **A2** `sync-cherrypicks.sh` 작성
  - [ ] 매니페스트 파싱
  - [ ] 각 source repo pull
  - [ ] hash 비교 + 변경 감지
  - [ ] 무수정/수정 분기 처리
  - [ ] bash 3.2 호환 + jq 폴백
  - [ ] chmod +x
- [ ] **A3** ECC deep-research cherry-pick
  - [ ] `.dev-references/ecc/.agents/skills/deep-research/SKILL.md` 확인
  - [ ] `templates/skills/deep-research/` 생성
  - [ ] 매니페스트에 등재
- [ ] **A4** ECC market-research cherry-pick
  - [ ] `.dev-references/ecc/.agents/skills/market-research/SKILL.md` 확인
  - [ ] `templates/skills/market-research/` 생성
  - [ ] 매니페스트에 등재
- [ ] **A5** `templates/mcp.json` 작성 (공통 항목)
- [ ] **A6** `templates/settings.json` 작성 ($CLAUDE_PROJECT_DIR)

---

## Phase B: Removal

- [ ] **B1** `git rm templates/rules/commit-policy.md`
- [ ] **B2** `git rm templates/rules/ecc-testing.md`
- [ ] **B3** `git rm templates/commands/ecc/projects.md`
- [ ] **B4** `git rm -r templates/skills/continuous-learning-v2/agents/`
- [ ] **B5** `git rm templates/skills/continuous-learning-v2/scripts/test_parse_instinct.py`
- [ ] **B6** CL-v2 핵심 동작 확인 (observe.sh + instinct-cli.py + detect-project.sh)

---

## Phase C: setup-harness.sh 대수술

- [ ] **C1** 글로벌 mcp add 제거
  - [ ] line 311: railway-mcp-server 제거
  - [ ] line 329: supabase 제거
  - [ ] grep 검증: `grep "claude mcp add" setup-harness.sh` 결과 0
- [ ] **C2** `.mcp.json` 생성 함수 추가
  - [ ] 공통 항목 (chrome-devtools, context7, github)
  - [ ] Track별 조건부 (railway, supabase)
  - [ ] jq로 동적 조립
- [ ] **C3** `.claude/settings.json` 생성 (settings.local.json 대체)
  - [ ] statusLine: claude-powerline
  - [ ] hooks: $CLAUDE_PROJECT_DIR 사용
  - [ ] 절대 경로 grep 검증
- [ ] **C4** DEV_RULES 수정
  - [ ] commit-policy 제거
  - [ ] ecc-testing 제거
- [ ] **C5** 공통 도구 설치 단계 추가
  - [ ] find-skills (vercel-labs)
  - [ ] agent-browser (npm -g)
  - [ ] playwright (UI Track 한정 → 공통 이동)
- [ ] **C6** ECC cherry-pick 추가
  - [ ] deep-research → 모든 dev/tooling
  - [ ] market-research → executive

---

## Phase E: Self-dogfood

- [ ] **E1** `.claude/rules/`, `.claude/commands/` 정리
- [ ] **E2** setup-harness.sh 재실행 (`--track tooling`)
- [ ] **E3** 자동 검증
  - [ ] 글로벌 ~/.claude/CLAUDE.md mtime 미변경
  - [ ] 8개 파일 미존재 확인
  - [ ] deep-research, find-skills, agent-browser 설치 확인
  - [ ] .mcp.json 생성 확인
  - [ ] .claude/settings.json 생성 확인 ($CLAUDE_PROJECT_DIR 포함)
- [ ] **E4** Hook 동작 테스트
  - [ ] echo + bash로 gate-check.sh
  - [ ] echo + bash로 protect-files.sh
  - [ ] $CLAUDE_PROJECT_DIR 해석 검증

---

## Phase D: Documentation

- [ ] **D1** README.md
  - [ ] Architecture 다이어그램에 deep-research, market-research 추가
  - [ ] Common tools 섹션 신규
  - [ ] Cherry-pick sync 섹션 신규
- [ ] **D2** USAGE.md
  - [ ] Common tools 시나리오
  - [ ] .mcp.json/settings.json 설명
  - [ ] sync-cherrypicks.sh 사용법
- [ ] **D3** PRD.md
  - [ ] D18 (cherry-pick 매니페스트), D19 (settings.json 통합), D20 (.mcp.json 도입)
  - [ ] Phase 4b Complete 마킹
- [ ] **D4** CONTRIBUTING.md (또는 README) sync 절차
- [ ] **D5** project-claude/*.md 9종 동기화
  - [ ] commit-policy 제거
  - [ ] ecc-testing 제거
  - [ ] 공통 도구 언급

---

## Phase F: Commit + Tag

- [ ] **F1** Phase별 분할 커밋
  - [ ] Phase A: foundation 커밋
  - [ ] Phase B: removal 커밋
  - [ ] Phase C: setup-harness.sh 커밋
  - [ ] Phase E: dogfood 결과 커밋
  - [ ] Phase D: docs 커밋
- [ ] **F2** git push
- [ ] **F3** v26.2.0 태그 생성 + push

---

## 완료 조건

- [ ] 모든 Phase A-F 체크박스 완료
- [ ] 글로벌 미수정 자동 검증 통과
- [ ] 매니페스트와 실제 파일 일관
- [ ] v26.2.0 푸시 완료
