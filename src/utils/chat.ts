import { runLLM } from "./llm";
import type { StepToolCall, StepToolResult } from "../types";
import { getChatSystemPrompt } from "./systemPrompt";
import { chatTools } from "./tools";
import type { Session } from "./session";

export async function chatWithModel(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
  abortSignal?: AbortSignal,
) {
  return runLLM({
    system: await getChatSystemPrompt(),
    prompt,
    session,
    mode: "chat",
    tools: chatTools,
    onToolCall,
    onToolResult,
    abortSignal,
  });
}
