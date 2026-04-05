import type { Command } from "../types";
import { readPet, isCommandUnlocked } from "../pet";

const command = {
  type: "prompt",
  name: "crimes",
  description: "Milo files a rap sheet on your codebase. (unlocks at level 10)",
  isEnabled: true,
  isHidden: false,
  progressMessage: "compiling evidence 🔍",
  userFacingName() {
    return "crimes";
  },
  async getPromptForCommand(_args: string) {
    const pet = await readPet();
    if (!isCommandUnlocked("crimes", pet.level)) {
      return `Tell the user: "/crimes unlocks at level 10. you're level ${pet.level}. you haven't seen enough yet 😾"`;
    }

    return `You are filing a formal rap sheet on this codebase. Every crime must be documented.

Crimes to look for:
- TODO/FIXME/HACK comments that have been abandoned
- Files over 300 lines (misdemeanor) or over 500 lines (felony)
- console.log or debug statements left in production code
- Any/unknown types used as escape hatches in TypeScript
- Empty catch blocks or swallowed errors
- Hardcoded secrets, URLs, or magic numbers
- Circular dependencies
- Dead code — exported functions/types that are never imported anywhere
- Missing return types on exported functions
- Deeply nested callbacks or promise chains (callback hell)

Format your response as a literal rap sheet:
- Header: "RAP SHEET — [project name]"
- Each crime listed as: [SEVERITY] CRIME · file:line · description
- Severity levels: INFRACTION / MISDEMEANOR / FELONY / CAPITAL OFFENSE
- End with: "Total crimes: X | Recommend: [sentence]"

Rules:
- Use GrepTool and GlobTool extensively — find real crimes, not hypothetical ones
- Reference exact file paths and line numbers
- Stay in character — you are a cat judge with zero tolerance
- If the codebase is actually clean, acknowledge it but find at least 3 minor infractions`;
  },
} satisfies Command;

export default command;
