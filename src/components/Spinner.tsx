import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { getTheme } from "../utils/theme";
import { sample } from "lodash-es";
import { cornerBottomLeft, line } from "../icons";

const MESSAGES = [
  "Marinating 🍖",
  "Simmering 🍲",
  "Preheating 🔥",
  "Seasoning 🧂",
  "Slow cooking 🐢",
  "Whisking 🥄",
  "Folding in 📄",
  "Reducing 🧠",
  "Deglazing ✨",
  "Plating 🍽️",
  "Blending 🌀",
  "Tasting 👅",
  "Kneading 🥖",
  "Sautéing 🍳",
  "Caramelizing 🍯",
  "Chilling ❄️",
  "Flambéing 🔥",
  "Tempering ⚡",
  "Basting 🧂",
  "Drizzling 🌧️",
  "Sprinkling ✨",
  "Slow roasting 🐢",
  "Whipping up 🥄",
  "We move 🫡",
  "Rizzing up 😏",
  "No cap 🧢",
  "Lowkey cooking 🍳",
  "Slay mode 💅",
  "Main character 🎬",
  "Understood assignment 📋",
  "Vibing 🎵",
  "Fr fr 😭",
  "Ate different 🍽️",
];

const TIPS = [
  "use agent mode for file tasks",
  "use plan mode for large multi-step tasks",
  "esc to interrupt at any time",
  "vein remembers your preferences",
  "use RecallTool to search past sessions",
  "vein reads VEIN.md for project context",
  "chain tasks in one prompt for best results",
  "vein can run bash commands on your behalf",
  "use memory to persist facts across sessions",
  "the more context you give, the better the output",
];

export function Spinner(): React.ReactNode {
  const [elapsedTime, setElapsedTime] = useState(0);
  const message = useRef(sample(MESSAGES));
  const tip = useRef(sample(TIPS));
  const startTime = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        <Box flexWrap="nowrap" height={1} width={2}>
          <Text color={getTheme().primary}>
            <InkSpinner type="star" />
          </Text>
        </Box>
        <Text color={getTheme().primary}> {message.current}… </Text>
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
