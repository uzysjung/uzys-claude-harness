프로젝트 스코프 instinct를 글로벌 스코프로 승격시킨다.

```bash
python3 .claude/skills/continuous-learning-v2/scripts/instinct-cli.py promote [id]
```

id 없이 실행하면 승격 후보(confidence ≥ 0.8, 2개+ 프로젝트에서 확인)를 목록 표시.
id를 지정하면 해당 instinct를 글로벌로 승격.

글로벌 instinct는 모든 프로젝트에서 활성화된다.
