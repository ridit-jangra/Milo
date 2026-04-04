import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../../utils/theme";
import { SimpleSpinner } from "../Spinner";

type Props = {
  toolName: string;
  input: unknown;
  addMargin?: boolean;
};

export function ToolCallMessage({
  toolName,
  input,
  addMargin = false,
}: Props): React.ReactNode {
  const inputStr = JSON.stringify(input ?? {});
  const preview = inputStr.length > 60 ? inputStr.slice(0, 60) + "…" : inputStr;

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      marginTop={addMargin ? 1 : 0}
      width="100%"
    >
      <Box>
        <Box flexWrap="nowrap" minWidth={toolName.length + 2}>
          <SimpleSpinner />
          <Text color={getTheme().secondary} bold>
            {" "}
            {toolName}
          </Text>
        </Box>
        <Box flexWrap="nowrap">
          {Object.keys((input as object) ?? {}).length > 0 && (
            <Text color={getTheme().secondaryText}>({preview})</Text>
          )}
          <Text color={getTheme().secondaryText}>…</Text>
        </Box>
      </Box>
    </Box>
  );
}
