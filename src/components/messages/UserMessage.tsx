import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../../utils/theme";
import { useTerminalSize } from "../../hooks/useTerminalSize";

type Props = {
  text: string;
  addMargin?: boolean;
};

export function UserMessage({
  text,
  addMargin = false,
}: Props): React.ReactNode {
  const { columns } = useTerminalSize();
  if (!text) return null;

  return (
    <Box flexDirection="row" marginTop={addMargin ? 1 : 0} width="100%">
      <Box minWidth={2} width={2}>
        <Text color={getTheme().secondaryText}>{">"}</Text>
      </Box>
      <Box flexDirection="column" width={columns - 4}>
        <Text color={getTheme().secondaryText} wrap="wrap">
          {text}
        </Text>
      </Box>
    </Box>
  );
}
