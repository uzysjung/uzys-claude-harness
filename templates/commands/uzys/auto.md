SPEC 확정 후 나머지 5단계(Plan → Build → Test → Review → Ship)를 자동으로 순차 진행한다.

## 사전 조건

1. `docs/SPEC.md` 존재 확인. 없으면 "/uzys:spec을 먼저 실행하세요" 안내 후 **중단**.
2. `.claude/gate-status.json`의 `define.completed` = true 확인. false면 **중단**.

## 실행 순서

각 단계를 **순차 실행**. 각 단계 완료 시 gate-status.json을 자동 업데이트하고 다음 단계로 진행한다.

### 1. Plan
- `docs/plan.md` + `docs/todo.md` 생성
- plan-checker agent로 Goal-backward 검증 (Revision Gate, 최대 3회)
- 완료 시: `jq '.plan.completed = true | .plan.timestamp = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))' .claude/gate-status.json > /tmp/gate-tmp.json && mv /tmp/gate-tmp.json .claude/gate-status.json`

### 2. Build
- `docs/todo.md`에서 미완료 task를 순차 선택
- 각 task에 TDD 사이클 적용 (RED → GREEN → REFACTOR)
- 각 task 완료 시 **즉시 커밋** (commit-policy 준수)
- todo.md 체크박스 업데이트
- 모든 task 완료 시: gate-status build.completed = true

### 3. Test
- 전체 테스트 스위트 실행
- test-policy.md 커버리지 기준 확인 (UI 60%, API 80%, 로직 90%)
- 미달 시 추가 테스트 작성 시도 (최대 3회)
- 통과 시: gate-status verify.completed = true

### 4. Review
- reviewer subagent (context: fork) 호출
- 5축 리뷰: correctness, readability, architecture, security, performance
- CRITICAL 이슈 발견 시 즉시 수정 시도 (최대 3회)
- CRITICAL 0건 시: gate-status review.completed = true

### 5. Ship
- agentshield-gate 자동 실행 (CRITICAL 차단)
- spec-drift-check ship 모드 실행
- 전부 통과 시: gate-status ship.completed = true
- 최종 커밋 + 태그 제안

## 자동 재시도 (Revision Gate 패턴)

각 단계에서 실패 시:
1. 원인 분석 + 즉시 수정 시도
2. 최대 **3회** 재시도
3. 3회 초과 시 **사용자에게 escalation** (Escalation Gate)
4. 사용자 응답 대기

## 중단 조건 (Abort Gate)

- SPEC.md 300줄 초과 → spec-scaling 제안 + 중단
- 동일 이슈 3회 연속 미해결 → escalation
- 사용자 Ctrl+C → 현재 상태 보존

## Arguments

```
/uzys:auto                  # Plan부터 시작 (기본)
/uzys:auto from=build       # Build부터 (Plan 이미 완료 시)
/uzys:auto from=test        # Test부터
/uzys:auto from=review      # Review부터
/uzys:auto from=ship        # Ship부터
```

## 참조

- gate-check.sh는 `/uzys:auto` 를 게이트 체크 대상에서 **제외**. auto 커맨드가 내부에서 gate-status를 직접 관리.
- 각 단계의 상세 동작은 개별 `/uzys:plan`, `/uzys:build` 등의 커맨드 정의를 따른다.
- gates-taxonomy.md의 4유형 게이트 (Pre-flight/Revision/Escalation/Abort) 적용.
