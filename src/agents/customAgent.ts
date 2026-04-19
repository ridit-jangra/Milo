import { getSwarmAgentSystemPrompt } from "../utils/systemPrompt";
import { type Session } from "../utils/session";
import type { agentTools } from "../utils/tools";
import { resolveTools } from "../utils/resolve";
import { resolvePermission } from "../permissions";
import { runLLM } from "../utils/llm";
import { sharedMemory } from "./memory/sharedMemory";
import { TalkTool } from "../tools/TalkTool/tool";

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
      "ReadManyFilesTool",
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
      ])}\n\n# Your personality\n${this.personality}\n\nAlready searched by other agents: ${JSON.stringify(sharedMemory.toolCalls)}`,
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
        sharedMemory.record(this.name, t.toolName, t.output, t.input);
      },
      abortSignal,
      session: this.session,
    });

    resolvePermission("allow_session");

    this.session = response.session;

    return response;
  }
}
