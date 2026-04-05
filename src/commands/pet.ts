import type { Command } from "../types";
import { readPet, getMoodEmoji, renderXpBar } from "../pet";

const command = {
  type: "local",
  name: "pet",
  description: "Show Milo's stats",
  isEnabled: true,
  isHidden: false,
  userFacingName() {
    return "pet";
  },
  async call() {
    const pet = await readPet();
    const mood = getMoodEmoji(pet.mood);
    const bar = renderXpBar(pet.xp, pet.xpToNext, 20);
    const hunger =
      pet.hunger >= 80
        ? "starving 😿"
        : pet.hunger >= 50
          ? "hungry 🍖"
          : "fed 😺";

    return [
      `${mood} Milo — Level ${pet.level}`,
      `XP    ${bar} ${pet.xp}/${pet.xpToNext}`,
      `Mood  ${pet.mood}`,
      `Hunger ${hunger} (${pet.hunger}/100)`,
      `Streak ${pet.streak} day${pet.streak !== 1 ? "s" : ""}`,
      `Tasks  ${pet.totalTasks} completed`,
    ].join("\n");
  },
} satisfies Command;

export default command;
