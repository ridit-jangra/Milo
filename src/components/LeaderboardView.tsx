import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { getTheme } from "../utils/theme";
import { fetchLeaderboard, getMyRank } from "../utils/leaderboard";
import { getUserId } from "../auth";
import { coin, diamond, star } from "../icons";
import type { LeaderboardEntry } from "../utils/leaderboard";

export function LeaderboardView({
  onDone,
}: {
  onDone: () => void;
}): React.ReactNode {
  const theme = getTheme();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<{ rank: number; score: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [data, userId] = await Promise.all([
        fetchLeaderboard(10),
        getUserId(),
      ]);

      setEntries(data);
      setMyUserId(userId);

      if (userId) {
        const rank = await getMyRank();
        setMyRank(rank);
      }

      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, []);

  useInput((_input, key) => {
    if (key.escape) onDone();
  });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Box flexDirection="column" marginY={1} paddingX={1}>
      {/* header */}
      <Box marginBottom={1} gap={2} alignItems="center">
        <Text color={theme.primary} bold>
          🏆 Leaderboard
        </Text>
        <Text color={theme.secondaryText}>top {entries.length}</Text>
        {myRank && (
          <Box gap={1}>
            <Text color={theme.secondaryText}>{diamond}</Text>
            <Text color={theme.warning}>rank #{myRank.rank}</Text>
          </Box>
        )}
      </Box>

      {/* loading */}
      {loading && <Text color={theme.secondaryText}>loading…</Text>}

      {/* empty */}
      {!loading && entries.length === 0 && (
        <Box marginY={1}>
          <Text color={theme.secondaryText}>
            {star} no one here yet. be the first! 👑
          </Text>
        </Box>
      )}

      {/* entries */}
      {!loading && entries.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {entries.map((entry, i) => {
            const isMe = entry.user_id === myUserId;
            const medal = medals[i] ?? `${i + 1}.`;
            const name = entry.username ?? "anonymous cat";

            return (
              <Box key={entry.user_id} flexDirection="column" marginBottom={1}>
                <Box gap={2} alignItems="flex-start">
                  {/* rank */}
                  <Box width={3}>
                    <Text>{medal}</Text>
                  </Box>

                  {/* name + you tag */}
                  <Box flexGrow={1} justifyContent="space-between">
                    <Box gap={1}>
                      <Text
                        color={isMe ? theme.primary : theme.text}
                        bold={isMe}
                      >
                        {name}
                      </Text>
                      {isMe && (
                        <Text color={theme.secondaryText} dimColor>
                          · you
                        </Text>
                      )}
                    </Box>

                    {/* score */}
                    <Box gap={1}>
                      <Text color={theme.warning} bold={isMe}>
                        {entry.score}
                      </Text>
                      <Text color={theme.warning}>{coin}</Text>
                      {entry.level && (
                        <Text color={theme.secondaryText} dimColor>
                          · lv.{entry.level}
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* my rank footer (if outside top 10) */}
      {myRank && myRank.rank > 10 && (
        <Box marginTop={1} gap={2}>
          <Text color={theme.secondaryText}>your rank</Text>
          <Text color={theme.warning}>#{myRank.rank}</Text>
          <Text color={theme.secondaryText}>{diamond}</Text>
          <Text color={theme.warning}>
            {myRank.score} {coin}
          </Text>
        </Box>
      )}

      {/* esc hint */}
      <Box marginTop={1}>
        <Text color={theme.secondaryText} dimColor>
          esc to close
        </Text>
      </Box>
    </Box>
  );
}
