Ship phase — 프리런치 체크리스트 실행 후 배포한다.

## Gate Check

Review 단계가 완료되었는지 확인한다. CRITICAL 이슈가 남아 있으면 경고.

## Process

1. agent-skills의 shipping-and-launch 스킬을 활성화한다.
2. `.claude/rules/ship-checklist.md` 게이트를 순차 확인:

   - [ ] E2E 테스트 전부 PASS
   - [ ] test-policy.md 커버리지 기준 충족
   - [ ] `npx ecc-agentshield scan` — CRITICAL/HIGH 없음
   - [ ] SPEC.md/PRD.md 대비 배포 항목 일치 확인

3. 하나라도 실패하면 배포 차단 + 실패 항목 보고.

4. 전부 통과하면:
   - Railway MCP/플러그인으로 배포 (Railway 사용 시)
   - Health check 엔드포인트 응답 확인
   - 배포 후 smoke test

5. Post-Ship:
   - SPEC/PRD 불일치 발견 시 → 업데이트 후 커밋
   - 아키텍처 결정이 있었으면 → `docs/decisions/` 에 ADR 기록
   - Change Log 최종 확정

## Hotfix Mode

긴급 수정 시 Build → Verify → Ship 단축 경로 허용.
Define/Plan/Review 게이트 건너뛰기 가능하지만, Verify(테스트)는 필수.

## Gate Status Update

이 단계가 성공적으로 완료되면 `.claude/gate-status.json`의 `ship.completed`를 `true`로, `ship.timestamp`를 현재 시각으로 업데이트한다.

```bash
jq '.ship.completed = true | .ship.timestamp = now | .ship.timestamp = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))' .claude/gate-status.json > /tmp/gate-tmp.json && mv /tmp/gate-tmp.json .claude/gate-status.json
```
