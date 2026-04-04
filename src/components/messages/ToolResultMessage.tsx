import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../../utils/theme";
import { tick, cross } from "../../icons";

type Props = {
  toolName: string;
  output: unknown;
  success: boolean;
  addMargin?: boolean;
};

export function ToolResultMessage({
  toolName,
  output,
  success,
  addMargin = false,
}: Props): React.ReactNode {
  const outputStr =
    typeof output === "string" ? output : JSON.stringify(output ?? "");
  const preview =
    outputStr.length > 80 ? outputStr.slice(0, 80) + "…" : outputStr;

  return (
    <Box flexDirection="row" marginTop={addMargin ? 1 : 0} width="100%">
      <Text color={success ? getTheme().success : getTheme().error}>
        {success ? tick : cross} {toolName}
      </Text>
      {preview && (
        <Text color={getTheme().secondaryText} dimColor>
          {" · "}
          {preview}
        </Text>
      )}
    </Box>
  );
}
