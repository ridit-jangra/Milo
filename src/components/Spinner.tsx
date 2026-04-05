import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { getTheme } from "../utils/theme";
import { sample } from "lodash-es";
import { cornerBottomLeft, line } from "../icons";
import { readPet, getSpinnerPool } from "../pet";

const TIPS = [
  "use agent mode for file tasks",
  "use plan mode for large multi-step tasks",
  "esc to interrupt at any time",
  "milo remembers your preferences",
  "use RecallTool to search past sessions",
  "milo reads MILO.md for project context",
  "chain tasks in one prompt for best results",
  "milo can run bash commands on your behalf",
  "use memory to persist facts across sessions",
  "the more context you give, the better the output",
];

export function Spinner(): React.ReactNode {
  const [elapsedTime, setElapsedTime] = useState(0);
  const message = useRef<string>("Sniffing… 🐱");
  const tip = useRef(sample(TIPS));
  const startTime = useRef(Date.now());

  useEffect(() => {
    readPet()
      .then((pet) => {
        const pool = getSpinnerPool(pet.level);
        message.current = sample(pool) ?? "Sniffing… 🐱";
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column" height={2}>
      <Box flexDirection="row">
        <Box flexWrap="nowrap" height={1} width={2}>
          <Text color={getTheme().primary}>
            <InkSpinner type="star" />
          </Text>
        </Box>
        <Text color={getTheme().primary}> {message.current} </Text>
        <Text color={getTheme().secondaryText}>
          ({elapsedTime}s · <Text bold>esc</Text> to interrupt)
        </Text>
      </Box>
      <Box flexDirection="row" marginLeft={1}>
        <Text color={getTheme().secondaryText} dimColor>
          {cornerBottomLeft}
          {line} tip: {tip.current}
        </Text>
      </Box>
    </Box>
  );
}

export function SimpleSpinner(): React.ReactNode {
  return (
    <Box flexWrap="nowrap" height={1} width={2}>
      <Text color={getTheme().primary}>
        <InkSpinner type="star" />
      </Text>
    </Box>
  );
}
