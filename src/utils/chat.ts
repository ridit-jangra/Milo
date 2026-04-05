import { runLLM } from "./llm";
import type { StepToolCall, StepToolResult } from "../types";
import { getChatSystemPrompt } from "./systemPrompt";
import type { Session } from "./session";
import { chatTools } from "./tools";

export async function chatWithModel(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
) {
  return runLLM({
    system: await getChatSystemPrompt(),
    prompt,
    session,
    tools: chatTools,
    onToolCall,
    onToolResult,
  });
}
