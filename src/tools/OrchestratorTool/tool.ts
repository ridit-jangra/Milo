// OrchestratorTool.ts
import { z } from "zod";
import { DESCRIPTION, PROMPT } from "./prompt";
import { tool } from "ai";
import { Orchestrator } from "../../multi-agent/orchestrator/orchestrator";
import type { OnOrchestratorEvent } from "../../types";

export function createOrchestratorTool(onEvent?: OnOrchestratorEvent) {
  return tool({
    description: DESCRIPTION + "\n\n" + PROMPT,
    inputSchema: z.object({
      goal: z.string().describe("The complex task to orchestrate"),
    }),
    title: "Orchestrator",
    execute: async ({ goal }) => {
      const orchestrator = new Orchestrator(onEvent);
      return await orchestrator.startTask(goal);
    },
  });
}
