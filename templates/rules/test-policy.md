# Test Policy

## Coverage Thresholds (Track-Specific)

| 영역 | 최소 커버리지 | 적용 Track |
|------|-------------|-----------|
| UI 컴포넌트 | 60% | csr-*, ssr-* |
| API 엔드포인트 | 80% | csr-*, ssr-*, data |
| 비즈니스 로직 | 90% | 전체 개발 Track |

## Test Types (All Required)

1. **Unit Tests** — 개별 함수, 유틸리티, 컴포넌트
2. **Integration Tests** — API 엔드포인트, DB 연동
3. **E2E Tests** — 핵심 사용자 흐름 (Ship 단계 필수)

## Dev-Prod Parity (CRITICAL)

개발/테스트 DB 엔진은 Prod와 **동일**해야 한다. 엔진 불일치는 마이그레이션/쿼리/트랜잭션 레벨 버그를 숨긴다.

| Prod Stack | 테스트 DB | 금지 대체 |
|------------|----------|---------|
| Railway Postgres / Supabase | Postgres (testcontainer 또는 docker-compose) | SQLite, in-memory mock |
| Redis (prod) | Redis container | in-process dict fake |
| S3-호환 스토리지 | MinIO container | 로컬 파일시스템 |

예외 — Prod가 SQLite인 경우에만 SQLite 테스트 허용. "CI 속도/편의"는 근거로 불허.

## Live E2E for Critical Paths (CRITICAL)

다음 흐름은 **Mock 금지** — staging 실환경에서 최소 1건 Live E2E 필수:

- **인증**: login → magic-link/OAuth callback → /me 200
- **결제**: checkout → webhook → refund
- **외부 API 의존**: Stripe, Supabase Auth/Realtime, SES, Railway deploy 등

Mock 기반 unit/integration test는 *보조*이지 *충분조건*이 아니다. 인증 플로우가 staging에서 실제 200을 돌려받는지 검증해야 Ship 가능.

## TDD Workflow (Mandatory)

```
1. RED    — 실패하는 테스트 먼저 작성
2. GREEN  — 테스트를 통과하는 최소 구현
3. REFACTOR — 코드 개선 (테스트 유지)
4. VERIFY — 커버리지 확인
```

## Test Structure (AAA Pattern)

```python
def test_calculates_similarity():
    # Arrange
    vector1 = [1, 0, 0]
    vector2 = [0, 1, 0]
    # Act
    result = calculate_cosine_similarity(vector1, vector2)
    # Assert
    assert result == 0
```

## Test Naming

동작을 설명하는 이름:
- `test_returns_empty_array_when_no_markets_match_query`
- `test_throws_error_when_api_key_is_missing`
- `test_falls_back_to_substring_search_when_redis_unavailable`

## Framework Mapping

| Stack | Unit/Integration | E2E |
|-------|-----------------|-----|
| Python (FastAPI) | pytest + pytest-asyncio + httpx | Playwright |
| TypeScript (React) | Vitest + React Testing Library | Playwright |
| Next.js | Vitest + RTL | Playwright |

## Troubleshooting

1. 테스트 격리 확인 (공유 상태 없는지)
2. mock이 실제 동작과 일치하는지 확인
3. 구현을 수정하라, 테스트를 수정하지 마라 (테스트가 틀린 경우 제외)
