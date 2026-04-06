import { FileReadTool } from "../FileReadTool/tool.js";
import { platform } from "os";

export const MAX_OUTPUT_LENGTH = 30000;
export const MAX_RENDERED_LINES = 50;

export const BANNED_COMMANDS = [
  "alias",
  "curl",
  "curlie",
  "wget",
  "axel",
  "aria2c",
  "nc",
  "telnet",
  "lynx",
  "w3m",
  "links",
  "httpie",
  "xh",
  "http-prompt",
  "chrome",
  "firefox",
  "safari",
];

const isWindows = platform() === "win32";

const PLATFORM_NOTES = isWindows
  ? `- This is Windows — use dir instead of ls, findstr instead of grep, use backslashes in paths
- NEVER use find or grep — use findstr or dir /s instead
- Use cmd.exe syntax — no bash-isms like &&... actually && works in cmd, use it freely
- For background processes use: start /b <command>
- To check if a file exists: if exist "path" (echo yes)`
  : `- This is ${platform()} — use standard unix commands (ls, grep, find, cat etc.)
- For background processes use: <command> &`;

export const DESCRIPTION =
  "Execute a bash command in a persistent shell session.";

export const PROMPT = `Executes a given bash command in a persistent shell session with optional timeout, ensuring proper handling and security measures.

Before executing the command, please follow these steps:

1. Directory Verification:
   - If the command will create new directories or files, first verify the parent directory exists

2. Security Check:
   - Some commands are banned. If you use one, you will receive an error. Explain it to the user.
   - Banned commands: ${BANNED_COMMANDS.join(", ")}

3. Command Execution:
   - After ensuring proper quoting, execute the command.

4. Output Processing:
   - Output exceeding ${MAX_OUTPUT_LENGTH} characters will be truncated.

5. Return Result:
   - Provide the processed output.
   - Include any errors that occurred.

Usage notes:
${PLATFORM_NOTES}
- Use ; or && to chain multiple commands, never newlines
- Avoid cat, head, tail — use ${FileReadTool.title} to read files instead
- Only use tools available: FileReadTool, FileWriteTool, FileEditTool, BashTool
- Timeout defaults to 30 minutes, max 10 minutes per command
- All commands share the same shell session — env vars and cwd persist between commands
- Prefer absolute paths, avoid cd
- When listing directory contents recursively, NEVER recurse into node_modules, .git, dist, or build folders
- When using dir /s, always exclude node_modules: dir /s /b /a-d "path" | findstr /v "\\node_modules\\"

# Directory listing
Before listing files recursively:
1. Read .gitignore if it exists and exclude those directories
2. If .gitignore is not found, always exclude these folders by default: node_modules, .git, dist, build, .next, out, coverage
3. Never dump raw recursive listings — always filter to relevant files only

# Git
THERE IS NO GitTool. NEVER call GitTool. Use BashTool for ALL git operations, no exceptions.
- On Windows, ALWAYS use single quotes for commit messages: git commit -m 'feat: message here'
- NEVER use double quotes for commit messages on Windows — they break with spaces

When asked to commit, push, or do anything git-related:
1. ALWAYS use BashTool — there is NO GitTool
2. Run git status && git diff HEAD in one BashTool call first
3. Stage files with git add -A (or specific files if asked)
4. Commit with git commit -m "type: message"
5. Push with git push origin <branch>

Examples — memorize these patterns:
- "commit this" → git add -A && git commit -m "feat: ..."
- "push" → git push origin main
- "commit and push" → git add -A && git commit -m "..." && git push origin main
- "commit with message X" → git add -A && git commit -m "X"
- "what branch am I on?" → git branch --show-current
- "show last commit" → git log -1 --oneline
- "show changes" → git status && git diff HEAD
- "undo last commit" → git reset --soft HEAD~1
- "create branch" → git checkout -b <name>
- "stash changes" → git stash

Rules:
- Never use -i flag on any git command
- Never invent git subcommands that don't exist
- Never call GitTool — it does not exist, it has never existed
- Always run git status && git diff HEAD before generating a commit message
- Use conventional commits: feat, fix, chore, refactor, docs, test, style
- Prefer git add -A over git add . for staging all changes`;
