# Next.js Rules

ssr-nextjs Track에서 적용.

## Routing

- **App Router only**. Pages Router 사용 금지.
- 동적 라우트: `[param]` / `[...catchAll]`
- Route Groups: `(group)` 으로 레이아웃 공유
- `generateStaticParams` 사용하여 정적 경로 사전 생성

## Server vs Client Components

- **기본은 Server Component**. `'use client'`는 필요할 때만.
- `'use client'` 사용 시점: useState, useEffect, 이벤트 핸들러, 브라우저 API
- 서버/클라이언트 경계를 최대한 아래로 밀어내기. 가능한 한 작은 client component.

## Data Fetching

- `fetch` 옵션 명시적으로 지정:
  - `{ cache: 'force-cache' }` — 정적 데이터
  - `{ cache: 'no-store' }` — 동적 데이터
  - `{ next: { revalidate: 3600 } }` — ISR
- Server Actions: `'use server'` 지시어, 폼 mutation에 사용

## Assets

- `next/image`: 모든 이미지에 사용. `<img>` 직접 사용 금지.
- `next/font`: 폰트 최적화. Google Fonts 등.
- 환경 변수: 클라이언트 노출 시 `NEXT_PUBLIC_` 접두사.

## Middleware

- `middleware.ts`: 인증 리다이렉트, locale 감지에만 사용.
- 무거운 로직 금지 — middleware는 edge에서 실행.
