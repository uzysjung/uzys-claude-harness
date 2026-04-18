# E2: Claude Code Memory Architecture 검증

> **Status**: 검증 완료 · **Date**: 2026-04-15 · **Trigger**: harness-engineering-audit-2026-04 §E2 (조사 요청)
>
> **입력**: [Claude Code 공식 문서 — Memory](https://code.claude.com/docs/en/memory) (WebFetch 2026-04-15)

---

## 조사 배경

리서치 문서 §10 Gap-E2에서 "Memory Architecture Standardization (Mar 2026, 3-layer)" 를 업계 표준으로 분류하고, 현재 프로젝트가 이를 **⚠ 부분 반영** 상태로 판정했었다. 이 문서는 **실제 Claude Code Memory가 무엇인지, 우리 CL-v2 instinct 시스템과 어떻게 공존하는지** 명확히 한다.

---

## 공식 사실 (인용 기반)

### 1. 두 메커니즘

Claude Code는 **두 개의 보완적 memory 시스템**을 가진다 — 두 개 모두 세션 시작 시 로드된다.

|  | CLAUDE.md files | Auto memory |
|---|---|---|
| 작성 주체 | 사용자 | Claude |
| 내용 | 지침 / 규칙 | 학습 / 패턴 |
| 스코프 | 프로젝트/사용자/조직 | worktree별 |
| 로드 | 매 세션 | 매 세션 (첫 200줄 또는 25KB) |
| 용도 | 코딩 표준, 워크플로우, 아키텍처 | 빌드 명령, 디버깅 인사이트, 선호도 |

> "Both are loaded at the start of every conversation. Claude treats them as context, not enforced configuration." — 공식 문서

### 2. Auto Memory 저장 위치

```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # 인덱스, 세션마다 로드
├── debugging.md       # 주제별 상세 노트
├── api-conventions.md
└── ...
```

- `<project>` 경로는 git 레포에서 파생 → 모든 worktree + 하위 디렉토리 공유
- **MEMORY.md 만 세션 시작 시 로드** (첫 200줄 or 25KB)
- 주제 파일들은 **on-demand** 로드 (Claude가 표준 file tool로 읽음)
- machine-local (머신 간 공유 X)

### 3. 버전 + 제어

- **v2.1.59+ 필요** (2026-03 공식 출시)
- 기본 **활성**
- Off 방법: `autoMemoryEnabled: false` in project settings, 또는 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` env var
- 수동 제어: `/memory` 슬래시 커맨드 (공식)

### 4. CLAUDE.md 파일 우선순위 (요약)

```
managed policy (OS별) > project (./CLAUDE.md or ./.claude/CLAUDE.md) >
user (~/.claude/CLAUDE.md) > local (./CLAUDE.local.md)
```

---

## 현재 프로젝트와의 대조

| 항목 | 현재 상태 | Memory 공식 | 결론 |
|------|---------|------------|------|
| 프로젝트 CLAUDE.md | `./CLAUDE.md` + `.claude/CLAUDE.md` 둘 다 존재 | 공식 지원 (둘 다 로드) | ✅ 정합 |
| User CLAUDE.md | `~/.claude/CLAUDE.md` (150줄) | 공식 지원 | ✅ 정합 (사용자 의도) |
| `.claude/rules/` | 10-20개 rule 파일 | 공식 지원, path-scoped 가능 | ✅ 정합 |
| Auto memory | 미검증 / 미활용 | 기본 활성, v2.1.59+ | ⚠ 확인 필요 |
| CL-v2 instinct | observer hook 등록 | 별개 시스템 | ✅ 공존 |

### Auto Memory vs CL-v2 역할 비교

| 차원 | Claude Code Auto Memory | CL-v2 Instinct |
|------|------------------------|-------------------|
| 저장 위치 | `~/.claude/projects/<project>/memory/MEMORY.md` | `.claude/skills/continuous-learning-v2/observations/` |
| 작성 주체 | Claude (세션 중 자동) | Claude (PostToolUse hook) |
| 내용 형식 | free-form markdown | JSONL observations + instinct CLI 변환 |
| 로드 시점 | 세션 시작 (첫 200줄) | observer hook이 session 중 트리거 |
| Confidence scoring | 없음 (수집만) | 있음 (0.3–0.9) |
| Rule 승격 파이프라인 | 없음 | 있음 (`/ecc:promote`) |
| Cross-session | 있음 | 있음 (machine-local) |
| 주 용도 | 빌드 명령, 디버깅, 선호도 | 구조화된 pattern → Rule |

**결론**: 두 시스템은 **중복이 아닌 보완재**. 역할이 분리되어 있다:
- **Auto memory** = 즉시 사용 가능한 경량 메모 (자동 저장/로드)
- **CL-v2** = 구조화된 학습 파이프라인 (confidence scoring + Rule 승격 후보)

---

## 7기준 재판정

| # | 기준 | Auto memory (공식) | CL-v2 | 결론 |
|---|------|-------|-------|------|
| ① | 요구사항 연결 | ✅ R2 크로스 프로젝트 learning | ✅ R1 instinct Rule 승격 | 둘 다 필수 |
| ② | 결정론 | ⚠ Claude가 자동 판단 | ✅ confidence scoring 결정론 | CL-v2 우위 |
| ③ | 대체 불가 | ✅ 공식 메커니즘 | ✅ 구조화 파이프라인 | 둘 다 유효 |
| ④ | 워크플로우 사용 | ✅ 기본 활성 | ✅ observer hook | 둘 다 사용 중 |
| ⑤ | 비용/컨텍스트 | ✅ 200줄 제한 | ⚠ observations.jsonl 누적 | Auto memory 우위 |
| ⑥ | 보안 | ⚠ `~/.claude/`에 쓰기 (글로벌) | ⚠ 글로벌 설정은 건드리지 않지만 기록은 `~/.claude/projects/` | 둘 다 관찰 대상 |
| ⑦ | 관측성 | ✅ `/memory` 커맨드 | ✅ instinct-status 커맨드 | 둘 다 우수 |

**판정**: Auto memory = **이미 활성** (Claude Code 기본), CL-v2 = **이미 설치됨**. 추가 구현 불필요.

---

## 글로벌 불변 원칙과의 관계 (중요)

> Auto memory는 `~/.claude/projects/<project>/memory/` 에 쓴다. 글로벌 `~/.claude/` **하위**다.

우리 프로젝트의 "글로벌 절대 불변" 원칙은 **사용자가 관리하는 설정 파일**에 한정:
- ❌ `~/.claude/CLAUDE.md` — 절대 수정 금지
- ❌ `~/.claude/settings.json` — 절대 수정 금지
- ❌ `~/.claude/rules/` — 절대 수정 금지

**자동 생성 디렉토리는 제외**:
- ✅ `~/.claude/projects/<project>/memory/` — Claude Code가 자동 쓰기. 우리가 설정하거나 지시하지 않음. 원칙 충돌 없음.
- ✅ `~/.claude/projects/<project>/tasks/` — task 관리. 동일.

즉 **Auto memory 사용은 글로벌 불변 원칙을 위반하지 않는다**.

---

## 결정 (D33)

**검증 완료. 추가 작업 없음.**

- Auto memory는 Claude Code 기본 활성 → 우리는 **설정 변경 불필요**
- CL-v2는 **계속 유지** → 역할이 다름 (구조화 학습 vs free-form 노트)
- 두 시스템 공존 확인
- CLAUDE.md의 "Experience Accumulation" 섹션 이미 정합

**후속 권장**:
- `/memory` 커맨드를 한 번 실행해 현재 auto memory 상태 확인 (사용자 수동)
- CL-v2 observer hook은 현재 PostToolUse에 등록되어 있음. 비활성 원한다면 `.claude/skills/continuous-learning-v2/config.json`의 observer 필드 조정
- 분기 1회 메모리 정리 주기 검토 (P10 Harness Maintenance)

---

## References

- [Claude Code Memory 공식 문서](https://code.claude.com/docs/en/memory) *(WebFetch 2026-04-15, 리다이렉트 원 URL: docs.claude.com/en/docs/claude-code/memory → code.claude.com/docs/en/memory)*
- 리서치 문서: `Docs/research/harness-engineering-audit-2026-04.md` §E2
- CL-v2 설정: `templates/skills/continuous-learning-v2/config.json`
- PRD: `Docs/dev/PRD.md` Experience Accumulation 섹션
