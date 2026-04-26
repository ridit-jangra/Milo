import type { Command, CommandContext } from "../types";
import { sendMagicLink, verifyOtp, getAuthState } from "../auth";

let pendingEmail: string | null = null;

const command = {
  type: "local",
  name: "login",
  description: "Login to Milo to earn purr-coins 🪙",
  isEnabled: true,
  isHidden: false,
  userFacingName() {
    return "login";
  },
  async call(args: string): Promise<string> {
    const input = args.trim().replace(/^mailto:/i, "");

    const state = await getAuthState();
    if (state.status === "logged_in") {
      const email = state.session.user.email ?? "unknown";
      return `✅ Already logged in as ${email}\nUse /logout to sign out.`;
    }

    if (pendingEmail && /^\d{6,8}$/.test(input)) {
      const { session, error } = await verifyOtp(pendingEmail, input);

      if (error || !session) {
        return `❌ Invalid code. Try again or re-run /login <email> to resend.`;
      }

      const email = session.user.email ?? pendingEmail;
      pendingEmail = null;
      return [
        `✅ Logged in as ${email}! Welcome to the leaderboard 👑`,
        ``,
        `You can now earn purr-coins 🪙 and unlock achievements 🐾`,
        `Type /achievements to see what you can unlock.`,
      ].join("\n");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(input)) {
      const { error } = await sendMagicLink(input);

      if (error) {
        return `❌ Couldn't send magic link: ${error}`;
      }

      pendingEmail = input;
      return [
        `📬 Magic link sent to ${input}!`,
        ``,
        `Check your email for your code, then type:`,
        `  /login <code>`,
      ].join("\n");
    }

    return [
      `🔐 Login to Milo`,
      ``,
      `  /login <email>   → sends a code to your email`,
      `  /login <code>    → verify the code from your email`,
      ``,
      `Without login, Milo works normally but purr-coins`,
      `and achievements won't be tracked. No pressure tho 😼`,
    ].join("\n");
  },
} satisfies Command;

export default command;
