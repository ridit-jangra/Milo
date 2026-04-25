import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../../utils/theme";
import { useTerminalSize } from "../../hooks/useTerminalSize";

type Props = {
  text: string;
  addMargin?: boolean;
  isFirst?: boolean;
};

export function UserMessage({ text, isFirst = false }: Props): React.ReactNode {
  const { columns } = useTerminalSize();
  if (!text) return null;

  return (
    <Box flexDirection="row" marginTop={isFirst ? 0 : 1} width="100%">
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
