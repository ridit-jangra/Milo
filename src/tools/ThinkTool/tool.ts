import { tool } from "ai";
import { z } from "zod";

export const ThinkTool = tool({
  title: "Think",
  description:
    "Use this tool to think out loud in first person before acting. Write your internal monologue like 'I need to…', 'I should…', 'I did…', 'My plan is…'. No side effects.",
  inputSchema: z.object({
    thought: z
      .string()
      .describe("Your reasoning, plan, or analysis before taking action"),
  }),
  execute: async ({ thought }) => {
    return { success: true, thought };
  },
});
