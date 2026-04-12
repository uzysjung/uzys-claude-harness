instinct를 knowledge-base 이관을 위해 내보낸다.

```bash
python3 .claude/skills/continuous-learning-v2/scripts/instinct-cli.py export [옵션]
```

옵션:
- `--domain <name>`: 특정 도메인만 내보내기
- `--min-confidence <0.0-1.0>`: 최소 신뢰도 필터
- `--scope project|global`: 스코프 필터
- `--output <path>`: 출력 파일 경로

프로젝트 완료 시 검증된 instinct를 knowledge-base 리포로 이관하는 데 사용.
