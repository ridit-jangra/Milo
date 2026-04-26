import { Box, Text } from "ink";
import React from "react";
import { getTheme } from "../utils/theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { AsciiLogo } from "./AsciiLogo";
import { lineVertical } from "../icons";

const TIPS = [
  "run /init to generate MILO.md",
  "use /mode chat for read-only",
  "use /mode build for big tasks",
  "esc to interrupt at any time",
  "/help to see all commands",
  "ctrl+t to switch mode",
];

type Props = { level: number };

export function Header({ level }: Props): React.ReactNode {
  const { columns } = useTerminalSize();
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

  return (
    <Box
      width={columns}
      flexDirection="row"
      marginTop={1}
      marginBottom={1}
      justifyContent="space-between"
      gap={2}
    >
      <Box
        borderStyle="round"
        borderColor={getTheme().border}
        paddingX={1}
        gap={1}
      >
        <Box flexDirection="column">
          <Text color={getTheme().secondaryText}>{process.cwd()}</Text>
        </Box>
        <Box flexDirection="column" alignItems="center" paddingX={1}>
          <Text color={getTheme().border} dimColor>
            {Array(4).fill(lineVertical).join("\n")}
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text color={getTheme().text} dimColor bold>
            getting started
          </Text>
          <Text color={getTheme().secondaryText} wrap="wrap">
            {tip}
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column" justifyContent="center">
        <AsciiLogo level={level} />
      </Box>
    </Box>
  );
}
