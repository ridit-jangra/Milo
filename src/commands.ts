import type { Command } from "./types";
import clear from "./commands/clear";
import help from "./commands/help";
import mode from "./commands/mode";
import init from "./commands/init";
import genz from "./commands/genz";

const COMMANDS: Command[] = [clear, help, mode, init, genz];

export function getCommands(): Command[] {
  return COMMANDS.filter((c) => c.isEnabled);
}

export function findCommand(
  input: string,
): { command: Command; args: string } | null {
  if (!input.startsWith("/")) return null;
  const [name, ...rest] = input.slice(1).split(" ");
  const args = rest.join(" ");
  const command = COMMANDS.find(
    (c) => c.userFacingName() === name || c.aliases?.includes(name ?? ""),
  );
  if (!command || !command.isEnabled) return null;
  return { command, args };
}
