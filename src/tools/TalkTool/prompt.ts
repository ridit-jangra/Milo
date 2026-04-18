export const DESCRIPTION =
  "Send a message to another active agent and get their response.";

export const PROMPT = `Sends a message to another agent by name and returns their reply.

Use this when:
- You need information or help from a specific agent
- You want to delegate a question or subtask to another agent
- You need another agent's perspective on something

Do NOT use this when:
- The agent you're targeting doesn't exist
- You can handle the task yourself directly

The target agent will process your message using their own memory and tools, and return a text response.`;
