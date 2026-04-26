import type { Command, CommandContext } from "../types";
import { AchievementsView } from "../components/AchievementsView";

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
  async call(args: string, { renderComponent }: CommandContext) {
    renderComponent(<AchievementsView onDone={() => renderComponent(null)} />);
  },
} satisfies Command;

export default command;
