# Phase 4 — Real-World E2E Validation via A/B Controlled Experiment

> **Status**: 준비 완료 · **Date**: 2026-04-16 · **Target tag**: v26.7.1 이후
>
> **핵심 질문**: *"이 하네스 프로젝트가 실제로 효용이 있는가?"*
>
> **검증 방법**: **A/B Controlled Experiment** — 동일한 복잡도의 중급 난이도 서비스(React + Tauri)를 동일한 자연어 프롬프트로 두 환경에서 개발하고, 객관적 지표로 비교한다.
>
> 이 문서는 **실행 가이드**다. 실제 실행은 사용자 환경 준비 + 세션 2회 실행.

---

## 1. Context

이 프로젝트는 자기 자신(tooling Track)만 dogfooding 중. 실제 효용이 있는지 **측정된 데이터 없음**. PRD §4.3 Success Metrics 의 목표 값(5분 이내 설치, 0% 건너뛰기, 40-70% 토큰 감소 등)은 **검증되지 않은 주장**.

이 run-book은 다음을 실증한다:
1. 하네스를 적용한 환경(B)이 적용 안 한 환경(A) 대비 **더 나은 결과**를 내는가?
2. "더 나은"의 정의는 무엇인가? (객관 지표)
3. 어떤 Phase 5.1/5.2 기능이 실제 효과가 있는가?

**주의**: 이 실험은 통계적 검정이 아닌 **케이스 스터디**. 1개 과제에 대한 1:1 비교. 여러 과제로 일반화하려면 N회 반복 필요 (향후 작업).

---

## 2. Experiment 설계

### 2.1 비교군

| 구분 | 환경 | 하네스 |
|------|------|------|
| **A (Baseline)** | 일반 Claude Code, `.claude/` 없음 | 없음 (기본 `~/.claude/CLAUDE.md`만) |
| **B (Treatment)** | `setup-harness.sh` 적용된 프로젝트 | 9 Tracks 중 선택 (권장: `csr-fastapi` 또는 `full`) |

### 2.2 고정 변수 (동일해야 함)

- **초기 스캐폴드**: 빈 git 저장소 + 동일 README.md + 동일 package.json (없거나 최소)
- **동일 프롬프트** (§3 참조, 자연어, 의도적으로 "적당히 열려있음")
- **동일 Claude Code 버전 + 동일 모델** (기본 설정)
- **동일 시작 시각** 또는 실행 순서 랜덤화 (순서 효과 제거)
- **동일 중단 조건**: 아래 Done Criteria 충족 또는 2시간 경과

### 2.3 독립 변수 (비교 대상)

- 하네스 존재 여부 (A: off, B: on)

### 2.4 종속 변수 (측정 지표)

| 지표 | 측정 방법 | 단위 |
|------|---------|------|
| **토큰 사용량** | Claude Code 세션 총 input+output 토큰 | tokens |
| **개발 시간** | 세션 시작 ~ Done 판정까지 실경과 | 분 |
| **완성도 스코어** | 아래 §5 체크리스트 충족률 | % (0-100) |
| **수정 요청 횟수** | 사용자가 "고쳐줘", "이건 틀렸어" 식 재지시 횟수 | count |
| **Round trip 수** | user → assistant 왕복 메시지 수 | count |
| **Blocking 이슈** | 세션 중단 없이 진행 불가했던 순간 수 | count |
| **생성 파일 수** | git status로 확인 | count |
| **Lint/Test 통과율** | 최종 코드 `bun test` / `cargo check` 결과 | PASS/FAIL |
| **Git 커밋 수** | `git log --oneline \| wc -l` | count |
| **Security 이슈** | AgentShield 스캔 결과 (B만, A는 수동 스캔) | CRITICAL/HIGH 수 |

### 2.5 과제 난이도: 중급

> "중급" = 단순 CRUD 이상, 풀 프로덕션 이하. 약 500-1500줄 코드 + 1-3 외부 통합 + UI.

---

## 3. 실험 프롬프트 (동일 입력)

**Track 가정**: React + Tauri 데스크톱 서비스. Phase 5.1/5.2 하네스가 다루는 영역을 실제로 건드리도록 의도적으로 설계.

