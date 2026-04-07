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

// best-effort JSON repair for malformed tool call args
function repairJSON(raw: string): string {
  try {
    JSON.parse(raw);
    return raw; // already valid
  } catch {
    // fix unescaped newlines and control chars inside strings
    return raw.replace(/[\u0000-\u001F\u007F]/g, (c) => {
      const replacements: Record<string, string> = {
        "\n": "\\n",
        "\r": "\\r",
        "\t": "\\t",
      };
      return replacements[c] ?? "";
    });
  }
}

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

  const toolReminder = tools
    ? `\n\n# STRICT TOOL RULE — you may ONLY call these tools: ${Object.keys(tools).join(", ")}. Calling anything else will crash. No exceptions.`
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
    experimental_repairToolCall: async ({ toolCall, error }) => {
      console.warn(
        `[llm] repairing tool call ${toolCall.toolName}:`,
        error.message,
      );
      try {
        const repaired = repairJSON(toolCall.input as string);
        return { ...toolCall, input: JSON.parse(repaired) };
      } catch {
        console.error(
          `[llm] could not repair tool call ${toolCall.toolName}, skipping`,
        );
        return null;
      }
    },
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
