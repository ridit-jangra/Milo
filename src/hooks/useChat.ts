import { useState, useCallback } from "react";
import { chatWithModel } from "../utils/chat";
import { createAgent } from "../utils/agent";
import { planWithModel } from "../utils/plan";
import type { Mode, ChatMessage } from "../types";
import type { Session } from "../utils/session";

export function useChat(initialMode: Mode = "agent") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>(initialMode);

  const submit = useCallback(
    async (input: string) => {
      if (!input.trim() || loading) return;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "user", text: input },
      ]);
      setLoading(true);

      try {
        const runner =
          mode === "agent"
            ? createAgent
            : mode === "plan"
              ? planWithModel
              : chatWithModel;

        const { text, session: newSession } = await runner(
          input,
          session,
          (toolCall) => {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                type: "tool_call",
                toolName: toolCall.toolName,
                input: toolCall.input,
              },
            ]);
          },
          (toolResult) => {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                type: "tool_result",
                toolName: toolResult.toolName,
                output: toolResult.output,
                success: true,
              },
            ]);
          },
        );

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), type: "assistant", text },
        ]);
        setSession(newSession);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: "assistant",
            text: `Error: ${(err as Error).message}`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, mode, session],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSession(undefined);
  }, []);

  return { messages, loading, mode, setMode, submit, clearMessages };
}
