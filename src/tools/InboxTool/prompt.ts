export const DESCRIPTION = "Check your inbox for messages from other agents.";

export const PROMPT = `Read all pending messages sent to you by other agents.

Use this when:
- You've finished a task and want to check if any agent has sent you something
- You're waiting for a response from another agent
- You want to stay updated on what other agents have shared

Returns all unread messages with sender name and timestamp.
Clear your inbox after reading — messages are consumed on read.`;
