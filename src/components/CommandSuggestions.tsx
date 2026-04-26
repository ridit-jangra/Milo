import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../utils/theme";
import { getCommands } from "../commands";
import { arrowDown, arrowUp, pointerSmall } from "../icons";
import type { Command } from "../types";

type Props = {
  query: string;
  selectedIndex: number;
};

function HighlightedName({ name, query }: { name: string; query: string }) {
  if (!query) return <Text color={getTheme().secondary}>/{name}</Text>;

  const matched = query.slice(1).toLowerCase();
  const matchEnd = matched.length;

  return (
    <Text>
      <Text color={getTheme().secondaryText} dimColor>
        /
      </Text>
      {name.split("").map((char, i) => (
        <Text
          key={i}
          color={i < matchEnd ? getTheme().primary : getTheme().secondary}
        >
          {char}
        </Text>
      ))}
    </Text>
  );
}

export function getMatchingCommands(query: string): Command[] {
  if (!query.startsWith("/")) return [];

  const input = query.slice(1).toLowerCase();

  return getCommands()
    .filter((c) => !c.isHidden)
    .filter(
      (c) =>
        c.userFacingName().startsWith(input) ||
        c.aliases?.some((a) => a.startsWith(input)),
    );
}

export function CommandSuggestions({
  query,
  selectedIndex,
}: Props): React.ReactNode {
  if (!query.startsWith("/")) return null;

  const matches = getMatchingCommands(query);
  if (matches.length === 0) return null;

  const MAX_VISIBLE = 4;

  let start = selectedIndex - Math.floor(MAX_VISIBLE / 2);
  start = Math.max(0, start);

  const end = Math.min(start + MAX_VISIBLE, matches.length);

  if (end - start < MAX_VISIBLE) {
    start = Math.max(0, end - MAX_VISIBLE);
  }

  const visible = matches.slice(start, end);

  return (
    <Box flexDirection="column" marginLeft={2} marginBottom={1}>
      {start > 0 && (
        <Text color={getTheme().secondaryText} dimColor>
          {arrowUp} more
        </Text>
      )}

      {visible.map((c, i) => {
        const actualIndex = start + i;
        const name = c.userFacingName();
        const isSelected = actualIndex === selectedIndex;
        const aliases = c.aliases ? ` (${c.aliases.join(", ")})` : "";

        return (
          <Box key={name} gap={1}>
            <Text
              color={isSelected ? getTheme().primary : getTheme().secondaryText}
              dimColor={!isSelected}
            >
              {pointerSmall}
            </Text>

            <HighlightedName name={name + aliases} query={query} />

            <Text color={getTheme().secondaryText} dimColor>
              — {c.description}
            </Text>
          </Box>
        );
      })}

      {end < matches.length && (
        <Text color={getTheme().secondaryText} dimColor>
          {arrowDown} more
        </Text>
      )}
    </Box>
  );
}
