Define phase — 구조화된 스펙을 코드 작성 전에 작성한다.

## Process

1. 요청이 모호하면 먼저 아이디어를 정제한다 (agent-skills idea-refine 패턴 활용).
2. agent-skills의 spec-driven-development 스킬을 따라 SPEC.md를 작성한다.
   - 6가지 핵심 영역: Objective, Commands, Project Structure, Code Style, Testing Strategy, Boundaries
3. 대형 프로젝트(비즈니스 맥락 필요)면 PRD 템플릿(Docs/dev/PRD-TEMPLATE-standalone.md)을 참조하여 확장.
4. Non-Goals를 반드시 명시한다 — "미언급 = 범위 밖" 원칙.
5. DO NOT CHANGE 영역을 식별하고 SPEC에 기록한다.
6. SPEC.md를 `docs/SPEC.md`에 저장한다.

## Test Environment Parity (필수 질의)

SPEC 작성 시 다음 4개 항목을 **명시적으로 질문하고 기록**한다. 미기재 시 SPEC 미완료 — Build 단계에서 dev-prod drift 버그로 이어짐.

1. **Prod DB 엔진** — Postgres/MySQL/SQLite/Redis 등 + 버전
2. **테스트 DB 전략** — testcontainer / docker-compose / staging DB / none. SQLite 대체는 Prod가 SQLite인 경우에만 허용 (test-policy.md Dev-Prod Parity)
3. **외부 의존성** — Stripe, Supabase, Railway, SES 등. 각각 Mock / Live staging 중 어떤 전략인지
4. **핵심 E2E 플로우** — 인증(login/callback/me), 결제(checkout/webhook), 파일업로드 등 Mock 금지 대상 목록

이 4개는 SPEC.md의 "Testing Strategy" 섹션에 표로 정리한다.

## Gate

이 단계가 완료되어야 `/uzys:plan`으로 진행 가능.
SPEC.md가 존재하고, 최소 Objective + Boundaries가 정의되어 있어야 완료.

## Auto-Actions

- SPEC.md가 300줄을 초과하면 spec-scaling 스킬로 기능별 분리 제안.
- change-management.md 규칙 적용: 이후 SPEC 변경 시 CR 분류.

## Gate Status Update

이 단계가 성공적으로 완료되면 `.claude/gate-status.json`의 `define.completed`를 `true`로, `define.timestamp`를 현재 시각으로 업데이트한다.

```bash
jq '.define.completed = true | .define.timestamp = now | .define.timestamp = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))' .claude/gate-status.json > /tmp/gate-tmp.json && mv /tmp/gate-tmp.json .claude/gate-status.json
```
