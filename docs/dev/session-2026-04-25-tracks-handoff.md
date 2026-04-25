# Session Handoff — 신규 Track 2개 (project-management + growth-marketing)

> **Date**: 2026-04-25
> **Outgoing**: v0.4.0 ship 완료 (PR #38 / tag v0.4.0). PR #39 (streaming fix) 미머지. PR #40 (alirezarezvani marketplace 정정) 머지됨.
> **Incoming**: 신규 Track 2개 추가 SPEC 작성 + 구현.

---

## 1. 사용자 결정 사항 (Q&A 답변, 2026-04-25)

| Q | 답 |
|---|----|
| Q1 PM Track 이름 | `project-management` (full descriptive) |
| Q2 Growth Marketing Track 이름 | `growth-marketing` |
| Q3 growth-marketing 외부 자산 | **5종 모두** (marketing-skills + business-growth-skills + content-creator + demand-gen + research-summarizer) |
| Q4 product-skills 위치 | **모든 dev Track + project-management Track** (즉 `has-dev-track + project-management`) |
| Q5 진행 옵션 | **A: SPEC 먼저 작성** |

## 2. 신규 Track 2개 (확정 명세)

### Track: `project-management`

- **Persona**: PM, Scrum Master, Jira/Confluence 관리자
- **Baseline 성격**: executive-style (코드 없음, no test/commit policy)
- **외부 자산**:
  - `pm-skills@claude-code-skills` (6 — senior PM, scrum master, Jira expert, Confluence expert, Atlassian admin, template creator)
  - `product-skills@claude-code-skills` (15 — RICE, PRD, agile PO, UX research, landing, SaaS scaffolder 등)

### Track: `growth-marketing`

- **Persona**: Growth/Marketing Lead, Content Strategist
- **Baseline 성격**: executive-style + 콘텐츠 자료 작성
- **외부 자산** (모두 alirezarezvani/claude-skills marketplace):
  - `marketing-skills@claude-code-skills` (44 — content/SEO/CRO/channels/growth/intelligence/sales/twitter)
  - `business-growth-skills@claude-code-skills` (4 — 재사용)
  - `content-creator` (별도 plugin — SEO content + brand voice + frameworks)
  - `demand-gen` (다채널 demand gen + paid media + partnership)
  - `research-summarizer` (시장 조사 요약)

### product-skills 추가 위치 (재정리)

- 기존 외부 자산 catalog에 신규 entry 추가
- Condition: `has-dev-track + project-management` (executive 외 모두 + project-management)
- pluginId: `product-skills@claude-code-skills`
- 15 자산: product manager toolkit (RICE, PRDs), agile PO, product strategist, UX researcher, UI design system, competitive teardown, landing page generator, SaaS scaffolder, product analytics, experiment designer, product discovery, roadmap communicator, code-to-prd, research summarizer, apple-hig-expert

## 3. 변경 영역 (큰 변경)

| 영역 | 변경 |
|------|------|
| `src/types.ts` | TRACKS 9 → 11 (`project-management`, `growth-marketing` 추가) |
| `src/manifest.ts` | 두 Track baseline 자산 entry 추가 (rules/skills/agents 매핑) |
| `templates/project-claude/project-management.md` | 신규 |
| `templates/project-claude/growth-marketing.md` | 신규 |
| `templates/CLAUDE.md` | 두 Track 언급 (선택) |
| `src/external-assets.ts` | pm-skills + product-skills + marketing-skills + business-growth-skills (재사용) + content-creator + demand-gen + research-summarizer entries |
| `src/prompts.ts` | TRACK_LABELS 확장 |
| `src/router.ts` (필요 시) | Track 레이블 |
| `tests/installer-cli-matrix.test.ts` | 9 × 5 = 45 → **11 × 5 = 55** 시나리오 |
| `tests/installer-track-matrix.test.ts` | 두 Track × external 매핑 테스트 추가 |
| `tests/installer-9-track.test.ts` | rename → `installer-11-track.test.ts` 또는 갱신 |
| `docs/REFERENCE.md` | Track 표 갱신 |
| `README.md` + `README.ko.md` | Track 표 갱신 |
| `docs/USAGE.md` | Track 시나리오 추가 |

## 4. SPEC 작성 가이드 (다음 세션 진행)

**SPEC 위치**: `docs/specs/new-tracks-pm-growth.md`

**Status**: Draft (사용자 승인 후 Accepted)

**핵심 섹션**:
- Objective: 11 Track으로 확장 (PM + Growth Marketing 신규)
- AC1: types.ts TRACKS 11종 + 인터랙티브 prompts 라벨
- AC2: 두 Track baseline manifest entries 정상 작동 (test-harness)
- AC3: 외부 자산 신규 7종 (pm-skills, product-skills, marketing-skills, content-creator, demand-gen, research-summarizer + business-growth 재사용) catalog 추가
- AC4: 11 Track × 5 CLI mode = 55 시나리오 매트릭스 PASS
- AC5: README/USAGE/REFERENCE 갱신 (Track 카운트 + 자산)
- AC6: regression 0 (기존 9 Track + 45 시나리오 모두 보존)

**Phase 분해 제안**:
- Phase 1: TRACKS 확장 + manifest entries + project-claude 템플릿 신규 (1일)
- Phase 2: external-assets catalog 7종 추가 + executive 자산 재사용 (0.5일)
- Phase 3: 매트릭스 테스트 9→11 확장 + 신규 Track unit test (0.5일)
- Phase 4: README/USAGE/REFERENCE 갱신 + Ship v0.5.0 (0.5일)

**총**: ~2.5일.

## 5. 미머지 PR 정리

| PR | 상태 | 내용 |
|----|------|------|
| #39 | Open | streaming fix (Phase 1 즉시 표시 + 외부 자산 per-row) — **다음 세션 시작 시 우선 머지 권장** |
| 본 PR (#40) | Merged ✓ | alirezarezvani marketplace 통합 |

PR #39를 먼저 머지해야 사용자가 "Phase 1 멈춤" 문제 없이 신규 Track 검증 가능.

## 6. 환경 컨텍스트 요약

- **현재 main**: PR #38 (v0.4.0) + PR #40 (marketplace) 반영
- **package.json version**: 0.4.0
- **NORTH_STAR Phase**: 1 (어휘 완전성) 종결, Phase 2 (진입 효율) 진입 중
- **vitest threshold**: lines/funcs/stmt 90 / branches **89** (PR #39 머지 시 88로 추가 완화 검토)
- **test count**: 413
- **DO NOT CHANGE**: docs/SPEC.md (Phase 1 Finalization), templates/codex/, src/codex/transform.ts, ~/.claude/, ~/.codex/, ~/.opencode/

## 7. 다음 세션 시작 절차

1. `git pull` (main 동기화 확인)
2. PR #39 (streaming fix) 머지 — 사용자 승인 후
3. `/uzys:spec` → SPEC `docs/specs/new-tracks-pm-growth.md` 작성 (본 핸드오프 §2~4 참고)
4. SPEC Status Accepted 후 `/uzys:auto` → Phase 1~4 자동 진행
5. v0.5.0 ship

---

## Changelog

- 2026-04-25: 핸드오프 작성. 사용자 결정 + 외부 자산 조사 결과 + SPEC 가이드 보존.
