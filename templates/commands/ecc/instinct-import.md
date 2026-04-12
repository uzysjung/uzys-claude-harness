외부에서 내보낸 instinct를 현재 프로젝트/글로벌에 가져온다.

```bash
python3 .claude/skills/continuous-learning-v2/scripts/instinct-cli.py import <path> [옵션]
```

옵션:
- `--scope project|global`: 어디에 가져올지 (기본: project)
- `--merge`: 기존 instinct와 병합 (중복 시 높은 신뢰도 유지)

다른 프로젝트나 팀원에게서 검증된 instinct를 공유받을 때 사용.
