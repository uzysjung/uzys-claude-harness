import { cac } from "cac";
import { registerInstallCommand } from "./commands/install.js";

export const VERSION = "0.1.0-alpha.1";

export type Cli = ReturnType<typeof cac>;

export function buildCli(): Cli {
  const cli = cac("claude-harness");

  cli.help();
  cli.version(VERSION);

  registerInstallCommand(cli);

  // Default behavior when no subcommand: hint at interactive mode (Phase B)
  cli.command("", "Interactive mode (Phase B — not yet implemented)").action(() => {
    console.log("Interactive mode is not yet implemented (Phase B).");
    console.log("Use `claude-harness --help` for available commands.");
  });

  return cli;
}
