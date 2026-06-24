import { tool } from "ai";
import { z } from "zod";
import { DESCRIPTION, PROMPT } from "./prompt";
import { agentStream } from "../../utils/agentStream";

function describeActivity(toolName: string, input: unknown): string {
  const obj = (input ?? {}) as Record<string, unknown>;
  const hint =
    (typeof obj.command === "string" && obj.command) ||
    (typeof obj.file_path === "string" && obj.file_path) ||
    (typeof obj.path === "string" && obj.path) ||
    (typeof obj.pattern === "string" && obj.pattern) ||
    (typeof obj.query === "string" && obj.query) ||
    "";
  return hint ? `${toolName} · ${hint}` : toolName;
}

export const AgentTool = tool({
  title: "Agent",
  description: DESCRIPTION + "\n\n" + PROMPT,
  inputSchema: z.object({
    prompt: z.string().describe("The task for the sub-agent to perform"),
  }),
  execute: async ({
    prompt,
  }): Promise<{ success: boolean; result?: string; error?: string }> => {
    const id = crypto.randomUUID();
    const task = prompt.split("\n")[0]?.slice(0, 80) ?? prompt.slice(0, 80);
    agentStream.emit("start", { id, task, prompt });

    try {
      const { createSubAgent } = await import("../../agents/agent.js");
      const result = (
        await createSubAgent(
          prompt,
          undefined,
          (t) => {
            agentStream.emit("activity", {
              id,
              activity: describeActivity(t.toolName, t.input),
            });
            agentStream.emit("tool_call", { id, call: t });
          },
          (t) => agentStream.emit("tool_result", { id, result: t }),
        )
      ).text;
      agentStream.emit("done", { id, success: true, text: result });
      return { success: true, result };
    } catch (err) {
      agentStream.emit("done", { id, success: false, text: String(err) });
      return { success: false, error: String(err) };
    }
  },
});
