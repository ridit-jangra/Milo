import { Box, Text } from "ink";
import * as React from "react";
import type { StructuredPatchHunk } from "diff";
import { getTheme } from "../utils/theme";
import { useMemo } from "react";
import { wrapText } from "../utils/format";

type Props = {
  patch: StructuredPatchHunk;
  dim: boolean;
  width: number;
};

type DiffLine = {
  code: string;
  type: string;
  i: number;
  empty: boolean;
};

export function StructuredDiff({ patch, dim, width }: Props): React.ReactNode {
  const diff = useMemo(
    () => formatDiff(patch.lines, patch.oldStart, width, dim),
    [patch.lines, patch.oldStart, width, dim],
  );

  return diff.map((_, i) => <Box key={i}>{_}</Box>);
}

function formatDiff(
  lines: string[],
  startingLineNumber: number,
  width: number,
  dim: boolean,
): React.ReactNode[] {
  const theme = getTheme();

  const ls = numberDiffLines(
    lines.map((code) => {
      const content = code.slice(1);
      if (code.startsWith("+")) {
        return {
          code: "+  " + content,
          i: 0,
          type: "add",
          empty: !content.trim(),
        };
      }
      if (code.startsWith("-")) {
        return {
          code: "-  " + content,
          i: 0,
          type: "remove",
          empty: !content.trim(),
        };
      }
      return {
        code: "   " + code,
        i: 0,
        type: "nochange",
        empty: !code.trim(),
      };
    }),
    startingLineNumber,
  );

  const maxLineNumber = Math.max(...ls.map(({ i }) => i));
  const maxWidth = maxLineNumber.toString().length;

  return ls.flatMap(({ type, code, i, empty }) => {
    const wrappedLines = wrapText(code, width - maxWidth);
    const renderLines =
      wrappedLines.length && wrappedLines[0] !== "" ? wrappedLines : [" "];

    return renderLines.map((line, lineIndex) => {
      const key = `${type}-${i}-${lineIndex}`;
      switch (type) {
        case "add":
          return (
            <Box key={key} width={width - maxWidth}>
              <LineNumber
                i={lineIndex === 0 ? i : undefined}
                width={maxWidth}
              />
              <Box flexGrow={1}>
                <Text
                  color={theme.text}
                  backgroundColor={
                    empty
                      ? undefined
                      : dim
                        ? theme.diff.addedDimmed
                        : theme.diff.added
                  }
                  dimColor={dim}
                >
                  {empty ? line : line.padEnd(width - maxWidth - 4)}
                </Text>
              </Box>
            </Box>
          );
        case "remove":
          return (
            <Box key={key} width={width - maxWidth}>
              <LineNumber
                i={lineIndex === 0 ? i : undefined}
                width={maxWidth}
              />
              <Box flexGrow={1}>
                <Text
                  color={theme.text}
                  backgroundColor={
                    empty
                      ? undefined
                      : dim
                        ? theme.diff.removedDimmed
                        : theme.diff.removed
                  }
                  dimColor={dim}
                >
                  {empty ? line : line.padEnd(width - maxWidth - 4)}
                </Text>
              </Box>
            </Box>
          );
        case "nochange":
          return (
            <Box key={key} width={width - maxWidth}>
              <LineNumber
                i={lineIndex === 0 ? i : undefined}
                width={maxWidth}
              />
              <Text color={theme.text} dimColor={dim}>
                {line}
              </Text>
            </Box>
          );
      }
    });
  });
}

function LineNumber({
  i,
  width,
}: {
  i: number | undefined;
  width: number;
}): React.ReactNode {
  return (
    <Text color={getTheme().secondaryText}>
      {i !== undefined ? i.toString().padStart(width) : " ".repeat(width)}{" "}
    </Text>
  );
}

function numberDiffLines(
  diff: { code: string; type: string; empty: boolean }[],
  startLine: number,
): DiffLine[] {
  let i = startLine;
  const result: DiffLine[] = [];
  const queue = [...diff];

  while (queue.length > 0) {
    const { code, type, empty } = queue.shift()!;
    const line = { code, type, i, empty };

    switch (type) {
      case "nochange":
        i++;
        result.push(line);
        break;
      case "add":
        i++;
        result.push(line);
        break;
      case "remove": {
        result.push(line);
        let numRemoved = 0;
        while (queue[0]?.type === "remove") {
          i++;
          const { code, type, empty } = queue.shift()!;
          result.push({ code, type, i, empty });
          numRemoved++;
        }
        i -= numRemoved;
        break;
      }
    }
  }

  return result;
}
