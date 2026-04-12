---
name: spec-scaling
description: "Detects when SPEC.md or PRD.md exceeds 300 lines and proposes feature-based splitting with a master route document. Use when SPEC.md grows too large to be effectively used as a single document."
---

# Spec Scaling

## When to Use

SPEC.md 또는 PRD.md가 300줄을 초과했을 때 자동 트리거.

## Process

1. 현재 SPEC.md/PRD.md의 줄 수를 확인한다.
2. 300줄 초과 시 기능별 분리를 제안한다:

```
docs/
├── SPEC.md                    # 마스터 — 공통 규칙 + 각 기능 파일 라우트
├── specs/
│   ├── auth.md                # 인증/인가 기능 스펙
│   ├── dashboard.md           # 대시보드 기능 스펙
│   └── payment.md             # 결제 기능 스펙
```

3. 마스터 SPEC.md 구조:

```markdown
# SPEC: [프로젝트명]

## 공통 규칙
[전체 적용 Boundaries, Tech Stack, DO NOT CHANGE]

## 기능별 스펙
- [인증/인가](specs/auth.md)
- [대시보드](specs/dashboard.md)
- [결제](specs/payment.md)
```

4. **인간 승인 후에만 분리 실행**. 자동 분리 금지.

## Rules

- 공통 규칙(Boundaries, Tech Stack, DO NOT CHANGE)은 마스터에 유지.
- 각 기능 스펙은 독립적으로 참조 가능해야 한다.
- 기능 간 의존성은 마스터에 명시.
- 분리 후 기존 SPEC.md는 마스터로 변환 (삭제 아님).
