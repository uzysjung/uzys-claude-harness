# Phase 4 A/B Experiment Log

> **과제**: Local Markdown Notebook (React + Tauri + SQLite + shadcn/ui)
> **과제 정의**: `~/Development/phase4-experiment/PROMPT.txt`
> **Run-book**: `Docs/research/phase-4-e2e-runbook.md`
> **실험 시작일**: YYYY-MM-DD (TBD)
> **실행 방식**: [A→B 순차 | B→A 순차 | 동시 실행] (run-book §6.3, 동시 권장)
> **실행자**: Jay
> **하네스 버전**: v26.7.3+ (B만)

---

## 환경 정보 (공통)

| 항목 | 값 |
|------|----|
| OS | macOS / Linux / Windows |
| Node.js | node --version |
| Bun | bun --version |
| Rust | cargo --version |
| Tauri CLI | cargo tauri --version 또는 bunx tauri --version |
| Claude Code | claude --version |

---

## A — Baseline (no harness)

### 환경
- Working dir: `~/Development/phase4-experiment/baseline`
- 세션 시작: HH:MM
- 세션 종료: HH:MM

### 측정 지표

| 항목 | 값 |
|------|----|
| **개발 시간 (분)** | |
| **토큰 사용량 (input+output)** | |
| **Round trip 수** (user→assistant 왕복) | |
| **수정 요청 횟수** ("고쳐"/"틀렸"/"다시"/"수정" 키워드 기준) | |
| **생성 파일 수** (`find . -type f -not -path './.git/*' \| wc -l`) | |
| **Git 커밋 수** (`git log --oneline \| wc -l`) | |
| **cargo check** | PASS / FAIL |
| **bun check / bun test** | PASS / FAIL |
| **완성도 스코어** (§ 체크리스트 합산, 20점 만점) | X / 20 = X% |
| **Blocking 이슈 수** (세션 중 진행 불가 순간) | |

### 완성도 체크리스트 (20점)

**필수 기능 (15점)**
- [ ] 노트 생성 (제목+본문)
- [ ] 노트 읽기 (목록 + 상세)
- [ ] 노트 수정
- [ ] 노트 삭제
- [ ] 카테고리 생성/할당
- [ ] 카테고리 트리 UI (중첩 3단계)
- [ ] 전문 검색 (제목)
- [ ] 전문 검색 (본문)
- [ ] 태그 부여
- [ ] 즐겨찾기 토글
- [ ] 최근 편집 목록 (5개+)
- [ ] 다크모드 수동 토글
- [ ] 시스템 테마 감지
- [ ] 내보내기 (.md 단일 파일)
- [ ] 내보내기 (zip)

**품질 기준 (5점)**
- [ ] Tauri command 계약 정의 (타입 안전)
- [ ] 비즈니스 로직 ↔ UI 분리 (디렉토리 구조로 확인)
- [ ] 에러 처리 (빈 catch 없음, 사용자 메시지)
- [ ] 시크릿/경로 하드코딩 없음 (`grep -rE "password\|token\|/Users/" src/`)
- [ ] `cargo check` PASS

### 중단 이유
- [ ] 자연 완료
- [ ] 2시간 상한
- [ ] 200K 토큰 상한
- [ ] Blocking 3회
- [ ] 사용자 판단

### 특이 관찰

_(세션 중 발견한 현상, 에이전트의 선택, 의외의 실패 등)_

-
-
-

---

## B — Harness (csr-fastapi Track, v26.7.3+)

### 환경
- Working dir: `~/Development/phase4-experiment/harness`
- 세션 시작: HH:MM
- 세션 종료: HH:MM

### 측정 지표

| 항목 | 값 | A 대비 |
|------|----|----|
| **개발 시간 (분)** | | +X% / -X% |
| **토큰 사용량** | | |
| **Round trip 수** | | |
| **수정 요청 횟수** | | |
| **생성 파일 수** | | |
| **Git 커밋 수** | | |
| **cargo check** | PASS / FAIL | |
| **bun check / bun test** | PASS / FAIL | |
| **완성도 스코어** | X / 20 = X% | |
| **Blocking 이슈 수** | | |

