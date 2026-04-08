import { runLLM } from "./llm";
import type { StepToolCall, StepToolResult } from "../types";
import { getChatSystemPrompt } from "./systemPrompt";
import { chatTools, withCompact } from "./tools";
import type { Session } from "./session";

export async function chatWithModel(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
  onCompact?: (s: Session) => void,
  abortSignal?: AbortSignal,
) {
  return runLLM({
    system: await getChatSystemPrompt(),
    prompt,
    session,
    mode: "chat",
    tools:
      session && onCompact
        ? withCompact(chatTools, session, onCompact)
        : chatTools,
    onToolCall,
    onToolResult,
    abortSignal,
  });
}
