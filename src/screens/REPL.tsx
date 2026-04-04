import React, { useState, type JSX } from "react";
import { Box, Text, Static } from "ink";
import TextInput from "../components/TextInput";
import { Spinner } from "../components/Spinner";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { useChat } from "../hooks/useChat";
import { getTheme } from "../utils/theme";
import { Message } from "../components/Message";
import { pointer } from "../icons";
import { Header } from "../components/Header";
import type { ChatMessage } from "../types";

const LOGO_ITEM = [{ id: "logo", type: "logo" as const }];

type StaticItem =
  | { id: string; type: "logo" }
  | { id: string; type: "message"; msg: ChatMessage; index: number };

export default function REPL(): JSX.Element {
  const { columns } = useTerminalSize();
  const [value, setValue] = useState("");
  const [cursorOffset, setCursorOffset] = useState(0);
  const { messages, loading, submit } = useChat();

  function onSubmit(input: string) {
    if (!input.trim() || loading) return;
    submit(input);
    setValue("");
    setCursorOffset(0);
  }

  const staticItems: StaticItem[] = [
    ...LOGO_ITEM,
    ...messages.map((msg, index) => ({
      id: msg.id,
      type: "message" as const,
      msg,
      index,
    })),
  ];

  return (
    <Box flexDirection="column" height="100%">
      <Static items={staticItems}>
        {(item) => {
          if (item.type === "logo") return <Header key="logo" />;
          return (
            <Message key={item.id} msg={item.msg} isFirst={item.index === 0} />
          );
        }}
      </Static>

      {loading && <Spinner />}

      <Box
        borderStyle="round"
        borderColor={getTheme().border}
        borderRight={false}
        borderLeft={false}
        paddingX={1}
        marginTop={1}
      >
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
    </Box>
  );
}
