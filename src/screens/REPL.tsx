import React, { useState, useEffect, type JSX } from "react";
import { Box, Text, Static, useInput } from "ink";
import { getHistory, addToHistory } from "../history";
import TextInput from "../components/TextInput";
import { SimpleSpinner, Spinner } from "../components/Spinner";
import InkSpinner from "ink-spinner";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { useChat } from "../hooks/useChat";
import { getTheme } from "../utils/theme";
import { Message } from "../components/Message";
import { pointer, line, cornerBottomLeft } from "../icons";
import { shellStream } from "../utils/shellStream";
import { Header } from "../components/Header";
import { ProviderWizard } from "../components/ProviderWizard";
import {
  CommandSuggestions,
  getMatchingCommands,
} from "../components/CommandSuggestions";
import type { ChatMessage } from "../types";
import { StatusBar } from "../components/StatusBar";
import { findShortcut } from "../shortcuts";
import { PermissionCard } from "../components/permissions/PermissionCard";
import { readPetSync } from "../pet";
import { isBootstrap, markBootstrapDone } from "../utils/bootstrap";
import { BootstrapWizard } from "../components/BootstrapWizard";
import { HighlightedCode } from "../components/HighlightedCode";
import { PersistentShell } from "../utils/PersistentShell";

const MAX_RENDERED_LINES = 20;

type SubtoolMessage = Extract<
  ChatMessage,
  { type: "tool_call" | "tool_result" }
>;

type StaticItem =
  | { id: string; type: "header"; level: number }
  | { id: string; type: "message"; msg: ChatMessage; index: number }
  | {
      id: string;
      type: "agent_snapshot";
      msg: ChatMessage;
      task: string;
      subtools: SubtoolMessage[];
    };

const INITIAL_PET_LEVEL = readPetSync().level;

