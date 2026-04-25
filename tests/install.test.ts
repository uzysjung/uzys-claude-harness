import { describe, expect, it, vi } from "vitest";
import { installAction, runInstall } from "../src/commands/install.js";

describe("runInstall", () => {
  it("returns ok=true with default cli=claude when --cli omitted", () => {
    const result = runInstall({});
    expect(result.ok).toBe(true);
    expect(result.cli).toBe("claude");
    expect(result.message).toContain("placeholder");
  });

  it.each(["claude", "codex", "both"] as const)("accepts %s as a valid --cli", (mode) => {
    const result = runInstall({ cli: mode });
    expect(result.ok).toBe(true);
    expect(result.cli).toBe(mode);
  });

  it("rejects an unknown --cli value with ok=false", () => {
    const result = runInstall({ cli: "rust" });
    expect(result.ok).toBe(false);
    expect(result.cli).toBe("claude");
    expect(result.message).toContain("must be one of");
    expect(result.message).toContain("rust");
  });

  it("preserves user-provided options without mutation", () => {
    const opts = { cli: "codex" as const, track: ["tooling"], withTauri: true };
    runInstall(opts);
    expect(opts.cli).toBe("codex");
    expect(opts.track).toEqual(["tooling"]);
    expect(opts.withTauri).toBe(true);
  });
});

describe("installAction", () => {
  it("logs success messages on valid options", () => {
    const log = vi.fn();
    const err = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    installAction({ cli: "codex", track: ["tooling"] }, { log, err, exit });
    expect(err).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("placeholder"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("CLI: codex"));
  });

  it("calls err + exit(1) on invalid --cli", () => {
    const log = vi.fn();
    const err = vi.fn();
    const exit = vi.fn() as unknown as (code: number) => never;
    installAction({ cli: "rust" }, { log, err, exit });
    expect(err).toHaveBeenCalledWith(expect.stringContaining("must be one of"));
    expect(exit).toHaveBeenCalledWith(1);
    // Success log should NOT have been emitted after the error path
    expect(log).not.toHaveBeenCalled();
  });

  it("falls back to console.log/console.error when deps omitted", () => {
    // Smoke test — we don't capture output, but we verify the call doesn't throw
    // for the valid path. (Default exit would terminate the process; covered by mock above.)
    expect(() => installAction({ cli: "claude" })).not.toThrow();
  });
});
