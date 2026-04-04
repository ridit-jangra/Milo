import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { getTheme } from "../utils/theme";
import { sample } from "lodash-es";

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

export function Spinner(): React.ReactNode {
  const [elapsedTime, setElapsedTime] = useState(0);
  const message = useRef(sample(MESSAGES));
  const startTime = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="row" marginTop={1}>
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
