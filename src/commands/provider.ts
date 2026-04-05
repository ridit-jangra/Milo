import type { Command } from "../types";
import { setActiveProvider } from "../utils/providers";

const command = {
  type: "local",
  name: "provider",
  description: "Manage AI providers",
  isEnabled: true,
  isHidden: false,
  userFacingName() {
    return "provider";
  },
  async call(args: string, { pushMessage, openWizard }) {
    const sub = args.trim().split(" ")[0];

    if (!sub || sub === "list") {
      openWizard("list");
      return;
    }
    if (sub === "add") {
      openWizard("add");
      return;
    }
    if (sub === "remove") {
      openWizard("remove");
      return;
    }
    if (sub === "use") {
      const name = args.trim().split(" ")[1];
      if (!name) {
        openWizard("list");
        return;
      }
      try {
        await setActiveProvider(name);
        return `switched to "${name}" 🫡`;
      } catch (e) {
        return `error: ${(e as Error).message}`;
      }
    }

    return `usage: /provider | /provider add | /provider remove | /provider use <name>`;
  },
} satisfies Command;

export default command;
