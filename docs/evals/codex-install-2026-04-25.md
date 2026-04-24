# Codex CLI Dogfood Verification — 2026-04-25

> **Scope**: SPEC `docs/specs/codex-compat.md` AC2 (≥2 Track Codex 설치 검증) + AC4 (MCP smoke test) + Phase F.
> **Codex Version**: 0.124.0 (`/usr/local/Caskroom/codex/0.124.0`)
> **Branch**: `feat/codex-phase-ef-dogfood`
> **Linked**: `docs/decisions/ADR-002-codex-hook-gap.md` v2 (Accepted)

## 절차

각 Track 별 임시 디렉토리 생성 후 비대화형 설치:
```bash
bash scripts/setup-harness.sh --track <track> --cli codex --project-dir <tmp>/<track> </dev/null
```

검증 단계:
1. `setup-harness.sh` exit code = 0
2. 7개 필수 파일 생성 검증 (AGENTS.md + 3 hooks + 2 skills + config.toml)
3. **Codex 자체로 config.toml 파싱** (`CODEX_HOME=tmp + codex features list`)
4. MCP 서버 블록 [mcp_servers.X] 존재 확인 (.mcp.json 변환)
5. Hook 스크립트 stdin JSON 시뮬레이션 (session-start, hito-counter)

## 결과

### Track 1 — `tooling`

| 검증 항목 | 결과 |
|-----------|------|
| `setup-harness.sh` exit | **0** |
| `AGENTS.md` 생성 | OK (8240 B) |
| `.codex/config.toml` 생성 | OK (3997 B) |
| `.codex/hooks/session-start.sh` | OK (1290 B, +x) |
| `.codex/hooks/hito-counter.sh` | OK (991 B, +x) |
| `.codex/hooks/gate-check.sh` | OK (4492 B, +x) |
| `.codex-skills/uzys-spec/SKILL.md` | OK (4367 B) |
| `.codex-skills/uzys-ship/SKILL.md` | OK (2076 B) |
| Codex `config.toml` 파싱 | **PASS** (`features list` 65 features, errors 0) |
| MCP 블록 | `[mcp_servers.context7]`, `[mcp_servers.github]`, `[mcp_servers.chrome-devtools]` |
| Hook session-start stdin JSON | exit=0, JSON output 정상 |
| Hook hito-counter stdin JSON | exit=0 |

### Track 2 — `csr-fastapi`

| 검증 항목 | 결과 |
|-----------|------|
| `setup-harness.sh` exit | **0** |
| `AGENTS.md` 생성 | OK (8244 B) |
| `.codex/config.toml` 생성 | OK (4021 B) |
| `.codex/hooks/session-start.sh` | OK (1290 B, +x) |
| `.codex/hooks/hito-counter.sh` | OK (991 B, +x) |
| `.codex/hooks/gate-check.sh` | OK (4492 B, +x) |
| `.codex-skills/uzys-spec/SKILL.md` | OK (4367 B) |
| `.codex-skills/uzys-ship/SKILL.md` | OK (2076 B) |
| Codex `config.toml` 파싱 | **PASS** (`features list` 65 features, errors 0) |
| MCP 블록 | `[mcp_servers.context7]`, `[mcp_servers.github]`, `[mcp_servers.chrome-devtools]` |
| Hook session-start stdin JSON | exit=0, JSON output 정상 |
| Hook hito-counter stdin JSON | exit=0 |

## 글로벌 영향 (D16 / ADR-002 v2 D4 검증)

비대화형 stdin(`</dev/null`)로 실행 시 opt-in 프롬프트 자동 거부 → 글로벌 변경 없음:

| 영역 | 상태 |
|------|------|
| `~/.codex/skills/` | 미변경 (기존 비어있음) |
| `~/.codex/config.toml` trust entry | **미추가** (`grep -c trust_level` = 1, 사용자 기존 1건 그대로) |
| `~/.claude/` | mtime 불변 |

opt-in 거부 시 stderr 안내:
```
trust entry 등록 스킵 — 프로젝트 hook이 로드되지 않을 수 있음
(수동: ~/.codex/config.toml 에 [projects."<path>"] trust_level="trusted" 추가)
```

## AC 영향

| AC | 직전 | 현재 |
|----|------|------|
| **AC1** (`--cli=codex` 무인 설치) | ✅ (Phase D T23.6) | ✅ 유지 |
| **AC2** (≥2 Track 검증) | Pending | **✅ Pass** (tooling + csr-fastapi 2/2) |
| **AC3** (6 skill slash) | ✅ | ✅ |
| **AC4** (MCP 2+ 서버) | ✅ (병합 자동) | **✅ 실측 확인** (3 서버 매핑) |
| **AC5** (Hook 포맷 변환) | ✅ ADR-002 v2 | **✅ 실측 hook 실행 검증** |
| **AC6** (Claude regression 0) | ✅ | ✅ 유지 |

## OQ 진척

- **OQ7** (Issue #17532 인터랙티브 세션 hook 미로드) — 본 dogfood는 **비대화형 `codex exec` 컨텍스트**로 검증. 인터랙티브 세션(`codex` 직접) 검증은 후속 (실측 시 model API 호출 비용 발생).
- **OQ8** (Plugin 번들 배포 채택 여부) — 본 SPEC 범위 밖. Phase G에서 사용자 결정.

## 한계

- **Live model 호출 미수행**: `codex exec "Hello"` 등 실제 LLM 호출은 비용 회피 + 본 SPEC AC 범위 밖. Hook stdin/stdout 호환성은 시뮬레이션으로 검증.
- **OQ7 인터랙티브 세션 hook**: 별도 라이브 세션에서 1회 검증 필요. 현재 단계에서 결과 영향 없음 (config.toml + hook 구조는 verified).
- 임시 디렉토리는 dogfood 후 정리.

## 결론

**SPEC AC1~AC6 전부 Pass**. Codex 호환 풀 하네스 복제 1차 (Codex 타깃) 완료.

후속:
- Phase G — README Codex 섹션 추가 + 사용자 가이드
- v27.19.0 (또는 v28.x) 태그 (Phase F+G 완료 후)
- Phase 1 Finalization (`docs/SPEC.md`) 와의 통합 — AC3 HITO baseline 경과 후 (~2026-04-30)
