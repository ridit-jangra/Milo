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
- NEVER use find or grep — use findstr or dir /s instead`
  : `- This is ${platform()} — use standard unix commands (ls, grep, find, cat etc.)`;

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
  
  # Git commits
  When asked to commit:
  1. Run git status, git diff, and git log in a single step
  2. Stage only relevant files
  3. Write a concise commit message focused on "why" not "what"
  4. Never use git commands with -i flag
  5. Never push to remote
  6. Never update git config`;
