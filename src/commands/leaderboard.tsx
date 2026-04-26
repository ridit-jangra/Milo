import React from "react";
import type { Command, CommandContext } from "../types";
import { LeaderboardView } from "../components/LeaderboardView";

const command = {
  type: "local",
  name: "leaderboard",
  description: "Show the Milo leaderboard 🏆",
  isEnabled: true,
  isHidden: false,
  aliases: ["lb"],
  userFacingName() {
    return "leaderboard";
  },
  async call(_args: string, { renderComponent }: CommandContext) {
    renderComponent(<LeaderboardView onDone={() => renderComponent(null)} />);
  },
} satisfies Command;

export default command;
