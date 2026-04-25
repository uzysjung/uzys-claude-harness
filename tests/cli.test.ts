import { describe, expect, it } from "vitest";
import { VERSION, buildCli } from "../src/cli.js";
import { isCliMode } from "../src/commands/install.js";

describe("buildCli", () => {
  it("returns a cac instance with the expected name", () => {
    const cli = buildCli();
    expect(cli.name).toBe("claude-harness");
  });

  it("exposes the current version string in semver shape", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
  });

  it("registers the install subcommand", () => {
    const cli = buildCli();
    const installCmd = cli.commands.find((cmd) => cmd.name === "install");
    expect(installCmd).toBeDefined();
    expect(installCmd?.description).toContain("Install");
  });

  it("registers --cli, --track, --project-dir options on install", () => {
    const cli = buildCli();
    const installCmd = cli.commands.find((cmd) => cmd.name === "install");
    const optionNames = installCmd?.options.map((o) => o.name) ?? [];
    // cac normalizes flag names to camelCase
    expect(optionNames).toEqual(expect.arrayContaining(["cli", "track", "projectDir"]));
  });

  it("registers all 5 with-* boolean options on install", () => {
    const cli = buildCli();
    const installCmd = cli.commands.find((cmd) => cmd.name === "install");
    const optionNames = installCmd?.options.map((o) => o.name) ?? [];
    expect(optionNames).toEqual(
      expect.arrayContaining(["withTauri", "withGsd", "withEcc", "withPrune", "withTob"]),
    );
  });

  it("registers an explicit empty default command (interactive placeholder)", () => {
    const cli = buildCli();
    const defaultCmd = cli.commands.find((cmd) => cmd.name === "");
    expect(defaultCmd).toBeDefined();
  });

  it("default command action prints interactive placeholder messages", () => {
    const cli = buildCli();
    const defaultCmd = cli.commands.find((cmd) => cmd.name === "");
    const calls: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => {
      calls.push(args.join(" "));
    };
    try {
      // biome-ignore lint/suspicious/noExplicitAny: cac internal command shape varies
      (defaultCmd as any)?.commandAction?.();
    } finally {
      console.log = original;
    }
    expect(calls.some((line) => line.includes("Interactive mode"))).toBe(true);
  });
});

describe("isCliMode", () => {
  it.each(["claude", "codex", "both"])("accepts %s as a valid CLI mode", (mode) => {
    expect(isCliMode(mode)).toBe(true);
  });

  it.each([null, undefined, "", "invalid", 1, true, {}])(
    "rejects %s as an invalid CLI mode",
    (value) => {
      expect(isCliMode(value)).toBe(false);
    },
  );
});
