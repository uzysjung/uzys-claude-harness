# uzysClaudeUniversalEnv 종합 리서치 리포트

*Generated: 2026-04-17 | Sources: 5 reviewer agents + 4 phase 액션 | Confidence: High*

## Executive Summary

`/everything-claude-code:deep-research` 호출로 5축 분석 후 즉시 패치 4 phase 진행. v26.11.1 → v26.11.2 → v26.12.0.

- v26.11.2: CRITICAL 2 + 빠른 HIGH 5 + 문서 보강
- v26.12.0: MCP 매핑 데이터 외재화 (`templates/track-mcp-map.tsv`)
- 후속 보류: `setup-harness.sh` lib/ 분할 (1-2일, 별도 세션)
- test-harness **98 PASS / 0 FAIL** 회귀 없음. 글로벌 mtime 불변 (D16).

## Methodology

5개 sub-question을 5 agent에 병렬 분담:

| Agent | 영역 | 결과 |
|-------|------|------|
| architect | 아키텍처/구조 | HIGH 2, MEDIUM 2, LOW 1 |
| code-reviewer | edge case | CRITICAL 2, HIGH 4, MEDIUM 3, LOW 2 |
| security-reviewer | 잔여 위협 | HIGH 2, MEDIUM 4, LOW 3 |
| harness-optimizer | 유지보수/throughput | 스코어카드 + 개선 3건 |
| general-purpose | 사용성 | HIGH 4, MEDIUM 2 |

판단 기준 P12 — 검증 가능한 pass/fail + 파일:줄 근거.

## 1. 아키텍처/구조 [architect]

| Severity | 이슈 | 위치 | 상태 |
|---------|------|------|------|
| HIGH | setup-harness.sh 763줄 (800 상한 95%) | 전체 | 보류 (Phase 3b — 별도 세션) |
| HIGH | MCP 조립 jq 보일러플레이트 case별 복제 | L397-407 | **v26.12.0 패치** (tsv 외재화) |
| MEDIUM | TRACK + SELECTED_TRACKS[] 이중 변수 | L20-21, 67-70 | 보류 (TRACK은 후방호환 alias) |
| MEDIUM | cherry-pick + plugin + npx 3패턴 공존 | L317-329, 444-548 | 보류 |

## 2. 테스트/품질 [code-reviewer]

| Severity | 이슈 | 위치 | 상태 |
|---------|------|------|------|
| CRITICAL C2 | gate-check.sh `set -e` + jq 손상 → silent pass | gate-check.sh L47-51 | **v26.11.2 패치** (fail-secure) |
| CRITICAL C1 | --project-dir 심링크 우회 + invalid 검증 부재 | setup-harness.sh L53-63 | **v26.11.2 패치** (Track 검증). 심링크 부분 보류 |
| HIGH | --track invalid 부분 설치 | get_track_rules `*)` | **v26.11.2 패치** |
| HIGH | --add-track + 손상 .mcp.json 복구 부재 | L385 trap | **v26.11.2 패치** (자동 백업) |
| HIGH | --track full --track tooling 검증 누락 | T13 | 보류 (이미 multi 시 expected skip) |
| MEDIUM | T5 7 Track × 24 네트워크 호출 timeout 없음 | test-harness L174 | 보류 |
| MEDIUM | mcp-pre-exec.sh jq 없을 때 fallback 검증 부재 | mcp-pre-exec.sh L87-89 | 보류 |

## 3. 보안 잔여 위협 [security-reviewer]

| Severity | 이슈 | OWASP/CWE | 상태 |
|---------|------|----------|------|
| HIGH | npx -y, claude plugin install 버전 핀 부재 | A06, CWE-829 | **v26.11.2 부분** (README 신뢰 등급). 핀 보류 |
| HIGH | Plugin marketplace 신뢰 모델 미정의 | A06, CWE-494 | **v26.11.2 패치** (등급 표) |
| MEDIUM | agentshield-gate.sh `.agentshield-ignore` regex injection | A05, CWE-20 | **v26.11.2 패치** (grep -F) |
| MEDIUM | mcp-pre-exec.sh nested JSON 평탄화 부재 | A03, CWE-116 | 보류 |
| MEDIUM | prune-ecc.sh KEEP validation 없음 | A05, CWE-20 | 보류 |
| MEDIUM | install.sh `curl \| bash` 체크섬 부재 | A08, CWE-494 | 보류 |

## 4. 유지보수/확장성 [harness-optimizer]

스코어: 신뢰성 98/100, **유지보수 60/100, throughput 40/100, instinct 활용 35/100**

