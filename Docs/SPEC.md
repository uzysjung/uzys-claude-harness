# SPEC: Phase 4b — 필수성 검증 + 프로젝트 스코프화 + 버전관리

> **Status**: Define (확정)
> **Created**: 2026-04-14
> **Trigger**: 사용자 요청 — "정말 다 꼭 필요한가?" + 글로벌 절대 불변 + ECC 버전관리

---

## 1. Objective

3가지 동시 달성:

1. **필수성 감사**: 명확한 기준으로 모든 구성요소 분류, 불필요 항목 제거
2. **글로벌 → 프로젝트 스코프 이관**: `claude mcp add` 글로벌 등록을 프로젝트 `.mcp.json`으로 이관. 글로벌 `~/.claude/` 절대 불변
3. **Cherry-pick 버전관리**: ECC뿐 아니라 모든 외부 출처(agent-skills, vercel-labs, ECC 등)의 cherry-pick에 대한 매니페스트 + sync 스크립트

성공 기준: 9개 불필요 항목 제거, **7개 공통 도구 추가**, **4개 신규 인프라 파일**(`templates/mcp.json`, `templates/settings.json`, `cherrypicks.lock`, `sync-cherrypicks.sh`), 동기화 스크립트 동작.

---

## 2. 판단 기준 (불변)

### 필수 (Necessary) — ALL True
1. 요구사항 직접 연결 (RAW/REQUIREMENTS/Blueprint)
2. 결정론적 동작 또는 LLM 지침 고유성
3. 대체 불가 (ECC/GSD/플러그인에 동등 없음)
4. 일반 워크플로우 사용

### 불필요 (Unnecessary) — ANY True
1. 요구사항 미연결
2. 다른 파일과 내용 중복
3. dead code (트리거 안 됨)
4. ECC/GSD/플러그인 대체 가능
5. **글로벌 파일 수정 필요** ← 절대 위반

### 조건부 (Conditional)
- Track 한정 / 옵션 / 미래 기능

---

## 3. 결정 일람

### 3.1 제거 (9개 항목)

| # | 파일 | 위반 기준 |
|---|------|---------|
| 1 | `templates/rules/commit-policy.md` | ② 중복 (git-policy + ecc-git-workflow) |
| 2 | `templates/rules/ecc-testing.md` | ② 중복 (test-policy가 더 완전) |
| 3 | `templates/commands/ecc/projects.md` | ① 미연결, ④ 무관 |
| 4-7 | `templates/skills/continuous-learning-v2/agents/*` (4개) | ③ dead code |
| 8 | `templates/skills/continuous-learning-v2/scripts/test_parse_instinct.py` | ④ 런타임 무관 |
| 9 | setup-harness.sh의 `claude-code-statusline` 설치 블록 | ⑤ 글로벌 수정 필수 |

→ ~1183줄 절감 + 글로벌 1개 미수정 복원

### 3.2 추가 (공통 도구)

| # | 항목 | 출처 | 위치 | 적용 Track |
|---|------|------|------|---------|
| A1 | **deep-research** 스킬 | ECC cherry-pick | `templates/skills/deep-research/` | 전체 |
| A2 | **find-skills** | vercel-labs/skills (npx) | `npx skills add vercel-labs/skills --skill find-skills` | 전체 dev |
| A3 | **agent-browser** | vercel-labs/agent-browser (npm -g) | `npm install -g agent-browser` | 전체 dev |
| A4 | **playwright** (이동) | testdino-hq/playwright-skill | UI 전용 → **공통** | 전체 dev |
| A5 | **chrome-devtools** MCP | chrome-devtools-mcp@latest | **`.mcp.json`** (프로젝트) | 전체 dev |
| A6 | **claude-powerline** statusLine | @owloops/claude-powerline | **`.claude/settings.json`** (프로젝트) | 전체 |
| A7 | **market-research** 스킬 | ECC cherry-pick | `templates/skills/market-research/` | executive |

### 3.3 신규 인프라

| 파일 | 목적 |
|------|------|
| `templates/mcp.json` | 프로젝트 .mcp.json 템플릿 (Track별 조합) |
| `templates/settings.json` | 프로젝트 .claude/settings.json 템플릿 (statusLine + hooks via `$CLAUDE_PROJECT_DIR`) |
| `.dev-references/cherrypicks.lock` | 모든 cherry-pick 매니페스트 (출처별 commit, file hash, 수정 여부) |
| `sync-cherrypicks.sh` | 동기화 스크립트 (ECC, agent-skills, vercel-labs 등) |

### 3.4 글로벌 → 프로젝트 이관 (Q1=B, Q2=A)

**현재 (제거)**: setup-harness.sh의 `claude mcp add ...` 명령들 → 글로벌 등록
**신규 (이관)**: 프로젝트 `.mcp.json` 생성

