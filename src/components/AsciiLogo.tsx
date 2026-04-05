import { Box, Text } from "ink";
import React from "react";
import { getTheme } from "../utils/theme";
import { useTerminalSize } from "../hooks/useTerminalSize";

const LOGO_MIN_WIDTH = 120;

export function AsciiLogo(): React.ReactNode {
  const { columns } = useTerminalSize();

  if (columns < LOGO_MIN_WIDTH) return null;

  return (
    <Box>
      <Text color={getTheme().error}>
        {`███╗   ███╗██╗██╗      ██████╗ 
████╗ ████║██║██║     ██╔═══██╗
██╔████╔██║██║██║     ██║   ██║
██║╚██╔╝██║██║██║     ██║   ██║
██║ ╚═╝ ██║██║███████╗╚██████╔╝
╚═╝     ╚═╝╚═╝╚══════╝ ╚═════╝ `}
      </Text>
    </Box>
  );
}
