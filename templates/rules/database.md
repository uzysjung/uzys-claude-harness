# Database Rules

csr-fastify, csr-fastapi Track에서 적용.

## ORM & Migration

- **SQLModel** + asyncpg (Python). SQLAlchemy Core 접근 가능.
- **Alembic**으로만 마이그레이션. 수동 DDL 금지.
- 마이그레이션 생성: `alembic revision --autogenerate -m "description"`
- 마이그레이션 적용: `alembic upgrade head`

## Model Conventions

- PK: `id = Field(default_factory=uuid4, primary_key=True)` (UUID v4)
- `created_at`, `updated_at` 필수 (서버 사이드 타임스탬프).
- 소프트 삭제 시: `deleted_at: datetime | None = None`

## Query Patterns

- **N+1 방지**: eager loading (`selectinload`, `joinedload`)
- **페이징**: cursor 기반 (offset 기반 대규모에서 성능 저하)
- **인덱스**: WHERE/ORDER BY에 사용되는 컬럼에 인덱스 추가
- `SELECT *` 금지 — 필요한 컬럼만

## Safety

- 파라미터화된 쿼리만 사용. 문자열 결합 금지.
- 스키마 변경은 Major Change Request 대상.
- 프로덕션 DB 직접 접근 금지. 마이그레이션 통해서만.
