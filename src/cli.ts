import { cac } from "cac";
import { registerInstallCommand } from "./commands/install.js";
import { type InteractiveResult, runInteractive } from "./interactive.js";

export const VERSION = "0.1.0-alpha.1";

export type Cli = ReturnType<typeof cac>;

export interface DefaultActionDeps {
  log?: (msg: string) => void;
  err?: (msg: string) => void;
  exit?: (code: number) => never;
  run?: (cwd: string) => Promise<InteractiveResult>;
}

/**
 * Pure default action handler. Easy to test directly.
 * The cac action callback delegates here.
 */
export async function defaultAction(deps: DefaultActionDeps = {}): Promise<void> {
  const log = deps.log ?? console.log;
  const err = deps.err ?? console.error;
  const exit = deps.exit ?? ((code: number) => process.exit(code) as never);
  const run = deps.run ?? ((cwd: string) => runInteractive(cwd));

  const result = await run(process.cwd());
  if (!result.ok) {
    if (result.message) {
      err(result.message);
    }
    // exit-code mapping: no-tty=2; cancelled/exit/disabled/declined=0
    exit(result.reason === "no-tty" ? 2 : 0);
    return;
  }
  // ok=true; Phase C wires the install pipeline here.
  log("Spec captured (Phase B). Phase C will run the install pipeline.");
}

export function buildCli(): Cli {
  const cli = cac("claude-harness");

  cli.help();
  cli.version(VERSION);

  registerInstallCommand(cli);

  cli
    .command("", "Interactive installer (state detection + prompts)")
    .action(() => defaultAction());

  return cli;
}
