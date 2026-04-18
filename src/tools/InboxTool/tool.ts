import { tool } from "ai";
import { z } from "zod";
import { DESCRIPTION, PROMPT } from "./prompt";
import { messageQueue } from "../../agents/queue/messageQueue";

export const InboxTool = tool({
  title: "Inbox",
  description: DESCRIPTION + "\n\n" + PROMPT,
  inputSchema: z.object({
    name: z.string().describe("Your agent name"),
  }),
  execute: async ({
    name,
  }): Promise<{
    messages: { from: string; message: string; timestamp: number }[];
  }> => {
    const messages = messageQueue.peek(name);
    messageQueue.clear(name);

    for (const msg of messages) {
      console.log(`[${name}] received from [${msg.from}]: ${msg.message}`);
    }

    return { messages };
  },
});
