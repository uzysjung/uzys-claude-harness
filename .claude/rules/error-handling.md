# Error Handling

"에러 무시 금지", "빈 catch 금지"는 linter가 처리. 여기는 프로젝트 특화 규약만.

## 에러 응답 포맷 (FastAPI 백엔드)

구조화된 JSON. 스택트레이스/내부 경로/DB 쿼리 등 민감 정보 노출 금지.

```json
{ "success": false, "error": { "code": "...", "message": "..." } }
```

커스텀 예외 클래스 + 전역 exception handler로 일관성 유지. 에러 로깅 시 context 필수(request_id, user_id, endpoint).

## 외부 API 호출

timeout + 1회 재시도(exponential backoff). 무한 재시도 금지.

## 프론트엔드

- Route 레벨 `ErrorBoundary` 배치.
- 사용자 메시지는 친화적으로, 기술 세부사항은 콘솔만.
- Form 검증은 schema 기반(zod 등).
