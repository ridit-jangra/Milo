import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { getTheme } from "../utils/theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import type { Mode } from "../types";
import { bullet, diamond, star } from "../icons";
import { readPet } from "../pet";
import type { Pet } from "../types";
import Spinner from "ink-spinner";

type Props = {
  model: string;
  mode: Mode;
  thinking: boolean;
};

function getModeColor(mode: Mode): string {
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
  const modeBg = getModeColor(mode);

  const modelPart = ` ${model} `;
  const modePart = ` ${icon} ${mode} mode `;

  const levelPart = pet ? ` lv.${pet.level} ` : "";
  const xpPart = pet ? ` ${pet.xp}/${pet.xpToNext}xp ` : "";

  return (
    <Box width={columns} justifyContent="space-between">
      <Box gap={2}>
        {thinking ? (
          <Box>
            <Spinner type="bluePulse" />
            <Text>Thinking</Text>
          </Box>
        ) : (
          <>
            <Box>
              <Text color={getTheme().error}>{star}</Text>
              <Text color={getTheme().secondary}>{levelPart}</Text>
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
