import {
  getConnectorSystemPrompt,
  getOrchestratorAgentSystemPrompt,
} from "../../utils/systemPrompt";
import { orchestratorAgentTools, connectorTools } from "../../utils/tools";
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

  const tools = mode === "connector" ? connectorTools : orchestratorAgentTools;

  const { text } = await runLLM({
    system,
    prompt: subtask,
    tools,
    mode: "orchestratorAgent",
    onToolCall: (toolCall) => {
      onEvent?.({
        type: "subagent_tool_call",
        taskId: taskId ?? "?",
        toolName: toolCall.toolName,
        input: toolCall.input,
      });
    },
    onToolResult: (toolResult) => {
      onEvent?.({
        type: "subagent_tool_result",
        taskId: taskId ?? "?",
        toolName: toolResult.toolName,
        output: toolResult.output,
      });
    },
  });

  onEvent?.({ type: "agent_done", taskId: taskId ?? "?", result: text });
  return { subtask, result: text };
}
