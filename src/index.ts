import { buildCli } from "./cli.js";

const cli = buildCli();
cli.parse(process.argv);
