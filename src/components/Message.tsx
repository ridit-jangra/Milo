import React from "react";
import type { ChatMessage } from "../types";
import { UserMessage } from "./messages/UserMessage";
import { AssistantMessage } from "./messages/AssistantMessage";
import { ToolCallMessage } from "./messages/ToolCallMessage";
import { ToolResultMessage } from "./messages/ToolResultMessage";

type Props = {
  msg: ChatMessage;
  addMargin?: boolean;
};

export const Message = React.memo(function Message({
  msg,
  addMargin = false,
}: Props): React.ReactNode {
  switch (msg.type) {
    case "user":
      return <UserMessage text={msg.text} addMargin={addMargin} />;
    case "assistant":
      return <AssistantMessage text={msg.text} addMargin={addMargin} />;
    case "tool_call":
      return (
        <ToolCallMessage
          toolName={msg.toolName}
          input={msg.input}
          addMargin={addMargin}
        />
      );
    case "tool_result":
      return (
        <ToolResultMessage
          toolName={msg.toolName}
          output={msg.output}
          success={msg.success}
          addMargin={addMargin}
        />
      );
  }
});
