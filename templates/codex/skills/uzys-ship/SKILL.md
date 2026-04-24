---
name: uzys-ship
description: "Ship phase — 프리런치 체크리스트 실행 후 배포한다. Codex 포팅 (원본: .claude/commands/uzys/ship.md)"
---

# /uzys-ship — ship Phase (Codex)

> **Generated from**: `.claude/commands/uzys/ship.md` via `scripts/claude-to-codex.sh` (Phase C)
> **Slash**: `/uzys-ship`

## Pre-flight

이 skill 호출 전 확인:
- 직전 phase 완료 체크: `docs/todo.md`에서 이전 Phase 체크박스 확인
- `pre_tool_use` hook이 Skill matcher로 순서 강제 (Codex hook 시스템, ADR-002 v2)
- 직전 phase 미완료 시 exit 2로 차단됨

## Goal

{SKILL_BODY_PLACEHOLDER}

---

*Phase C에서 본 SKILL.md 본문이 `.claude/commands/uzys/ship.md`로부터 포팅됨.*
