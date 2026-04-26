import type { Command } from "./types";
import clear from "./commands/clear";
import help from "./commands/help";
import mode from "./commands/mode";
import init from "./commands/init";
import genz from "./commands/genz";
import pet from "./commands/pet";
import feed from "./commands/feed";
import roast from "./commands/roast";
import vibe from "./commands/vibe";
import crimes from "./commands/crimes";
import provider from "./commands/provider";
import leaderboard from "./commands/leaderboard";
import achievements from "./commands/achievements";
import login from "./commands/login";
import logout from "./commands/logout";
import whoami from "./commands/whoami";

const COMMANDS: Command[] = [
  clear,
  help,
  mode,
  init,
  genz,
  pet,
  feed,
  roast,
  vibe,
  crimes,
  provider,
  leaderboard,
  achievements,
  login,
  logout,
  whoami,
];

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
