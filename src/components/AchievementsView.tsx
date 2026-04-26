import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { getTheme } from "../utils/theme";
import { getAllAchievements, getUnlockedAchievements } from "../achievements";
import { getBalance } from "../wallet";
import { isLoggedIn } from "../auth";
import { diamond, star } from "../icons";
import type { Achievement, UserAchievement } from "../achievements";

type AchievementRowProps = {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
};

function AchievementRow({
  achievement,
  unlocked,
  unlockedAt,
}: AchievementRowProps): React.ReactNode {
  const theme = getTheme();

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={2} alignItems="flex-start">
        <Box width={3}>
          <Text color={unlocked ? theme.success : theme.secondaryText}>
            {unlocked ? "✦" : "○"}
          </Text>
        </Box>

        <Box flexGrow={1} justifyContent="space-between">
          <Box gap={1}>
            <Text
              color={unlocked ? theme.text : theme.secondaryText}
              bold={unlocked}
            >
              {achievement.title}
            </Text>
            {unlocked && unlockedAt && (
              <Text color={theme.secondaryText} dimColor>
                · {new Date(unlockedAt).toLocaleDateString()}
              </Text>
            )}
          </Box>
          <Text
            color={unlocked ? theme.warning : theme.secondaryText}
            dimColor={!unlocked}
          >
            +{achievement.reward} 🪙
          </Text>
        </Box>
      </Box>

      <Box marginLeft={5}>
        <Text color={theme.secondaryText} dimColor>
          {achievement.description}
        </Text>
      </Box>
    </Box>
  );
}

export function AchievementsView({
  onDone,
}: {
  onDone: () => void;
}): React.ReactNode {
  const theme = getTheme();

  const [all, setAll] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [_, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [login, achievements] = await Promise.all([
        isLoggedIn(),
        getAllAchievements(),
      ]);

      setLoggedIn(login);
      setAll(achievements);

      if (login) {
        const [unlockedData, bal] = await Promise.all([
          getUnlockedAchievements(),
          getBalance(),
        ]);
        setUnlocked(unlockedData);
        setBalance(bal);
      }

      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      onDone();
    }
  });

  const unlockedMap = new Map(
    unlocked.map((u) => [u.achievement_id, u.unlocked_at]),
  );

  const unlockedCount = unlockedMap.size;
  const total = all.length;
  const progressFilled = Math.floor((unlockedCount / total) * 20);
  const progressBar =
    "█".repeat(progressFilled) + "░".repeat(20 - progressFilled);

  return (
    <Box flexDirection="column" marginY={1} paddingX={1}>
      <Box marginBottom={1} gap={2} alignItems="center">
        <Text color={theme.primary} bold>
          🐾 Achievements
        </Text>
        <Text color={theme.secondaryText}>
          {unlockedCount}/{total}
        </Text>
        <Text color={theme.warning}>{progressBar}</Text>
        {loggedIn && (
          <Box gap={1}>
            <Text color={theme.secondaryText}>{diamond}</Text>
            <Text color={theme.warning}>{balance} 🪙</Text>
          </Box>
        )}
      </Box>

      {!loggedIn && (
        <Box marginY={1} paddingX={1}>
          <Text color={theme.secondaryText}>
            {star} login to track achievements and earn purr-coins · /login{" "}
            {"<email>"}
          </Text>
        </Box>
      )}

      <Box flexDirection="column" marginTop={1}>
        {all
          .sort((a, b) => {
            const aUnlocked = unlockedMap.has(a.id) ? 1 : 0;
            const bUnlocked = unlockedMap.has(b.id) ? 1 : 0;
            return bUnlocked - aUnlocked;
          })
          .map((a) => (
            <AchievementRow
              key={a.id}
              achievement={a}
              unlocked={unlockedMap.has(a.id)}
              unlockedAt={unlockedMap.get(a.id)}
            />
          ))}
      </Box>

      {unlockedCount === total && (
        <Box marginTop={1}>
          <Text color={theme.success}>
            🎉 all done bestie. you ate and left no crumbs.
          </Text>
        </Box>
      )}
    </Box>
  );
}
