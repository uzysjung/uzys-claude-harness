# Tauri Rules

CSR Track에서 데스크탑/모바일 확장 시 적용. PRD에 데스크탑 요구사항이 있을 때만.

## Structure

- Tauri 코드는 `src-tauri/` 에만 위치.
- 프론트엔드 ↔ Tauri IPC는 `src/lib/tauri.ts` 래퍼를 통해서만.
- 직접 `@tauri-apps/api` import 금지 — 래퍼 사용.

## IPC Pattern

```typescript
// src/lib/tauri.ts
import { invoke } from '@tauri-apps/api/core';

export async function readConfig(): Promise<Config> {
  return invoke<Config>('read_config');
}
```

## Feature Detection

```typescript
const isTauri = () => typeof window !== 'undefined' && '__TAURI__' in window;
```

웹과 데스크탑 모두에서 동작해야 할 때 feature detection 사용.

## Build

- `cargo tauri dev` — 개발 모드
- `cargo tauri build` — 프로덕션 빌드
- 빌드 전 프론트엔드 빌드가 먼저 완료되어야 함.

## Security

- Tauri의 capability 시스템으로 최소 권한 부여.
- 파일 시스템 접근은 명시적으로 허용된 경로만.
- IPC 핸들러에서 사용자 입력 검증 필수.
