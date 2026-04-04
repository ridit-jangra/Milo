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
    case "WebSearchTool":
      return `search ${(a as any).query ?? ""}`;
    case "WebFetchTool":
      return `fetch ${(a as any).url ?? ""}`;
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

function getOutputPreview(toolName: string, output: unknown): string | null {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;

  switch (toolName) {
    case "BashTool": {
      const out = String(o.output ?? "").trim();
      const first = out.split("\n")[0] ?? "";
      return first.length > 60 ? first.slice(0, 60) + "…" : first || null;
    }
    case "FileReadTool": {
      const lines = String(o.content ?? "")
        .trim()
        .split("\n").length;
      return `${lines} lines`;
    }
    case "GrepTool": {
      const matches = String(o.output ?? "")
        .trim()
        .split("\n")
        .filter(Boolean).length;
      return matches > 0
        ? `${matches} match${matches === 1 ? "" : "es"}`
        : "no matches";
    }
    case "WebSearchTool": {
      const results = (o.results as any[])?.length ?? 0;
      return `${results} result${results === 1 ? "" : "s"}`;
    }
    case "WebFetchTool": {
      const content = String(o.content ?? "").trim();
      return content.length > 0 ? `${content.length} chars` : null;
    }
    case "RecallTool": {
      const matches = String(o.output ?? "")
        .trim()
        .split("\n")
        .filter(Boolean).length;
      return matches > 0
        ? `${matches} match${matches === 1 ? "" : "es"}`
        : "no matches";
    }
    case "FileWriteTool":
    case "FileEditTool":
      return o.success ? "saved" : "failed";
    case "ThinkTool":
      return null;
    default:
      return null;
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
  const preview = action.length > 60 ? action.slice(0, 60) + "…" : action;
  const outputPreview = getOutputPreview(toolName, output);

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
      {outputPreview && (
        <Text color={getTheme().secondaryText} dimColor>
          {" · "}
          {outputPreview}
        </Text>
      )}
    </Box>
  );
}
