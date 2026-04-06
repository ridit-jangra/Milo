import { highlight, supportsLanguage } from "cli-highlight";
import { Box, Text } from "ink";
import React, { useMemo } from "react";
import chalk from "chalk";
import { getTheme } from "../utils/theme";

type Props = {
  code: string;
  language: string;
};

const THEME = {
  keyword: chalk.hex("#7FBEB3"),
  built_in: chalk.hex("#78B8B5"),
  string: chalk.hex("#C48DBE"),
  number: chalk.hex("#C8B07A"),
  comment: chalk.hex("#6A6A6A").italic,
  function: chalk.hex("#D3A06F"),
  title: chalk.hex("#D3A06F"),
  params: chalk.hex("#D6B66A"),
  attr: chalk.hex("#9A8FD6"),
  class: chalk.hex("#7FB0D9"),
  type: chalk.hex("#7FB0D9"),
  literal: chalk.hex("#78B8B5"),
  regexp: chalk.hex("#BFBFC6"),
  tag: chalk.hex("#C26A72"),
  name: chalk.hex("#7FBEB3"),
  meta: chalk.hex("#D6B66A"),
  symbol: chalk.hex("#9D92D9"),
  default: chalk.hex("#CFCFD6"),
};

export function HighlightedCode({ code, language }: Props): React.ReactElement {
  const theme = getTheme();

  const lines = useMemo(() => {
    try {
      const lang = supportsLanguage(language) ? language : "text";
      return highlight(code, { language: lang, theme: THEME }).split("\n");
    } catch {
      return code.split("\n");
    }
  }, [code, language]);

  return (
    <Box flexDirection="column" marginTop={1} marginBottom={1}>
      <Text>
        <Text color={theme.primary}>{"┌─"}</Text>
        {language ? (
          <Text color={theme.primary} bold>{` ${language} `}</Text>
        ) : null}
      </Text>

      {lines.map((line, i) => (
        <Text key={i}>
          <Text color={theme.primary}>{"│ "}</Text>
          <Text>{line}</Text>
        </Text>
      ))}

      <Text color={theme.primary}>{"└─"}</Text>
    </Box>
  );
}
