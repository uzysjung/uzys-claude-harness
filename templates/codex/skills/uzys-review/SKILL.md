---
name: uzys-review
description: "Review phase — 다중 관점 리뷰로 품질을 검증한다. Codex 포팅 (원본: .claude/commands/uzys/review.md)"
---

# /uzys-review — review Phase (Codex)

> **Generated from**: `.claude/commands/uzys/review.md` via `scripts/claude-to-codex.sh` (Phase C)
> **Slash**: `/uzys-review`

## Pre-flight

이 skill 호출 전 확인:
- 직전 phase 완료 체크: `docs/todo.md`에서 이전 Phase 체크박스 확인
- `pre_tool_use` hook이 Skill matcher로 순서 강제 (Codex hook 시스템, ADR-002 v2)
- 직전 phase 미완료 시 exit 2로 차단됨

## Goal

{SKILL_BODY_PLACEHOLDER}

---

*Phase C에서 본 SKILL.md 본문이 `.claude/commands/uzys/review.md`로부터 포팅됨.*
