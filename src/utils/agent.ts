import { runLLM } from "./llm";
import type { StepToolCall, StepToolResult } from "../types";
import { getAgentSystemPrompt } from "./systemPrompt";
import { agentTools, subagentTools, withCompact } from "./tools";
import type { Session } from "./session";

export async function createAgent(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
  onCompact?: (s: Session) => void,
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
  });
}

export async function createSubAgent(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
  onCompact?: (s: Session) => void,
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
  });
}
