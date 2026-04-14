import { tool } from "ai";
import { z } from "zod";
import {
  DESCRIPTION,
  PROMPT,
  MAX_OUTPUT_LENGTH,
  BANNED_COMMANDS,
} from "./prompt.js";
import { PersistentShell } from "../../utils/PersistentShell.js";
import { writeFileSync } from "fs";
import { requestPermission } from "../../permissions.js";

const inputSchema = z.object({
  command: z.string().describe("The bash command to execute"),
  timeout: z
    .number()
    .optional()
    .describe("Timeout in milliseconds, max 600000"),
});

export const BashTool = {
  description: DESCRIPTION + "\n\n" + PROMPT,
  title: "Bash",
  inputSchema,
  execute: async ({ command, timeout }: z.infer<typeof inputSchema>) => {
    const decision = await requestPermission("BashTool", { command });
    if (decision === "deny")
      return { success: false, output: "User denied permission" };

    try {
      const banned = BANNED_COMMANDS.find(
        (cmd) => command.split(/\s+/)[0] === cmd,
      );
      if (banned)
        return {
          success: false,
          error: `Command "${banned}" is not allowed`,
        };

      const shell = PersistentShell.getInstance();

      const sanitized =
        process.platform === "win32" ? command.replace(/\^"/g, '"') : command;

      let finalCommand = sanitized;

      if (process.platform === "win32") {
        const commitMatch = sanitized.match(/^git\s+commit\s+-m\s+(.+)$/i);
        if (commitMatch) {
          let msg = commitMatch[1]!.trim();
          if (
            (msg.startsWith('"') && msg.endsWith('"')) ||
            (msg.startsWith("'") && msg.endsWith("'"))
          ) {
            msg = msg.slice(1, -1);
          }
          const tempPath = `${process.env.TEMP}\\milo_commit_msg.txt`;
          writeFileSync(tempPath, msg);
          finalCommand = sanitized.replace(
            /^git\s+commit\s+-m\s+.+$/i,
            `git commit -F '${tempPath}'`,
          );
        }
      }

      const output = await shell.execute(finalCommand, timeout);

      const truncated = output.length > MAX_OUTPUT_LENGTH;
      return {
        success: true,
        output: truncated
          ? output.slice(0, MAX_OUTPUT_LENGTH) + "\n... (truncated)"
          : output,
        truncated,
      };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
};
