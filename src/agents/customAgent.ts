import type { StepToolCall, StepToolResult } from "../types";
import { runLLM } from "../utils/llm";
import { agentTools } from "../utils/tools";
import { resolveTools } from "../utils/resolve";
import { TalkTool } from "../tools/TalkTool/tool";
import { getSwarmAgentSystemPrompt } from "../utils/systemPrompt";
import type { Session } from "../utils/session";
import { InboxTool } from "../tools/InboxTool/tool";

export const agentsMap = new Map<string, CustomAgent>();

export class CustomAgent {
  public isBusy = false;
  private session?: Session;

  constructor(
    public name: string,
    private tools: (keyof typeof agentTools)[] = [
      "FileReadTool",
      "ThinkTool",
      "MemoryReadTool",
      "GlobTool",
      "GrepTool",
      "ReadManyFilesTool",
    ],
    private additionalSystemPrompt?: string,
  ) {
    agentsMap.set(name, this);
  }

  public async chat(
    prompt: string,
    onToolCall?: (t: StepToolCall) => void,
    onToolResult?: (t: StepToolResult) => void,
    abortSignal?: AbortSignal,
  ) {
    if (this.isBusy) return { text: "I'm currently busy." };
    this.isBusy = true;

    try {
      const resolved = { ...resolveTools(this.tools), TalkTool, InboxTool };

      const response = await runLLM({
        system: await getSwarmAgentSystemPrompt(this.name, [
          ...agentsMap.keys(),
        ]),
        prompt: prompt,
        mode: "agent",
        tools: resolved,
        onToolCall: (t) => {
          console.log(
            `[${this.name}] used ${t.toolName} with input: ${JSON.stringify(t.input)}`,
          );
        },
        onToolResult: (t) => {
          console.log(
            `the [${t.toolName}] that [${this.name}] called returned output [${t.output}]`,
          );
        },
        abortSignal,
        session: this.session,
        // messages: this.messages,
      });

      this.session = response.session;

      console.log(`[${this.name}] to [user]: ${response.text}`);

      return response;
    } catch (err) {
      console.error(`[${this.name}] error:`, err);
    } finally {
      this.isBusy = false;
    }
  }
}
