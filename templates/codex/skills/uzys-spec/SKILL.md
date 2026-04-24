---
name: uzys-spec
description: "Define phase — 구조화된 스펙을 코드 작성 전에 작성한다. Codex 포팅 (원본: .claude/commands/uzys/spec.md)"
---

# /uzys-spec — Define Phase (Codex)

> **Generated from**: `.claude/commands/uzys/spec.md` via `scripts/claude-to-codex.sh` (Phase C)
> **Slash**: `/uzys-spec` (Codex namespace 미지원으로 `:` → `-` rename)

## Pre-flight

이 skill 호출 전 확인:
- 직전 단계 없음 (최초 진입점)
- `docs/SPEC.md` 또는 `docs/specs/<feature>.md`가 아직 없거나 갱신 필요한 상황

## Goal

{SKILL_BODY_PLACEHOLDER}

## Codex 제약 참고

- `pre_tool_use` hook이 Bash 툴만 감지 (Issue #16732) — spec 작성 시 ApplyPatch 경로는 sandbox가 보호
- `child_agents_md=disabled` — docs/specs/*.md 계층 merge 수동 관리 필요

---

*Phase C에서 본 SKILL.md 본문이 `.claude/commands/uzys/spec.md`로부터 포팅됨.*
