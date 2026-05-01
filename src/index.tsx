import { program } from "commander";
import { serve } from "./server/serve";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { version } = require("../package.json");

program
  .name("milo")
  .description("tiny cat. big code.")
  .version(version, "-v, --version", "display current version");

program
  .command("serve")
  .description("start milo daemon on port 6969")
  .option("-p, --port <port>", "port to listen on", "6969")
  .action(async (opts) => {
    await serve({ port: parseInt(opts.port) });
  });

program
  .command("kill")
  .description("stop running daemon")
  .action(async () => {
    // read ~/.milo/milo.port, send DELETE /shutdown
    const { kill } = await import("./server/kill");
    await kill();
  });

program
  .command("status")
  .description("check if daemon is running")
  .action(async () => {
    const { status } = await import("./server/status");
    await status();
  });

// default — no command = launch REPL
if (process.argv.length <= 2) {
  const { render } = await import("ink");
  const { default: REPL } = await import("./screens/REPL");
  const React = await import("react");
  render(React.default.createElement(REPL));
} else {
  program.parse();
}
