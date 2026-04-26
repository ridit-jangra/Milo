import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { getTheme } from "../utils/theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { getAllAchievements, getUnlockedAchievements } from "../achievements";
import { getBalance } from "../wallet";
import { isLoggedIn } from "../auth";
import { coin } from "../icons";
import type { Achievement, UserAchievement } from "../achievements";

const PAGE_SIZE = 6;
const ROW_WIDTH = 56;

type AchievementRowProps = {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
  focused: boolean;
};

function AchievementRow({
  achievement,
  unlocked,
  unlockedAt,
  focused,
}: AchievementRowProps): React.ReactNode {
  const theme = getTheme();

  const rewardStr = `+${achievement.reward}`;
  // title: enough space for reward + coin icon + gaps
  const titleMaxWidth = ROW_WIDTH - rewardStr.length - 6;
  const title =
    achievement.title.length > titleMaxWidth
      ? achievement.title.slice(0, titleMaxWidth - 1) + "…"
      : achievement.title;

  // description: only shown when focused
  const descMaxWidth = ROW_WIDTH - 3;
  const desc =
    achievement.description.length > descMaxWidth
      ? achievement.description.slice(0, descMaxWidth - 1) + "…"
      : achievement.description;

  const statusIcon = unlocked ? "◆" : "◇";
  const titleColor = focused
    ? theme.primary
    : unlocked
      ? theme.text
      : theme.secondaryText;

  return (
    <Box flexDirection="column" width={ROW_WIDTH + 4}>
      {/* main row */}
      <Box gap={1} alignItems="flex-start">
        <Text color={focused ? theme.primary : theme.border}>
          {focused ? "▸" : " "}
        </Text>
        <Text color={unlocked ? theme.success : theme.border}>
          {statusIcon}
        </Text>
        <Box flexGrow={1} width={titleMaxWidth}>
          <Text color={titleColor} bold={focused}>
            {title}
          </Text>
        </Box>
        {unlocked && unlockedAt && (
          <Text color={theme.border} dimColor>
            {new Date(unlockedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </Text>
        )}
        <Text
          color={unlocked ? theme.money : theme.border}
          dimColor={!unlocked}
        >
          {rewardStr} {coin}
        </Text>
      </Box>

      {/* description: only when focused to reduce noise */}
      {focused && (
        <Box marginLeft={3}>
          <Text color={theme.secondaryText} dimColor>
            {desc}
          </Text>
        </Box>
      )}
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
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(0);

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

  const unlockedMap = new Map(
    unlocked.map((u) => [u.achievement_id, u.unlocked_at]),
  );

  const sorted = [...all].sort((a, b) => {
    return (unlockedMap.has(b.id) ? 1 : 0) - (unlockedMap.has(a.id) ? 1 : 0);
  });

  useInput((_input, key) => {
    if (key.escape) {
      onDone();
      return;
    }
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(sorted.length - 1, c + 1));
  });

  const unlockedCount = unlockedMap.size;
  const total = all.length;
  const progressFilled =
    total > 0 ? Math.round((unlockedCount / total) * 16) : 0;
  const progressBar =
    "█".repeat(progressFilled) + "░".repeat(16 - progressFilled);

  const windowStart = Math.max(
    0,
    Math.min(cursor - Math.floor(PAGE_SIZE / 2), sorted.length - PAGE_SIZE),
  );
  const windowEnd = Math.min(sorted.length, windowStart + PAGE_SIZE);
  const visible = sorted.slice(windowStart, windowEnd);
  const canScrollUp = windowStart > 0;
  const canScrollDown = windowEnd < sorted.length;

  const divider = "─".repeat(ROW_WIDTH + 4);

  return (
    <Box flexDirection="column" marginY={1} paddingX={1}>
      {/* header: title + progress + balance on one clean line */}
      <Box marginBottom={1} gap={2} alignItems="center">
        <Text color={theme.primary} bold>
          Achievements
        </Text>
        <Text color={theme.secondaryText}>
          {unlockedCount}/{total}
        </Text>
        <Text color={theme.warning}>{progressBar}</Text>
        {loggedIn && (
          <Text color={theme.money}>
            {balance} {coin}
          </Text>
        )}
      </Box>

      <Text color={theme.border}>{divider}</Text>

      {loading && (
        <Box marginY={1}>
          <Text color={theme.secondaryText}>loading…</Text>
        </Box>
      )}

      {!loading && !loggedIn && (
        <Box marginY={1}>
          <Text color={theme.secondaryText}>
            /login {"<email>"} to track achievements and earn coins
          </Text>
        </Box>
      )}

      {/* scroll hint — subdued, no arrow icons */}
      {canScrollUp && (
        <Box marginBottom={1}>
          <Text color={theme.border} dimColor>
            {"  "}↑ {windowStart} more
          </Text>
        </Box>
      )}

      {!loading && (
        <Box flexDirection="column" gap={0}>
          {visible.map((a, i) => (
            <AchievementRow
              key={a.id}
              achievement={a}
              unlocked={unlockedMap.has(a.id)}
              unlockedAt={unlockedMap.get(a.id)}
              focused={windowStart + i === cursor}
            />
          ))}
        </Box>
      )}

      {canScrollDown && (
        <Box marginTop={1}>
          <Text color={theme.border} dimColor>
            {"  "}↓ {sorted.length - windowEnd} more
          </Text>
        </Box>
      )}

      <Text color={theme.border}>{divider}</Text>

      {!loading && unlockedCount === total && total > 0 && (
        <Box marginTop={1}>
          <Text color={theme.success}>
            🎉 All done. You ate and left no crumbs.
          </Text>
        </Box>
      )}

      {/* minimal footer hints */}
      <Box marginTop={1} gap={3}>
        <Text color={theme.border} dimColor>
          ↑↓ navigate
        </Text>
        <Text color={theme.border} dimColor>
          esc close
        </Text>
      </Box>
    </Box>
  );
}