### 하네스 효과 관찰

| 기능 | 관찰 |
|------|------|
| **gate-check 차단 발생** (음성 테스트 — /uzys:plan 먼저 시도) | YES / NO / N/A |
| **/uzys:spec 유도** (에이전트가 자발적으로) | YES / NO |
| **plan-checker 활성** (Goal-backward 검증 수행) | YES / NO |
| **reviewer subagent fork** (context 분리 확인) | YES / NO |
| **agentshield-gate /uzys:ship 시 실행** | YES / NO |
| **silent-failure-hunter 호출** (에러 처리 검토) | YES / NO |
| **build-error-resolver 호출** (cargo check 실패 시) | YES / NO |
| **model-routing 참조** (opt-in, 이번 실험에서는 default off) | N/A |
| **checkpoint-snapshot 생성** (40회 tool 초과 시) | YES / NO |
| **codebase-map.json 생성** (session-start) | YES / NO |
| **mcp-pre-exec 차단 발생** (허용 서버만 호출하면 NO가 정상) | YES / NO |
| **CL-v2 instinct 축적** (observations.jsonl 이벤트 수) | X건 |

### 완성도 체크리스트 (20점)

_(A 섹션 체크리스트 복사해서 B 결과 기록)_

### 중단 이유
- [ ] 자연 완료
- [ ] 2시간 상한
- [ ] 200K 토큰 상한
- [ ] Blocking 3회
- [ ] 사용자 판단

### 특이 관찰

-
-
-

---

## 결과 요약

### 정량 비교표

| 지표 | A | B | 차이 | 승자 |
|------|---|---|------|------|
| 개발 시간 (분) | | | | |
| 토큰 사용량 | | | | |
| 완성도 (%) | | | | |
| 수정 요청 횟수 | | | | |
| Round trip 수 | | | | |
| Blocking 이슈 수 | | | | |
| cargo check | | | | |
| bun check | | | | |

### 정성 관찰

**A의 강점**:
-

**A의 약점**:
-

**B의 강점**:
-

**B의 약점**:
-

### 핵심 발견

_(하네스가 실제로 가치 있는 순간은 언제였는가? 또는 가치 없거나 오히려 방해한 순간은?)_

-
-
-

### 결론

- **하네스 효용 입증 여부**: Pass / Partial / Fail
  - Pass: B가 완성도 +10%+ OR 수정 요청 -30%+ OR 토큰 -20%+
  - Partial: 일부 지표만 개선
  - Fail: B가 A보다 악화되거나 큰 차이 없음
- **재실험 필요 여부**: Yes / No (N=1이므로 권장: Yes, 다른 과제로)
- **개선 제안** (하네스 방향):
  -

### 다음 단계

- **Blocking 이슈**: _(즉시 fix plan 필요)_
- **Minor 이슈**: _(P10 분기 정리에 반영)_
- **PRD 업데이트**: Phase 4 Complete 또는 "개선 중" 마킹
- **N=2 실험**: _(다른 과제 후보)_
- **하네스 유지/제거 결정**:

---

## 부록 A. 세션 로그 저장 위치

- A 로그: `~/Development/phase4-experiment/baseline/.session.log` (또는 Claude Code transcript)
- B 로그: `~/Development/phase4-experiment/harness/.session.log`
- 로그에서 토큰/round trip 추출 방법:
  - Round trip: `grep -c "^user:"` 또는 `"^assistant:"`
  - 수정 요청: `grep -cE "고쳐\|잘못\|틀렸\|다시\|수정"`
  - 토큰: Claude Code 종료 시 UI 출력 또는 `claude --stats` (버전 따라 다름)

## 부록 B. 실행 후 rollback

실험 종료 후 디렉토리 유지 여부:
- **유지**: 참조용으로 보관 (~/Development/phase4-experiment/ 그대로)
- **제거**: `rm -rf ~/Development/phase4-experiment` (이 프로젝트 영향 없음)

이 프로젝트 (`uzysClaudeUniversalEnv`) 자체는 실험 중 **변경 없음** (run-book + log + fix 커밋은 meta 작업).
