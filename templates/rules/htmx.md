# htmx Rules

ssr-htmx Track에서 적용.

## Core Patterns

- `hx-swap` 기본값: `innerHTML`. 명시적으로 지정.
- `hx-trigger` 항상 명시. 암묵적 트리거에 의존하지 않음.
- `hx-boost` 내비게이션 링크에만. 폼이나 API 호출에 사용 금지.
- `hx-indicator` 필수 — 네트워크 요청 시 사용자에게 로딩 표시.

## Partial Responses

- htmx 요청에 대한 응답은 **부분 HTML**만 반환.
- Jinja2 `block`/`macro`로 부분 템플릿 정의.
- 전체 페이지 렌더링 금지 (htmx 요청인 경우).

```python
@app.get("/items/{id}")
async def get_item(request: Request, id: int):
    item = await fetch_item(id)
    if request.headers.get("HX-Request"):
        return templates.TemplateResponse("partials/item.html", {"item": item})
    return templates.TemplateResponse("pages/item.html", {"item": item})
```

## htmx + Alpine.js Boundary

- **htmx**: 서버 상호작용 (데이터 로드, 폼 제출, 부분 업데이트)
- **Alpine.js**: 클라이언트 전용 상호작용 (토글, 드롭다운, 탭)
- 둘을 혼합하지 않음. 서버 상태는 htmx, 클라이언트 상태는 Alpine.

## Chart.js Coexistence

- htmx로 차트 영역 업데이트 전 기존 Chart 인스턴스 반드시 `destroy()`.
- 병렬 `htmx.ajax()` 호출 금지 — 순차 실행.
- 차트 컨테이너에 고정 높이 부여 (CLS 방지).

## Security

- 모든 mutation(POST/PUT/DELETE)에 CSRF 토큰 필수.
- `hx-vals`로 민감 데이터 전송 금지.
