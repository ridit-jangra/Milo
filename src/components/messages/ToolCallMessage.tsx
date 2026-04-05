import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../../utils/theme";
import { SimpleSpinner } from "../Spinner";
import { cornerBottomLeft, line } from "../../icons";

type Props = {
  toolName: string;
  input?: unknown;
  addMargin?: boolean;
};

function getCommand(toolName: string, input: unknown): string {
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
    case "WebSearchTool":
      return `search ${String((a as any).query ?? "")}`;
    case "WebFetchTool":
      return `fetch ${String((a as any).url ?? "")}`;
    case "MemoryReadTool":
      return `memory read`;
    case "MemoryWriteTool":
      return `memory write`;
    case "MemoryEditTool":
      return `memory edit`;
    case "ThinkTool":
      return `think`;
    case "AgentTool":
      return `agent · ${String((a as any).task ?? (a as any).subtask ?? "").slice(0, 50)}`;
    case "OrchestratorTool":
      return `orchestrate · ${String((a as any).goal ?? "").slice(0, 50)}`;
    default:
      return toolName;
  }
}

export function ToolCallMessage({
  toolName,
  input,
  addMargin = false,
}: Props): React.ReactNode {
  const command = getCommand(toolName, input);
  const preview = command.length > 60 ? command.slice(0, 60) + "…" : command;

  return (
    <Box flexDirection="column" marginTop={addMargin ? 1 : 0}>
      <Box flexDirection="row">
        <Box minWidth={2} width={2}>
          <SimpleSpinner />
        </Box>
        <Text color={getTheme().secondaryText}>Running 1 tool…</Text>
      </Box>
      <Box flexDirection="row" marginLeft={2}>
        <Text color={getTheme().secondaryText} dimColor>
          {cornerBottomLeft}
          {line}{" "}
        </Text>
        <Text color={getTheme().secondary}>$ {preview}</Text>
      </Box>
    </Box>
  );
}