```
Local Markdown Notebook 을 React + Tauri 로 만들어줘.

기능:
- 마크다운 노트 CRUD (제목, 본문, 카테고리, 태그, 생성/수정 시간)
- 로컬 SQLite 저장 (Tauri rusqlite 플러그인)
- 카테고리 트리 (중첩 3단계까지)
- 전문 검색 (제목 + 본문, FTS)
- 다크모드 + 시스템 테마 감지
- 즐겨찾기 + 최근 편집 목록
- 내보내기 (개별 .md 파일 또는 zip)

요구사항:
- 테스트 가능한 구조 (비즈니스 로직과 UI 분리)
- 시크릿/경로 하드코딩 금지
- 오프라인 전용 (네트워크 불필요)
- shadcn/ui 컴포넌트 스타일
- RESTful하지 않아도 됨 (Tauri command 직접 호출)
- 빌드가 깨지지 않아야 함 (cargo check + bun check 둘 다 통과)

적당한 수준에서 알아서 판단해. 너무 과하지 말고 너무 단순하지도 말고.
```

**의도**:
- "적당한 수준"이라는 **모호한 지시어**로 에이전트의 기본 판단력 테스트
- React + Tauri + Rust + SQLite 는 B의 `csr-fastapi` 또는 `full` Track의 rules (tauri, shadcn, code-style, error-handling) + plan-checker + silent-failure-hunter의 실전 가치를 측정
- 다크모드/즐겨찾기 같은 "누락하기 쉬운" 기능으로 완성도 차이 관찰
- 테스트 + 빌드 통과 요구로 Phase 5.1 plan-checker + verification-loop의 효과 측정

**프롬프트 변형 금지**: A와 B에 동일하게 입력. 기존 대화 컨텍스트 없음.

---

## 4. 사전 준비 (Day 0)

### 4.1 실험 디렉토리

```bash
# 프로젝트 외부 경로 (사용자 선호 위치로 조정 가능)
EXPERIMENT_ROOT="$HOME/Development/phase4-experiment"
mkdir -p "$EXPERIMENT_ROOT"
cd "$EXPERIMENT_ROOT"

# A: Baseline
mkdir -p baseline && cd baseline
git init -q
cat > README.md <<'EOF'
# Phase 4 A/B Experiment — Baseline (no harness)

Local Markdown Notebook (React + Tauri). Baseline 환경 — Claude Code 기본 설정.
EOF
git add . && git commit -m "init" -q
cd ..

# B: Treatment (하네스 적용)
mkdir -p harness && cd harness
git init -q
cat > README.md <<'EOF'
# Phase 4 A/B Experiment — Harness (csr-fastapi Track)

Local Markdown Notebook (React + Tauri). 하네스 적용 환경.
EOF
git add . && git commit -m "init" -q
bash "$HOME/Development/Claude-Workspace/uzys-claude-harness/setup-harness.sh" \
  --track csr-fastapi --project-dir .
cd ..
```

### 4.2 설치 검증 (B만)

```bash
cd $EXPERIMENT_ROOT/harness
ls .claude/hooks/          # 9개 예상
ls .claude/agents/          # 8개 예상
ls .claude/rules/           # 13개 예상 (csr-fastapi Track)
ls .mcp.json .mcp-allowlist CLAUDE.md
```

설치 실패 시 실험 중단, 원인 분석 후 재시도.

### 4.3 측정 도구 준비

- **타이머**: 각 세션 시작 시 `date +%s` 기록, 종료 시 차이 계산
- **토큰 기록**: Claude Code 세션 종료 시 `claude --help` 또는 UI에서 토큰 수 확인 (버전별 다름)
  - 수동 방법: 세션 스크립트를 `tee session.log`로 캡처, 나중에 대략 글자수로 추정
- **Round trip 카운터**: 세션 로그에서 user→assistant 메시지 수
- **수정 요청 카운터**: 로그 `grep -c "고쳐\|잘못\|틀렸\|다시\|수정"`

---

## 5. 완성도 스코어 체크리스트

각 항목은 0 (미구현) / 0.5 (부분) / 1 (완전) 점. 총 20점 만점 × 5 = 100%.

### 필수 기능 (각 1점)

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

### 품질 기준 (각 1점)

- [ ] Tauri command 계약 정의 (타입 안전)
- [ ] 비즈니스 로직 ↔ UI 분리 (파일 구조로 확인)
- [ ] 에러 처리 (빈 catch 없음, 사용자 메시지)
- [ ] 시크릿/경로 하드코딩 없음 (grep 확인)
- [ ] `cargo check` PASS

---

## 6. 실행 절차 (Day 1)

