# Todo: Phase 4 체크리스트

> **Linked plan**: `docs/plan.md`
> **Linked SPEC**: `docs/SPEC.md`

---

## Phase 1: Deterministic Gate Update

- [ ] **P1.1** `templates/hooks/gate-update.sh` 작성
  - [ ] PostToolUse stdin 파싱 (tool_name, tool_input.skill, tool_output)
  - [ ] skill 이름 → gate 매핑 함수
  - [ ] gate-status.json 업데이트 로직 (jq + bash 폴백)
  - [ ] 에러 케이스 silent pass
  - [ ] chmod +x
- [ ] **P1.2** `setup-harness.sh` 수정
  - [ ] settings.local.json 생성 시 PostToolUse matcher="Skill"에 gate-update.sh 등록
  - [ ] safe_copy로 gate-update.sh 복사 추가
- [ ] **P1.3** 6개 uzys 커맨드에서 "Gate Status Update" 섹션 제거
  - [ ] spec.md
  - [ ] plan.md
  - [ ] build.md
  - [ ] test.md
  - [ ] review.md
  - [ ] ship.md
- [ ] **P1.4** 검증
  - [ ] 모의 stdin으로 uzys:spec 성공 이벤트 → define=true 확인
  - [ ] 모의 stdin으로 uzys:build 성공 이벤트 → build=true 확인
  - [ ] 에러 이벤트 (tool_output에 error) → gate 미변경 확인

---

## Phase 2: UX Improvements

- [ ] **P2.1** uzys 커맨드 순서 표시
  - [ ] spec.md frontmatter: `description: "(1) Define phase — ..."`
  - [ ] plan.md frontmatter: `description: "(2) Plan phase — ..."`
  - [ ] build.md frontmatter: `description: "(3) Build phase — ..."`
  - [ ] test.md frontmatter: `description: "(4) Verify phase — ..."`
  - [ ] review.md frontmatter: `description: "(5) Review phase — ..."`
  - [ ] ship.md frontmatter: `description: "(6) Ship phase — ..."`
- [ ] **P2.2** `/ecc:self-test` 신규
  - [ ] `templates/commands/ecc/self-test.md` 작성
  - [ ] rules/commands/agents/hooks/skills 개수 리포트
  - [ ] gate-status.json 현재 상태 리포트
  - [ ] 검증: 실행 후 출력 구조 확인

---

## Phase 3: Documentation Sync

- [ ] **P3.1** USAGE.md --project-only 사용 가이드
  - [ ] 케이스 1: 메타 프로젝트 (이 repo)
  - [ ] 케이스 2: 글로벌 미수정 테스트 설치
  - [ ] 케이스 3: CI/CD 임시 설치
- [ ] **P3.2** cli-development.md bash 3.2 호환 섹션
  - [ ] declare -A 금지 명시
  - [ ] case statement 대안
  - [ ] TRACK_EXTRA_RULES 버그 사례
- [ ] **P3.3** ship-checklist.md 의존성 감사 강화
  - [ ] `npm audit` (Node.js)
  - [ ] `pip audit` (Python)
  - [ ] CRITICAL/HIGH 0건 조건
- [ ] **P3.4** PRD.md 반영
  - [ ] Section 7.2: Phase 4 추가
  - [ ] Section 12.2: D16 (gate update 자동화)
  - [ ] Section 12: Audit Log (M1-M6, W1-W3)
  - [ ] Section 11 Status Tracker: Phase 4 In Progress

---

## Self-dogfood 재적용

- [ ] setup-harness.sh 재실행 (--track tooling --project-only)
- [ ] `.claude/hooks/gate-update.sh` 존재 확인
- [ ] `.claude/settings.local.json`에 PostToolUse gate-update 등록 확인
- [ ] 실제 /uzys:test 또는 다음 커맨드 실행 시 gate-status.json 자동 업데이트 확인

---

## 완료 조건

- [ ] 모든 Phase 1-3 체크박스 완료
- [ ] 전체 변경사항 커밋 (Phase별 분리 가능)
- [ ] git push
- [ ] v26.1.0 태그 생성 (승인 후)
- [ ] /uzys:test → /uzys:review → /uzys:ship 진행 가능
