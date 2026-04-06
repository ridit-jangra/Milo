import { useState, useCallback, useRef, useEffect } from "react";
import { chatWithModel } from "../utils/chat";
import { createAgent } from "../utils/agent";
import { planWithModel } from "../utils/plan";
import { findCommand } from "../commands";
import { onPermissionRequest, resolvePermission } from "../permissions";
import { awardXP, getLevelFlavor, LEVEL_UP_MESSAGES } from "../pet";
import type {
  Mode,
  ChatMessage,
  OrchestratorEvent,
  PermissionRequest,
} from "../types";
import type { Session } from "../utils/session";
import type { PermissionDecision } from "../permissions";
import { info, radioOn, star } from "../icons";

export type WizardMode = "add" | "edit" | "remove" | "list";

export function useChat(initialMode: Mode = "agent") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [mode, _setMode] = useState<Mode>(initialMode);
  const [pendingPermission, setPendingPermission] =
    useState<PermissionRequest | null>(null);
  const [pendingWizard, setPendingWizard] = useState<WizardMode | null>(null);
  const modeRef = useRef<Mode>(initialMode);
  const sessionRef = useRef<Session | undefined>(undefined);
  const abortControllerRef = useRef<AbortController>(new AbortController());

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const setMode = useCallback((m: Mode) => {
    modeRef.current = m;
    _setMode(m);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSession(undefined);
    sessionRef.current = undefined;
  }, []);

  const pushMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "assistant", text },
    ]);
  }, []);

  const onCompact = useCallback(
    (compacted: Session) => {
      setSession(compacted);
      sessionRef.current = compacted;
      pushMessage("🗜 Context compacted. Continuing from summary.");
    },
    [pushMessage],
  );

  useEffect(() => {
    const unsub = onPermissionRequest((p) => {
      setPendingPermission({
        id: crypto.randomUUID(),
        toolName: p.toolName,
        input: p.input,
      });
    });
    return unsub;
  }, []);

  const decide = useCallback((decision: PermissionDecision) => {
    resolvePermission(decision);
    setPendingPermission(null);
  }, []);

  const closeWizard = useCallback(
    (message?: string) => {
      setPendingWizard(null);
      if (message) pushMessage(message);
    },
    [pushMessage],
  );

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
        case "subagent_tool_call":
          setMessages((prev) => [
            ...prev,
            {
              id: `subagent-${event.taskId}-${event.toolName}-${Date.now()}`,
              type: "tool_call" as const,
              toolName: event.toolName,
              input: event.input,
              isOrchestrated: true,
              taskId: event.taskId,
            },
          ]);
          break;
        case "subagent_tool_result":
          setMessages((prev) => {
            const idx = [...prev]
              .reverse()
              .findIndex(
                (m) =>
                  m.type === "tool_call" &&
                  m.isOrchestrated === true &&
                  m.taskId === event.taskId &&
                  m.toolName === event.toolName,
              );
            if (idx === -1) return prev;
            const realIdx = prev.length - 1 - idx;
            return prev.map((m, i) => {
              if (i !== realIdx || m.type !== "tool_call") return m;
              return {
                id: m.id,
                type: "tool_result" as const,
                toolName: m.toolName,
                input: m.input,
                output: event.output,
                success: true,
                isOrchestrated: true,
                taskId: event.taskId,
              };
            });
          });
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
      if (!input.trim() || loading || pendingPermission || pendingWizard)
        return;

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
            openWizard: setPendingWizard,
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
          awardXP(toolResult.toolName)
            .then(({ pet, leveledUp }) => {
              if (leveledUp) {
                const flavor = getLevelFlavor(pet.level);
                const unlock = LEVEL_UP_MESSAGES[pet.level];
                const lines = [
                  `⚡ level up! milo is now level ${pet.level} 🐱`,
                  flavor,
                ];
                if (unlock) lines.push(unlock);
                pushMessage(lines.join("\n"));
              }
            })
            .catch(() => {});

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

        const currentMode = modeRef.current;
        const currentSession = sessionRef.current;

        const result =
          currentMode === "plan"
            ? await planWithModel(
                input,
                currentSession,
                onToolCall,
                onToolResult,
                handleOrchestratorEvent,
                onCompact,
              )
            : currentMode === "chat"
              ? await chatWithModel(
                  input,
                  currentSession,
                  onToolCall,
                  onToolResult,
                  onCompact,
                )
              : await createAgent(
                  input,
                  currentSession,
                  onToolCall,
                  onToolResult,
                  onCompact,
                );

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), type: "assistant", text: result.text },
        ]);
        setSession(result.session);
        sessionRef.current = result.session;
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
      pendingWizard,
      session,
      clearMessages,
      setMode,
      pushMessage,
      handleOrchestratorEvent,
      onCompact,
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
    pendingWizard,
    closeWizard,
  };
}
