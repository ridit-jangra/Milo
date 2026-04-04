import { highlight, supportsLanguage } from "cli-highlight";
import { Text } from "ink";
import React, { useMemo } from "react";

type Props = {
  code: string;
  language: string;
};

export function HighlightedCode({ code, language }: Props): React.ReactElement {
  const highlightedCode = useMemo(() => {
    try {
      if (supportsLanguage(language)) {
        return highlight(code, { language });
      }
      return highlight(code, { language: "markdown" });
    } catch {
      return highlight(code, { language: "markdown" });
    }
  }, [code, language]);

  return <Text>{highlightedCode}</Text>;
}
