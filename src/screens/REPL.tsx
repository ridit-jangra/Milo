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
import type { ChatMessage } from "../types";

const HEADER_ITEM = [{ id: "header", type: "header" as const }];

type StaticItem =
  | { id: string; type: "header" }
  | { id: string; type: "message"; msg: ChatMessage; index: number };

export default function REPL(): JSX.Element {
  const { columns } = useTerminalSize();
  const [value, setValue] = useState("");
  const [cursorOffset, setCursorOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { messages, loading, submit } = useChat();

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
        const matches = getMatchingCommands(value);
        setSelectedIndex((i) => Math.max(0, i - 1));
      }
      if (key.downArrow && value.startsWith("/")) {
        const matches = getMatchingCommands(value);
        setSelectedIndex((i) => Math.min(matches.length - 1, i + 1));
      }
    },
    { isActive: !loading },
  );

  const staticItems: StaticItem[] = [
    ...HEADER_ITEM,
    ...messages.map((msg, index) => ({
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
        <CommandSuggestions query={value} selectedIndex={selectedIndex} />
      </Box>
    </Box>
  );
}
