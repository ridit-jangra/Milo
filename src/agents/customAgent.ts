// TESTING STUFF, CAN BE ADDED IN FUTURE VERSIONS.

/* eslint-disable */

import { getSwarmAgentSystemPrompt } from "../utils/systemPrompt";
import { createSession, saveSession, type Session } from "../utils/session";
import type { agentTools } from "../utils/tools";
import { resolveTools } from "../utils/resolve";
import { resolvePermission } from "../permissions";
import { sharedMemory } from "./memory/sharedMemory";
import { TalkTool } from "../tools/TalkTool/tool";
import { generateText, stepCountIs } from "ai";
import { getModel } from "../utils/model";
import type { LLMOptions } from "../types";
import { repairJSON } from "../utils/json";

export async function runLLM({
  system,
  tools,
  prompt,
  mode = "agent",
  onToolCall,
  onToolResult,
  abortSignal,
}: LLMOptions): Promise<{ text: string; session: Session }> {
  const activeSession = createSession();

  const messagesBeforePrompt = [...activeSession.messages];
  activeSession.messages.push({ role: "user", content: prompt });

  const { model } = await getModel();

  const stepLimits: Record<string, number> = {
    chat: 30,
    agent: 150,
    build: 200,
    orchestratorAgent: 50,
    subagent: 50,
  };

  const result = await generateText({
    model,
    system: system,
    messages: activeSession.messages,
    stopWhen: stepCountIs(stepLimits[mode] ?? 100),
    tools,
    abortSignal,
    experimental_repairToolCall: async ({ toolCall }) => {
      const repaired = repairJSON(toolCall.input as string);
      if (repaired === null) return null;
      return { ...toolCall, input: JSON.parse(repaired) };
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
        const toolCall = toolCalls?.find(
          (t) => t.toolCallId === toolResult.toolCallId,
        );
        onToolResult?.({
          id: toolResult.toolCallId,
          toolName: toolResult.toolName,
          input: toolCall?.input,
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

export const agentsMap = new Map<string, CustomAgent>();

export class CustomAgent {
  private session?: Session;

  constructor(
    public name: string,
    private personality?: string,
    private tools: (keyof typeof agentTools)[] = [
      "FileReadTool",
      "ThinkTool",
      "GlobTool",
      "GrepTool",
      "MemoryReadTool",
    ],
  ) {
    agentsMap.set(name, this);
  }

  public async chat(prompt: string, abortSignal?: AbortSignal) {
    const resolved = {
      ...resolveTools(this.tools),
      TalkTool,
    };

    const response = await runLLM({
      system: `${await getSwarmAgentSystemPrompt(this.name, [
        ...agentsMap.keys(),
      ])}`,
      prompt: prompt,
      mode: "agent",
      tools: resolved,
      onToolCall: (t) => {
        if (t.toolName === "TalkTool") {
          console.log(
            `\n💬 [${this.name}] → ${t.toolName === "TalkTool" ? `talking to ${(t.input as any).name}` : t.toolName}`,
          );
          console.log(`   "${(t.input as any).message}"`);
        } else {
        }
      },
      onToolResult: (t) => {
        if (t.toolName === "TalkTool") {
          console.log(`💬 [${(t.input as any)?.name}] → ${this.name}`);
          console.log(`   "${(t.output as any)?.response}"`);
        }
        sharedMemory.record(this.name, t.toolName, t.output);
      },
      abortSignal,
      session: this.session,
    });

    resolvePermission("allow_session");

    this.session = response.session;

    return response;
  }
}
