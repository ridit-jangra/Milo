// TESTING STUFF, CAN BE ADDED IN FUTURE VERSIONS.

/* eslint-disable */

import { getSwarmAgentSystemPrompt } from "../utils/systemPrompt";
import { type Session } from "../utils/session";
import type { agentTools } from "../utils/tools";
import { resolveTools } from "../utils/resolve";
import { resolvePermission } from "../permissions";
import { sharedMemory } from "./memory/sharedMemory";
import { TalkTool } from "../tools/TalkTool/tool";
import { buildProvider, runLLM } from "@ridit/ai/ai";

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

    const provider = buildProvider({
      model: "openai/gpt-oss-20b",
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY!,
    });

    const response = await runLLM({
      system: `${await getSwarmAgentSystemPrompt(this.name, [
        ...agentsMap.keys(),
      ])}`,
      prompt: prompt,
      // mode: "agent",
      provider: provider,
      tools: resolved,
      // tools: resolved,
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

    console.log(`\n🤖 [${this.name}] → Response: ${response.text}`);

    return response;
  }
}
