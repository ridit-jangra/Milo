import { runLLM } from "./llm";
import type {
  // OnOrchestratorEvent,
  StepToolCall,
  StepToolResult,
} from "../types";
import { getPlanSystemPrompt } from "./systemPrompt";
import { createPlanTools, withCompact } from "./tools";
import type { Session } from "./session";

export async function planWithModel(
  prompt: string,
  session?: Session,
  onToolCall?: (t: StepToolCall) => void,
  onToolResult?: (t: StepToolResult) => void,
  // onOrchestratorEvent?: OnOrchestratorEvent,
  onCompact?: (s: Session) => void,
  abortSignal?: AbortSignal,
) {
  const planTools = createPlanTools();
  return runLLM({
    system: await getPlanSystemPrompt(),
    prompt,
    session,
    mode: "plan",
    tools:
      session && onCompact
        ? withCompact(planTools, session, onCompact)
        : planTools,
    onToolCall,
    onToolResult,
    abortSignal,
  });
}
