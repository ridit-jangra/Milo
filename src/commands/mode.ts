import type { Command, Mode } from "../types";

const command = {
  type: "local",
  name: "mode",
  description: "Switch mode. Usage: /mode agent | build | chat",
  isEnabled: true,
  isHidden: false,
  userFacingName() {
    return "mode";
  },
  async call(args, { setMode }) {
    const m = args.trim();
    if (m !== "agent" && m !== "build" && m !== "chat") {
      return "Usage: /mode agent | build | chat";
    }
    setMode(m as Mode);
    return `Switched to ${m} mode.`;
  },
} satisfies Command;

export default command;
