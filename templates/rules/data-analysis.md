# Data Analysis Rules

data Track에서 적용.

## DuckDB Patterns

- 파일 직접 쿼리: `SELECT * FROM 'data.parquet'`, `read_csv_auto('data.csv')`
- CTE 적극 활용 — 서브쿼리 중첩 대신 CTE 체이닝
- Window functions는 별도 CTE로 분리
- `SELECT *` 금지 — 필요한 컬럼만

```sql
WITH daily_metrics AS (
    SELECT date, SUM(revenue) AS total_revenue
    FROM read_parquet('sales/*.parquet')
    GROUP BY date
),
moving_avg AS (
    SELECT *, AVG(total_revenue) OVER (ORDER BY date ROWS 6 PRECEDING) AS ma7
    FROM daily_metrics
)
SELECT * FROM moving_avg WHERE date >= '2026-01-01';
```

## Trino Federation

- 카탈로그 명시: `catalog.schema.table`
- 크로스 소스 JOIN 시 작은 테이블을 드라이빙 테이블로
- `EXPLAIN ANALYZE`로 쿼리 플랜 확인

## pandas / polars

- **polars 우선** (대용량, 성능)
- pandas 사용 시: `df.copy()` 후 변환. 원본 수정 금지.
- 체이닝: pipe 패턴 사용

```python
result = (
    df.lazy()
    .filter(pl.col("status") == "active")
    .group_by("category")
    .agg(pl.col("revenue").sum())
    .sort("revenue", descending=True)
    .collect()
)
```

## ML Pipeline

1. 데이터 분리: train/val/test (시계열은 시간 순서 유지)
2. 전처리: `sklearn.pipeline.Pipeline` + `ColumnTransformer`
3. 베이스라인: 가장 단순한 모델 먼저 (LogisticRegression, XGBoost)
4. 평가: cross_val_score, 혼동 행렬, 비즈니스 메트릭
5. 실험 추적: MLflow (run_name, params, metrics, artifacts)

## Visualization

- EDA: matplotlib/seaborn (정적)
- 인터랙티브: plotly
- PySide6 임베딩: `matplotlib.backends.backend_qtagg`
- 차트에 제목, 축 레이블, 범례 필수
