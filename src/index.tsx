import { program } from "commander";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { version } = require("../package.json");

program
  .name("milo")
  .description("tiny cat. big code.")
  .version(version, "-v, --version", "display current version");

program
  .command("mcp")
  .description("run milo as an MCP server over stdio")
  .action(async () => {
    const { mcp } = await import("./server/mcp");
    await mcp();
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
