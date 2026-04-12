# Error Handling

## FastAPI (Python Backend)

- 전역 exception handler 등록. 스택트레이스 노출 금지.
- 구조화된 에러 응답: `{ "success": false, "error": { "code": "...", "message": "..." } }`
- 외부 API 호출: timeout + retry (exponential backoff).
- 비즈니스 로직 예외: 커스텀 exception 클래스 정의.
- 모든 에러는 context와 함께 로깅 (request_id, user_id, endpoint).

```python
@app.exception_handler(AppError)
async def handle_app_error(request: Request, exc: AppError):
    logger.error(f"AppError: {exc.code}", extra={"detail": exc.detail})
    return JSONResponse(status_code=exc.status, content={"success": False, "error": {"code": exc.code, "message": exc.user_message}})
```

## React (Frontend)

- Route 레벨에 `ErrorBoundary` 배치.
- API 에러: 사용자 친화적 메시지 표시. 기술적 세부사항은 콘솔만.
- Form 검증: zod schema + react-hook-form.
- 비동기 에러: try/catch + 사용자 알림 (toast/alert).

## Universal Rules

- 빈 catch 블록 금지. 최소한 로그 남기기.
- 에러 무시(swallow) 금지. 처리하거나 상위로 전파.
- 사용자 입력은 시스템 경계에서 검증. 내부 코드는 신뢰.
- 에러 메시지에 민감 정보(DB 쿼리, 내부 경로, 스택트레이스) 포함 금지.
