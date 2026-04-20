# Changelog

All notable changes to **uzys-claude-harness**.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v27.14.0] — 2026-04-20

### Changed
- **`tauri.md` Rule을 `--with-tauri` 플래그 opt-in으로 분리** — 기존 csr-*/full track에 자동 설치되던 tauri 규칙이 "PRD에 desktop 요구 있을 때만 적용"이라는 조건부 특성인데 모든 CSR 프로젝트에 무조건 포함되어 context noise였음. 이제 명시적 `--with-tauri` 플래그에서만 포함. 기본 설치 시 Rule 1개 감소로 LLM context 최소화.
- P10 재평가 완료 — Rule 17 / Hook 7 / 자체 skill 3 전수 검토. tauri 외 모든 scaffold는 현역 사용 확인, 추가 slim-down 불필요 (v26.14.0 cleanup 이후 lean 상태 유지).

### Added
- **`templates/hooks/hito-counter.sh` 신규** — `UserPromptSubmit` hook으로 사용자 prompt 제출 시 `.claude/evals/hito-<date>.log`에 타임스탬프 append (프롬프트 내용은 프라이버시상 기록 안 함). Phase 2 HITO(Human-In-The-Loop Occurrences) NSM baseline 자동 수집 인프라.
- `templates/settings.json`에 `UserPromptSubmit` hook 섹션 등록 (async, timeout 2s)
- **T13 확장**: `--with-tauri` 시 tauri.md 설치 / 미지정 시 미설치 assertion 추가

### Stats
- test-harness assertion: 149 → 151 (PASS, FAIL 0)

## [v27.13.0] — 2026-04-20

### Added
- **`docs/NORTH_STAR.md` 본 repo 자기 적용 (dogfooding)**:
  - Statement: "필수적인 skill/plugin/CLAUDE.md/Agent.md 번들만으로 구체적 디렉션 없이도 고수준 서비스를 한 번에 만드는 하네스"
  - NSM: **HITO — Human-In-The-Loop Occurrences per Feature ≤ 3**
  - 4-gate 실제 적용 이력 (v27.8~v27.12 Pass/Fail 사례) 기록
- `README.md` / `README.ko.md`에 **Built-in custom skills** 섹션 신규 — north-star / ui-visual-review / spec-scaling 표 + PLAN template + ADR Status 흐름 요약
- `docs/REFERENCE.md` 섹션 6 "자체 작성 자산" 전면 확장 — skills 표화(3개 + 버전/Track), Templates 섹션, Commands 결합 상세, eval-harness 확장 명시

### Fixed (중요)
- **신규 north-star + ui-visual-review skill이 setup-harness.sh에서 복사 안 되던 문제** — `safe_copy_dir` 라인 누락으로 사용자 프로젝트에 전달 실패. v27.10.0/v27.11.0 설치분은 재설치(또는 `--update`) 필요.
  - north-star: 전 track 설치
  - ui-visual-review: UI track(csr-*/ssr-*/full) 한정 설치
- **test-harness T17.8, T18.7 신규 assertion** — setup-harness.sh에 safe_copy_dir 등록 정적 검증으로 재발 방지

### Stats
- test-harness assertion: 147 → 149 (PASS, FAIL 0)

## [v27.12.1] — 2026-04-20

### Security
- `docs/dev/*` (bootstrap-dev.sh / PRD.md / REQUIREMENTS.md) 에 남아있던 개인 private 리포 이름(`uzysjung/std-dev-boilerplate`, `uzysjung/dyld-vantage`) 제거 — generic placeholder(`<YOUR_BOILERPLATE_REPO>`, `<YOUR_REFERENCE_REPO>`)로 치환. public harness repo에서 개인 private 프로젝트 메타데이터 노출 차단. AgentShield 스캔 + `/ecc:security-scan` 요청에 의해 발견.

## [v27.12.0] — 2026-04-20

### Added — GoalTrack 이식
- **`templates/docs/PLAN.template.md` 신규** — Sprint Contract / Phase Overview / **Milestone × Dependency Graph (직렬/병렬/강한 의존 표기 규약)** / Critical Path / Per-Milestone AC / Risk & Mitigation / Open Questions / Changelog 8섹션. GoalTrack `docs/plan.md` 패턴 일반화.
- **`templates/rules/change-management.md` ADR 섹션 확장**:
  - Status 흐름 `Proposed → Accepted → (Superseded | Deprecated)` 정형화
  - ADR 템플릿에 `PR: #N`, `Supersedes: ADR-M` 필드 추가
  - "채택 프로세스" (PR 초안 → 검토 → 머지 시 Accepted) 4단계
  - "어떤 결정이 ADR 대상인가" 대상/비대상 목록

