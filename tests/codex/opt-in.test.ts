import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCodexOptIn } from "../../src/codex/opt-in.js";

describe("runCodexOptIn — skills copy", () => {
  let projectDir: string;
  let codexHome: string;
  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "ch-cox-proj-"));
    codexHome = mkdtempSync(join(tmpdir(), "ch-cox-home-"));
    // Synthesize .agents/skills/uzys-{spec,plan} from a Codex transform
    for (const phase of ["spec", "plan", "build"]) {
      const skillDir = join(projectDir, ".agents/skills", `uzys-${phase}`);
      mkdirSync(skillDir, { recursive: true });
      writeFileSync(join(skillDir, "SKILL.md"), `# uzys-${phase}\n`);
    }
  });
  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(codexHome, { recursive: true, force: true });
  });

  it("copies uzys-* skills to ~/.codex/skills/ when withCodexSkills=true", () => {
    const report = runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: true,
      withCodexTrust: false,
      withCodexPrompts: false,
    });
    expect(report.skillsInstalled.enabled).toBe(true);
    expect(report.skillsInstalled.count).toBe(3);
    for (const phase of ["spec", "plan", "build"]) {
      expect(existsSync(join(codexHome, "skills", `uzys-${phase}`, "SKILL.md"))).toBe(true);
    }
  });

  it("withCodexSkills=false does NOT copy", () => {
    const report = runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: false,
      withCodexPrompts: false,
    });
    expect(report.skillsInstalled.enabled).toBe(false);
    expect(report.skillsInstalled.count).toBe(0);
    expect(existsSync(join(codexHome, "skills"))).toBe(false);
  });

  it("returns count=0 when source .agents/skills/ missing", () => {
    rmSync(join(projectDir, ".agents/skills"), { recursive: true });
    const report = runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: true,
      withCodexTrust: false,
      withCodexPrompts: false,
    });
    expect(report.skillsInstalled.count).toBe(0);
  });

  it("forward-compat: copies extra uzys-<phase> not in standard PHASES list", () => {
    // Add uzys-newphase (not in [spec, plan, build, test, review, ship])
    mkdirSync(join(projectDir, ".agents/skills", "uzys-newphase"), { recursive: true });
    writeFileSync(join(projectDir, ".agents/skills", "uzys-newphase", "SKILL.md"), "# new\n");
    const report = runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: true,
      withCodexTrust: false,
      withCodexPrompts: false,
    });
    // 3 standard (spec/plan/build) + 1 extra = 4
    expect(report.skillsInstalled.count).toBe(4);
    expect(existsSync(join(codexHome, "skills", "uzys-newphase", "SKILL.md"))).toBe(true);
  });
});

describe("runCodexOptIn — trust entry", () => {
  let projectDir: string;
  let codexHome: string;
  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "ch-trust-proj-"));
    codexHome = mkdtempSync(join(tmpdir(), "ch-trust-home-"));
  });
  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(codexHome, { recursive: true, force: true });
  });

  it("registers trust entry to ~/.codex/config.toml when withCodexTrust=true", () => {
    const report = runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: true,
      withCodexPrompts: false,
    });
    expect(report.trustEntry.enabled).toBe(true);
    expect(report.trustEntry.status).toBe("registered");
    const toml = readFileSync(join(codexHome, "config.toml"), "utf8");
    expect(toml).toContain(`[projects."${projectDir}"]`);
    expect(toml).toContain('trust_level = "trusted"');
  });

  it("idempotent — second call returns 'already-present'", () => {
    runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: true,
      withCodexPrompts: false,
    });
    const second = runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: true,
      withCodexPrompts: false,
    });
    expect(second.trustEntry.status).toBe("already-present");
  });

  it("withCodexTrust=false does NOT touch config.toml", () => {
    const report = runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: false,
      withCodexPrompts: false,
    });
    expect(report.trustEntry.enabled).toBe(false);
    expect(report.trustEntry.status).toBe("skipped");
    expect(existsSync(join(codexHome, "config.toml"))).toBe(false);
  });

  it("preserves existing trust entries (append, not overwrite)", () => {
    mkdirSync(codexHome, { recursive: true });
    writeFileSync(
      join(codexHome, "config.toml"),
      '[projects."/other/project"]\ntrust_level = "trusted"\n',
    );
    runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: true,
      withCodexPrompts: false,
    });
    const toml = readFileSync(join(codexHome, "config.toml"), "utf8");
    expect(toml).toContain('[projects."/other/project"]'); // preserved
    expect(toml).toContain(`[projects."${projectDir}"]`); // added
  });
});

