import { runLLM } from "./llm";
import type { StepToolCall, StepToolResult } from "../types";
import { CHAT_SYSTEM_PROMPT } from "./systemPrompt";
import type { Session } from "./session";
import { chatTools } from "./tools";

export async function chatWithModel(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
) {
  return runLLM({
    system: CHAT_SYSTEM_PROMPT,
    prompt,
    session,
    tools: chatTools,
    onToolCall,
    onToolResult,
  });
}
