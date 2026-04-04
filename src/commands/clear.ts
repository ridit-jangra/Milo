import type { Command } from "../types";

const command = {
  type: "local",
  name: "clear",
  description: "Clear chat history and session",
  isEnabled: true,
  isHidden: false,
  aliases: ["cls"],
  userFacingName() {
    return "clear";
  },
  async call(_, { clearMessages }) {
    clearMessages();
  },
} satisfies Command;

export default command;
