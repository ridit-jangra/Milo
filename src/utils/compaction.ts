import { generateText } from "ai";
import { provider, modelId } from "./model";
import type { Session } from "./session";
import type { ModelMessage } from "ai";

const COMPACTION_THRESHOLD = 80000;
const KEEP_RECENT = 20;

export function estimateTokens(messages: ModelMessage[]): number {
  const text = JSON.stringify(messages);
  return Math.floor(text.length / 4);
}

export function shouldCompact(session: Session): boolean {
  return estimateTokens(session.messages) > COMPACTION_THRESHOLD;
}

export async function compactSession(session: Session): Promise<Session> {
  const messages = session.messages;

  const memoryMessages = session.memoryLoaded ? messages.slice(0, 2) : [];

  const summarizeFrom = memoryMessages.length;
  const summarizeTo = Math.max(summarizeFrom, messages.length - KEEP_RECENT);

  if (summarizeTo <= summarizeFrom) return session;

  const toSummarize = messages.slice(summarizeFrom, summarizeTo);
  const recent = messages.slice(summarizeTo);

  const summaryResult = await generateText({
    model: provider(modelId),
    system: `You are a conversation compactor. Your job is to summarize a conversation history into a dense, information-rich summary that preserves all important context.

Include in your summary:
- What files were read, created, or edited (with paths)
- What tools were called and their key results  
- What decisions were made and why
- What the user asked for and what was accomplished
- Any errors encountered and how they were resolved
- Current state of any ongoing work

Be dense and specific. This summary replaces the full conversation history, so nothing important can be lost.
Format as a single structured block, not a narrative.`,
    messages: [
      {
        role: "user",
        content: `Summarize this conversation history:\n\n${JSON.stringify(toSummarize, null, 2)}`,
      },
    ],
  });

  const summaryMessage: ModelMessage = {
    role: "user",
    content: `<compacted_context>\n${summaryResult.text}\n</compacted_context>`,
  };

  const summaryAck: ModelMessage = {
    role: "assistant",
    content:
      "Context loaded from compacted history. Continuing from where we left off.",
  };

  const compacted: Session = {
    ...session,
    messages: [...memoryMessages, summaryMessage, summaryAck, ...recent],
    updatedAt: Date.now(),
  };

  return compacted;
}
