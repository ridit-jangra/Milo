import { generateText, stepCountIs } from "ai";
import { getModel } from "./model";
import {
  type Session,
  createSession,
  loadMemoryIntoSession,
  saveSession,
} from "./session";
import type { LLMOptions } from "../types";
import { estimateTokens, shouldCompact } from "./compaction";

export const maxSteps: Record<
  "chat" | "agent" | "plan" | "subagent" | "orchestratorAgent",
  number
> = {
  chat: 100,
  agent: 200,
  plan: 400,
  orchestratorAgent: 100,
  subagent: 100,
};

export async function runLLM({
  system,
  tools,
  session,
  prompt,
  mode = "agent",
  onToolCall,
  onToolResult,
}: LLMOptions): Promise<{ text: string; session: Session }> {
  let activeSession = session ?? createSession();
  loadMemoryIntoSession(activeSession);

  if (shouldCompact(activeSession)) {
    activeSession.messages.push({
      role: "user",
      content:
        "Your context is very long. Call CompactTool now with a full summary before doing anything else.",
    });
  }

  activeSession.messages.push({ role: "user", content: prompt });

  const { model } = await getModel();

  const tokenCount = estimateTokens(activeSession.messages);

  const steps = maxSteps[mode];

  const result = await generateText({
    model,
    system:
      system +
      `\n\n# Context usage\nTokens used so far: ~${tokenCount}. If this exceeds 60,000, call CompactTool immediately.`,
    messages: activeSession.messages,
    ...(tools ? { tools, stopWhen: stepCountIs(steps) } : {}),
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