### 6.1 세션 A — Baseline

1. 새 터미널 → `cd $EXPERIMENT_ROOT/baseline`
2. `claude` 실행
3. **기록**: 시작 시각 `date +%s > /tmp/a-start.txt`
4. §3 프롬프트 **정확히 복사 붙여넣기** (수정 없음)
5. 세션 진행
6. 중단 조건 도달 시 `exit` → `date +%s > /tmp/a-end.txt`
7. 로그 저장: 세션 종료 직전 `/copy` 또는 transcript 파일 경로 확인
8. 완성도 체크리스트 수행 (§5)
9. 결과를 `Docs/research/phase-4-ab-log.md` A 섹션에 기록

### 6.2 세션 B — Harness (A 완료 후 동일 날짜 내)

1. 새 터미널 → `cd $EXPERIMENT_ROOT/harness`
2. `claude` 실행
   - session-start hook 자동 실행 (git pull + codebase-map 생성 + SPEC 확인)
3. **기록**: 시작 시각
4. §3 프롬프트 동일 붙여넣기
5. 세션 진행 — 하네스는 다음을 자동 유도할 가능성:
   - `/uzys:spec` 먼저 요청 (gate-check hook)
   - SPEC.md 작성 → plan-checker → plan.md → /uzys:build → tests → /uzys:review → /uzys:ship
6. 동일 중단 조건 도달 시 종료
7. 완성도 체크리스트 수행
8. 로그 기록 (B 섹션)

### 6.3 순서 효과 방지

동일 사용자가 두 세션을 연속 실행하면 **학습 효과**(A에서 얻은 아이디어가 B에 반영) 발생. 완화:

**Option A (권장)**: 첫 실험은 A→B, 두 번째 실험은 B→A로 다른 과제 수행. N=2 이상일 때만 의미.

**Option B**: 하루 이상 간격 두고 실행. 메모리에서 희미해진 상태.

**Option C**: 두 세션을 **동시 실행**. 터미널 2개, 같은 프롬프트 동시 입력. 가장 공정. 단 사용자 주의 분산.

이 실험(N=1)에서는 **Option C 권장**: 하네스 효과를 보존된 조건에서 측정.

---

## 7. 측정 로그 템플릿 (별도 파일)

파일: `Docs/research/phase-4-ab-log.md` (실험 중 작성)

```markdown
# Phase 4 A/B Experiment Log

**실험일**: YYYY-MM-DD
**과제**: Local Markdown Notebook (React + Tauri)
**순서 방식**: [A→B | B→A | 동시]
**실행자**: Jay

---

## A — Baseline (no harness)

### 환경
- Working dir: `$EXPERIMENT_ROOT/baseline`
- 세션 시작: HH:MM
- 세션 종료: HH:MM
- Claude Code 버전:

### 지표
| 항목 | 값 |
|------|----|
| 개발 시간 (분) | |
| 토큰 사용량 | |
| Round trip 수 | |
| 수정 요청 횟수 | |
| 생성 파일 수 | |
| Git 커밋 수 | |
| cargo check | PASS / FAIL |
| bun check | PASS / FAIL |
| 완성도 스코어 | [X/20 → %] |
| Blocking 이슈 수 | |
| 관찰된 문제 | |

### 완성도 체크리스트
(§5 복사, 각 항목 채움)

### 특이 관찰
-

---

## B — Harness (csr-fastapi Track)

### 환경
- Working dir: `$EXPERIMENT_ROOT/harness`
- 하네스 버전: v26.7.x
- 세션 시작: HH:MM
- 세션 종료: HH:MM

### 지표
| 항목 | 값 | A 대비 |
|------|----|----|
| 개발 시간 (분) | | +X% or -X% |
| 토큰 사용량 | | |
| Round trip 수 | | |
| 수정 요청 횟수 | | |
| 생성 파일 수 | | |
| Git 커밋 수 | | |
| cargo check | PASS / FAIL | |
| bun check | PASS / FAIL | |
| 완성도 스코어 | [X/20 → %] | |
| Blocking 이슈 수 | | |

### 하네스 효과 관찰
- gate-check 차단 발생 횟수:
- plan-checker 활성 여부:
- silent-failure-hunter 지적 수:
- reviewer subagent fork 동작:
- agentshield-gate 결과:
- model-routing rule 활성 (옵션):
- CL-v2 instinct 축적 수:

### 완성도 체크리스트
(§5 복사)

### 특이 관찰
-

---

## 결과 요약

### 정량 비교

| 지표 | A | B | 차이 | 승자 |
|------|---|---|------|------|
| 개발 시간 | | | | |
| 토큰 사용량 | | | | |
| 수정 요청 횟수 | | | | |
| 완성도 | | | | |
| Lint/Build | | | | |

### 정성 관찰
- A의 강점:
- A의 약점:
- B의 강점:
- B의 약점:

### 결론
- 하네스 효용 입증 여부: Pass / Partial / Fail
- 재실험 필요 여부:
- 개선 제안 (하네스 방향):

### 다음 단계
- 발견된 Blocking 이슈는 즉시 fix plan
- Minor 이슈는 P10 분기 정리에 반영
- 다른 과제로 N=2 실험 수행 여부
```

