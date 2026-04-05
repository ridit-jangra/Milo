import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { getTheme } from "../utils/theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import type { Mode } from "../types";
import { bullet, diamond, dot, star } from "../icons";
import { readPet, renderXpBar } from "../pet";
import type { Pet } from "../types";

type Props = {
  model: string;
  mode: Mode;
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

export function StatusBar({ model, mode }: Props): React.ReactNode {
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
      <Box>
        <Text color={getTheme().secondary}>{levelPart}</Text>
        <Text>{dot}</Text>
        <Text color={getTheme().success}>{xpPart}</Text>
      </Box>
      <Text color={getTheme().secondaryText}>{modelPart}</Text>
      <Text backgroundColor={modeBg} color="#000000">
        {modePart}
      </Text>
    </Box>
  );
}