### Added — Vantage 이식
- **`templates/skills/spec-scaling/SKILL.md` 확장** — SPEC 기능별 분리와 별개로 **PRD 영역별 분리(`docs/PRD/` 계층화)** 패턴 신규. 마스터 PRD.md 구조 예시 + "SPEC vs PRD 분리 가이드" 표 추가. Vantage `.claude/PRD/` 구조 일반화.
- **`templates/skills/eval-harness/SKILL.md` 확장** — `.md` (설계) + `.log` (실행 결과) **쌍 의무화** + `.md` 3섹션(**Capability / Regression / Test**) 필수 명시 + `.log` append 포맷 예시. Vantage `.claude/evals/*.{md,log}` 구조 일반화.

### Added — 검증
- **T19 — External 이식 패턴** (test-harness): 8개 assertion (PLAN template + 의존성/Critical Path, ADR Status 흐름 + 채택 프로세스, spec-scaling PRD 계층화 + 가이드, eval-harness .md+.log 쌍 + 3섹션)

### Stats
- test-harness assertion: 139 → 147 (PASS, FAIL 0)

## [v27.11.0] — 2026-04-20

### Added
- **`ui-visual-review` skill 신규** (`templates/skills/ui-visual-review/SKILL.md`):
  - 5단계 프로세스 — 화면 리스트업(`docs/visual-pages.json`) → 캡처(chrome-devtools MCP / Playwright) → diff(L1 해시 → L2 pixelmatch → L3 LLM 시각 비교) → 에이전트 1차 판정(REGRESSION/CHANGED/PASS) → 사용자 승인 게이트
  - 출력: `docs/screenshots/<phase>/*.png` + `docs/visual-review-<phase>.md`
  - GoalTrack의 수동 스크린샷 검토 패턴(mvp-/v3-/v4- prefix)을 자동화
- `/uzys:test`에 UI Track(csr-*/ssr-*/full) 한정 ui-visual-review 호출 권유 섹션 추가
- `/uzys:review` Process step 5 — `docs/visual-review-<phase>.md` 존재 시 review 입력으로 흡수. **REGRESSION 1건이라도 있으면 Review Gate 차단** (CRITICAL과 동급)
- **T18 — UI Visual Review Skill 자산 검증** (test-harness): 6개 assertion (SKILL.md/frontmatter/핵심 키워드/UI Track 한정/test·review 결합/출력 경로 규약)

### Stats
- test-harness assertion: 132 → 139 (PASS, FAIL 0)

## [v27.10.0] — 2026-04-20

