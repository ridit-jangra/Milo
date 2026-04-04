import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../../utils/theme";
import { tick, cross, cornerBottomLeft, line } from "../../icons";

type Props = {
  toolName: string;
  input?: unknown;
  output: unknown;
  success: boolean;
  addMargin?: boolean;
};

function getAction(toolName: string, input: unknown): string {
  if (!input || typeof input !== "object") return toolName;
  const a = input as Record<string, unknown>;
  switch (toolName) {
    case "FileReadTool":
      return `cat ${a.path ?? ""}`;
    case "FileWriteTool":
      return `write ${a.path ?? ""}`;
    case "FileEditTool":
      return `edit ${a.path ?? ""}`;
    case "BashTool":
      return String(a.command ?? "");
    case "GrepTool":
      return `grep ${a.pattern ?? ""}`;
    case "GlobTool":
      return `glob ${a.pattern ?? ""}`;
    case "RecallTool":
      return `recall ${a.query ?? ""}`;
    case "MemoryReadTool":
      return `memory read`;
    case "MemoryWriteTool":
      return `memory write`;
    case "MemoryEditTool":
      return `memory edit`;
    case "ThinkTool":
      return `think`;
    case "AgentTool":
      return `agent`;
    default:
      return toolName;
  }
}

export function ToolResultMessage({
  toolName,
  input,
  output,
  success,
  addMargin = false,
}: Props): React.ReactNode {
  const action = getAction(toolName, input);
  const preview = action.length > 80 ? action.slice(0, 80) + "…" : action;

  return (
    <Box flexDirection="row" marginTop={addMargin ? 1 : 0}>
      <Box minWidth={2} width={2}>
        <Text color={success ? getTheme().success : getTheme().error}>
          {success ? tick : cross}
        </Text>
      </Box>
      <Text color={getTheme().secondaryText} dimColor>
        {cornerBottomLeft}
        {line} {preview}
      </Text>
    </Box>
  );
}
