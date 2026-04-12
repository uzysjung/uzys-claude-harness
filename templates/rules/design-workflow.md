# Design Workflow

UI가 포함된 작업 시 적용. (csr-*, ssr-* Track)

## Pre-Build Checklist

1. `DESIGN.md` 존재 확인 → 있으면 디자인 방향/톤 참조
2. `.impeccable.md` 존재 확인 → 있으면 브랜드/청중/톤 컨텍스트 참조
3. 둘 다 없으면 → `/imm:teach`로 디자인 컨텍스트 설정 제안

## Impeccable Integration

설치된 Impeccable 스킬은 `imm:` 네임스페이스로 사용 가능:

- `/imm:teach` — 브랜드/청중/톤 설정 → `.impeccable.md` 생성
- `/imm:shape` — UX/UI 계획 (코드 전 설계)
- `/imm:impeccable` — 프로덕션 수준 인터페이스 생성
- `/imm:polish` — 최종 품질 패스 (정렬, 간격, 일관성)
- `/imm:critique` — UX 관점 평가
- `/imm:audit` — 접근성, 성능, 테마, 반응형 품질 체크

## Design Principles

- Generic AI 미학 금지 — 대담한 방향을 선택하고 일관성 유지.
- 컴포넌트 라이브러리(shadcn/ui 등) 스타일과 충돌하지 않도록.
- 접근성: WCAG 2.1 AA 이상.
- 반응형: 모바일 우선, 브레이크포인트 적절히 활용.
