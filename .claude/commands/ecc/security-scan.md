Claude Code 설정(.claude/ 디렉토리)에 대한 AgentShield 보안 스캔을 실행한다.

`npx ecc-agentshield scan` 을 실행하여 CLAUDE.md, settings.json, MCP 서버, hooks, agent 정의에서 보안 취약점, 설정 오류, 인젝션 위험을 검사한다.

옵션:
- `--fix`: 자동 수정 가능한 항목 수정 (하드코딩 시크릿 → 환경변수 참조 등)
- `--min-severity medium`: 최소 심각도 필터
- `--format json|markdown|html`: 출력 형식

결과는 A-F 등급으로 표시. CRITICAL/HIGH 발견 시 즉시 조치 필요.
