Define phase — 구조화된 스펙을 코드 작성 전에 작성한다.

## Process

1. 요청이 모호하면 먼저 아이디어를 정제한다 (agent-skills idea-refine 패턴 활용).
2. agent-skills의 spec-driven-development 스킬을 따라 SPEC.md를 작성한다.
   - 6가지 핵심 영역: Objective, Commands, Project Structure, Code Style, Testing Strategy, Boundaries
3. 대형 프로젝트(비즈니스 맥락 필요)면 PRD 템플릿(Docs/dev/PRD-TEMPLATE-standalone.md)을 참조하여 확장.
4. Non-Goals를 반드시 명시한다 — "미언급 = 범위 밖" 원칙.
5. DO NOT CHANGE 영역을 식별하고 SPEC에 기록한다.
6. SPEC.md를 `docs/SPEC.md`에 저장한다.

## Gate

이 단계가 완료되어야 `/uzys:plan`으로 진행 가능.
SPEC.md가 존재하고, 최소 Objective + Boundaries가 정의되어 있어야 완료.

## Auto-Actions

- SPEC.md가 300줄을 초과하면 spec-scaling 스킬로 기능별 분리 제안.
- change-management.md 규칙 적용: 이후 SPEC 변경 시 CR 분류.
