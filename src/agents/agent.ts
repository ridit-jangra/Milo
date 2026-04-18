import { runLLM } from "../utils/llm";
import type { StepToolCall, StepToolResult } from "../types";
import { getAgentSystemPrompt } from "../utils/systemPrompt";
import { agentTools, subagentTools, withCompact } from "../utils/tools";
import type { Session } from "../utils/session";

export async function createAgent(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
  onCompact?: (s: Session) => void,
  abortSignal?: AbortSignal,
) {
  return runLLM({
    system: await getAgentSystemPrompt(),
    prompt,
    session,
    mode: "agent",
    tools:
      session && onCompact
        ? withCompact(agentTools, session, onCompact)
        : agentTools,
    onToolCall,
    onToolResult,
    abortSignal,
  });
}

export async function createSubAgent(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
  onCompact?: (s: Session) => void,
  abortSignal?: AbortSignal,
) {
  return runLLM({
    system: await getAgentSystemPrompt(),
    prompt,
    session,
    mode: "subagent",
    tools:
      session && onCompact
        ? withCompact(subagentTools, session, onCompact)
        : subagentTools,
    onToolCall,
    onToolResult,
    abortSignal,
  });
}
