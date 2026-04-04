import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../../utils/theme";
import { useTerminalSize } from "../../hooks/useTerminalSize";

type Props = {
  text: string;
  addMargin?: boolean;
};

export function AssistantMessage({
  text,
  addMargin = false,
}: Props): React.ReactNode {
  const { columns } = useTerminalSize();
  if (!text) return null;

  return (
    <Box
      alignItems="flex-start"
      flexDirection="row"
      marginTop={addMargin ? 1 : 0}
      width="100%"
    >
      <Box flexDirection="column" width={columns - 6}>
        <Text>{text}</Text>
      </Box>
    </Box>
  );
}
