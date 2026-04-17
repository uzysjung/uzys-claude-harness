# Performance Optimization

Claude Code CLI 조작법(Option+T, build-error-resolver 호출법)은 rule이 아니므로 제외. 모델 선택 원칙만 유지.

## 모델 선택 (참고 — 강제 아님)

작업 성격에 따라 사용자가 `/model`로 선택. 에이전트는 필요 시 제안만 한다.

| 모델 | 권장 쓰임새 |
|------|-----------|
| Haiku 4.5 | 경량/반복 작업, worker agent |
| Sonnet 4.6 | 일상 개발, 복합 코딩 |
| Opus 4.5 | 아키텍처 결정, 깊은 추론 |

## Context Window

다음은 context 50% 도달 전에 수행:
- 대형 리팩터링
- 여러 파일 동시 수정
- 복잡한 상호작용 디버깅

50% 초과 시 /compact 고려.
