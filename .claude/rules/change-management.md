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

## Decision Log (ADR)

구현 중 SPEC에 명시되지 않은 의사결정은 `docs/decisions/` 에 ADR로 기록:

```markdown
# ADR-NNN: [결정 제목]
- Status: Proposed | Accepted | Superseded | Deprecated
- Date: YYYY-MM-DD
- PR: #123 (제안/승인 PR 링크)
- Supersedes: ADR-MMM (있으면)
- Context: [왜 결정이 필요했는가]
- Decision: [무엇을 결정했는가]
- Alternatives: [검토 후 기각된 대안]
- Consequences: [이 결정의 영향]
```

### ADR Status 흐름

```
Proposed → Accepted → (Superseded by ADR-N | Deprecated)
   ↓
 (Rejected — 별도 ADR 안 만듦, PR comment에 사유 기록)
```

| Status | 의미 | 다음 가능 transition |
|--------|------|-------------------|
| **Proposed** | PR 작성 + 검토 중. 아직 적용 X | Accepted, (Rejected) |
| **Accepted** | 머지됨. 본 결정에 따라 코드/문서 작성 | Superseded, Deprecated |
| **Superseded** | 다른 ADR이 본 결정을 대체 | (terminal — `Supersedes:` 필드로 link) |
| **Deprecated** | 더 이상 유효하지 않으나 대체 ADR 없음 | (terminal — 사유 PR/section 기록) |

### 채택 프로세스

1. **Proposed**: 의사결정 필요 시 ADR 초안 PR 생성. Status: Proposed.
2. **검토**: PR review에서 Alternatives + Consequences 검증.
3. **Accepted**: 머지 직전 Status: Accepted, PR 번호 채움.
4. **변경**: 새 ADR로 Supersedes/Deprecates 명시. 기존 ADR Status 갱신.

### 어떤 결정이 ADR 대상인가

- **대상**: 아키텍처 변경, 외부 의존성 도입/제거, 데이터 모델 변경, 보안 정책, breaking API
- **비대상**: 한 함수의 구현 디테일, 임시 워크어라운드, 명백한 버그 fix

## Savepoint Protocol

Major CR 적용 전, 또는 주요 변경점에서 savepoint 생성:

```bash
git add -A && git commit -m "chore: savepoint before [변경 설명]"
```

