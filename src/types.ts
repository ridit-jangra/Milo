import type { ToolSet } from "ai";
import type { Session } from "./utils/session";
import type { WizardMode } from "./hooks/useChat";

export type Mode = "chat" | "agent" | "plan";

export type ChatMessage =
  | { id: string; type: "user"; text: string }
  | { id: string; type: "assistant"; text: string }
  | { id: string; type: "tool_call"; toolName: string; input: unknown }
  | {
      id: string;
      type: "tool_result";
      toolName: string;
      input: unknown;
      output: unknown;
      success: boolean;
    }
  | {
      id: string;
      type: "permission_request";
      toolName: string;
      input: unknown;
      preview: unknown;
      resolve: (decision: "allow" | "allow_session" | "deny") => void;
    };

export interface Theme {
  primary: string;
  secondary: string;
  border: string;
  secondaryBorder: string;
  text: string;
  secondaryText: string;
  suggestion: string;
  success: string;
  error: string;
  warning: string;
  diff: {
    added: string;
    removed: string;
    addedDimmed: string;
    removedDimmed: string;
  };
}

export type StepToolCall = {
  id: string;
  toolName: string;
  input: unknown;
};

export type StepToolResult = {
  id: string;
  toolName: string;
  output: unknown;
};

export type LLMOptions = {
  system: string;
  tools?: ToolSet;
  session?: Session;
  prompt: string;
  maxSteps?: number;
  onToolCall?: (toolCall: StepToolCall) => void;
  onToolResult?: (toolResult: StepToolResult) => void;
  onOrchestratorEvent?: OnOrchestratorEvent;
};

export type CommandContext = {
  clearMessages: () => void;
  session: Session | undefined;
  setSession: (session: Session | undefined) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  pushMessage: (text: string) => void;
  abortController: AbortController;
  openWizard: (mode: WizardMode) => void;
};

type LocalCommand = {
  type: "local";
  call(args: string, context: CommandContext): Promise<string | void>;
};

type PromptCommand = {
  type: "prompt";
  progressMessage: string;
  getPromptForCommand(args: string): Promise<string>;
};

export type Command = {
  name: string;
  description: string;
  isEnabled: boolean;
  isHidden: boolean;
  aliases?: string[];
  userFacingName(): string;
} & (LocalCommand | PromptCommand);

export type OrchestratorEvent =
  | { type: "plan_created"; tasks: { id: string; subtask: string }[] }
  | { type: "agent_start"; taskId: string; subtask: string }
  | { type: "agent_done"; taskId: string; result: string }
  | { type: "connecting" }
  | { type: "done" };

export type OnOrchestratorEvent = (event: OrchestratorEvent) => void;

export type PermissionRequest = {
  toolName: string;
  input: unknown;
};

export interface Pet {
  level: number;
  xp: number;
  xpToNext: number;
  mood: "happy" | "sad" | "sleepy";
  hunger: number;
  streak: number;
  lastActive: Date;
  totalTasks: number;
}
