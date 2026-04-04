export const INTERRUPT_MESSAGE = "[Request interrupted by user]";
export const INTERRUPT_MESSAGE_FOR_TOOL_USE =
  "[Request interrupted by user for tool use]";
export const CANCEL_MESSAGE =
  "The user doesn't want to take this action right now. STOP what you are doing and wait for the user to tell you how to proceed.";
export const REJECT_MESSAGE =
  "The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed.";
export const NO_RESPONSE_REQUESTED = "No response requested.";

export const SYNTHETIC_ASSISTANT_MESSAGES = new Set([
  INTERRUPT_MESSAGE,
  INTERRUPT_MESSAGE_FOR_TOOL_USE,
  CANCEL_MESSAGE,
  REJECT_MESSAGE,
  NO_RESPONSE_REQUESTED,
]);

export function extractTag(html: string, tagName: string): string | null {
  if (!html.trim() || !tagName.trim()) return null;

  const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<${escapedTag}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}>`,
    "gi",
  );

  let match;
  let depth = 0;
  let lastIndex = 0;
  const openingTag = new RegExp(`<${escapedTag}(?:\\s+[^>]*?)?>`, "gi");
  const closingTag = new RegExp(`<\\/${escapedTag}>`, "gi");

  while ((match = pattern.exec(html)) !== null) {
    const content = match[1];
    const beforeMatch = html.slice(lastIndex, match.index);

    depth = 0;

    openingTag.lastIndex = 0;
    while (openingTag.exec(beforeMatch) !== null) depth++;

    closingTag.lastIndex = 0;
    while (closingTag.exec(beforeMatch) !== null) depth--;

    if (depth === 0 && content) return content;

    lastIndex = match.index + match[0].length;
  }

  return null;
}

const STRIPPED_TAGS = [
  "commit_analysis",
  "context",
  "function_analysis",
  "pr_analysis",
];

export function stripSystemMessages(content: string): string {
  const regex = new RegExp(`<(${STRIPPED_TAGS.join("|")})>.*?</\\1>\n?`, "gs");
  return content.replace(regex, "").trim();
}

export function isEmptyMessageText(text: string): boolean {
  return (
    stripSystemMessages(text).trim() === "" ||
    text.trim() === INTERRUPT_MESSAGE_FOR_TOOL_USE
  );
}

export function getLastAssistantMessage(
  messages: { role: string; content: string }[],
): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "assistant") {
      return messages[i]?.content;
    }
  }
  return undefined;
}
