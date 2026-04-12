Verify phase — TDD 워크플로우와 Track별 커버리지 게이트를 실행한다.

## Process

1. agent-skills의 test-driven-development 스킬을 따른다.
2. agent-skills의 **test-engineer 에이전트**를 활성화하여 테스트 전략 설계, 시나리오 분석(happy path, boundary, error path, concurrency)을 수행한다.
3. `.claude/rules/test-policy.md`의 Track별 커버리지 기준을 참조한다:
   - UI 컴포넌트: 60%
   - API 엔드포인트: 80%
   - 비즈니스 로직: 90%
3. 브라우저 테스트가 필요한지 판단한다:
   - UI 변경이 있으면 → browser-testing 스킬 + Playwright 활성화
   - API/로직만이면 → unit/integration 테스트만
4. 전체 테스트 스위트를 실행하고 결과를 보고한다.
5. 커버리지가 기준 미달이면 추가 테스트 작성을 제안한다.

## Bug Fix Mode

버그 수정 시 Prove-It 패턴:
1. 버그를 재현하는 테스트 작성
2. 테스트가 실패하는지 확인 (버그 존재 증명)
3. 수정 구현
4. 테스트가 통과하는지 확인
5. 가드 테스트로 유지

## Gate

모든 테스트 PASS + 커버리지 기준 충족 시 완료.
