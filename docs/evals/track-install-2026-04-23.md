# Track Fresh Install Verification — 2026-04-23

> **Scope**: SPEC AC4 Phase 2 Entry Checklist #1 ("9 Track clean install 성공률 ≥ 95%")
> **Context**: Phase B(2026-04-23)에서 tooling/executive/full 3 Track 검증 완료. 나머지 6 Track(csr-*, ssr-*, data) 단독 fresh install 확장 검증.
> **Version**: v27.17.0 + main 최신 (commit 1cca8c6)

## 절차

1. `mktemp -d` 로 임시 베이스 디렉토리 생성
2. 각 Track 별 서브 디렉토리 생성 후 `bash scripts/setup-harness.sh --track <name> --project-dir <path> </dev/null` 실행 (비대화형)
3. exit code + 생성 파일 6종 존재 검증:
   - `.claude/CLAUDE.md`, `.claude/settings.json`, `CLAUDE.md`, `.claude/commands/uzys/`, `.claude/rules/`, `.mcp.json`
4. `~/.claude/` D16 보호 영역 미수정 확인

## 결과

### 이번 세션 (6 Track)

| Track | exit | .claude/CLAUDE.md | settings.json | CLAUDE.md | commands/uzys | rules | .mcp.json | uzys cmds | rules 개수 | 판정 |
|-------|------|-------------------|---------------|-----------|---------------|-------|-----------|-----------|-----------|------|
| csr-supabase | 0 | OK | OK | OK | OK | OK | OK | 7 | 10 | PASS |
| csr-fastify  | 0 | OK | OK | OK | OK | OK | OK | 7 | 11 | PASS |
| csr-fastapi  | 0 | OK | OK | OK | OK | OK | OK | 7 | 11 | PASS |
| ssr-htmx     | 0 | OK | OK | OK | OK | OK | OK | 7 | 9  | PASS |
| ssr-nextjs   | 0 | OK | OK | OK | OK | OK | OK | 7 | 10 | PASS |
| data         | 0 | OK | OK | OK | OK | OK | OK | 7 | 9  | PASS |

### Phase B 기등록 (3 Track)

| Track | 근거 |
|-------|------|
| tooling   | `docs/todo.md` B2 / `docs/dogfood/cli-dogfood-2026-04-23.md` |
| executive | 동일 |
| full      | 동일 |

## 최종 판정

- **9/9 Track PASS**, 성공률 **100%** — NSM 2차 지표 ≥ 95% 충족.
- `~/.claude/CLAUDE.md` mtime 불변 (D16 보호 준수).
- 7 `uzys:*` 명령 + Track별 9~11개 rules 일관 설치.

## AC 영향

- **AC4 #1** (9 Track clean install 성공률): **부분 충족 → Pass** 로 전환.

## 비고

- `~/.claude/` 하위 Claude Code 자체 운영 파일(`metrics/costs.jsonl`, `bash-commands.log`, `tasks/*`)은 세션 사용 중 자동 갱신되지만 D16 보호 영역(`CLAUDE.md`, 설정 파일)과 무관.
- 임시 디렉토리: `/var/folders/gn/.../T/e1-track-install-XXXXXX.28c4jBZoRG` (세션 종료 후 정리).
