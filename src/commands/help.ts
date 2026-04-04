import type { Command } from "../types";
import { getCommands } from "../commands";

const command = {
  type: "local",
  name: "help",
  description: "List all available commands",
  isEnabled: true,
  isHidden: false,
  userFacingName() {
    return "help";
  },
  async call() {
    const commands = getCommands().filter((c) => !c.isHidden);
    return commands
      .map((c) => {
        const name = c.userFacingName();
        const aliases = c.aliases ? ` (${c.aliases.join(", ")})` : "";
        return `/${name}${aliases} — ${c.description}`;
      })
      .join("\n");
  },
} satisfies Command;

export default command;
