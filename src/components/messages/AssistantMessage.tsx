import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../../utils/theme";
import { useTerminalSize } from "../../hooks/useTerminalSize";
import { applyMarkdown } from "../../utils/markdown";
import { HighlightedCode } from "../HighlightedCode";
import { bullet } from "../../icons";

type Props = {
  text: string;
  addMargin?: boolean;
};

type Segment =
  | { type: "text"; content: string }
  | { type: "code"; lang: string; code: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", content: text.slice(last, match.index) });
    }
    segments.push({
      type: "code",
      lang: match[1] || "markdown",
      code: match[2] ?? "",
    });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ type: "text", content: text.slice(last) });
  }

  return segments;
}

export function AssistantMessage({
  text,
  addMargin = false,
}: Props): React.ReactNode {
  const { columns } = useTerminalSize();
  if (!text) return null;

  const segments = parseSegments(text);

  return (
    <Box flexDirection="row" marginTop={addMargin ? 1 : 0} width="100%">
      <Box minWidth={2} width={2}>
        <Text color={getTheme().primary}>{bullet}</Text>
      </Box>
      <Box flexDirection="column" width={columns - 4}>
        {segments.map((seg, i) =>
          seg.type === "code" ? (
            <HighlightedCode key={i} code={seg.code} language={seg.lang} />
          ) : (
            <Text key={i}>{applyMarkdown(seg.content)}</Text>
          ),
        )}
      </Box>
    </Box>
  );
}
