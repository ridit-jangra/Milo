import { useState, useCallback, useRef, useEffect } from "react";
import { chatWithModel } from "../utils/chat";
import { createAgent } from "../utils/agent";
import { planWithModel } from "../utils/plan";
import { findCommand } from "../commands";
import { onPermissionRequest, resolvePermission } from "../permissions";
import type {
  Mode,
  ChatMessage,
  OrchestratorEvent,
  PermissionRequest,
} from "../types";
import type { Session } from "../utils/session";
import type { PermissionDecision } from "../permissions";
import { info, radioOn, star } from "../icons";

export function useChat(initialMode: Mode = "agent") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [mode, _setMode] = useState<Mode>(initialMode);
  const [pendingPermission, setPendingPermission] =
    useState<PermissionRequest | null>(null);
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

  useEffect(() => {
    const unsub = onPermissionRequest((p) => {
      setPendingPermission({ toolName: p.toolName, input: p.input });
    });
    return unsub;
  }, []);

  const decide = useCallback((decision: PermissionDecision) => {
    resolvePermission(decision);
    setPendingPermission(null);
  }, []);

  const handleOrchestratorEvent = useCallback(
    (event: OrchestratorEvent) => {
      switch (event.type) {
        case "plan_created":
          pushMessage(
            `${info} Plan created — ${event.tasks.length} subtasks:\n${event.tasks
              .map((t) => `  [${t.id}] ${t.subtask}`)
              .join("\n")}`,
          );
          break;
        case "agent_start":
          setMessages((prev) => [
            ...prev,
            {
              id: `agent-${event.taskId}`,
              type: "tool_call",
              toolName: "AgentTool",
              input: { task: event.subtask },
            },
          ]);
          break;
        case "agent_done":
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === `agent-${event.taskId}`
                ? {
                    id: msg.id,
                    type: "tool_result" as const,
                    toolName: "AgentTool",
                    input: msg.type === "tool_call" ? msg.input : undefined,
                    output: { output: event.result },
                    success: true,
                  }
                : msg,
            ),
          );
          break;
        case "connecting":
          pushMessage(`${radioOn} Connecting all agents...`);
          break;
        case "done":
          pushMessage(`${star} Orchestration complete.`);
          break;
      }
    },
    [pushMessage],
  );

  const submit = useCallback(
    async (input: string) => {
      if (!input.trim() || loading || pendingPermission) return;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "user", text: input },
      ]);
      setLoading(true);

      abortControllerRef.current = new AbortController();

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
        const onToolCall = (toolCall: {
          id: string;
          toolName: string;
          input: unknown;
        }) => {
          setMessages((prev) => [
            ...prev,
            {
              id: toolCall.id,
              type: "tool_call",
              toolName: toolCall.toolName,
              input: toolCall.input,
            },
          ]);
        };

        const onToolResult = (toolResult: {
          id: string;
          toolName: string;
          output: unknown;
        }) => {
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
        };

        const actualPrompt = input;

        let text: string;
        let newSession: Session;

        const currentMode = modeRef.current;
        const result =
          currentMode === "plan"
            ? await planWithModel(
                actualPrompt,
                session,
                onToolCall,
                onToolResult,
                handleOrchestratorEvent,
              )
            : await (currentMode === "chat" ? chatWithModel : createAgent)(
                actualPrompt,
                session,
                onToolCall,
                onToolResult,
              );
        text = result.text;
        newSession = result.session;

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
    [
      loading,
      pendingPermission,
      session,
      clearMessages,
      setMode,
      pushMessage,
      handleOrchestratorEvent,
    ],
  );

  return {
    messages,
    loading,
    mode,
    setMode,
    submit,
    clearMessages,
    pendingPermission,
    decide,
    pushMessage,
  };
}
