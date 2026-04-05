import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { getTheme } from "../../utils/theme";
import { useTerminalSize } from "../../hooks/useTerminalSize";
import { StructuredDiff } from "../StructuredDiff";
import { parsePatch } from "diff";
import type { PermissionDecision } from "../../permissions";
import type { PermissionRequest } from "../../types";
import {
  arrowRight,
  cornerBottomLeft,
  cornerTopLeft,
  line,
  upDownArrow,
} from "../../icons";

type Props = {
  permission: PermissionRequest;
  onDecide: (decision: PermissionDecision) => void;
};

const OPTIONS: { label: string; value: PermissionDecision }[] = [
  { label: "Yes", value: "allow" },
  {
    label: "Yes, and don't ask again in this session.",
    value: "allow_session",
  },
  { label: "No (esc)", value: "deny" },
];

function getBashPreview(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  return String((input as any).command ?? "");
}

function getFilePreview(toolName: string, input: unknown) {
  if (!input || typeof input !== "object") return null;
  const a = input as Record<string, unknown>;

  if (toolName === "FileWriteTool") {
    const content = String(a.content ?? "");
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
    const patch = String(a.patch ?? "");
    if (!patch) return null;
    const parsed = parsePatch(patch);
    return parsed[0]?.hunks[0] ?? null;
  }

  return null;
}

export function PermissionCard({
  permission,
  onDecide,
}: Props): React.ReactNode {
  const { columns } = useTerminalSize();
  const theme = getTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { toolName, input } = permission;
  const isBash = toolName === "BashTool";
  const isFile = toolName === "FileWriteTool" || toolName === "FileEditTool";
  const hunk = isFile ? getFilePreview(toolName, input) : null;
  const command = isBash ? getBashPreview(input) : null;
  const path = isFile ? String((input as any).path ?? "") : null;

  useInput((_, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(OPTIONS.length - 1, i + 1));
    }
    if (key.return) {
      onDecide(OPTIONS[selectedIndex]!.value);
    }
    if (key.escape) {
      onDecide("deny");
    }
  });

  return (
    <Box flexDirection="column" marginTop={1} paddingX={1} width={columns}>
      <Box marginBottom={1}>
        <Text color={theme.primary} bold>
          {isBash ? "Run command" : "Edit file"}
        </Text>
        {path && <Text color={theme.secondaryText}> · {path}</Text>}
      </Box>

      {isBash && command && (
        <Box flexDirection="column" marginBottom={1}>
          <Box flexDirection="row">
            <Text color={theme.secondaryText} dimColor>
              {cornerBottomLeft}
              {line}{" "}
            </Text>
            <Text color={theme.secondary}>$ {command}</Text>
          </Box>
        </Box>
      )}

      {hunk && (
        <Box marginBottom={1} flexDirection="column">
          <StructuredDiff patch={hunk} dim={false} width={columns - 8} />
        </Box>
      )}

      <Box flexDirection="column" marginTop={1}>
        {OPTIONS.map((opt, i) => {
          const selected = i === selectedIndex;
          const color =
            opt.value === "deny"
              ? theme.error
              : opt.value === "allow_session"
                ? theme.warning
                : theme.success;
          return (
            <Box key={opt.value} flexDirection="row" gap={1}>
              <Text color={selected ? color : theme.secondaryText}>
                {selected ? arrowRight : " "}
              </Text>
              <Text>{i + 1}.</Text>
              <Text
                color={selected ? color : theme.secondaryText}
                bold={selected}
              >
                {opt.label}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text color={theme.secondaryText} dimColor>
          {upDownArrow} to select · enter to confirm · esc to deny
        </Text>
      </Box>
    </Box>
  );
}