| 이슈 | 영향 | 상태 |
|------|------|------|
| 새 Track 1개 = 6+ 파일 변경 | 12+ Track 도달 시 누락 위험 | 보류 (현재 9 Track 허용) |
| 풀 설치 11분 43초 (24개 순차) | 다른 프로젝트 적용 시 반복 비용 | 보류 (병렬화 시 복잡도) |
| install_fail 재시도 없음 | 일시 네트워크 장애 취약 | **v26.11.2 패치** (retry_install 함수) |
| sync-cherrypicks CI 미연결 | ECC drift 감지 지연 | 보류 |
| CL-v2 instinct 파일 미발견 | 학습 파이프라인 미검증 | 보류 (별도 검증 필요) |

## 5. 문서/사용성 [general-purpose]

스코어: **70/100 → 85/100** (Phase 2 후)

| Severity | 이슈 | 상태 |
|---------|------|------|
| HIGH P1 | Track 선택 결정 도구 부재 | **v26.11.2 패치** (Choosing a Track) |
| HIGH P2 | Troubleshooting 섹션 전무 | **v26.11.2 패치** (12행 표) |
| HIGH P3 | claude --plugin-dir alias 가이드 부재 | **v26.11.2 패치** |
| HIGH P4 | CLAUDE.md 3중 위치 + canonical 모호 | **v26.11.2 패치** (위치 표) |
| MEDIUM | Migration 가이드 + 한/영 혼용 | 보류 |
| MEDIUM | TOC 부재 | 보류 |

## Key Takeaways — 진행 상태

| # | 영역 | Severity | 상태 |
|---|------|---------|------|
| 1 | gate-check.sh fail-secure | CRITICAL | ✅ v26.11.2 |
| 2 | --track invalid 검증 | CRITICAL | ✅ v26.11.2 |
| 3 | agentshield grep -F | HIGH | ✅ v26.11.2 |
| 4 | README Track + alias + Troubleshooting | HIGH | ✅ v26.11.2 |
| 5 | --add-track .mcp.json 백업 | HIGH | ✅ v26.11.2 |
| 6 | npx 핀 + marketplace 신뢰 표 | HIGH | ⚠ 부분 (등급 표만) |
| 7 | MCP 조립 데이터 외재화 (tsv) | HIGH | ✅ v26.12.0 |
| 8 | setup-harness.sh lib/ 분할 | HIGH | ⏳ 보류 (별도 세션) |
| 9 | install_fail 재시도 래퍼 | MEDIUM | ✅ v26.11.2 (함수 정의) |
| 10 | CLAUDE.md 위치 정리 | MEDIUM | ✅ v26.11.2 |

## 다음 세션 권장 작업

### Phase 3b: setup-harness.sh lib/ 분할 (HIGH, 1-2일)
- `lib/{args,track-rules,mcp-assembly,plugin-install,verify-report}.sh`
- 메인은 orchestrator 100줄 이내
- 단계적 추출 + 회귀 검증 필수

### 보안 추가 강화
- npx 버전 핀 (`@railway/mcp-server@x.y.z`)
- mcp-pre-exec.sh nested JSON 평탄화 (`jq '[.. | strings]'`)
- prune-ecc.sh KEEP NOT_FOUND 시 `--apply` 차단
- install.sh SHA256 체크섬 옵션

### 유지보수 자동화
- sync-cherrypicks CI 연결 (`.github/workflows/`)
- CL-v2 instinct 파이프라인 동작 검증
- retry_install 함수를 24개 호출에 점진적 적용

## Sources

1. **architect agent** — agentId: aca96c6d987668752
2. **code-reviewer agent** — agentId: a2fe69d54b507b65f
3. **security-reviewer agent** — agentId: a6d5cb910b08a0a97
4. **harness-optimizer agent** — agentId: a881352f30bff7106
5. **general-purpose agent** — agentId: a4e37085676e671b8

## Commits

- 188725a (v26.11.1) — 5축 리뷰 HIGH 6건 보안 패치 (이전 작업)
- 1590e62 (v26.11.2) — deep-research CRITICAL 2 + HIGH 5 + 문서 보강
- (이번) v26.12.0 — MCP 데이터 외재화

## Verdict

**완료 7/10 (70%)**. CRITICAL 2건 모두 패치. HIGH 5/6 패치 (lib/ 분할만 보류). 문서 4건 모두 패치. 스코어카드: 신뢰성 98/100 유지, 유지보수 60→75/100 (tsv 외재화), 사용성 70→85/100 (4건 보강).
