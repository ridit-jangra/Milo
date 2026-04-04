import type { Command } from "../types";
import { platform } from "os";
import { existsSync } from "fs";
import { join } from "path";

const command = {
  type: "prompt",
  name: "init",
  description: "Generate VEIN.md for this project",
  isEnabled: true,
  isHidden: false,
  progressMessage: "analyzing your codebase",
  userFacingName() {
    return "init";
  },
  async getPromptForCommand(_args: string) {
    const cwd = process.cwd();
    const os = platform();

    const pm = existsSync(join(cwd, "bun.lock"))
      ? "bun"
      : existsSync(join(cwd, "pnpm-lock.yaml"))
        ? "pnpm"
        : existsSync(join(cwd, "yarn.lock"))
          ? "yarn"
          : "npm";

    const hasTypeScript = existsSync(join(cwd, "tsconfig.json"));
    const hasPython =
      existsSync(join(cwd, "requirements.txt")) ||
      existsSync(join(cwd, "pyproject.toml"));
    const hasRust = existsSync(join(cwd, "Cargo.toml"));
    const hasGo = existsSync(join(cwd, "go.mod"));

    const langs =
      [
        hasTypeScript && "TypeScript",
        hasPython && "Python",
        hasRust && "Rust",
        hasGo && "Go",
      ]
        .filter(Boolean)
        .join(", ") || "JavaScript";

    return `Please analyze this codebase and create a VEIN.md file containing:

1. **Project overview** — what this project does, its purpose, and high-level architecture
2. **Tech stack** — languages (detected: ${langs}), frameworks, runtimes, and key libraries
3. **Package manager** — detected: ${pm}. Document install/run commands using ${pm}
4. **Platform** — running on ${os}. Note any platform-specific considerations
5. **Build & dev commands** — how to install, build, run, test, and lint the project
6. **Project structure** — key folders and what they contain
7. **Code style** — imports style, formatting conventions, TypeScript config, naming conventions, error handling patterns
8. **Architecture notes** — key design decisions, patterns used, how components connect

Rules:
- Be concise but complete — around 30-40 lines
- Use real values found in the codebase, not placeholders
- If there's already a VEIN.md, improve it rather than replacing it
- If there are Cursor rules (.cursor/rules/ or .cursorrules) or other AI context files, incorporate them
- Format with markdown headers for each section`;
  },
} satisfies Command;

export default command;
