import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../utils/theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import type { Mode } from "../types";
import { bullet, diamond, star } from "../icons";

type Props = {
  model: string;
  mode: Mode;
};

function getModeColor(mode: Mode): string {
  switch (mode) {
    case "agent":
      return getTheme().secondary;
    case "plan":
      return getTheme().warning;
    case "chat":
      return getTheme().success;
  }
}

export function StatusBar({ model, mode }: Props): React.ReactNode {
  const { columns } = useTerminalSize();

  const icon = mode === "agent" ? diamond : mode === "plan" ? star : bullet;
  const left = ` ${model} `;
  const right = ` ${icon} ${mode} mode `;
  const padding = columns - left.length - right.length;
  const modeBg = getModeColor(mode);

  return (
    <Box width={columns}>
      <Text color={getTheme().secondaryText}>{left}</Text>
      <Text color={getTheme().secondaryText}>
        {" ".repeat(Math.max(0, padding))}
      </Text>
      <Text backgroundColor={modeBg} color="#000000">
        {right}
      </Text>
    </Box>
  );
}
