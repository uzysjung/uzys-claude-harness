# API Contract Rules

CSR Track에서 적용. 백엔드-프론트엔드 타입 일관성 보장.

## Contract-First Development

1. **Backend Pydantic = SSOT**: 백엔드 Pydantic 모델이 API 스키마의 source of truth.
2. **OpenAPI 생성**: FastAPI가 자동 생성하는 `/openapi.json` 사용.
3. **Frontend 타입 생성**: `openapi-typescript`로 TypeScript 타입 자동 생성.
4. **수동 타입 정의 금지**: 프론트엔드에서 API 응답 타입을 직접 작성하지 않음.

## Direction

```
Backend Pydantic → OpenAPI spec → openapi-typescript → Frontend types
```

역방향(Frontend → Backend) 금지.

## API Response Format

```python
class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    error: ErrorDetail | None = None
    meta: PaginationMeta | None = None
```

## Versioning

- API 경로: `/api/v1/...`
- 신규 엔드포인트는 v1에 추가. 기존 시그니처 변경 시 v2 고려.
