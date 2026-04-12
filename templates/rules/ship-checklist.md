# Ship Checklist

`/uzys:ship` 실행 시 아래 모든 항목을 통과해야 배포 가능.

## Pre-Ship Gates

- [ ] **E2E 테스트 통과**: 핵심 사용자 흐름 E2E 테스트 전부 PASS
- [ ] **커버리지 기준 충족**: test-policy.md의 Track별 threshold 확인
- [ ] **Security Scan 통과**: `npx ecc-agentshield scan` 결과 CRITICAL/HIGH 없음
- [ ] **의존성 감사 통과**: `npm audit` (Node.js) 또는 `pip audit` (Python) 실행. critical/high 취약점 없음
- [ ] **SPEC/PRD 정합성**: 배포 항목이 SPEC.md/PRD.md와 일치하는지 확인
- [ ] **Review 게이트 통과**: `/uzys:review`에서 CRITICAL 이슈 없음 확인

## Post-Ship Actions

- SPEC/PRD와 불일치 발견 시: SPEC/PRD 업데이트 → 커밋
- ADR 기록 필요 시: `docs/decisions/` 에 아키텍처 결정 기록
- Change Log 최종 확정

## Deployment

- Railway 배포 가능 상태 확인 (Railway MCP/플러그인 사용)
- Health check 엔드포인트 응답 확인
- 배포 후 smoke test 실행
