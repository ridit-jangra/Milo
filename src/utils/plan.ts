import { runLLM } from "./llm";
import type { StepToolCall, StepToolResult } from "../types";
import { PLAN_SYSTEM_PROMPT } from "./systemPrompt";
import { planTools } from "./tools";
import type { Session } from "./session";

export async function planWithModel(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
) {
  return runLLM({
    system: PLAN_SYSTEM_PROMPT,
    prompt,
    session,
    tools: planTools,
    onToolCall,
    onToolResult,
  });
}
