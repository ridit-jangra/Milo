import React, { useState, type JSX } from "react";
import { Box, Text, Static, useInput } from "ink";
import TextInput from "../components/TextInput";
import { Spinner } from "../components/Spinner";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { useChat } from "../hooks/useChat";
import { getTheme } from "../utils/theme";
import { Message } from "../components/Message";
import { pointer } from "../icons";

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

  return (
    <Box flexDirection="column" height="100%">
      <Static items={messages}>
        {(msg) => <Message key={msg.id} msg={msg} />}
      </Static>

      {loading && <Spinner />}

      <Box borderStyle="round" borderColor={getTheme().border} paddingX={1}>
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
