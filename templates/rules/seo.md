# SEO Rules

SSR Track (ssr-htmx, ssr-nextjs)에서 적용.

## Required Meta Tags

- `<title>`: 고유, 60자 이내
- `<meta name="description">`: 고유, 160자 이내
- `<link rel="canonical">`: 정규 URL
- Open Graph: `og:title`, `og:description`, `og:image`, `og:url`
- Twitter: `twitter:card`, `twitter:title`, `twitter:description`

## Semantic HTML

- `<h1>`: 페이지당 1개만
- 헤딩 계층 순서 유지 (h1 → h2 → h3, 건너뛰기 금지)
- `<img>`: `alt` 속성 필수. 장식 이미지는 `alt=""`
- `<a>`: 의미 있는 링크 텍스트 ("여기" 금지)

## Performance (Core Web Vitals)

| 지표 | 목표 |
|------|------|
| LCP (Largest Contentful Paint) | < 2.5s |
| CLS (Cumulative Layout Shift) | < 0.1 |
| INP (Interaction to Next Paint) | < 200ms |

## Images

- 지연 로딩: `loading="lazy"` (뷰포트 밖 이미지)
- 크기 명시: `width`, `height` 속성 (CLS 방지)
- 최적화 포맷: WebP/AVIF 우선

## SSR-Specific

### ssr-htmx (FastAPI)
```python
@app.get("/robots.txt")
async def robots(): ...

@app.get("/sitemap.xml")
async def sitemap(): ...
```

### ssr-nextjs
- `generateMetadata` API 사용
- `app/sitemap.ts`, `app/robots.ts`
- JSON-LD 구조화 데이터
