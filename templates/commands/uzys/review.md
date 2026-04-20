Review phase — 다중 관점 리뷰로 품질을 검증한다.

## Gate Check

Verify 단계가 완료되었는지 확인한다. 테스트가 통과하지 않았으면 경고.

## Process

1. agent-skills의 code-review-and-quality + security-and-hardening 스킬을 활성화한다.
2. **reviewer subagent를 호출한다** (SOD: 구현과 검증 분리):
   - reviewer는 context: fork로 격리 실행
   - 5축 리뷰: correctness, readability, architecture, security, performance
3. 프로젝트 레벨 에이전트도 활성화:
   - code-reviewer (ECC, sonnet): 일상적 코드 리뷰
   - security-reviewer (ECC, sonnet): OWASP Top 10, 보안 패턴
4. 산출물 유형에 따라 리뷰 관점 자동 선택:
   - 코드: 5축 리뷰
   - 문서/제안서: 논리 흐름, 설득력, 범위 커버리지
   - UI: 디자인 일관성, 접근성, 반응형
5. **UI 변경이 있고 `docs/visual-review-<phase>.md`가 존재**하면 visual review 결과를 입력으로 흡수:
   - REGRESSION 1건이라도 있으면 **Review Gate 차단** (CRITICAL과 동급)
   - CHANGED 항목은 의도성 검증 (커밋 메시지/PR 본문과 매칭)
   - 부재 시 ui-visual-review skill 호출 권유 (UI Track 한정)

## Severity Classification

| Severity | Action |
|----------|--------|
| CRITICAL | 즉시 수정 필수. Review 게이트 통과 불가 |
| HIGH | 수정 권장. 합리적 사유 있으면 예외 가능 |
| MEDIUM | 제안. 현재 PR에서 안 해도 됨 |
| LOW | 참고 |

## Gate

CRITICAL 이슈 0건이어야 Review 게이트 통과.

## Gate Status Update

이 단계가 성공적으로 완료되면 `.claude/gate-status.json`의 `review.completed`를 `true`로, `review.timestamp`를 현재 시각으로 업데이트한다.

```bash
jq '.review.completed = true | .review.timestamp = now | .review.timestamp = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))' .claude/gate-status.json > /tmp/gate-tmp.json && mv /tmp/gate-tmp.json .claude/gate-status.json
```
