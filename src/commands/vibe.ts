import type { Command } from "../types";
import { readPet, isCommandUnlocked } from "../pet";

const command = {
  type: "prompt",
  name: "vibe",
  description: "Milo gives your project a vibe check. (unlocks at level 5)",
  isEnabled: true,
  isHidden: false,
  progressMessage: "reading the room 👁️",
  userFacingName() {
    return "vibe";
  },
  async getPromptForCommand(_args: string) {
    const pet = await readPet();
    if (!isCommandUnlocked("vibe", pet.level)) {
      return `Tell the user: "/vibe unlocks at level 5. you're level ${pet.level}. not there yet 😼"`;
    }

    return `You are giving this codebase a vibe check. Not a code review — a personality read.

Your job:
- Read the project structure, main files, README if it exists
- Get a feel for the energy, ambition, and soul of the project
- Give it a vibe rating and a personality archetype

Format:
- **Vibe rating**: X/10 with a one-word descriptor (e.g. "7/10 — chaotic")
- **Archetype**: what kind of developer energy does this project have? (e.g. "midnight hacker", "overengineered startup", "solo dev cooking", "enterprise cope")
- **The good**: 2-3 things that give good energy
- **The concerning**: 2-3 things that give off bad vibes
- **Final verdict**: one sentence, delivered like a cat judging you from across the room

Rules:
- Use GlobTool to scan the structure first
- Read 3-5 key files to get a feel for the code style
- Be opinionated. Neutral vibes are not vibes.
- Stay in cat personality throughout.`;
  },
} satisfies Command;

export default command;
