import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ESC = String.fromCharCode(27);
const ANSI_RE = new RegExp(`${ESC}\\[[0-9;]*m`, "g");
const BOLD_RE = new RegExp(`${ESC}\\[1m`);

describe("design module — color disabled (no TTY)", () => {
  let originalIsTTY: boolean | undefined;
  let originalNoColor: string | undefined;

  beforeEach(() => {
    originalIsTTY = process.stdout?.isTTY;
    originalNoColor = process.env.NO_COLOR;
    Object.defineProperty(process.stdout, "isTTY", { value: false, configurable: true });
    Reflect.deleteProperty(process.env, "NO_COLOR");
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(process.stdout, "isTTY", {
      value: originalIsTTY,
      configurable: true,
    });
    if (originalNoColor !== undefined) {
      process.env.NO_COLOR = originalNoColor;
    }
  });

  it("returns plain text when not a TTY", async () => {
    const { c } = await import("../src/design.js");
    expect(c.green("ok")).toBe("ok");
    expect(c.red("err")).toBe("err");
    expect(c.bold("bold")).toBe("bold");
  });

  it("status helpers always include the symbol prefix", async () => {
    const { status } = await import("../src/design.js");
    expect(status.success("done")).toContain("✓");
    expect(status.failure("nope")).toContain("✗");
    expect(status.warn("careful")).toContain("⚠");
    expect(status.info("hi")).toContain("•");
  });

  it("keyValue pads the key column", async () => {
    const { keyValue } = await import("../src/design.js");
    const row = keyValue("Tracks", "tooling");
    expect(row).toContain("Tracks:");
    expect(row).toContain("tooling");
  });

  it("header includes the arrow symbol + title", async () => {
    const { header } = await import("../src/design.js");
    expect(header("Install")).toContain("›");
    expect(header("Install")).toContain("Install");
  });
});

describe("design module — color enabled (TTY)", () => {
  let originalIsTTY: boolean | undefined;
  let originalNoColor: string | undefined;

  beforeEach(() => {
    originalIsTTY = process.stdout?.isTTY;
    originalNoColor = process.env.NO_COLOR;
    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    Reflect.deleteProperty(process.env, "NO_COLOR");
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(process.stdout, "isTTY", {
      value: originalIsTTY,
      configurable: true,
    });
    if (originalNoColor !== undefined) {
      process.env.NO_COLOR = originalNoColor;
    } else {
      Reflect.deleteProperty(process.env, "NO_COLOR");
    }
  });

  it("emits ANSI escapes when stdout is a TTY", async () => {
    const { c } = await import("../src/design.js");
    expect(c.green("ok")).toMatch(ANSI_RE);
    expect(c.bold("x")).toMatch(BOLD_RE);
  });

  it("respects NO_COLOR even on a TTY", async () => {
    process.env.NO_COLOR = "1";
    vi.resetModules();
    const { c } = await import("../src/design.js");
    expect(c.green("ok")).toBe("ok");
  });
});