### Added
- **`north-star` skill 신규** (`templates/skills/north-star/`):
  - `SKILL.md` — 4-gate decision heuristic(Trend/Persona/Capability/Lean) + NSM 정의 + Will/Won't/Trade-offs 작성 가이드. CLAUDE.md의 P1/P2/Decision Making을 프로젝트 단위로 인스턴스화.
  - `NORTH_STAR.template.md` — 7-섹션 템플릿(Statement / NSM / Will-Won't / Phase Roadmap / Decision Heuristics / Versioning / Changelog). GoalTrack의 NORTH_STAR.md를 도메인 비종속으로 일반화.
- `/uzys:spec`에 D 블록 추가 — 6개월 이상 / 복수 Phase / 우선순위 결정 빈번 시 NORTH_STAR.md 작성 권장 (선택, 1회성 작업은 skip)
- `/uzys:plan` Process step 4에 north-star 4-gate 체크 — Complex 복잡도 + NORTH_STAR.md 존재 시 task가 4-gate 통과해야 진입. 1개 fail 시 사용자 보고 후 결정 대기. 자동 hook 없음 — 의식적 결정 강제 X.
- **T17 — North Star Skill 자산 검증** (test-harness): SKILL.md/template 존재, frontmatter, 4-gate 키워드, 7-섹션 구조, /uzys:spec & /uzys:plan 결합. 7개 assertion.

### Stats
- test-harness assertion: 125 → 132 (PASS, FAIL 0)

## [v27.9.0] — 2026-04-20

### Added
- **T15 — Install UX Regression**: v27.8.0 fix(`</dev/null` 격리, `exec </dev/tty`, `run_quiet` 헬퍼)의 회귀를 막는 6개 assertion. stdin pipe 상태에서 `--help` 즉시 exit 검증 포함
- **T16 — install.sh file:// end-to-end**: `UZYS_HARNESS_REPO=file://...`로 `curl|bash` 경로를 로컬 git repo로 재현. install.sh 자체가 처음으로 E2E 테스트됨 (clone → setup-harness → asset 생성 → 임시 클론 정리). 6개 assertion
- **T5 9-track 확장**: 기존 7 tracks → `csr-fastify`, `ssr-nextjs` 추가하여 9 tracks 전수 병렬 검증

### Fixed
- `install.sh` / `scripts/setup-harness.sh`의 TTY 재부착이 background/CI 환경에서 `set -e` + `Device not configured` 에러로 즉사하던 문제 — fd 3에 먼저 시도하는 `if exec 3</dev/tty 2>/dev/null; then exec <&3 3<&-; fi` 패턴으로 안전하게 우회

### Stats
- test-harness assertion: 111 → 125 (PASS, FAIL 0)

## [v27.8.0] — 2026-04-20

### Fixed
- `curl|bash` 설치 중 "설치 항목이 1,3,5처럼 중간에 씹혀 안 보이는" 현상 — MCP/plugin installer의 stdout/stderr 출력이 진행 표시 줄을 덮어쓰는 문제. 모든 설치 호출(`npx skills add`, `claude plugin install`, `claude plugin marketplace add`, `npm install -g`)에 `</dev/null >/dev/null 2>&1` 일관 적용 (27건)
- `curl|bash` 설치 중 "안내 없이 멈춰서 엔터 쳐야 넘어가는" 현상 — interactive 프롬프트(y/n)가 stdin pipe에 가로막혀 보이지 않는 문제. `</dev/null` stdin 닫기로 EOF 즉시 전달 + `install.sh`와 `scripts/setup-harness.sh` 헤더에 `exec </dev/tty` 이중 안전망 추가

### Added
- `run_quiet <label> <cmd...>` 설치 래퍼 헬퍼 (`scripts/setup-harness.sh`) — stdin/stdout/stderr 격리 + 실패 시 로그 tail 5줄 stderr 노출. 추후 설치 블록 공통화 시 사용
- `install.sh`에 사전 의존성 체크 (`git`, `bash`) — 중간 실패 방지
- `UZYS_HARNESS_REPO` 환경변수로 install.sh의 리포 URL 오버라이드 가능 (fork/mirror 지원)

## [v27.7.0] — 2026-04-19

### Added
- `csr-supabase` Track 설치 시 `.env.example` 자동 생성 (Supabase Management API Token, Project Ref, DB Password, Public URL/Key, AI API key 주석 포함)
- `.gitignore`에 `.env` 자동 추가 (시크릿 커밋 사고 방지)

## [v27.6.0] — 2026-04-19

### Added
- `csr-supabase` Track 설치 시 Supabase CLI(`npm install -g supabase`) 자동 설치 — OAuth login 1회로 프로젝트 관리
- `templates/project-claude/csr-supabase.md`에 "Supabase 인증 설정 (1회)" 섹션 — CLI login(OAuth) + MCP(`SUPABASE_ACCESS_TOKEN` env) 두 경로 분리 안내

## [v27.5.0] — 2026-04-19

### Fixed
- `--add-track` 시 ECC/ToB/GSD 프롬프트가 다시 떠서 사용자가 엔터로 skip해야 했던 문제 — ADD_MODE 시 default skip, 명시 플래그(`--with-ecc`/`--with-tob`/`--gsd`)로만 진행
- GSD 프롬프트가 `curl|bash` 환경에서 진입 못 했던 문제 — `[ -e /dev/tty ]` 검사 + `read … < /dev/tty` 추가 (ECC/ToB와 일관성)

### Documentation
- README.md / README.ko.md에 "Interactive prompts — what asks, when, how to skip" 섹션 신규: 4개 프롬프트(Track/GSD/ToB/ECC+prune) × 환경(local/`curl\|bash`/CI) 매트릭스, `--add-track`/`--update` SKIP 동작 명시

## [v27.4.0] — 2026-04-19

### Changed
- `csr-supabase` Track에서 Railway 자동 설치 제거 (Supabase가 자체 backend, redundant)
  - `track-mcp-map.tsv`: `railway-mcp-server` 패턴에서 `csr-supabase` 제외
  - `setup-harness.sh`: `railway-plugin` / `railway-skills` 조건 → `csr-fastify\|csr-fastapi\|ssr-htmx\|ssr-nextjs\|full`
- `csr-supabase`에 Vercel CLI + Netlify CLI 자동 설치 추가 (Supabase backend + JAMstack frontend hosting)
- `templates/project-claude/csr-supabase.md`: Plugins 섹션 정정

## [v27.3.0] — 2026-04-19

### Added
- README.md / README.ko.md 양쪽에 OSS 표준 readme 섹션:
  - **30-second start** — install + claude + `/uzys:spec` + `/uzys:auto` 한 블록
  - **Why this?** — "Use it when… / Skip it when…" 5-row 비교 표
  - **Example workflow** — csr-fastapi로 노트 앱 만드는 실전 시나리오 (Pre-SPEC 질의 → /uzys:auto → hook 배경)
  - **FAQ** — Linux/WSL, 글로벌 보호, --update, 9 Track, ECC opt-in, contributing, Cursor/Codex 호환, override 8문항
- GitHub Actions CI badge

## [v27.2.0] — 2026-04-18

### Added
- `--with-ecc` / `--with-prune` / `--with-tob` 플래그: ECC/ToB 프롬프트 비대화형 자동 진행 (CI/automation용). `--with-prune`은 `--with-ecc` 자동 활성
- `curl | bash` 환경에서도 `/dev/tty`로 ECC/ToB 프롬프트 인터랙티브 동작 (이전엔 stdin이 pipe라 skip)

### Changed
- ECC/ToB 블록 read에 `< /dev/tty 2>/dev/null` 패턴 적용
- `--help` 출력 cat heredoc로 정리 (가독성)

## [v27.1.0] — 2026-04-18

### Changed
- 디렉토리 구조 OSS 표준 준수 (root 13 → 8 파일):
  - `setup-harness.sh`, `prune-ecc.sh`, `sync-cherrypicks.sh`, `test-harness.sh` → `scripts/`
  - `Reference.md` → `docs/REFERENCE.md`
  - `USAGE.md` → `docs/USAGE.md`
  - `Docs/` → `docs/` (case rename)
- `install.sh` root 유지 (curl 진입점, 사용자 호환 유지)
- 모든 path 참조 일괄 업데이트 (README/CONTRIBUTING/CHANGELOG/CI workflow/scripts 내부)
- `setup-harness.sh`/`test-harness.sh` ROOT 변수 변경: scripts/ 안에서 실행 시 부모를 repo root로 인식

### BREAKING (수동 설치만)
- 수동 명령은 이제 `bash scripts/setup-harness.sh ...` 형태 (이전 `bash setup-harness.sh`)
- `curl | bash` 한 줄 설치는 그대로 작동 — install.sh가 새 경로 호출

## [v27.0.0] — 2026-04-18

### Added
- README.md (영어 first) + README.ko.md (한국어) 분리
- CONTRIBUTING.md, CHANGELOG.md, .github/workflows/test.yml (CI)
- Catch phrase + badges + Track별 설치 단계 (Step 1-3) + 시나리오별 명령

### Changed
- 리포 이름: `uzysClaudeUniversalEnv` → `uzys-claude-harness`
- 디렉토리 cleanup: 124MB backup 삭제, 5 .DS_Store 삭제, 잡파일 정리

## [v26.17.0] — 2026-04-18

### Added
- `docs/REFERENCE.md` — single catalog of all installed assets (Plugins / Skills / MCP / Agents / Cherry-pick / own) with trust tier (✅ official / 🟢 vetted third-party / 🟡 community), per-track applicability, exact install commands
- `README.md` link to docs/REFERENCE.md prominent at top of References section

### Security
- AgentShield CRITICAL 1 + HIGH 2 false positives resolved (`--no-verify` text in git-policy → "hook 검증 우회 플래그", "Goal-backward" in plan-checker → "Outcome-driven")
- `.claude/settings.local.json` untracked + added to `.gitignore`
- `git filter-repo` history rewrite: removed 6 commits referencing `settings.local.json`, anonymized `uzysjung@gmail.com` → `uzysjung@users.noreply.github.com` across all 67 tags + main
- `git config --local user.email` set to noreply (auto-applied to future commits)

## [v26.16.1] — 2026-04-18

### Changed
- `/uzys:plan` skill: added Plan Depth section with 3-tier guidance (Trivial → skip / Standard → milestones / Complex → detailed). Reflects Anthropic best practices "*if you can describe the diff in one sentence, skip the plan*". Stops forcing fine-grained decomposition on Opus-class models.

## [v26.16.0] — 2026-04-18

### Added
- **data Track 5 external skills**: polars + dask (K-Dense), python-resource-management + python-performance-optimization (wshobson), Anthropic data plugin (visualization)
- **CLAUDE.md Project Direction section** — codifies ECC.tools dependency, continuous-learning + Ralph loop autonomy, lean-by-design principles

### Decisions (skipped)
- pandas-pro skill: conflicts with our `polars 우선` policy
- awesome-llm-apps/data-analyst agent: our self-authored data-analyst is deeper (DuckDB+Trino+sklearn+PyTorch+XGBoost+MLflow+PySide6)
- K-Dense seaborn: covered by Anthropic data plugin

## [v26.15.0] — 2026-04-18

### Added
- `scripts/setup-harness.sh` end-of-flow ECC plugin prompt (interactive only, all tracks):
  - Q1: install ECC project-scoped? [y/N]
  - Q2: prune unused items? [y/N]
- `prune-ecc.sh --copy-only` flag (copy without prune)
- prune-ecc.sh now shows DELETED + KEPT file lists (categorized by skills/agents/commands)

## [v26.14.1] — 2026-04-18

### Removed
- `codebase-map.sh` hook (Claude can use Glob/Grep directly — was redundant)
- `change-management.md` Session Protocol section (duplicated CLAUDE.md Context Management)

### Changed
- `/uzys:spec` skill: added Pre-SPEC required questions block — Test Environment Parity (Prod DB, test strategy, external deps) + Critical E2E flows + Design Context (DESIGN.md/.impeccable.md for UI tracks)

## [v26.14.0] — 2026-04-18

### Added
- `setup-harness.sh --update` flag with two cleanup mechanisms:
  - **Orphan prune**: removes files in `.claude/{rules,agents,commands/uzys,hooks}` not present in templates (auto-cleans deprecated stuff in old installs)
  - **Stale hook ref cleanup**: removes `settings.json` hook entries pointing to non-existent files

### Changed
- Rule slim-down 21 → 17 files (~1,800 → 903 lines, -50%)
  - Deleted: `ecc-security-common`, `model-routing`, `seo`, `ecc-performance-common`
  - Compressed: `code-style`, `error-handling`, `git-policy`, `design-workflow`, `gates-taxonomy`, `cli-development`
  - Rationale: only enforce non-obvious project-specific invariants; linter/config files own everything else
- Hook auto-registration 9 → 6 (removed `uncommitted-check.sh`; demoted `spec-drift-check`/`checkpoint-snapshot`/`codebase-map` to on-demand utilities)

## [v26.12.0] — 2026-04-17

### Added
- `templates/track-mcp-map.tsv` — externalized Track→MCP mapping. New MCPs need only a single TSV row, no `scripts/setup-harness.sh` edit
- `docs/research/repo-deep-research-2026-04-17.md` — 5-axis self-research across reviewer agents

### Changed
- `scripts/setup-harness.sh` `.mcp.json` assembly switched from inline case statements to TSV-driven loop with `jq --arg`/`--argjson`

## [v26.11.0] — 2026-04-17

### Added
- Multi-Track install — `--track tooling --track csr-fastapi` (union)
- `--add-track` flag — add a track to an existing install (preserves `.mcp.json`/`.claude/*`)
- Helper functions: `any_track`, `has_dev_track`, `all_executive`

## [v26.10.0] — 2026-04-16

### Changed (BREAKING for old installs)
- ECC plugin replaced by **Track-based cherry-picks** (`.dev-references/cherrypicks.lock`). Existing global ECC users should run `claude plugin uninstall everything-claude-code@everything-claude-code` after migration
- `scripts/prune-ecc.sh` (new) for project-local ECC copy + selective prune (89 user-defined KEEP items)

## Earlier history

Tags v26.0.0 through v26.9.x: foundational work — 6-gate workflow, 11 principles, initial Track set, security hardening, reviewer subagent (SOD), agent-skills integration. See `git log` for details.

[Unreleased]: https://github.com/uzysjung/uzys-claude-harness/compare/v27.13.0...HEAD
[v27.13.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.13.0
[v27.12.1]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.12.1
[v27.12.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.12.0
[v27.11.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.11.0
[v27.10.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.10.0
[v27.9.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.9.0
[v27.8.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.8.0
[v27.7.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.7.0
[v27.6.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.6.0
[v27.5.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.5.0
[v27.4.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.4.0
[v27.3.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.3.0
[v27.2.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.2.0
[v27.1.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.1.0
[v27.0.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v27.0.0
[v26.17.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.17.0
[v26.16.1]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.16.1
[v26.16.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.16.0
[v26.15.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.15.0
[v26.14.1]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.14.1
[v26.14.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.14.0
[v26.12.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.12.0
[v26.11.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.11.0
[v26.10.0]: https://github.com/uzysjung/uzys-claude-harness/releases/tag/v26.10.0
