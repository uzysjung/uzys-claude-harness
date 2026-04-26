# ADR-006: karpathy-coder hook matcher — PreToolUse Write|Edit (v0.6.0)

- **Status**: Accepted (with v0.7+ re-evaluation)
- **Date**: 2026-04-26
- **PR**: feat/v0.6.0-karpathy-hook-autowire
- **Linked SPEC**: `docs/specs/karpathy-hook-autowire.md` (Accepted)
- **Linked Research**: `docs/research/karpathy-hook-autowire-2026-04-26.md`
- **Reviewer flag**: HIGH-1 (5축 리뷰 2026-04-26)

---

## Context

본 SPEC §3.4 OQ3에서 hook matcher를 `PreToolUse Write|Edit`으로 결정. 사후 reviewer 5축 리뷰에서 다음 문제 제기:

- `PreToolUse`는 **코드 작성 직전** 발동 — Claude Code가 Write/Edit 도구 호출 전.
- `karpathy-gate.sh`의 `complexity_checker.py` 분기는 `file_path`가 가리키는 **현재 파일 내용**을 분석:
  - 새 파일 (`Write`): file_path 미존재 → 검사 무의미
  - 기존 파일 (`Edit`): pre-edit 내용 검사 → 사용자 의도(작성된 코드 검사)와 불일치
- upstream `enforcement-patterns.md` Level 3 예제는 `PostToolUse Bash` matcher (git commit 명령 가로채기) — 우리 PreToolUse Write|Edit과 다른 컨텍스트.

## Decision

**v0.6.0은 `PreToolUse Write|Edit` 유지**. 다음 사유:

1. **4 원칙 reminder 가치 우선**: `karpathy-gate.sh`의 핵심 가치는 코드 작성 직전 4 원칙(`Think Before / Simplicity / Surgical / Goal-Driven`) 환기 메시지. 작성 전 시점이 본래 의도와 맞음.
2. **`complexity_checker` 한계 명시**: USAGE.md에 "Edit on existing file에만 의미 있음" 한계 명시. 사용자 기대 정렬.
3. **graceful exit 정신**: hook은 `set +e` + `exit 0` 항상. complexity_checker 무의미한 시점에는 silent skip — 부작용 없음.
4. **PostToolUse 전환 위험**:
   - reminder 의미 약화 (이미 작성됨)
   - Claude Code hook spec 호환성 별도 검증 필요
   - SPEC drift — Major CR + 재dogfood + 재테스트

## Alternatives

### Alt-1: PostToolUse Write|Edit로 즉시 전환

- **장점**: complexity_checker가 작성된 file 검사 → 정확한 input.
- **단점**:
  - reminder는 사후 → 환기 의미 약함
  - SPEC drift → Major CR + ship 지연
  - reviewer HIGH-1 본인이 "Ship 차단은 아님"이라 평가
- **기각**.

### Alt-2: PreToolUse + PostToolUse 두 hook 조합

- **장점**: reminder는 Pre, complexity_checker는 Post.
- **단점**: 복잡도 증가 (P2 Simplicity First 위반). settings.json 두 entry 자동 등록 → idempotent 검증 부담.
- **기각**.

### Alt-3: PreToolUse 유지 + USAGE 한계 명시 + v0.7+ ADR (현재)

- **장점**: 현재 코드 변경 0. reminder 가치 유지. HIGH-1 정직히 인정.
- **단점**: complexity_checker 정확도 약함 (단, USAGE 명시로 사용자 기대 정렬).
- **선택**.

## Consequences

### 즉시
- `docs/USAGE.md` "v0.6.0 한계 — PreToolUse vs PostToolUse" 섹션 추가 (이미 적용).
- SPEC `docs/specs/karpathy-hook-autowire.md` §3.4 OQ3는 Closed 유지하되 본 ADR-006 reference 추가 가능.

### v0.7+ 재평가 트리거
- 사용자 피드백 — complexity_checker가 실제 사용 환경에서 누락하는 case 보고
- upstream `enforcement-patterns.md` 갱신 (PostToolUse Write|Edit 새 권장 사례 등)
- Claude Code hook spec 변경 — 새 matcher 또는 PostToolUse Write|Edit 정식 지원 명시

### 후속 SPEC
v0.7+에서 PostToolUse 전환 SPEC 작성 시:
- 본 ADR-006이 `Supersedes` 대상
- 새 ADR-N에 PostToolUse 전환 결정 + 본 ADR-006을 supersede

## References

- SPEC: `docs/specs/karpathy-hook-autowire.md`
- Research: `docs/research/karpathy-hook-autowire-2026-04-26.md` (PostToolUse 인용 출처)
- USAGE: `docs/USAGE.md` "v0.6.0 한계" 섹션
- Reviewer (HIGH-1, 5축 리뷰 2026-04-26): independent verification 권장 사항
- upstream: [karpathy-coder enforcement-patterns.md](https://github.com/alirezarezvani/claude-skills/blob/main/engineering/karpathy-coder/references/enforcement-patterns.md)