---

## 8. Done Criteria (세션 중단 조건)

각 세션은 다음 **하나**라도 충족 시 종료:

1. **자연 완료**: Claude가 "완료했습니다" 또는 동등 표현 + 체크리스트 90%+ 충족
2. **시간 상한**: 2시간 경과 (타이머)
3. **토큰 상한**: 200K tokens 도달 (추정)
4. **Blocking 3회**: 동일 이슈로 3회 반복 차단
5. **사용자 판단**: "이 수준에서 충분" 또는 "더 진행해도 개선 없음"

---

## 9. Failure Mode 처리

실험 중 다음 상황 발생 시:

| 상황 | 대응 |
|------|------|
| A에서 cargo check 실패 | 실패로 기록, 계속 진행 (수정 시도 허용) |
| B에서 agentshield CRITICAL 차단 | `.agentshield-ignore` 업데이트 or 실제 수정, 시간 카운트 |
| A/B 중 한쪽만 매우 빠르게 완료 | 다른 쪽도 동일 시간까지 진행 (강제 완성 유도) |
| Tauri 설치 실패 (rust 미설치 등) | 실험 **중단**, rust 설치 후 재시작 (사전 준비 누락) |
| 동일 프롬프트인데 해석이 다름 | 의도 프롬프트 그대로 유지 (에이전트 해석 차이 자체가 측정 대상) |

---

## 10. Open Questions (사용자 확인 후 실행)

1. **실험 디렉토리 경로**: `~/Development/phase4-experiment` 로 OK? 다른 위치?
2. **Track 선택**: `csr-fastapi` vs `full` vs 기타? (데스크톱+SQLite는 엄격히는 어느 Track도 맞지 않음. csr-* 계열이 그나마 적합)
3. **실행 순서**: A→B 순차 vs 동시 (Option C)?
4. **시간 상한**: 2시간 vs 다른 값?
5. **과제 바꾸기**: React+Tauri 말고 다른 스택 선호? (단 이 프롬프트는 tauri/shadcn/React rules를 검증하기 위해 선택)
6. **반복 횟수**: N=1 (1회만) vs N=2 (다른 과제로 한 번 더)?

---

## 11. 실행 후 산출물

1. `Docs/research/phase-4-ab-log.md` — 측정 로그 (이 세션에서 템플릿만)
2. `$EXPERIMENT_ROOT/baseline/` — A 결과 코드 (실험 후 git log + 최종 상태)
3. `$EXPERIMENT_ROOT/harness/` — B 결과 코드
4. `Docs/research/phase-4-ab-report.md` — 분석 보고 (실험 후 작성)
5. **결정** (분석 후):
   - 하네스 효용 입증됐으면 PRD §11 Status → "Phase 4 Complete + 검증된 효용"
   - 효용 불명확하면 개선 plan (어느 부분이 도움이 안 됐는지)
   - 명확한 실패면 해당 기능 제거 또는 재설계

---

## 12. Rollback

실험 실패 시:
- `rm -rf $EXPERIMENT_ROOT` 로 실험 디렉토리 전체 제거
- 이 프로젝트는 변경 없음 (실험은 외부 디렉토리에서만)
- 하네스 자체는 영향 없음

---

## 13. 다음 단계 요약

**이 세션에서 할 일** (준비):
- [x] 이 run-book 작성
- [ ] 사용자 확인: §10 Open Questions 답변
- [ ] 커밋 + 태그

**별도 세션에서 할 일** (실행):
- 사용자가 §10 질문에 답한 후 실험 디렉토리 생성
- A/B 세션 실행 (동시 권장)
- 측정 로그 작성
- 분석 보고
