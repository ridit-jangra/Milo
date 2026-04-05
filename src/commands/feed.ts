import type { Command } from "../types";
import { feedPet, getMoodEmoji } from "../pet";

const command = {
  type: "local",
  name: "feed",
  description: "Feed Milo 🍖",
  isEnabled: true,
  isHidden: false,
  userFacingName() {
    return "feed";
  },
  async call() {
    const pet = await feedPet();
    const mood = getMoodEmoji(pet.mood);
    return `${mood} Milo has been fed! Hunger reset. purrrr 🐱`;
  },
} satisfies Command;

export default command;
