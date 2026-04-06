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

  const messagesBeforePrompt = [...activeSession.messages];

  activeSession.messages.push({ role: "user", content: prompt });

  const { model } = await getModel();

  const tokenCount = estimateTokens(activeSession.messages);

  const toolReminder =
    tools && tokenCount > 30000
      ? `\n\n# Available tools (reminder)\nYou must ONLY call tools from this exact list: ${Object.keys(tools).join(", ")}. Do not call any other tool names.`
      : "";

  const stepLimits: Record<string, number> = {
    chat: 30,
    agent: 150,
    plan: 50,
    orchestratorAgent: 50,
    subagent: 50,
  };

  const result = await generateText({
    model,
    system:
      system +
      `\n\n# Context usage\nTokens used so far: ~${tokenCount}. If this exceeds 60,000, call CompactTool immediately.` +
      toolReminder,
    messages: activeSession.messages,
    stopWhen: stepCountIs(stepLimits[mode] ?? 100),
    tools,
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

  activeSession.messages = [
    ...messagesBeforePrompt,
    { role: "user", content: prompt },
    ...result.response.messages,
  ];

  saveSession(activeSession);
  return { text: result.text, session: activeSession };
}
