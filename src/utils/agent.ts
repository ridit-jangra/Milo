import { runLLM } from "./llm";
import type { StepToolCall, StepToolResult } from "../types";
import { getAgentSystemPrompt } from "./systemPrompt";
import { agentTools } from "./tools";
import type { Session } from "./session";

export async function createAgent(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
) {
  return runLLM({
    system: await getAgentSystemPrompt(),
    prompt,
    session,
    tools: agentTools,
    onToolCall,
    onToolResult,
  });
}
