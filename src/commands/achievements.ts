import type { Command } from "../types";
import { renderAchievements } from "../utils/achievements";

const command = {
  type: "local",
  name: "achievements",
  description: "Show your achievements and purr-coins 🐾",
  isEnabled: true,
  isHidden: false,
  aliases: ["ach"],
  userFacingName() {
    return "achievements";
  },
  async call() {
    return renderAchievements();
  },
} satisfies Command;

export default command;
