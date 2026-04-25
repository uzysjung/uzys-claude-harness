/**
 * Codex global opt-in — ~/.codex/skills/ 복사 + ~/.codex/config.toml trust entry.
 *
 * SPEC: docs/specs/cli-rewrite-completeness.md F10, F11 (Reviewer HIGH-3, HIGH-4)
 * Source: bash setup-harness.sh@911c246~1 L1389~1429
 *
 * SAFETY: 사용자 명시 opt-in 없이 ~/.codex/ 글로벌 수정 금지 (D16 / ADR-002 v2 D4).
 * 호출자(installer)는 OptionFlags.withCodexSkills / withCodexTrust 둘 다 true일 때만 호출.
 */

import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { type RegisterTrustResult, registerTrustEntry } from "./trust-entry.js";

export interface CodexOptInReport {
  /** ~/.codex/skills/uzys-{phase}/ 복사 결과 */
  skillsInstalled: {
    enabled: boolean;
    /** 복사된 skill 폴더 갯수 (uzys-spec, uzys-plan, ...) */
    count: number;
    /** 복사 대상 글로벌 경로 (절대 경로) */
    targetDir: string;
  };
  /** ~/.codex/config.toml trust entry 등록 결과 */
  trustEntry: {
    enabled: boolean;
    status: "registered" | "already-present" | "error" | "skipped";
    message?: string;
  };
}

export interface CodexOptInContext {
  /** 사용자 프로젝트 root (.codex-skills/ 소스). */
  projectDir: string;
  /** 글로벌 ~/.codex/ 경로 (테스트 override 가능). */
  codexHome?: string;
  /** ~/.codex/skills/uzys-* 복사 활성? */
  withCodexSkills: boolean;
  /** ~/.codex/config.toml trust entry 등록 활성? */
  withCodexTrust: boolean;
}

const PHASES = ["spec", "plan", "build", "test", "review", "ship"];

/**
 * 두 opt-in 액션 실행. 비활성 플래그는 skip.
 */
export function runCodexOptIn(ctx: CodexOptInContext): CodexOptInReport {
  const codexHome = ctx.codexHome ?? join(homedir(), ".codex");
  const skillsTarget = join(codexHome, "skills");
  const configPath = join(codexHome, "config.toml");

  // 1. ~/.codex/skills/uzys-* 복사
  let skillsCount = 0;
  if (ctx.withCodexSkills) {
    skillsCount = copyCodexSkills(ctx.projectDir, skillsTarget);
  }

  // 2. ~/.codex/config.toml trust entry
  let trustResult: RegisterTrustResult & { enabled: boolean } = {
    enabled: false,
    status: "registered",
  };
  if (ctx.withCodexTrust) {
    const result = registerTrustEntry({
      configPath,
      projectDir: ctx.projectDir,
    });
    trustResult = { enabled: true, ...result };
  }

  return {
    skillsInstalled: {
      enabled: ctx.withCodexSkills,
      count: skillsCount,
      targetDir: skillsTarget,
    },
    trustEntry: {
      enabled: ctx.withCodexTrust,
      status: trustResult.enabled ? trustResult.status : "skipped",
      ...(trustResult.message ? { message: trustResult.message } : {}),
    },
  };
}

/**
 * 프로젝트의 .codex-skills/uzys-{phase}/ 6 폴더를 ~/.codex/skills/ 로 복사.
 * @returns 복사된 폴더 갯수
 */
function copyCodexSkills(projectDir: string, skillsTarget: string): number {
  const sourceDir = join(projectDir, ".codex-skills");
  if (!existsSync(sourceDir)) {
    return 0;
  }
  mkdirSync(skillsTarget, { recursive: true });

  let count = 0;
  for (const phase of PHASES) {
    const src = join(sourceDir, `uzys-${phase}`);
    if (!existsSync(src)) continue;
    const dest = join(skillsTarget, `uzys-${phase}`);
    cpSync(src, dest, { recursive: true });
    count++;
  }

  // Catch any other uzys-* (forward-compat, in case PHASES expands)
  try {
    for (const entry of readdirSync(sourceDir)) {
      if (!entry.startsWith("uzys-")) continue;
      const phase = entry.slice("uzys-".length);
      if (PHASES.includes(phase)) continue; // already copied
      cpSync(join(sourceDir, entry), join(skillsTarget, entry), { recursive: true });
      count++;
    }
  } catch {
    // best-effort
  }

  return count;
}
