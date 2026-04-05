import React, { useState, type JSX } from "react";
import { Box, Text, Static, useInput } from "ink";
import TextInput from "../components/TextInput";
import { Spinner } from "../components/Spinner";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { useChat } from "../hooks/useChat";
import { getTheme } from "../utils/theme";
import { Message } from "../components/Message";
import { pointer, line } from "../icons";
import { Header } from "../components/Header";
import {
  CommandSuggestions,
  getMatchingCommands,
} from "../components/CommandSuggestions";
import type { ChatMessage, Mode } from "../types";
import { StatusBar } from "../components/StatusBar";
import { modelId } from "../utils/model";
import { findShortcut } from "../shortcuts";

const HEADER_ITEM = [{ id: "header", type: "header" as const }];

type StaticItem =
  | { id: string; type: "header" }
  | { id: string; type: "message"; msg: ChatMessage; index: number };

export default function REPL(): JSX.Element {
  const { columns } = useTerminalSize();
  const [value, setValue] = useState("");
  const [cursorOffset, setCursorOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { messages, loading, submit, mode, setMode, clearMessages } = useChat();

  function onSubmit(input: string) {
    if (!input.trim() || loading) return;
    submit(input);
    setValue("");
    setCursorOffset(0);
    setSelectedIndex(0);
  }

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [value]);

  useInput(
    (input, key) => {
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

  const borderLine = line.repeat(columns - 2);

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

      {/* live orchestrator progress — outside Static so it re-renders */}
      {isOrchestrating && orchestratedTotal.length > 0 && (
        <Box flexDirection="column" marginTop={1} marginLeft={2}>
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
                  color={isDone ? getTheme().success : getTheme().secondaryText}
                >
                  {isDone ? "✔" : "◆"}
                </Text>
                <Text color={getTheme().secondaryText} dimColor>
                  {task}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}

      {loading && <Spinner />}

      <Box flexDirection="column" marginTop={1}>
        <Text color={getTheme().border}>{borderLine}</Text>
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
            placeholder="ask vein anything..."
            isDimmed={loading}
            focus={!loading}
          />
        </Box>
        <Text color={getTheme().border}>{borderLine}</Text>
        <StatusBar model={modelId} mode={mode} />
        <CommandSuggestions query={value} selectedIndex={selectedIndex} />
      </Box>
    </Box>
  );
}
