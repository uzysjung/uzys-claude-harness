# data Track Skills 평가 — 2026-04-18

사용자 요청 8개 후보 평가. P12 4기준 (요구 매칭 / 결정론적 가이드 / 대체 불가 / 워크플로우 사용) 적용.

## 결정 매트릭스

| # | 출처 | 카테고리 | 판정 | 근거 |
|---|------|---------|:-:|------|
| 1 | jeffallan/pandas-pro | npx skill | ❌ Skip | 우리 정책 `polars 우선` — pandas는 보조. 충돌 |
| 2 | wshobson/python-resource-management | npx skill | ✅ 추가 | context manager / ExitStack / async cleanup. 메모리 누수 가이드 부재 메움 |
| 3 | awesome-llm-apps/data-analyst | agent.md | ❌ Skip | 우리 자체 data-analyst agent가 더 깊고 우리 스택(DuckDB+polars+PySide6)에 fit. 비교 결과 §3 |
| 4 | K-Dense/dask | npx skill | ✅ 추가 (선택) | larger-than-RAM 분산. DuckDB로 안 되는 케이스만 호출 |
| 5 | K-Dense/polars | npx skill | ✅ 추가 | core 도구. 우리 data-analysis.md 요약 가이드 → deep skill 보완 |
| 6 | K-Dense/seaborn | (제외) | ❌ Skip | #7 Anthropic data-visualization이 통합 커버 |
| 7 | anthropics/data plugin | claude plugin | ✅ 강추 | matplotlib/seaborn/plotly 통합 + chart selection guide. 공식 |
| 8 | wshobson/python-performance-optimization | npx skill | ✅ 추가 | cProfile/line_profiler/memory_profiler/py-spy. 일반 perf 가이드 부재 |

## 비교: data-analyst (우리 vs awesome-llm)

| 차원 | 우리 templates/agents/data-analyst.md | awesome-llm/data-analyst |
|------|------|------|
| Stack | DuckDB + Trino + pandas + polars + sklearn + PyTorch + XGBoost + MLflow + matplotlib/seaborn + plotly + PySide6 | SQL + pandas + 통계 |
| 깊이 | 70줄, ML/DL/Visualization/Desktop 4도메인 | ~50줄 일반 |
| Coding Standards | ruff + 타입힌트 + SQL/PySide6 패턴 | 없음 |
| Workflow | 6단계 (탐색→가설→실행→검증→인사이트→보고) | 없음 |
| Anti-patterns | 4개 명시 (전수분석/상관-인과/근거없는 수치/PySide6 UI 스레드 블로킹) | 없음 |
| 결론 | **유지** | **skip** |

## 설치 명령

| 스킬 | 설치 |
|------|------|
| polars (K-Dense) | `npx skills add K-Dense-AI/scientific-agent-skills --skill polars --yes` |
| dask (K-Dense) | `npx skills add K-Dense-AI/scientific-agent-skills --skill dask --yes` |
| python-resource-management | `npx skills add https://github.com/wshobson/agents --skill python-resource-management --yes` |
| python-performance-optimization | `npx skills add https://github.com/wshobson/agents --skill python-performance-optimization --yes` |
| Anthropic data plugin | `claude plugin marketplace add anthropics/knowledge-work-plugins` + `claude plugin install data@knowledge-work-plugins` |

## 적용 위치

`setup-harness.sh`의 `any_track 'data|full'` 분기에 추가 (v26.16.0).
