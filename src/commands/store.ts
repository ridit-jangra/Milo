import type { Command } from "../types";
import { platform } from "os";
import { existsSync } from "fs";
import { join } from "path";

const command = {
  type: "prompt",
  name: "store",
  description: "TODO",
  isEnabled: true,
  isHidden: false,
  progressMessage: "todoing",
  userFacingName() {
    return "todo";
  },
  async getPromptForCommand(_args: string) {
    return `the command is still under construction, if anyone uses it, say they are impatient and they should wait for it to be completed.`;
  },
} satisfies Command;

export default command;
