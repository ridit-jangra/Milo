import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import InkSpinner from "ink-spinner";
import { getTheme } from "../utils/theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { Message } from "./Message";
import { tick, cross, line, pointer } from "../icons";
import type { Agent } from "../types";

type Props = {
  agents: Agent[];
  onClose: () => void;
};

function statusIcon(status: Agent["status"]): React.ReactNode {
  const theme = getTheme();
  if (status === "running") return <InkSpinner type="orangePulse" />;
  if (status === "done") return <Text color={theme.success}>{tick}</Text>;
  return <Text color={theme.error}>{cross}</Text>;
}

export function AgentsScreen({ agents, onClose }: Props): React.ReactNode {
  const { columns, rows } = useTerminalSize();
  const theme = getTheme();
  const [selected, setSelected] = useState(0);

  const index = Math.min(selected, Math.max(0, agents.length - 1));
  const active = agents[index];
  const running = agents.filter((a) => a.status === "running").length;

  useInput((_, key) => {
    if (key.escape) {
      onClose();
      return;
    }
    if (key.upArrow || key.leftArrow) {
      setSelected((i) => Math.max(0, i - 1));
    }
    if (key.downArrow || key.rightArrow) {
      setSelected((i) => Math.min(agents.length - 1, i + 1));
    }
  });

  const maxMessages = Math.max(2, Math.floor((rows - 8) / 2));
  const messages = active?.messages ?? [];
  const hidden = Math.max(0, messages.length - maxMessages);
  const visible = messages.slice(hidden);

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      <Box justifyContent="space-between" paddingX={1}>
        <Text color={theme.primary} bold>
          🐱 milo · agents
        </Text>
        <Text color={theme.secondaryText} dimColor>
          {running} running · {agents.length} total
        </Text>
      </Box>
      <Text color={theme.secondaryBorder}>{line.repeat(columns)}</Text>

      {agents.length === 0 ? (
        <Box paddingX={1} paddingY={1}>
          <Text color={theme.secondaryText} dimColor>
            no agents spawned yet — milo will list sub-agents here as they run
          </Text>
        </Box>
      ) : (
        <>
          <Box flexDirection="column" paddingX={1}>
            {agents.map((agent, i) => {
              const isActive = i === index;
              return (
                <Box key={agent.id} flexDirection="row" gap={1}>
                  <Box minWidth={2}>
                    {isActive ? (
                      <Text color={theme.primary}>{pointer}</Text>
                    ) : (
                      <Text> </Text>
                    )}
                  </Box>
                  <Box minWidth={2}>{statusIcon(agent.status)}</Box>
                  <Text
                    color={isActive ? theme.text : theme.secondaryText}
                    dimColor={!isActive}
                  >
                    {agent.task.slice(0, columns - 14)}
                  </Text>
                </Box>
              );
            })}
          </Box>

          <Text color={theme.secondaryBorder}>{line.repeat(columns)}</Text>

          <Box flexDirection="column" paddingX={1} flexGrow={1}>
            {hidden > 0 && (
              <Text color={theme.secondaryText} dimColor>
                … {hidden} earlier message{hidden === 1 ? "" : "s"} hidden
              </Text>
            )}
            {visible.map((msg, i) => (
              <Message
                key={msg.id}
                msg={msg}
                isFirst={hidden === 0 && i === 0}
              />
            ))}
          </Box>
        </>
      )}

      <Text color={theme.secondaryBorder}>{line.repeat(columns)}</Text>
      <Box paddingX={1}>
        <Text color={theme.secondaryText} dimColor>
          ↑↓ select agent · esc / ctrl+x back to chat
        </Text>
      </Box>
    </Box>
  );
}
