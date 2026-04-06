export const DESCRIPTION = "Compact the conversation history into a summary.";

export const PROMPT = `Summarizes the current conversation into a dense context block and starts a fresh session.

Use this when:
- The conversation is getting very long
- You notice context is filling up
- You want to preserve important context before it gets lost

Do NOT use this:
- At the start of a conversation
- When the conversation is short
- More than once per session

Returns a confirmation that compaction was performed.`;
