import { Box, Text } from "ink";
import React from "react";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { getPetStage, getStageColor } from "../pet";

const LOGO_MIN_WIDTH = 120;

const MILO_LOGO = `███╗   ███╗██╗██╗      ██████╗ 
████╗ ████║██║██║     ██╔═══██╗
██╔████╔██║██║██║     ██║   ██║
██║╚██╔╝██║██║██║     ██║   ██║
██║ ╚═╝ ██║██║███████╗╚██████╔╝
╚═╝     ╚═╝╚═╝╚══════╝ ╚═════╝ `;

const CAT_ADDON: Record<string, string> = {
  kitten: `  /\\_/\\  
 ( •.• ) 
  > M <  
 (_m_m_) 
  |   |  
 (_____) `,

  teen: `   /\\_/\\  
  ( -_• ) 
  => M <= 
  /|   |\\ 
 / |   | \\
(___|___|_)`,

  adult: `   /\\_/\\   
  ( ◉.◉ )  
  => M <=  
  /|   |\\ 
 / |   | \\ 
(___|___|_)`,

  legendary: `  👑👑👑  
  /\\_/\\   
 ( ✦.✦ )  
  => M <=  
  /|   |\\ 
(___|___|_)`,
};

type Props = { level: number };

export function AsciiLogo({ level }: Props): React.ReactNode {
  const { columns } = useTerminalSize();
  if (columns < LOGO_MIN_WIDTH) return null;

  const stage = getPetStage(level);
  const color = getStageColor(level);
  const cat = CAT_ADDON[stage] ?? "";

  return (
    <Box gap={2} alignItems="flex-start">
      <Text color={color}>{MILO_LOGO}</Text>
      <Text color={color}>{cat}</Text>
    </Box>
  );
}
