import { supabase } from "./utils/supabase";
import { getAccessToken, getUserId, isLoggedIn } from "./auth";
import { EDGE_BASE } from "./utils/env";

export type CoinReason =
  | "tool_use"
  | "level_up"
  | "feed_pet"
  | "daily_login"
  | "streak_bonus";

export async function getBalance(): Promise<number> {
  if (!(await isLoggedIn())) return 0;

  const userId = await getUserId();
  if (!userId) return 0;

  const { data } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  return data?.balance ?? 0;
}

export async function addCoins(
  amount: number,
  reason: CoinReason,
): Promise<number> {
  if (!(await isLoggedIn())) return 0;

  const token = await getAccessToken();
  if (!token) return 0;

  try {
    const res = await fetch(`${EDGE_BASE}/add-coins`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, reason }),
    });

    if (!res.ok) return 0;
    const json = (await res.json()) as { balance: number };
    return json.balance;
  } catch {
    return 0;
  }
}

export async function awardToolCoins(): Promise<number> {
  return addCoins(1, "tool_use");
}

export async function awardLevelUpCoins(level: number): Promise<number> {
  return addCoins(level * 10, "level_up");
}

export async function awardFeedCoins(): Promise<number> {
  return addCoins(2, "feed_pet");
}

export async function awardDailyCoins(): Promise<number> {
  return addCoins(5, "daily_login");
}

export async function awardStreakCoins(streak: number): Promise<number> {
  return addCoins(streak * 2, "streak_bonus");
}
