import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { getTheme } from "../utils/theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import type { Mode } from "../types";
import { bullet, coin, diamond, star } from "../icons";
import { readPet, getStageColor, getPetStage, type PetStage } from "../pet";
import type { Pet } from "../types";
import Spinner from "ink-spinner";
import { getBalance } from "../wallet";
import { isLoggedIn } from "../auth";

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
    case "build":
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
  const [coins, setCoins] = useState<number | null>(null);

  useEffect(() => {
    // load pet
    readPet()
      .then(setPet)
      .catch(() => {});

    // load coins if logged in
    isLoggedIn().then((loggedIn) => {
      if (!loggedIn) return;
      getBalance()
        .then(setCoins)
        .catch(() => {});
    });

    const interval = setInterval(() => {
      readPet()
        .then(setPet)
        .catch(() => {});

      // refresh coins every 5s too
      isLoggedIn().then((loggedIn) => {
        if (!loggedIn) return;
        getBalance()
          .then(setCoins)
          .catch(() => {});
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const icon = mode === "agent" ? diamond : mode === "build" ? star : bullet;

  const modelPart = ` ${model} `;
  const modePart = ` ${icon} ${mode} mode `;
  const levelPart = pet ? ` lv.${pet.level} ` : "";
  const xpPart = pet ? ` ${pet.xp}/${pet.xpToNext}xp ` : "";

  const stageColor = pet ? getStageColor(pet.level) : getTheme().error;
  const stage = pet ? getPetStage(pet.level) : "kitten";
  const levelIcon = stage === "legendary" ? "👑" : star;

  const thinkingMessage = (() => {
    if (stage === "legendary") {
      if (pet?.mood === "happy") return "Cooking 🍳";
      if ((pet?.hunger ?? 0) >= 80) return "Starving 😿";
      if (pet?.mood === "sleepy") return "zzzz 💤";
      return "Cooking 🍳";
    }
    if (stage === "adult") return "Working...";
    if (stage === "teen") return "On it 😼";
    return "Thinking...";
  })();

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
              <Text color={getTheme().secondary}>{xpPart}</Text>
            </Box>
            {coins !== null && (
              <Box>
                <Text color={getTheme().money}>{coin}</Text>
                <Text color={getTheme().money}>{coins}</Text>
              </Box>
            )}
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
