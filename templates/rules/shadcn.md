# shadcn/ui Rules

CSR, ssr-nextjs Track에서 적용.

## Component Management

- CLI로만 추가: `npx shadcn@latest add <component>`
- `components/ui/` 디렉토리는 **읽기 전용**. 직접 수정 금지.
- 커스터마이징은 래퍼 컴포넌트로. 원본 ui/ 파일 수정하지 않음.

## Theming

- 60/30/10 컬러 규칙: primary 60%, secondary 30%, accent 10%.
- 4px 기본 간격 단위 (Tailwind의 spacing scale 사용).
- 다크 모드: `next-themes` (Next.js) 또는 CSS 변수 토글.

## Forms

- `react-hook-form` + `zod` 조합 사용.
- shadcn의 Form 컴포넌트 연동.
- 서버 사이드 검증과 동일한 zod 스키마 공유.

## Accessibility

- WCAG 2.1 AA 이상.
- 키보드 내비게이션 확인.
- 아이콘은 `lucide-react`만 사용.

## Registry Safety

- 새 컴포넌트 추가 전 기존 설치 목록 확인.
- 중복 추가 방지.
- 버전 충돌 시 lockfile 기준으로 해결.
