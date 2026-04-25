/**
 * design.ts — CLI visual design tokens (color, symbols, layout helpers).
 *
 * Goals (from user feedback on the bash CLI):
 *   1. Make input-wait points visually obvious (handled by @clack/prompts).
 *   2. Make the install pipeline output legible:
 *      - clear visual hierarchy (header / key-value / status row)
 *      - consistent column alignment for "Tracks:", "Files copied:", etc.
 *      - color-coded status (success/warn/error/info), but only when the
 *        output is a TTY and `NO_COLOR` is not set.
 *   3. Zero runtime dependencies — emit raw ANSI escapes.
 *
 * `NO_COLOR` is honored per https://no-color.org.
 */

const isColorEnabled = (() => {
  if (process.env.NO_COLOR && process.env.NO_COLOR !== "") {
    return false;
  }
  // stdout may be missing in some test contexts
  return Boolean(process.stdout?.isTTY);
})();

function wrap(open: number, close: number) {
  return (s: string): string => {
    if (!isColorEnabled) {
      return s;
    }
    return `\x1b[${open}m${s}\x1b[${close}m`;
  };
}

export const c = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
};

export const symbol = {
  success: "✓",
  failure: "✗",
  arrow: "›",
  bullet: "•",
  warn: "⚠",
};

/** Render a section header. Bold cyan with a leading arrow. */
export function header(title: string): string {
  return c.bold(c.cyan(`${symbol.arrow} ${title}`));
}

/**
 * Render a `key: value` row with a fixed-width left column for alignment.
 * The default width (16) matches the install report's longest key.
 */
export function keyValue(key: string, value: string, width = 16): string {
  const padded = `${key}:`.padEnd(width, " ");
  return `  ${c.dim(padded)} ${value}`;
}

export const status = {
  success: (msg: string): string => `${c.green(symbol.success)} ${msg}`,
  failure: (msg: string): string => `${c.red(symbol.failure)} ${msg}`,
  warn: (msg: string): string => `${c.yellow(symbol.warn)} ${msg}`,
  info: (msg: string): string => `${c.cyan(symbol.bullet)} ${msg}`,
};
