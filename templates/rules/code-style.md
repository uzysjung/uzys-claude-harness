# Code Style

## Python

- **Formatter**: ruff format (black 호환)
- **Linter**: ruff check
- **타입 힌트**: 필수. 모든 함수 시그니처에 타입 명시.
- **Naming**: snake_case (변수, 함수), PascalCase (클래스)
- **import 순서**: stdlib → third-party → local (ruff isort)
- `any`, `type: ignore` 사용 최소화. 불가피 시 사유 주석.

## TypeScript

- **Formatter**: prettier
- **Linter**: eslint (strict config)
- **Strict mode**: `"strict": true` in tsconfig.json
- **타입**: `any` 금지. `unknown` + 타입 가드 사용.
- **Naming**: camelCase (변수, 함수), PascalCase (컴포넌트, 타입)
- `as` 타입 단언 최소화. 타입 가드나 제네릭 사용.

## Universal Rules

- **불변성**: 새 객체 생성. 기존 객체 mutation 금지. spread 사용.
- **파일 크기**: 200-400줄 기준, 800줄 상한. 초과 시 분리.
- **함수 크기**: 50줄 이하. 초과 시 분리.
- **중첩 깊이**: 4레벨 이하. early return으로 중첩 감소.
- **하드코딩 금지**: 상수 또는 환경 변수 사용.
- **매직 넘버 금지**: 의미 있는 상수명 부여.
- **console.log**: 디버깅 후 반드시 제거. 영구 로깅은 structured logger 사용.