export default function REPL(): JSX.Element {
  const { columns } = useTerminalSize();
  const [value, setValue] = useState("");
  const [cursorOffset, setCursorOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lastTypedInput, setLastTypedInput] = useState("");
  const [commandStartTime, setCommandStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);
  const [modelLabel, setModelLabel] = useState("no model");
  const [bootstrap, setBootstrap] = useState(isBootstrap());
  const [liveOutput, setLiveOutput] = useState<string>("");
  const [liveCommand, setLiveCommand] = useState<string>("");
  const [petLevel] = useState(INITIAL_PET_LEVEL);

  const {
    messages,
    loading,
    submit,
    mode,
    setMode,
    clearMessages,
    decide,
    pendingPermission,
    pendingWizard,
    PendingComponent,
    closeComponent,
    closeWizard,
    abort,
  } = useChat();

  useInput((_, key) => {
    if (key.escape) {
      abort();
      setLiveOutput("");
      setLiveCommand("");
      setElapsed(0);
    }
  });

  useEffect(() => {
    import("../utils/model")
      .then((m) => m.getModel())
      .then(({ modelId }) => setModelLabel(modelId))
      .catch(() => {});
  }, [PendingComponent]);

  useEffect(() => {
    const onCommand = (cmd: string) => {
      setLiveCommand(cmd);
      setCommandStartTime(Date.now());
      setElapsed(0);
    };
    const onChunk = (chunk: string) => {
      setLiveOutput((prev) => {
        const next = prev + chunk;
        const lines = next.split("\n");
        return lines.slice(-MAX_RENDERED_LINES).join("\n");
      });
    };
    const onDone = () => {
      setLiveOutput("");
      setLiveCommand("");
      setElapsed(0);
    };

    shellStream.on("command", onCommand);
    shellStream.on("chunk", onChunk);
    shellStream.on("done", onDone);
    return () => {
      shellStream.off("command", onCommand);
      shellStream.off("chunk", onChunk);
      shellStream.off("done", onDone);
    };
  }, []);

  useEffect(() => {
    if (!liveCommand) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - commandStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [liveCommand, commandStartTime]);

  function onSubmit(input: string) {
    if (!input.trim() || loading) return;
    PersistentShell.getInstance().resetAbort();
    addToHistory(input.trim()).catch(() => {});
    setHistory((prev) =>
      prev[0] === input.trim() ? prev : [input.trim(), ...prev].slice(0, 100),
    );
    setHistoryIndex(0);
    setLastTypedInput("");
    submit(input);
    setValue("");
    setCursorOffset(0);
    setSelectedIndex(0);
  }

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [value]);

  React.useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => {});
  }, []);

  function onHistoryUp() {
    if (historyIndex < history.length) {
      if (historyIndex === 0 && value.trim() !== "") {
        setLastTypedInput(value);
      }
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const entry = history[historyIndex] ?? "";
      setValue(entry);
      setCursorOffset(entry.length);
    }
  }

  function onHistoryDown() {
    if (historyIndex > 1) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const entry = history[newIndex - 1] ?? "";
      setValue(entry);
      setCursorOffset(entry.length);
    } else if (historyIndex === 1) {
      setHistoryIndex(0);
      setValue(lastTypedInput);
      setCursorOffset(lastTypedInput.length);
    }
  }

  function onHistoryReset() {
    setHistoryIndex(0);
    setLastTypedInput("");
  }

  useInput(
    (input, key) => {
      if (PendingComponent) return;
      if (key.tab && value.startsWith("/")) {
        const matches = getMatchingCommands(value);
        if (matches.length === 0) return;
        const match = matches[selectedIndex] ?? matches[0];
        if (match) {
          const completed = "/" + match.userFacingName() + " ";
          setValue(completed);
          setCursorOffset(completed.length);
        }
      }
      if (key.upArrow && value.startsWith("/")) {
        setSelectedIndex((i) => Math.max(0, i - 1));
      }
      if (key.downArrow && value.startsWith("/")) {
        const matches = getMatchingCommands(value);
        setSelectedIndex((i) => Math.min(matches.length - 1, i + 1));
      }
      const shortcut = findShortcut(input, key);
      if (shortcut) {
        shortcut.action({ clearMessages, mode, setMode });
      }
    },
    { isActive: !loading },
  );

  const subagentByTask = messages.reduce<Record<string, SubtoolMessage[]>>(
    (acc, m) => {
      if (
        (m.type === "tool_call" || m.type === "tool_result") &&
        m.isOrchestrated &&
        m.taskId
      ) {
        acc[m.taskId] = [...(acc[m.taskId] ?? []), m];
      }
      return acc;
    },
    {},
  );

  const runningAgents = messages.filter(
    (m): m is Extract<ChatMessage, { type: "tool_call" }> =>
      m.id.startsWith("agent-") && m.type === "tool_call",
  );

  let baseIndex = 0;
  const headerItem: StaticItem = {
    id: "header",
    type: "header",
    level: petLevel,
  };

  const staticItems: StaticItem[] = messages.reduce<StaticItem[]>(
    (acc, m) => {
      if (
        (m.type === "tool_call" || m.type === "tool_result") &&
        m.isOrchestrated &&
        !m.taskId
      ) {
        return acc;
      }
      if (m.id.startsWith("agent-") && m.type === "tool_call") {
        return acc;
      }
      if (m.id.startsWith("agent-") && m.type === "tool_result") {
        const taskId = m.id.replace("agent-", "");
        const task = String(
          (m.input as { task?: string } | undefined)?.task ?? "",
        );
        return [
          ...acc,
          {
            id: m.id,
            type: "agent_snapshot" as const,
            msg: m,
            task,
            subtools: subagentByTask[taskId] ?? [],
          },
        ];
      }
      return [
        ...acc,
        { id: m.id, type: "message" as const, msg: m, index: baseIndex++ },
      ];
    },
    [headerItem],
  );

  return (
    <Box flexDirection="column" height="100%">
      <Static items={staticItems}>
        {(item) => {
          if (item.type === "header")
            return <Header key="header" level={item.level} />;
          if (item.type === "agent_snapshot") {
            return (
              <Box key={item.id} flexDirection="column" marginBottom={1}>
                <Box flexDirection="row" gap={1}>
                  <Text color={getTheme().success}>✔</Text>
                  <Text color={getTheme().secondaryText}>{item.task}</Text>
                </Box>
                {item.subtools.map((sub) => (
                  <Box key={sub.id} marginLeft={2}>
                    <Message msg={sub} addMargin={true} />
                  </Box>
                ))}
              </Box>
            );
          }
          return (
            <Box key={item.id} flexDirection="column">
              <Message msg={item.msg} isFirst={item.index === 0} />
            </Box>
          );
        }}
      </Static>

      {runningAgents.length > 0 && (
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          {runningAgents.map((agent) => {
            const taskId = agent.id.replace("agent-", "");
            const task = String(
              (agent.input as { task?: string } | undefined)?.task ?? "",
            ).slice(0, columns - 12);
            const subtools = subagentByTask[taskId] ?? [];
            const visibleSubtools = subtools.slice(-3);

            return (
              <Box key={agent.id} flexDirection="column" marginBottom={1}>
                <Box flexDirection="row" gap={1}>
                  <InkSpinner type="orangePulse" />
                  <Text color={getTheme().secondaryText} dimColor>
                    {task}
                  </Text>
                </Box>
                {visibleSubtools.map((sub) => {
                  return (
                    <Box key={sub.id} marginLeft={2}>
                      <Message msg={sub} addMargin={true} />
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      )}

      {liveOutput.length > 0 && (
        <Box flexDirection="column">
          <Box flexDirection="row">
            <Box minWidth={2} width={2}>
              <SimpleSpinner />
            </Box>
            <Text color={getTheme().secondaryText}>Running BashTool…</Text>
          </Box>
          <Box marginLeft={2} flexDirection="column">
            <Box flexDirection="row">
              <Text color={getTheme().secondaryText} dimColor>
                {cornerBottomLeft}
                {line}{" "}
              </Text>
              <Text color={getTheme().secondary}>
                $ {liveCommand}
                {elapsed > 0 ? (
                  <Text color={getTheme().secondaryText} dimColor>
                    {" "}
                    · {elapsed}s
                  </Text>
                ) : null}
              </Text>
            </Box>
            <HighlightedCode
              code={liveOutput}
              language={process.platform === "win32" ? "powershell" : "bash"}
            />
          </Box>
        </Box>
      )}

      <Box minHeight={2}>{loading && <Spinner />}</Box>

      <Box flexDirection="column">
        <Text color={getTheme().border}>{line.repeat(columns)}</Text>
        <Box key="input-area">
          {bootstrap ? (
            <BootstrapWizard
              onDone={() => {
                setBootstrap(false);
                markBootstrapDone();
              }}
              columns={columns}
            />
          ) : pendingPermission ? (
            <PermissionCard
              key="permission"
              permission={pendingPermission}
              onDecide={decide}
            />
          ) : PendingComponent ? (
            PendingComponent
          ) : (
            // key="wizard"
            // mode={pendingWizard}
            // onDone={closeWizard}

            <Box paddingX={1}>
              <Text color={getTheme().primary}>{pointer} </Text>
              <TextInput
                value={value}
                onChange={setValue}
                onSubmit={onSubmit}
                onExit={() => process.exit(0)}
                columns={columns - 6}
                cursorOffset={cursorOffset}
                onChangeCursorOffset={setCursorOffset}
                placeholder="ask milo anything..."
                // isDimmed={loading}
                focus={!pendingPermission && !pendingWizard}
                disabled={loading}
                onHistoryUp={onHistoryUp}
                onHistoryDown={onHistoryDown}
                onHistoryReset={onHistoryReset}
                onEscape={abort}
                // highlightPastedText={true}
              />
            </Box>
          )}
        </Box>
        <Text color={getTheme().border}>{line.repeat(columns)}</Text>
        <CommandSuggestions query={value} selectedIndex={selectedIndex} />
        <StatusBar model={modelLabel} mode={mode} thinking={loading} />
      </Box>
    </Box>
  );
}
