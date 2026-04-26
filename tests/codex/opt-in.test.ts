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
    });
    const second = runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: true,
    });
    expect(second.trustEntry.status).toBe("already-present");
  });

  it("withCodexTrust=false does NOT touch config.toml", () => {
    const report = runCodexOptIn({
      projectDir,
      codexHome,
      withCodexSkills: false,
      withCodexTrust: false,
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
    });
    expect(report.skillsInstalled.enabled).toBe(true);
    expect(report.skillsInstalled.count).toBe(2);
    expect(report.trustEntry.enabled).toBe(true);
    expect(report.trustEntry.status).toBe("registered");
  });
});
