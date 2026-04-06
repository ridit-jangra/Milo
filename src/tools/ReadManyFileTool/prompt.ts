// prompt.ts
const MAX_LINES_TO_READ = 2000;
const MAX_LINE_LENGTH = 2000;

export const DESCRIPTION =
  "Read multiple files from the local filesystem in a single call.";
export const PROMPT = `Reads multiple files at once. Each path must be an absolute path. Optionally specify line_start and line_end per file. Any lines longer than ${MAX_LINE_LENGTH} characters will be truncated. Use this instead of calling FileReadTool multiple times.`;
