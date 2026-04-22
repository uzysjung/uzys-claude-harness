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

## Dev-Prod Parity (필수)

개발/테스트 DB 엔진은 Prod와 **동일**해야 한다. Prod가 Postgres면 테스트도 Postgres (testcontainer 또는 docker-compose). SQLite 대체 금지 — CI 속도/편의는 근거가 아니다. 구체적 설정은 test-driven-development 스킬 참조.

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
[0;36m[1mT12. Install Catalog Consistency[0m
    [0;32m✓[0m plugin: addy-agent-skills
    [0;32m✓[0m plugin: railway-plugin
    [0;32m✓[0m plugin: railway-skills
    [0;32m✓[0m plugin: supabase-agent-skills
    [0;32m✓[0m plugin: anthropic-agent-skills
    [0;32m✓[0m plugin: c-level-skills
    [0;32m✓[0m plugin: finance-skills
    [0;32m✓[0m skill: impeccable
    [0;32m✓[0m skill: playwright-skill
    [0;32m✓[0m skill: find-skills
    [0;32m✓[0m skill: react-best-practices
    [0;32m✓[0m skill: shadcn/ui
    [0;32m✓[0m skill: web-design-guidelines
    [0;32m✓[0m skill: orchestkit
    [0;32m✓[0m skill: next-skills
    [0;32m✓[0m mcp: context7
    [0;32m✓[0m mcp: github
    [0;32m✓[0m mcp: chrome-devtools
    [0;32m✓[0m mcp-conditional: railway
    [0;32m✓[0m mcp-conditional: supabase
    [0;32m✓[0m command: uzys:auto
    [0;32m✓[0m install.sh
    [0;32m✓[0m gate-check: auto 예외
    [0;32m✓[0m prune-ecc.sh
    ## TAMPERED
