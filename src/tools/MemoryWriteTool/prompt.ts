export const DESCRIPTION = "Write content to a persistent memory file.";
export const PROMPT = `Saves information to ~/.milo/memory/ for use across sessions.

Use this to remember:
- User preferences and conventions
- Project-specific context (stack, patterns, rules)
- Anything the user explicitly asks you to remember

Always write to MEMORY.md unless the user specifies otherwise.
Content should be concise markdown.`;
