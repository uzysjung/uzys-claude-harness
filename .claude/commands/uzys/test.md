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

## 핵심 사용자 기능 플로우 E2E (필수)

다음 플로우가 프로젝트에 존재하면 **실환경(staging 또는 로컬 docker-compose) Live E2E 1건 이상 필수**:

- **인증**: login → magic-link/OAuth callback → /me (또는 보호된 엔드포인트) 200
- **결제**: checkout → webhook → refund (존재 시)
- **외부 API 의존 플로우**: Stripe, Supabase, Railway, SES 등

검증 방식: Mock이 아닌 실제 서비스 호출. unit/integration의 Mock 테스트는 보조.
Prod가 Postgres면 테스트도 Postgres (testcontainer/docker-compose) — test-policy.md Dev-Prod Parity 준수.

## Bug Fix Mode

버그 수정 시 Prove-It 패턴:
1. 버그를 재현하는 테스트 작성
2. 테스트가 실패하는지 확인 (버그 존재 증명)
3. 수정 구현
4. 테스트가 통과하는지 확인
5. 가드 테스트로 유지

## Gate

모든 테스트 PASS + 커버리지 기준 충족 시 완료.

## Gate Status Update

이 단계가 성공적으로 완료되면 `.claude/gate-status.json`의 `verify.completed`를 `true`로, `verify.timestamp`를 현재 시각으로 업데이트한다.

```bash
jq '.verify.completed = true | .verify.timestamp = now | .verify.timestamp = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))' .claude/gate-status.json > /tmp/gate-tmp.json && mv /tmp/gate-tmp.json .claude/gate-status.json
```
