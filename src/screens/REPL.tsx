import React, { useState, type JSX } from "react";
import { Box, Text, Static, useInput } from "ink";
import { getHistory, addToHistory } from "../history";
import TextInput from "../components/TextInput";
import { Spinner } from "../components/Spinner";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { useChat } from "../hooks/useChat";
import { getTheme } from "../utils/theme";
import { Message } from "../components/Message";
import { pointer, line } from "../icons";
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

const HEADER_ITEM = [{ id: "header", type: "header" as const }];

type StaticItem =
  | { id: string; type: "header" }
  | { id: string; type: "message"; msg: ChatMessage; index: number };

export default function REPL(): JSX.Element {
  const { columns } = useTerminalSize();
  const [value, setValue] = useState("");
  const [cursorOffset, setCursorOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lastTypedInput, setLastTypedInput] = useState("");
  const [modelLabel, setModelLabel] = useState("no model");
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
    closeWizard,
  } = useChat();

  React.useEffect(() => {
    import("../utils/model")
      .then((m) => m.getModel())
      .then(({ modelId }) => setModelLabel(modelId))
      .catch(() => {});
  }, [pendingWizard]);

  function onSubmit(input: string) {
    if (!input.trim() || loading) return;
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
      if (pendingWizard) return;
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

  const staticMessages = messages.filter(
    (m) => !(m.type === "tool_call" && (m as any).isOrchestrated),
  );

  const orchestratedMessages = messages.filter(
    (m) =>
      (m.type === "tool_call" || m.type === "tool_result") &&
      (m as any).isOrchestrated,
  );

  const orchestratedDone = orchestratedMessages.filter(
    (m) => m.type === "tool_result",
  );

  const orchestratedTotal = messages.filter(
    (m) => m.type === "tool_call" && (m as any).isOrchestrated,
  );

  const isOrchestrating = orchestratedTotal.length > 0 && loading;

  const staticItems: StaticItem[] = [
    ...HEADER_ITEM,
    ...staticMessages.map((msg, index) => ({
      id: msg.id,
      type: "message" as const,
      msg,
      index,
    })),
  ];

  const orchestratorHeight = isOrchestrating
    ? orchestratedTotal.slice(-4).length + 1
    : 0;

  return (
    <Box flexDirection="column" height="100%">
      <Static items={staticItems}>
        {(item) => {
          if (item.type === "header") return <Header key="header" />;
          return (
            <Message key={item.id} msg={item.msg} isFirst={item.index === 0} />
          );
        }}
      </Static>

      <Box
        flexDirection="column"
        marginLeft={2}
        minHeight={orchestratorHeight}
        marginTop={isOrchestrating ? 1 : 0}
      >
        {isOrchestrating && (
          <>
            <Text color={getTheme().primary}>
              ⚡ agents{" "}
              <Text color={getTheme().success}>{orchestratedDone.length}</Text>
              <Text color={getTheme().secondaryText}>
                /{orchestratedTotal.length} done
              </Text>
            </Text>
            {orchestratedTotal.slice(-4).map((m) => {
              const isDone = orchestratedMessages.some(
                (r) => r.type === "tool_result" && r.id === m.id,
              );
              const task = String(
                (m.type === "tool_call" ? (m.input as any)?.task : "") ?? "",
              ).slice(0, columns - 12);
              return (
                <Box key={m.id} flexDirection="row" gap={1}>
                  <Text
                    color={
                      isDone ? getTheme().success : getTheme().secondaryText
                    }
                  >
                    {isDone ? "✔" : "◆"}
                  </Text>
                  <Text color={getTheme().secondaryText} dimColor>
                    {task}
                  </Text>
                </Box>
              );
            })}
          </>
        )}
      </Box>

      <Box minHeight={2}>{loading && <Spinner />}</Box>

      <Box flexDirection="column">
        <Text color={getTheme().border}>{line.repeat(columns)}</Text>

        <Box
          key="input-area"
          // minHeight={pendingPermission ? 10 : pendingWizard ? 10 : 3}
        >
          {pendingPermission ? (
            <PermissionCard
              key="permission"
              permission={pendingPermission}
              onDecide={decide}
            />
          ) : pendingWizard ? (
            <ProviderWizard
              key="wizard"
              mode={pendingWizard}
              onDone={closeWizard}
            />
          ) : (
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
                isDimmed={loading}
                focus={!loading && !pendingPermission && !pendingWizard}
                onHistoryUp={onHistoryUp}
                onHistoryDown={onHistoryDown}
                onHistoryReset={onHistoryReset}
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
