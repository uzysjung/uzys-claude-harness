# Plan: Phase 4 — 자체 점검 개선 실행

> **Linked SPEC**: `docs/SPEC.md`
> **Created**: 2026-04-14
> **Status**: Plan

---

## Sprint Contract

### 범위

**포함 (In Scope)**:
- T1: uzys: 커맨드 순서 번호 (1)~(6) 표시
- T2: gate-update.sh 신규 PostToolUse Hook — deterministic gate update
- T3: uzys: 커맨드에서 "Gate Status Update" 섹션 제거 (Hook으로 대체)
- T4: /ecc:self-test 커맨드 신규 — 설치된 하네스 검증
- T5: USAGE.md에 --project-only 사용 시점 가이드
- T6: cli-development.md에 bash 3.2 호환 노트
- T7: ship-checklist.md 의존성 감사 강화
- T8: PRD에 점검 결과(M1-M6, W1-W3) 추가 + D16 기록

**제외 (Out of Scope)**:
- F1: Tauri iOS/AOS 가이드
- F2: npm/pip audit 자동 실행 (CI 통합)
- F3: 토큰/비용 모니터링
- F4: knowledge-base 리포 구조
- F5: Track별 rule 외부 config 파일

### 완료 기준

1. 모든 T1-T8 acceptance criteria 충족
2. gate-update.sh 동작 검증 (모의 stdin 테스트)
3. PRD.md, SPEC.md, plan.md, todo.md 동기화
4. 변경 사항 전부 커밋 + 푸시
5. Self-audit 통과 (원칙 11)

### 제약 조건

- **bash 3.2 호환 유지** (macOS 기본)
- **safe_copy 패턴 유지** (기존 파일 보존)
- **DO NOT CHANGE 영역 준수**: 11 원칙 구조, ECC cherry-pick 8개, 9 Track, gate 차단 메커니즘
- **인간 게이트 통과** (Phase 간 임의 진행 금지)

---

## Phase 분해

작업을 3개 Phase로 분해. 각 Phase는 독립적으로 커밋 가능.

### Phase 1: Deterministic Gate Update (Critical Path)

**목표**: SPEC의 W1(gate update가 LLM 의존) 해결. LLM이 jq 명령을 빠뜨려도 게이트가 정확히 진행되도록.

**Scope**: T2 + T3

**Tasks**:

- **P1.1** `templates/hooks/gate-update.sh` 신규 작성
  - Input: PostToolUse stdin (tool_name=Skill, tool_input.skill=uzys:*, tool_output)
  - 로직: 
    1. skill 이름이 `uzys:*`인지 확인
    2. tool_output이 성공인지 확인 (error 없음)
    3. skill → gate 매핑 (spec→define, plan→plan, build→build, test→verify, review→review, ship→ship)
    4. `.claude/gate-status.json`에 `<gate>.completed=true` + timestamp 기록
  - bash 3.2 호환 (jq 우선, grep 폴백)
  - 실패 시 silent pass (exit 0)

- **P1.2** `setup-harness.sh`의 settings.local.json에 gate-update.sh 등록
  - PostToolUse matcher="Skill"에 추가
  - 기존 CL-v2 PostToolUse와 공존

- **P1.3** 6개 uzys: 커맨드에서 "Gate Status Update" 섹션 제거
  - 대체 주석: `> 게이트 상태는 PostToolUse Hook(gate-update.sh)이 자동 업데이트.`

- **P1.4** 검증: 모의 stdin으로 gate-update.sh 테스트
  - `/uzys:spec` 성공 이벤트 → define=true 확인
  - `/uzys:build` 성공 이벤트 → build=true 확인

**Acceptance Criteria**:
- [ ] gate-update.sh 파일 존재 및 executable
- [ ] settings.local.json의 PostToolUse에 gate-update.sh 등록
- [ ] 6개 uzys 파일에서 "Gate Status Update" 섹션 제거 완료
- [ ] 모의 stdin 테스트: uzys:spec → define.completed=true 자동 설정 확인
- [ ] 에러 케이스(tool_output에 error 포함)에 gate 업데이트 안 됨 확인

**Dependencies**: 없음 (독립 실행 가능)

---

### Phase 2: UX Improvements (Parallel)

**목표**: 사용자 요청(순서 표시) + self-test 유틸.

**Scope**: T1 + T4

**Tasks**:

- **P2.1** 6개 uzys: 커맨드에 YAML frontmatter 추가
  - spec.md: `description: "(1) Define phase — 구조화된 스펙 작성"`
  - plan.md: `description: "(2) Plan phase — 작업 분해 + Sprint Contract"`
  - build.md: `description: "(3) Build phase — TDD 점진 구현"`
  - test.md: `description: "(4) Verify phase — 테스트 + 커버리지"`
  - review.md: `description: "(5) Review phase — reviewer subagent (SOD)"`
  - ship.md: `description: "(6) Ship phase — 프리런치 + 배포"`

