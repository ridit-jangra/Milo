import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../utils/theme";
import { getCommands } from "../commands";
import { pointerSmall } from "../icons";
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

  return (
    <Box flexDirection="column" marginLeft={2} marginBottom={1}>
      {matches.map((c, i) => {
        const name = c.userFacingName();
        const isSelected = i === selectedIndex;
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
    </Box>
  );
}
