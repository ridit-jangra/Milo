import type { Command, CommandContext } from "../types";
import { getAuthState } from "../auth";
import { getBalance } from "../wallet";
import { coin } from "../icons";

const command = {
  type: "local",
  name: "whoami",
  description: "Show your current login status 🐾",
  isEnabled: true,
  isHidden: false,
  userFacingName() {
    return "whoami";
  },
  async call(_args: string, _context: CommandContext): Promise<string> {
    const state = await getAuthState();

    if (state.status === "logged_in") {
      const email = state.session.user.email ?? "unknown";
      const userId = state.session.user.id;
      const balance = await getBalance();
      return [
        ``,
        `  😺 Logged in`,
        `  ─────────────────────────────`,
        `  Email   ${email}`,
        `  ID      ${userId}`,
        `  Coins   ${balance} ${coin}`,
        ``,
        `  Type /achievements to see your progress.`,
        ``,
      ].join("\n");
    }

    if (state.status === "anonymous") {
      return [
        ``,
        `  👤 Anonymous`,
        `  ─────────────────────────────`,
        `  Milo is working but not tracking coins.`,
        `  Type /login <email> to get started ${coin}`,
        ``,
      ].join("\n");
    }

    return [
      ``,
      `  🔒 Not logged in`,
      `  ─────────────────────────────`,
      `  Type /login <email> to get started ${coin}`,
      ``,
    ].join("\n");
  },
} satisfies Command;

export default command;
