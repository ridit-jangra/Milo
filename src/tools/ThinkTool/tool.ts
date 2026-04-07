import { tool } from "ai";
import { z } from "zod";

export const ThinkTool = tool({
  title: "Think",
  description:
    "Use this tool to think through a problem before acting. No side effects — just a scratchpad for reasoning.",
  inputSchema: z.object({
    thought: z
      .string()
      .describe("Your reasoning, plan, or analysis before taking action"),
  }),
  execute: async ({ thought }) => {
    return { success: true, thought };
  },
});