| MCP | 적용 Track | 위치 |
|-----|---------|------|
| chrome-devtools | 전체 dev | `.mcp.json` (공통) |
| context7 | 전체 | `.mcp.json` (공통) |
| github | 전체 | `.mcp.json` (공통) |
| railway-mcp-server | csr-fastify, csr-fastapi, ssr-* | `.mcp.json` (조건부) |
| supabase | csr-supabase | `.mcp.json` (조건부) |

**bootstrap-dev.sh**: 사용자 자체 dev 도구. 글로벌 `claude mcp add` 그대로 둠. setup-harness.sh와 분리.

### 3.5 settings.json 분리 전략

| 파일 | 내용 | git 추적 | 이유 |
|------|------|--------|------|
| `.claude/settings.json` | statusLine, hooks ($CLAUDE_PROJECT_DIR 사용) | **commit** | 팀/사용자 간 공유 |
| `.claude/settings.local.json` | (선택) 로컬 override | gitignore | 개인 설정 |

→ 절대 경로 hook은 `$CLAUDE_PROJECT_DIR` 변수로 대체. settings.json 단일화.

---

## 4. Cherry-pick Sync 메커니즘

### 4.1 매니페스트 (`.dev-references/cherrypicks.lock`)

```json
{
  "version": "1.0",
  "sources": {
    "ecc": {
      "url": "https://github.com/affaan-m/everything-claude-code",
      "commit": "<SHA>",
      "synced_at": "2026-04-14T..."
    },
    "agent-skills": {
      "url": "https://github.com/addyosmani/agent-skills",
      "commit": "<SHA>",
      "note": "플러그인으로 설치, cherry-pick 없음"
    },
    "vercel-labs-skills": {
      "url": "https://github.com/vercel-labs/skills",
      "commit": "<SHA>",
      "note": "find-skills를 npx로 설치, cherry-pick 없음"
    }
  },
  "cherrypicks": [
    {
      "source": "ecc",
      "src": "agents/code-reviewer.md",
      "dst": "templates/agents/code-reviewer.md",
      "src_hash": "sha256:...",
      "modified": false
    },
    {
      "source": "ecc",
      "src": "rules/common/git-workflow.md",
      "dst": "templates/rules/ecc-git-workflow.md",
      "src_hash": "sha256:...",
      "modified": true,
      "modification_note": "글로벌 settings 가정 라인 1개 제거"
    },
    {
      "source": "ecc",
      "src": "skills/continuous-learning-v2/",
      "dst": "templates/skills/continuous-learning-v2/",
      "src_hash": "...",
      "modified": true,
      "modification_note": "agents/ 디렉토리 + test_parse_instinct.py 제거"
    },
    {
      "source": "ecc",
      "src": "skills/strategic-compact/",
      "dst": "templates/skills/strategic-compact/",
      "modified": false
    },
    {
      "source": "ecc",
      "src": ".agents/skills/deep-research/SKILL.md",
      "dst": "templates/skills/deep-research/SKILL.md",
      "modified": false
    }
  ]
}
```

### 4.2 sync-cherrypicks.sh 동작

```
1. 각 source repo 최신 pull
2. 각 cherrypick 항목:
   a. ECC 원본 hash 계산
   b. 매니페스트 hash와 비교
   c. 변경 없음 → skip
   d. 변경 있음 + modified=false → diff 표시 후 자동 업데이트
   e. 변경 있음 + modified=true → 충돌 경고, 수동 머지 필요
3. 매니페스트 commit SHA 갱신
4. git diff로 변경 검토
```

### 4.3 트리거

- 수동: `bash sync-cherrypicks.sh` (분기 1회 권장 — P10 Harness Maintenance)
- README/CONTRIBUTING.md에 절차 기록

---

## 5. Scope

### In Scope

1. 9개 제거 실행
2. 7개 공통 도구 추가 (deep-research, find-skills, agent-browser, playwright 이동, chrome-devtools, claude-powerline, market-research)
3. 신규 4개 인프라 파일 (mcp.json, settings.json, cherrypicks.lock, sync-cherrypicks.sh)
4. setup-harness.sh 대규모 수정:
   - 글로벌 `claude mcp add` 제거
   - .mcp.json 생성 단계 추가
   - settings.json 생성 ($CLAUDE_PROJECT_DIR 활용)
   - 공통 도구 설치 단계
   - 통계/검증 업데이트
5. 문서 동기화 (README, USAGE, PRD, project-claude 9종)
6. self-dogfood 재설치
7. SPEC/plan/todo 최종 갱신

### Out of Scope (Non-Goals)

- 자동 sync (CI/cron) — 향후
- vercel-labs 외 추가 마켓 검토
- harness-audit 커맨드 (P10 분기 재검토용) — 향후
- eval-harness (R3 연결) — 향후
- **글로벌 `~/.claude/` 일체 수정** — 절대 금지

