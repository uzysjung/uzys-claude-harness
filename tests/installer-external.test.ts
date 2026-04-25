import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExternalInstallReport } from "../src/external-installer.js";
import { type InstallContext, runInstall } from "../src/installer.js";
import type { InstallSpec, OptionFlags, Track } from "../src/types.js";

type RunExternalFn = NonNullable<InstallContext["runExternal"]>;
function makeMock(fn: RunExternalFn): RunExternalFn & {
  mock: { calls: Array<Parameters<RunExternalFn>> };
} {
  return vi.fn(fn) as unknown as RunExternalFn & {
    mock: { calls: Array<Parameters<RunExternalFn>> };
  };
}

const HARNESS_ROOT = resolve(__dirname, "..");

const NO_OPTS: OptionFlags = {
  withTauri: false,
  withGsd: false,
  withEcc: false,
  withPrune: false,
  withTob: false,
};

function spec(tracks: Track[], options: Partial<OptionFlags>, projectDir: string): InstallSpec {
  return {
    tracks,
    options: { ...NO_OPTS, ...options },
    cli: "claude",
    projectDir,
  };
}

const EMPTY_REPORT: ExternalInstallReport = {
  attempted: [],
  succeeded: 0,
  skipped: 0,
};

describe("runInstall — external assets integration", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "ch-ext-"));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("calls runExternal with spec.tracks + options when not disabled", () => {
    const runExternal = makeMock(() => EMPTY_REPORT);
    runInstall({
      runExternal,
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: spec(["tooling"], { withEcc: true, withPrune: true }, projectDir),
    });
    expect(runExternal).toHaveBeenCalledOnce();
    const [ctx] = runExternal.mock.calls[0] ?? [];
    expect(ctx?.tracks).toEqual(["tooling"]);
    expect(ctx?.options.withEcc).toBe(true);
    expect(ctx?.options.withPrune).toBe(true);
  });

  it("skips external install when runExternal=null (test mode)", () => {
    const report = runInstall({
      runExternal: null,
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: spec(["tooling"], {}, projectDir),
    });
    expect(report.external).toBeNull();
  });

  it("attaches external report to InstallReport when runExternal returns one", () => {
    const fakeExternal: ExternalInstallReport = {
      attempted: [
        {
          asset: {
            id: "test-skill",
            description: "test",
            condition: { kind: "any-track", tracks: ["tooling"] },
            method: { kind: "skill", source: "owner/repo" },
          },
          ok: true,
        },
      ],
      succeeded: 1,
      skipped: 0,
    };
    const report = runInstall({
      runExternal: () => fakeExternal,
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: spec(["tooling"], {}, projectDir),
    });
    expect(report.external).toBe(fakeExternal);
    expect(report.external?.attempted[0]?.asset.id).toBe("test-skill");
  });

  it("propagates --with-ecc through to external installer ctx", () => {
    const runExternal = makeMock(() => EMPTY_REPORT);
    runInstall({
      runExternal,
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: spec(["tooling"], { withEcc: true }, projectDir),
    });
    expect(runExternal.mock.calls[0]?.[0]?.options.withEcc).toBe(true);
  });

  it("propagates --with-tob through", () => {
    const runExternal = makeMock(() => EMPTY_REPORT);
    runInstall({
      runExternal,
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: spec(["csr-fastapi"], { withTob: true }, projectDir),
    });
    expect(runExternal.mock.calls[0]?.[0]?.options.withTob).toBe(true);
  });

  it("propagates --with-gsd through", () => {
    const runExternal = makeMock(() => EMPTY_REPORT);
    runInstall({
      runExternal,
      harnessRoot: HARNESS_ROOT,
      projectDir,
      spec: spec(["executive"], { withGsd: true }, projectDir),
    });
    expect(runExternal.mock.calls[0]?.[0]?.options.withGsd).toBe(true);
  });
});
