# ADR-008: Session Boundary Definition (P2-03)

- **Status**: Accepted
- **Date**: 2026-04-30
- **PR**: (single-maintainer, 사용자 직접 승인)
- **Supersedes**: 없음
- **Related**:
  - `docs/evals/hito-baseline-2026-04-30.md` §5 한계 #1
  - `docs/decisions/ADR-001-phase2-entry-criteria.md` OQ1 (세션 ≥ 10회 측정 모호성)
  - `docs/phase-2-backlog.md` P2-03

## Context

`hito-counter.sh` (`UserPromptSubmit` hook)는 prompt 단위로 timestamp만 기록하고 **session 경계 정보를 갖지 않는다**. 결과적으로:

1. **ADR-001 OQ1 측정 모호성**: "세션 ≥ 10회" 기준이 prompt 누적 카운트로 대체됨 (baseline §5 한계 #1).
2. **NSM 자동화 차단** (P2-02 의존): per-feature HITO 추정에서 "session ≠ feature ≠ prompt" 매핑 휴리스틱 정의 불가.
3. **재현성 부재**: baseline 보고서 §3 feature 분류는 git log 매핑 + 사람 수작업.

`templates/hooks/hito-counter.sh` 로그 형식 (확인됨):

```
2026-04-30T13:33:08Z prompt_submit
2026-04-30T13:35:02Z prompt_submit
...
2026-04-25T00:41:05Z prompt_submit  ← 12시간 gap 후 새 활동
2026-04-25T13:16:04Z prompt_submit
```

ISO 8601 UTC, 1초 정확도, 일자별 파일. **timestamp gap만이 사용 가능한 신호**.

## Decision

### Session = timestamp gap ≥ **60분**

연속한 두 prompt 사이 wall-clock gap 이 **60분 이상**이면 새 session 시작으로 판정.

### 형식 정의

- **Session ID**: 첫 prompt timestamp의 `YYYY-MM-DDTHH:MM:SSZ` (UTC)
- **Session start**: gap ≥ 60분 또는 첫 prompt
- **Session end**: 다음 session start - 1초 (또는 마지막 prompt)
- **Session prompt count**: 해당 boundary 안 prompt 수

### 측정 방법 (P2-02 도구가 구현할 알고리즘)

```
prev_ts = NULL
session_id = NULL
sessions = []

for each prompt_ts in sorted(all_prompts):
    if prev_ts is NULL or (prompt_ts - prev_ts) >= 60min:
        session_id = prompt_ts  # new session
        sessions.append({id: session_id, start: prompt_ts, prompts: 1})
    else:
        sessions[-1].prompts += 1
        sessions[-1].end = prompt_ts
    prev_ts = prompt_ts

return sessions
```

### Sample 적용 (baseline 데이터)

baseline window (2026-04-23 ~ 04-30, 166 prompts) 가 60분 gap 휴리스틱으로 분할되면 **session count 자동 계산 가능** → ADR-001 OQ1 "세션 ≥ 10회" 기준 명확 검증.

## Alternatives

| 대안 | 기각 사유 |
|------|----------|
| **15분** gap | 짧은 thinking pause / tool call 대기 도 새 session으로 잘못 분할. NSM 평균 인플레이션 |
| **30분** gap | 점심/회의 휴식이 새 session이 됨 — feature 일관성 깨짐. 한국 근무 패턴(오전 + 오후) 분리 위험 |
| **120분 (2시간)** gap | 일과 구분 불가능 (오전 9시 시작 → 오후 1시 점심 → 오후 2시 재개 = 같은 session 처리). NSM 평균 디플레이션 |
| **1440분 (1일)** gap | file boundary 와 동일. 현재 baseline 보고서 가정 — 분할 정보 0. 본 ADR 의미 없음 |
| **claude-code session ID 사용** | hook 입력에 session ID 미제공 — `UserPromptSubmit` hook payload는 prompt text만. 미래 capability일 뿐 현재 미사용 |
| **사용자 명시 boundary** (`SessionStart` hook) | Claude Code 의 `SessionStart` hook 은 이미 존재하나 hito-counter는 prompt-level 만. 명시 boundary 채택 시 hook 추가 + log 포맷 변경 — out of scope (P2-02 자체에 포함하지 않음) |

## Consequences

### Positive

- **ADR-001 OQ1 명확화**: "세션" 정의가 명시적 알고리즘 — baseline 검증 재현 가능.
- **P2-02 prerequisite 충족**: NSM 자동화 도구가 session 단위로 prompt 분할 가능.
- **Lean**: hook / log 포맷 변경 0건. 후처리 도구만 본 ADR 따름.

### Negative

- **휴리스틱 한계**: 60분은 사용자 작업 패턴 가정. 다른 사용자(예: 외부 P2-01 적용)는 분포 다를 수 있음 — Phase 2 P2-01 baseline 측정 후 재평가.
- **Tool call latency 영향**: 매우 긴 tool 호출(외부 build / lint / E2E)이 60분+ 걸릴 시 같은 session 안 prompt 가 새 session 처리될 수 있음. 본 프로젝트 dogfood 패턴에선 거의 없음 (CI 30s, ship 5min 이내).

### Neutral

- **과거 baseline 보고서** (`docs/evals/hito-baseline-2026-04-30.md`) 는 본 ADR 적용 후 P2-02 자동화 도구로 재계산 가능. 보고서 §5 한계 #1 명시적 해결.
- **`hito-counter.sh` 자체는 변경 없음**. 본 ADR은 후처리 알고리즘만 정의.

## Verification

P2-02 자동화 도구가 본 ADR을 구현하면 다음 검증:

1. baseline window 자동 분할 → session count 산출
2. 산출 결과가 일자별 분포와 일관 (2026-04-25 = 79 prompts/day 가 1~3 sessions로 분할되는지)
3. 60분 gap 검증: log 에서 60분+ gap이 모두 session boundary 가 되는지

## Follow-up

- **P2-02 NSM 자동화 도구**: 본 ADR 알고리즘 구현 (`scripts/nsm-aggregate.sh` 또는 동등)
- **외부 사용자 baseline (P2-01) 후 재평가**: 사용자별 패턴이 다르면 60분 임계값 검토
- **장기**: `claude-code` upstream 이 hook payload 에 session ID 노출 시 본 ADR 폐기 후 명시 boundary 채택 가능