---

## 6. Boundaries

### DO NOT CHANGE
- **`~/.claude/` 전체** (절대)
- 11개 행동 원칙
- 9 Track 정의
- 6개 uzys: 커맨드 + 4개 Hook + 5개 Agent
- bootstrap-dev.sh의 글로벌 mcp add (사용자 자체 dev 도구)

### Always
- 변경 = README/USAGE/PRD/CLAUDE.md 동기화
- safe_copy 패턴
- 매니페스트 동시 갱신

### Never
- 글로벌 파일 생성/수정/삭제
- 게이트 차단 우회
- 매니페스트와 실제 파일 불일치 방치

---

## 7. Acceptance Criteria

### Feature: 글로벌 미수정 (절대 조건)
- **Given** setup-harness.sh를 어떤 Track으로 실행하든
- **When** 설치 완료 후 `~/.claude/` 검사
- **Then** 새 파일 생성 0건, 기존 파일 수정 0건

### Feature: .mcp.json 생성 (Q1=B)
- **Given** Track 선택
- **When** setup-harness.sh 실행
- **Then** 프로젝트 `.mcp.json`에 chrome-devtools, context7, github, (Track별) railway/supabase 포함

### Feature: settings.json 생성 ($CLAUDE_PROJECT_DIR)
- **Given** setup-harness.sh 실행
- **When** `.claude/settings.json` 생성
- **Then** statusLine(claude-powerline) + hooks ($CLAUDE_PROJECT_DIR 사용) 포함, 절대 경로 없음

### Feature: 공통 도구 설치
- **Given** dev Track (csr/ssr/data/tooling)
- **When** 설치 완료
- **Then** find-skills, agent-browser, playwright, deep-research 사용 가능

### Feature: 9개 제거 (8개 파일 + 1개 설치 블록)
- **Given** 설치 후 `.claude/` 검사
- **When** templates/와 대조
- **Then** commit-policy(1) + ecc-testing(1) + projects(1) + CL-v2 agents(4) + test_parse(1) = 8개 파일 미존재, statusline 설치 블록(1) 미실행 (글로벌 ~/.claude/statusline.sh 미생성)

### Feature: 매니페스트 정확성
- **Given** sync-cherrypicks.sh 실행
- **When** 매니페스트 검증
- **Then** 모든 cherrypick 파일이 매니페스트에 등재, src_hash 정확

### Verification Checklist
- [ ] 9개 제거 완료
- [ ] 7개 추가 완료
- [ ] mcp.json, settings.json, cherrypicks.lock, sync-cherrypicks.sh 신규 작성
- [ ] setup-harness.sh: 글로벌 claude mcp add 제거 확인
- [ ] **글로벌 파일 미수정 확인 (절대 조건)**
- [ ] self-dogfood 재설치 통과
- [ ] README/USAGE/PRD 동기화

---

## 8. Implementation Order (다음 /uzys:plan에서 분해)

### Phase A: Foundation (병렬 가능)
- A1: cherrypicks.lock 매니페스트 작성
- A2: sync-cherrypicks.sh 작성
- A3: deep-research / market-research cherry-pick
- A4: templates/mcp.json 작성
- A5: templates/settings.json 작성

### Phase B: Removal
- B1-B9: 9개 항목 제거

### Phase C: setup-harness.sh 대수술
- C1: 글로벌 claude mcp add 제거
- C2: .mcp.json 생성 단계 추가 (Track별)
- C3: settings.json 생성 ($CLAUDE_PROJECT_DIR)
- C4: 공통 도구 설치 추가 (find-skills, agent-browser, playwright 이동)
- C5: statusline 블록 제거

### Phase D: Documentation
- D1: README 업데이트
- D2: USAGE 업데이트
- D3: PRD 갱신 (D16-D20)
- D4: CONTRIBUTING.md 또는 README sync 절차 섹션
- D5: project-claude 9종 동기화

### Phase E: Self-dogfood
- E1: 이 프로젝트 .claude/ 재설치
- E2: 글로벌 미수정 검증
- E3: 9개 제거 + 7개 추가 확인

### Phase F: Commit + Tag
- F1: 전체 커밋
- F2: 푸시
- F3: v26.2.0 태그 (minor — 추가/정리)

---

## 9. Status

| 항목 | 내용 |
|------|------|
| Status | Define 완료, /uzys:plan 진행 가능 |
| 결정 | 9개 제거 + 7개 추가 + 4개 신규 인프라 + 글로벌 mcp 이관 |
| **절대 제약** | **`~/.claude/` 불변** |
| Next | /uzys:plan으로 Phase A-F 분해 후 /uzys:build 진입 |
