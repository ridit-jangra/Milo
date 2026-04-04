import {
  CONNECTOR_SYSTEM_PROMPT,
  AGENT_SYSTEM_PROMPT,
} from "../../utils/systemPrompt";
import { agentTools } from "../../utils/tools";
import { runLLM } from "../../utils/llm";

export async function spawnAgent(subtask: string, mode = "agent") {
  const system =
    mode === "connector" ? CONNECTOR_SYSTEM_PROMPT : AGENT_SYSTEM_PROMPT;

  const { text } = await runLLM({
    system,
    prompt: subtask,
    tools: agentTools,
  });

  return { subtask, result: text };
}
