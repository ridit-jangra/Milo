import type { Command, CommandContext } from "../types";
import { logout, getAuthState } from "../auth";

const command = {
  type: "local",
  name: "logout",
  description: "Logout from Milo",
  isEnabled: true,
  isHidden: false,
  userFacingName() {
    return "logout";
  },
  async call(_args: string, _context: CommandContext): Promise<string> {
    const state = await getAuthState();

    if (state.status !== "logged_in") {
      return `You're not logged in 😺`;
    }

    const email = state.session.user.email ?? "unknown";
    await logout();

    return [
      `👋 Logged out from ${email}`,
      ``,
      `Milo still works, but purr-coins won't be tracked.`,
      `Type /login to sign back in.`,
    ].join("\n");
  },
} satisfies Command;

export default command;