- **P2.2** `/ecc:self-test` 커맨드 신규
  - 파일: `templates/commands/ecc/self-test.md`
  - 로직:
    1. `.claude/rules/*.md` 개수
    2. `.claude/commands/uzys/*.md`, `.claude/commands/ecc/*.md` 개수
    3. `.claude/agents/*.md` 개수
    4. `.claude/hooks/*.sh` 개수
    5. `.claude/skills/` 하위 SKILL.md 개수
    6. `.claude/settings.local.json`의 hooks 수
    7. `.claude/gate-status.json` 현재 상태
    8. 예상 수량과 대조 (Track별 다름)
  - 출력: Markdown 표 형태

**Acceptance Criteria**:
- [ ] 6개 uzys 파일에 YAML frontmatter `description: "(N) ..."` 존재
- [ ] Claude Code skill listing에서 (1)~(6) 표시 확인
- [ ] `/ecc:self-test` 파일 존재 + 실행 시 구조 보고

**Dependencies**: Phase 1과 병렬 가능

---

### Phase 3: Documentation Sync (After 1+2)

**목표**: 모든 변경을 문서에 반영.

**Scope**: T5 + T6 + T7 + T8

**Tasks**:

- **P3.1** USAGE.md에 --project-only 사용 시점 섹션
  - 케이스 1: 메타 프로젝트(이 repo 같은 하네스 자체)
  - 케이스 2: 글로벌 ~/.claude를 건드리지 않는 테스트 설치
  - 케이스 3: CI/CD에서 임시 프로젝트 설치

- **P3.2** cli-development.md에 bash 3.2 호환 섹션 추가
  - "declare -A 금지" 명시
  - 대안: case statement 또는 함수로 매핑
  - 실제 버그 사례: TRACK_EXTRA_RULES

- **P3.3** ship-checklist.md 의존성 감사 강화
  - `npm audit` (Node.js 프로젝트)
  - `pip audit` (Python 프로젝트)
  - CRITICAL/HIGH 0건이 게이트 통과 조건

- **P3.4** PRD.md에 Phase 4 audit 반영
  - Section 7.2: Phase 4 (In Progress) 추가
  - Section 12 Decision Log: D16 (gate update Hook 자동화)
  - Section 12 새 섹션 12.4: Audit Log (M1-M6, W1-W3) 또는 D17로 요약
  - Status Tracker 업데이트

**Acceptance Criteria**:
- [ ] USAGE.md에 --project-only 3가지 사용 케이스 섹션 존재
- [ ] cli-development.md에 "bash 3.2 호환" 섹션 추가
- [ ] ship-checklist.md에 `npm audit`/`pip audit` 체크 항목 추가
- [ ] PRD.md Section 12에 D16 추가, Status Tracker Phase 4 반영

**Dependencies**: Phase 1, Phase 2 완료 후

---

## 의존성 그래프

```
Phase 1 (T2+T3) ─┐
                 ├──► Phase 3 (T5+T6+T7+T8) ──► 커밋 + 푸시
Phase 2 (T1+T4) ─┘
```

Phase 1, 2는 병렬. Phase 3는 1, 2 완료 후.

---

## 리스크 & 완화

| 리스크 | 완화 방안 |
|--------|---------|
| gate-update.sh가 tool_output 구조를 잘못 파싱 | 모의 stdin 테스트로 사전 검증 |
| PostToolUse Hook이 비동기(async: true)면 race condition | 동기 실행(async: false) 또는 기본값 사용 |
| Claude Code skill listing에서 frontmatter description 인식 실패 | 본문 첫 줄에도 순서 번호 중복 기재 (fallback) |
| 기존 .claude/gate-status.json 형식과 충돌 | 동일 스키마 유지 (define/plan/build/verify/review/ship) |
| self-test가 Track을 자동 판별 못함 | Track을 argument로 받거나 현재 track을 gate-status에 기록 |

---

## 예상 산출물

### 신규 파일 (3개)
- `templates/hooks/gate-update.sh`
- `templates/commands/ecc/self-test.md`

### 수정 파일 (~12개)
- `templates/commands/uzys/{spec,plan,build,test,review,ship}.md` — frontmatter 추가 + Gate Status Update 섹션 제거 (6)
- `setup-harness.sh` — settings.local.json PostToolUse 등록
- `templates/rules/cli-development.md` — bash 3.2 섹션
- `templates/rules/ship-checklist.md` — 의존성 감사
- `USAGE.md` — --project-only 가이드
- `Docs/dev/PRD.md` — Phase 4, D16, audit log

### 재설치 필요 (self-dogfood)
- 이 프로젝트의 `.claude/` 재설치 (변경 반영)

---

## Done Criteria (Phase 4 Complete)

- [ ] Phase 1 완료: gate-update.sh + 검증 통과
- [ ] Phase 2 완료: uzys 순서 표시 + self-test 동작
- [ ] Phase 3 완료: 4개 문서 동기화
- [ ] 이 프로젝트 self-reinstall 후 gate-status.json 자동 업데이트 확인
- [ ] 전체 커밋 + 푸시 + 태그 v26.1.0 (minor bump — 개선 작업)