describe("runCodexOptIn — both flags", () => {
  let projectDir: string;
  let codexHome: string;
  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "ch-both-proj-"));
    codexHome = mkdtempSync(join(tmpdir(), "ch-both-home-"));
    for (const phase of ["spec", "plan"]) {
      mkdirSync(join(projectDir, ".agents/skills", `uzys-${phase}`), { recursive: true });
      writeFileSync(
        join(projectDir, ".agents/skills", `uzys-${phase}`, "SKILL.md"),
        `# ${phase}\n`,
      );
    }
  });
  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(codexHome, { recursive: true, force: true });
  });

  it("both opt-ins enabled — both report fields populated", () => {
    const report = runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: true,
      withCodexTrust: true,
      withCodexPrompts: false,
    });
    expect(report.skillsInstalled.enabled).toBe(true);
    expect(report.skillsInstalled.count).toBe(2);
    expect(report.trustEntry.enabled).toBe(true);
    expect(report.trustEntry.status).toBe("registered");
  });
});

describe("runCodexOptIn — withCodexPrompts (v0.7.0)", () => {
  let projectDir: string;
  let codexHome: string;
  let harnessRoot: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "ch-prom-proj-"));
    codexHome = mkdtempSync(join(tmpdir(), "ch-prom-home-"));
    harnessRoot = mkdtempSync(join(tmpdir(), "ch-prom-harn-"));

    // harnessRoot에 templates/commands/uzys/ 구조 만들기
    const cmdDir = join(harnessRoot, "templates/commands/uzys");
    mkdirSync(cmdDir, { recursive: true });
    for (const phase of ["spec", "plan", "build", "test", "review", "ship"]) {
      writeFileSync(
        join(cmdDir, `${phase}.md`),
        `---\ndescription: "uzys ${phase} phase"\n---\n\n## Process\n\n1. ${phase} 단계.\n`,
      );
    }
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(codexHome, { recursive: true, force: true });
    rmSync(harnessRoot, { recursive: true, force: true });
  });

  it("withCodexPrompts=true + harnessRoot → 6 prompts 생성", () => {
    const report = runCodexOptIn({
      projectDir,
      harnessRoot,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: false,
      withCodexPrompts: true,
    });
    expect(report.promptsInstalled.enabled).toBe(true);
    expect(report.promptsInstalled.count).toBe(6);
    for (const phase of ["spec", "plan", "build", "test", "review", "ship"]) {
      expect(existsSync(join(codexHome, "prompts", `uzys-${phase}.md`))).toBe(true);
    }
  });

  it("withCodexPrompts=false → 0 prompts (opt-out)", () => {
    const report = runCodexOptIn({
      projectDir,
      harnessRoot,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: false,
      withCodexPrompts: false,
    });
    expect(report.promptsInstalled.enabled).toBe(false);
    expect(report.promptsInstalled.count).toBe(0);
    expect(existsSync(join(codexHome, "prompts"))).toBe(false);
  });

  it("withCodexPrompts=true + harnessRoot 부재 → projectDir/.claude/commands/uzys fallback", () => {
    // harnessRoot 미제공, projectDir에 .claude/commands/uzys 만들기
    const fallback = join(projectDir, ".claude/commands/uzys");
    mkdirSync(fallback, { recursive: true });
    writeFileSync(join(fallback, "spec.md"), `---\ndescription: "fallback spec"\n---\n\nbody\n`);
    const report = runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: false,
      withCodexPrompts: true,
    });
    expect(report.promptsInstalled.count).toBe(1); // spec only
    expect(existsSync(join(codexHome, "prompts/uzys-spec.md"))).toBe(true);
  });

  it("idempotent: 2회 호출 시 6개 그대로 (덮어쓰기)", () => {
    const ctx = {
      projectDir,
      harnessRoot,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: false,
      withCodexPrompts: true,
    };
    runCodexOptIn(ctx);
    const second = runCodexOptIn(ctx);
    expect(second.promptsInstalled.count).toBe(6);
    expect(existsSync(join(codexHome, "prompts/uzys-spec.md"))).toBe(true);
  });
});
