import { generateText, stepCountIs } from "ai";
import { getModel } from "./model";
import {
  type Session,
  createSession,
  loadMemoryIntoSession,
  saveSession,
} from "./session";
import { shouldCompact, compactSession } from "./compaction";
import type { LLMOptions } from "../types";

export async function runLLM({
  system,
  tools,
  session,
  prompt,
  maxSteps = 10,
  onToolCall,
  onToolResult,
}: LLMOptions): Promise<{ text: string; session: Session }> {
  let activeSession = session ?? createSession();
  loadMemoryIntoSession(activeSession);

  if (shouldCompact(activeSession)) {
    try {
      activeSession = await compactSession(activeSession);
      saveSession(activeSession);
    } catch {}
  }

  activeSession.messages.push({ role: "user", content: prompt });

  const { model, modelId } = await getModel();

  const result = await generateText({
    model,
    system,
    messages: activeSession.messages,
    ...(tools ? { tools, stopWhen: stepCountIs(maxSteps) } : {}),
    onStepFinish: ({ toolCalls, toolResults }) => {
      for (const toolCall of toolCalls ?? []) {
        onToolCall?.({
          id: toolCall.toolCallId,
          toolName: toolCall.toolName,
          input: toolCall.input,
        });
      }
      for (const toolResult of toolResults ?? []) {
        onToolResult?.({
          id: toolResult.toolCallId,
          toolName: toolResult.toolName,
          output: toolResult.output,
        });
      }
    },
  });

  activeSession.messages.push({
    role: "assistant",
    content: result.text,
  });

  saveSession(activeSession);
  return { text: result.text, session: activeSession };
}
