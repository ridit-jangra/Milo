import { useState, useCallback, useRef } from "react";
import { chatWithModel } from "../utils/chat";
import { createAgent } from "../utils/agent";
import { planWithModel } from "../utils/plan";
import { findCommand } from "../commands";
import type { Mode, ChatMessage } from "../types";
import type { Session } from "../utils/session";

export function useChat(initialMode: Mode = "agent") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [mode, _setMode] = useState<Mode>(initialMode);
  const modeRef = useRef<Mode>(initialMode);
  const abortControllerRef = useRef<AbortController>(new AbortController());

  const setMode = useCallback((m: Mode) => {
    modeRef.current = m;
    _setMode(m);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSession(undefined);
  }, []);

  const pushMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "assistant", text },
    ]);
  }, []);

  const submit = useCallback(
    async (input: string) => {
      if (!input.trim() || loading) return;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "user", text: input },
      ]);
      setLoading(true);

      abortControllerRef.current = new AbortController();

      // handle commands
      const found = findCommand(input);
      if (found) {
        const { command, args } = found;

        if (command.type === "local") {
          const result = await command.call(args, {
            clearMessages,
            session,
            setSession,
            mode: modeRef.current,
            setMode,
            pushMessage,
            abortController: abortControllerRef.current,
          });
          if (result) pushMessage(result);
          setLoading(false);
          return;
        }

        if (command.type === "prompt") {
          input = await command.getPromptForCommand(args);
        }
      }

      try {
        const currentMode = modeRef.current;
        const runner =
          currentMode === "plan"
            ? planWithModel
            : currentMode === "chat"
              ? chatWithModel
              : createAgent;

        const { text, session: newSession } = await runner(
          input,
          session,
          (toolCall) => {
            setMessages((prev) => [
              ...prev,
              {
                id: toolCall.id,
                type: "tool_call",
                toolName: toolCall.toolName,
                input: toolCall.input,
              },
            ]);
          },
          (toolResult) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === toolResult.id
                  ? {
                      id: toolResult.id,
                      type: "tool_result" as const,
                      toolName: toolResult.toolName,
                      input: msg.type === "tool_call" ? msg.input : undefined,
                      output: toolResult.output,
                      success: true,
                    }
                  : msg,
              ),
            );
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
    [loading, session, clearMessages, setMode, pushMessage],
  );

  return { messages, loading, mode, setMode, submit, clearMessages };
}
