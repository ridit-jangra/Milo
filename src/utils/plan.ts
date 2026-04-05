import { runLLM } from "./llm";
import type {
  OnOrchestratorEvent,
  StepToolCall,
  StepToolResult,
} from "../types";
import { PLAN_SYSTEM_PROMPT } from "./systemPrompt";
import { createPlanTools } from "./tools";
import type { Session } from "./session";

export async function planWithModel(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
  onOrchestratorEvent?: OnOrchestratorEvent,
) {
  return runLLM({
    system: PLAN_SYSTEM_PROMPT,
    prompt,
    session,
    tools: createPlanTools(onOrchestratorEvent),
    onToolCall,
    onToolResult,
  });
}
