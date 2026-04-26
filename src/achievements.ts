import { supabase } from "./utils/supabase";
import { getAccessToken, getUserId, isLoggedIn } from "./auth";
import { EDGE_BASE } from "./utils/env";

export type AchievementId =
  | "first_run"
  | "daily_user"
  | "power_user"
  | "night_owl"
  | "ai_addict"
  | "week_streak"
  | "fed_the_cat"
  | "level_5"
  | "level_10";

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  reward: number;
};

export type UserAchievement = {
  achievement_id: string;
  unlocked_at: string;
};

export async function unlockAchievement(
  achievementId: AchievementId,
  username?: string,
): Promise<{ success: boolean; balance: number }> {
  if (!(await isLoggedIn())) return { success: false, balance: 0 };

  const token = await getAccessToken();
  if (!token) return { success: false, balance: 0 };

  try {
    const res = await fetch(`${EDGE_BASE}/unlock-achievement`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ achievementId, username }),
    });

    if (!res.ok) return { success: false, balance: 0 };
    const json = (await res.json()) as { success: boolean; balance: number };
    return json;
  } catch {
    return { success: false, balance: 0 };
  }
}

export async function getUnlockedAchievements(): Promise<UserAchievement[]> {
  if (!(await isLoggedIn())) return [];

  const userId = await getUserId();
  if (!userId) return [];

  const { data } = await supabase
    .from("user_achievements")
    .select("achievement_id, unlocked_at")
    .eq("user_id", userId);

  return (data ?? []) as UserAchievement[];
}

export async function getAllAchievements(): Promise<Achievement[]> {
  const { data } = await supabase.from("achievements").select("*");

  return (data ?? []) as Achievement[];
}

export async function checkAchievements(opts: {
  totalTasks: number;
  streak: number;
  level: number;
  isFirstRun?: boolean;
  aiMessageCount?: number;
  justFed?: boolean;
}): Promise<AchievementId[]> {
  if (!(await isLoggedIn())) return [];

  const { totalTasks, streak, level, isFirstRun, aiMessageCount, justFed } =
    opts;
  const unlocked: AchievementId[] = [];

  const checks: Array<{ id: AchievementId; condition: boolean }> = [
    { id: "first_run", condition: !!isFirstRun },
    { id: "daily_user", condition: streak >= 1 },
    { id: "power_user", condition: totalTasks >= 100 },
    {
      id: "night_owl",
      condition: new Date().getHours() >= 0 && new Date().getHours() < 4,
    },
    { id: "ai_addict", condition: (aiMessageCount ?? 0) >= 10 },
    { id: "week_streak", condition: streak >= 7 },
    { id: "fed_the_cat", condition: !!justFed },
    { id: "level_5", condition: level >= 5 },
    { id: "level_10", condition: level >= 10 },
  ];

  await Promise.all(
    checks
      .filter((c) => c.condition)
      .map(async (c) => {
        const result = await unlockAchievement(c.id);
        if (result.success) unlocked.push(c.id);
      }),
  );

  return unlocked;
}
