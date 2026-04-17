# CLI Dogfood — 2026-04-17

**Target**: uzysClaudeUniversalEnv (bash CLI 하네스)
**Version tested**: v26.14.1 + 후속 (`9735f0d`)
**Method**: setup-harness.sh + test-harness.sh의 주요 시나리오를 실제 사용자 관점에서 재현

## Summary

| Phase | Scenarios | Pass | Fail | Issues |
|-------|:-:|:-:|:-:|:-:|
| 1. Fresh install | 3 | TBD | TBD | TBD |
| 2. Multi-track | 2 | TBD | TBD | TBD |
| 3. --update cleanup | 1 | TBD | TBD | TBD |
| 4. Error paths | 3 | TBD | TBD | TBD |
| 5. Workflow gate | N | TBD | TBD | TBD |

## Severity

- **CRITICAL**: 기능 깨짐. 즉시 수정.
- **HIGH**: 사용자 혼동/잘못된 메시지. 수정 권장.
- **MEDIUM**: UX/보고 표 정확성. 개선 제안.
- **LOW**: cosmetic/문구.
