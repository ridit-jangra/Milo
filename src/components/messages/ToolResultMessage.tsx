import React from "react";
import { Box, Text } from "ink";
import { parsePatch } from "diff";
import type { StructuredPatchHunk } from "diff";
import { getTheme } from "../../utils/theme";
import { useTerminalSize } from "../../hooks/useTerminalSize";
import { StructuredDiff } from "../StructuredDiff";
import { star, cornerBottomLeft, line, dot } from "../../icons";

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
      const matches = Array.isArray(o.matches) ? o.matches.length : 0;
      return matches > 0
        ? `${matches} match${matches === 1 ? "" : "es"}`
        : "no matches";
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
    case "WebSearchTool": {
      const results = (o.results as any[])?.length ?? 0;
      return `${results} result${results === 1 ? "" : "s"}`;
    }
    case "WebFetchTool": {
      const content = String(o.content ?? "").trim();
      return content.length > 0 ? `${content.length} chars` : null;
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

function getDiff(
  toolName: string,
  output: unknown,
): StructuredPatchHunk | null {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  if (!o.success) return null;

  if (toolName === "FileWriteTool") {
    const content = String(o.content ?? "");
    if (!content) return null;
    const lines = content.split("\n").map((l) => "+" + l);
    return {
      oldStart: 1,
      oldLines: 0,
      newStart: 1,
      newLines: lines.length,
      lines,
    };
  }

  if (toolName === "FileEditTool") {
    const patch = String(o.patch ?? "");
    if (!patch) return null;
    const parsed = parsePatch(patch);
    return parsed[0]?.hunks[0] ?? null;
  }

  return null;
}

export function ToolResultMessage({
  toolName,
  input,
  output,
  success,
  addMargin = false,
}: Props): React.ReactNode {
  const { columns } = useTerminalSize();
  const action = getAction(toolName, input);
  const preview = action.length > 60 ? action.slice(0, 60) + "…" : action;
  const outputPreview = getOutputPreview(toolName, output);
  const hunk = getDiff(toolName, output);

  return (
    <Box flexDirection="row" marginTop={addMargin ? 1 : 0}>
      <Box minWidth={2} width={2}>
        <Text color={success ? getTheme().success : getTheme().error}>
          {star}
        </Text>
      </Box>
      <Box flexDirection="column" width={columns - 4}>
        <Text>{toolName}</Text>
        <Box gap={1} alignItems="center">
          <Text color={getTheme().secondaryText} dimColor>
            {cornerBottomLeft}
            {line} {preview}
          </Text>
          <Text dimColor color={getTheme().secondaryText}>
            {dot}
          </Text>
          {outputPreview && (
            <Text color={getTheme().secondaryText} dimColor>
              {outputPreview}
            </Text>
          )}
        </Box>

        {hunk && (
          <Box marginTop={1} marginLeft={2} flexDirection="column">
            <StructuredDiff patch={hunk} dim={false} width={columns - 8} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
