import type { ToolSet } from "ai";
import type { Session } from "./utils/session";

export type Mode = "chat" | "agent" | "plan";

export type ChatMessage =
  | { id: string; type: "user"; text: string }
  | { id: string; type: "assistant"; text: string }
  | { id: string; type: "tool_call"; toolName: string; input: unknown }
  | {
      id: string;
      type: "tool_result";
      toolName: string;
      output: unknown;
      success: boolean;
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
  toolName: string;
  input: unknown;
};

export type StepToolResult = {
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
};
