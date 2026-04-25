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

describe("design — phase + section + asset rendering (NO_COLOR)", () => {
  beforeEach(() => {
    process.env.NO_COLOR = "1";
    vi.resetModules();
  });

  it("phaseHeader pads to width with rule chars", async () => {
    const { phaseHeader } = await import("../src/design.js");
    const out = phaseHeader(1, "Templates", 60);
    expect(out).toContain("Phase 1");
    expect(out).toContain("Templates");
    expect(out.length).toBe(60);
  });

  it("sectionHeader includes title + width pad", async () => {
    const { sectionHeader } = await import("../src/design.js");
    const out = sectionHeader("Summary", 40);
    expect(out).toContain("Summary");
    expect(out.length).toBe(40);
  });

  it("divider produces width chars of rule", async () => {
    const { divider } = await import("../src/design.js");
    const out = divider(20);
    expect(out.length).toBe(20);
  });

  it("infoRow has label + value with padding", async () => {
    const { infoRow } = await import("../src/design.js");
    const out = infoRow("KEY", "value");
    expect(out).toContain("KEY");
    expect(out).toContain("value");
  });

  it("assetRow renders different symbols for kind", async () => {
    const { assetRow } = await import("../src/design.js");
    expect(assetRow("success", "lbl")).toContain("✓");
    expect(assetRow("skip", "lbl")).toContain("⊘");
    expect(assetRow("failure", "lbl")).toContain("✗");
  });

  it("assetRow with meta puts meta to the right", async () => {
    const { assetRow } = await import("../src/design.js");
    const out = assetRow("success", "asset-id", "5 files");
    expect(out).toContain("asset-id");
    expect(out).toContain("5 files");
    expect(out.indexOf("asset-id")).toBeLessThan(out.indexOf("5 files"));
  });

  it("assetRow without meta omits trailing whitespace", async () => {
    const { assetRow } = await import("../src/design.js");
    const out = assetRow("success", "x");
    expect(out).not.toMatch(/\s+$/);
  });
});
