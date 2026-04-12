CL-v2에서 학습된 모든 instinct를 표시한다 (프로젝트 스코프 + 글로벌).

```bash
python3 .claude/skills/continuous-learning-v2/scripts/instinct-cli.py status
```

각 instinct는 신뢰도 점수(0.3-0.9)와 함께 표시. 도메인별로 그룹화.
high-confidence instinct(≥0.8)는 Rule 승격 후보로 표시된다.
