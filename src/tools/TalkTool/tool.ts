import { tool } from "ai";
import { z } from "zod";

import { DESCRIPTION, PROMPT } from "./prompt";
import { messageQueue } from "../../agents/queue/messageQueue";

export const TalkTool = tool({
  title: "Talk",
  description: DESCRIPTION + "\n\n" + PROMPT,
  inputSchema: z.object({
    name: z.string().describe("Name of the agent to send message to"),
    message: z.string().describe("The message you want to send"),
    yourName: z.string().describe("Your own agent name"),
  }),
  execute: async ({
    name,
    message,
    yourName,
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      messageQueue.push(name, yourName, message);
      console.log(`[${yourName}] to [${name}]: ${message}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
});
