import {
  getConnectorSystemPrompt,
  getOrchestratorAgentSystemPrompt,
} from "../../utils/systemPrompt";
import { agentTools, orchestratorAgentTools } from "../../utils/tools";
import { runLLM } from "../../utils/llm";
import type { OnOrchestratorEvent } from "../../types";

export async function spawnAgent(
  subtask: string,
  mode = "agent",
  onEvent?: OnOrchestratorEvent,
  taskId?: string,
) {
  onEvent?.({ type: "agent_start", taskId: taskId ?? "?", subtask });

  const system =
    mode === "connector"
      ? await getConnectorSystemPrompt()
      : await getOrchestratorAgentSystemPrompt();

  const tools =
    mode === "connector" ? orchestratorAgentTools : orchestratorAgentTools;

  const { text } = await runLLM({
    system,
    prompt: subtask,
    tools,
  });

  onEvent?.({ type: "agent_done", taskId: taskId ?? "?", result: text });
  return { subtask, result: text };
}
