# Change Management

## Change Request (CR) Classification

구현 중 SPEC/PRD 변경이 필요한 경우:

| 유형 | 기준 | 처리 |
|------|------|------|
| **Clarification** | 이미 합의된 내용의 구체화 | 에이전트가 즉시 반영 + Change Log 기록 |
| **Minor** | 현재 Phase 내부에 국한 | 에이전트가 제안 → **인간 승인** → Change Log |
| **Major** | AC/Phase/Non-Goals/DO NOT CHANGE 영향 | **인간 결정 필수** → Change Log + 영향 분석 |

## Classification Rules

```
IF AC의 Pass/Fail에 영향           → Major
IF 다른 Phase의 입력/산출물에 영향  → Major
IF DO NOT CHANGE 영역에 영향        → Major
IF Non-Goals 경계에 영향            → Major
IF 현재 Phase 내부에 국한           → Minor
IF 합의 내용의 구체화               → Clarification
```

## DO NOT CHANGE Protection

- SPEC/PRD의 DO NOT CHANGE 영역은 **절대 수정 금지**.
- 수정이 불가피한 경우: Major CR 작성 → 인간 결정 대기.
- 안정적으로 보이는 영역도 수정 전 확인: "이 부분도 수정 범위입니까?"

## Decision Log

구현 중 SPEC에 명시되지 않은 의사결정은 `docs/decisions/` 에 ADR로 기록:

```markdown
# ADR-NNN: [결정 제목]
- Status: Accepted | Superseded | Deprecated
- Date: YYYY-MM-DD
- Context: [왜 결정이 필요했는가]
- Decision: [무엇을 결정했는가]
- Alternatives: [검토 후 기각된 대안]
- Consequences: [이 결정의 영향]
```

## Savepoint Protocol

Major CR 적용 전, 또는 주요 변경점에서 savepoint 생성:

```bash
git add -A && git commit -m "chore: savepoint before [변경 설명]"
```

