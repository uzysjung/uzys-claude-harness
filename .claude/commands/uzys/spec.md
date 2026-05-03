Define phase — 구조화된 스펙을 코드 작성 전에 작성한다.

## Process

1. 요청이 모호하면 먼저 아이디어를 정제한다 (agent-skills idea-refine 패턴 활용).
2. agent-skills의 spec-driven-development 스킬을 따라 SPEC.md를 작성한다.
   - 6가지 핵심 영역: Objective, Commands, Project Structure, Code Style, Testing Strategy, Boundaries
3. 대형 프로젝트(비즈니스 맥락 필요)면 PRD 템플릿(Docs/dev/PRD-TEMPLATE-standalone.md)을 참조하여 확장.
4. Non-Goals를 반드시 명시한다 — "미언급 = 범위 밖" 원칙.
5. DO NOT CHANGE 영역을 식별하고 SPEC에 기록한다.
6. SPEC.md를 `docs/SPEC.md`에 저장한다.

## Pre-SPEC 필수 접수 (UI/Test/E2E)

SPEC 작성 **전에** 다음 항목을 사용자에게 질문하고 SPEC에 기록한다. 미기재 시 SPEC 미완료 — Build 단계에서 drift 버그로 이어짐.

### A. Test Environment Parity

1. **Prod DB 엔진** — Postgres/MySQL/SQLite/Redis 등 + 버전
2. **테스트 DB 전략** — testcontainer / docker-compose / staging DB / none. SQLite 대체는 Prod가 SQLite인 경우에만 허용 (test-policy.md Dev-Prod Parity)
3. **외부 의존성** — Stripe, Supabase, Railway, SES 등. 각각 Mock / Live staging 중 어떤 전략인지

→ SPEC.md "Testing Strategy" 섹션에 표로 정리.

### B. 핵심 E2E 플로우

- **Mock 금지 대상 목록**: 인증(login/callback/me), 결제(checkout/webhook), 파일업로드 등
- 각 플로우별 성공 기준 (예: "login → /me 200 + user_id 일치")

→ SPEC.md "Testing Strategy"의 E2E 하위 목록으로.

### C. Design Context (UI Track인 경우)

UI 포함 Track(csr-*/ssr-*/full)이면 SPEC 전에 다음 확인:

1. **`DESIGN.md` 존재 여부** — 디자인 방향/톤/레이아웃 원칙 기록. 없으면 `/teach` 또는 `/shape` 스킬로 먼저 작성 유도
2. **`.impeccable.md` 존재 여부** — 브랜드/청중/톤 컨텍스트. 없으면 `/teach` 선행
3. **디자인 참조물** — Figma 링크, 스크린샷, 경쟁사 레퍼런스 등

디자인 컨텍스트 없이 UI 코드 작성 금지. Generic AI 미학 산출물 방지.

### D'. GitHub Issue Tracking (선택)

`git remote -v`로 GitHub remote 확인 가능 + 사용자가 issue를 backlog/소통 채널로 쓰고 싶으면:

- `docs/SPEC.md`에 `issue_tracking: enabled` 라인 명시 (opt-in)
- 활성화 시 `gh-issue-workflow` skill이 `/uzys:plan`, `/uzys:build`, `/uzys:ship`에서 자동 결합
- ISSUE 본문은 `templates/skills/gh-issue-workflow/ISSUE.template.md`의 5섹션(배경/전제/방향성/AC/후속) 강제

기본은 비활성. SPEC에 명시 없으면 모든 단계에서 skip.

### D. North Star (선택, 대형 프로젝트 권장)

`docs/NORTH_STAR.md` 부재 + 다음 중 1개 이상 해당 시 작성 권장:

- 6개월 이상 지속 예상되는 프로젝트
- 복수 Phase / 복수 사용자 / 외부 의존성이 명확한 경우
- 신규 기능 우선순위 결정이 잦을 것으로 예상

작성 시 `north-star` 스킬 호출 → `templates/skills/north-star/NORTH_STAR.template.md`를 `docs/NORTH_STAR.md`로 복사 후 7개 섹션(NS Statement / NSM / Will-Won't / Phase / 4-gate / Versioning / Changelog) 채움. 단순 1회성 작업이면 skip.

---

위 A/B/C **세 블록은 SPEC 작성 전 접수** (D는 선택). 답변 없으면 "이 항목 정의가 필요합니다" 질문으로 돌아가 반복. 모두 수집된 후에 본 SPEC 작성 진행.

## Gate

이 단계가 완료되어야 `/uzys:plan`으로 진행 가능.
SPEC.md가 존재하고, 최소 Objective + Boundaries가 정의되어 있어야 완료.

## Auto-Actions

- SPEC.md가 300줄을 초과하면 spec-scaling 스킬로 기능별 분리 제안.
- change-management.md 규칙 적용: 이후 SPEC 변경 시 CR 분류.

## Gate Status Update

이 단계가 성공적으로 완료되면 `.claude/gate-status.json` 을 다음 두 동작으로 갱신한다:

1. `define.completed = true` + `define.timestamp = now`
2. **후속 5단계 (`plan` / `build` / `verify` / `review` / `ship`) 모두 리셋** — `completed = false`, `timestamp = null`

**원칙**: SPEC 재정의 = 새 cycle 시작 = 후속 모든 게이트 리셋. 이전 cycle 의 ship 완료 상태가 새 cycle 게이트를 만족시키는 정합성 위반을 차단한다 (gate bypass 방지).

```bash
jq '.define.completed = true
    | .define.timestamp = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))
    | .plan.completed   = false | .plan.timestamp   = null
    | .build.completed  = false | .build.timestamp  = null
    | .verify.completed = false | .verify.timestamp = null
    | .review.completed = false | .review.timestamp = null
    | .ship.completed   = false | .ship.timestamp   = null' .claude/gate-status.json > /tmp/gate-tmp.json && mv /tmp/gate-tmp.json .claude/gate-status.json
```
