import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { getTheme } from "../utils/theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import type { Mode } from "../types";
import { bullet, diamond, star } from "../icons";
import { readPet, getStageColor, getPetStage, type PetStage } from "../pet";
import type { Pet } from "../types";
import Spinner from "ink-spinner";

type Props = {
  model: string;
  mode: Mode;
  thinking: boolean;
};

function getModeColor(mode: Mode, stage: PetStage): string {
  if (stage === "legendary" && mode === "agent") return "#ffd700";
  switch (mode) {
    case "agent":
      return getTheme().secondary;
    case "plan":
      return getTheme().warning;
    case "chat":
      return getTheme().success;
  }
}

export function StatusBar({
  model,
  mode,
  thinking = false,
}: Props): React.ReactNode {
  const { columns } = useTerminalSize();
  const [pet, setPet] = useState<Pet | null>(null);

  useEffect(() => {
    readPet()
      .then(setPet)
      .catch(() => {});
    const interval = setInterval(() => {
      readPet()
        .then(setPet)
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const icon = mode === "agent" ? diamond : mode === "plan" ? star : bullet;

  const modelPart = ` ${model} `;
  const modePart = ` ${icon} ${mode} mode `;
  const levelPart = pet ? ` lv.${pet.level} ` : "";
  const xpPart = pet ? ` ${pet.xp}/${pet.xpToNext}xp ` : "";

  const stageColor = pet ? getStageColor(pet.level) : getTheme().error;
  const stage = pet ? getPetStage(pet.level) : "kitten";
  const levelIcon = stage === "legendary" ? "👑" : star;

  // Determine dynamic thinking message based on pet stage and mood/hunger
  let thinkingMessage = "";
  if (stage === "legendary") {
    if (pet?.mood === "happy") {
      thinkingMessage = "Cooking 🍳";
    } else if ((pet?.hunger ?? 0) >= 80) {
      thinkingMessage = "Starving 😿";
    } else if (pet?.mood === "sleepy") {
      thinkingMessage = "zzzz 💤";
    } else {
      thinkingMessage = "Cooking 🍳";
    }
  } else if (stage === "adult") {
    thinkingMessage = "Working...";
  } else if (stage === "teen") {
    thinkingMessage = "On it 😼";
  } else {
    thinkingMessage = "Thinking...";
  }

  const modeBg = getModeColor(mode, stage);

  return (
    <Box width={columns} justifyContent="space-between">
      <Box gap={1}>
        {thinking ? (
          <Box>
            <Spinner type="bluePulse" />
            <Text>{thinkingMessage}</Text>
          </Box>
        ) : (
          <>
            <Box>
              <Text color={stageColor}>{levelIcon}</Text>
              <Text color={stageColor}>{levelPart}</Text>
            </Box>
            <Box>
              <Text color={getTheme().warning}>{diamond}</Text>
              <Text color={getTheme().success}>{xpPart}</Text>
            </Box>
          </>
        )}
      </Box>
      <Text color={getTheme().secondaryText}>{modelPart}</Text>
      <Text backgroundColor={modeBg} color="#000000">
        {modePart}
      </Text>
    </Box>
  );
}
