import { supabase } from "../utils/supabase";
import { getUserId } from "../auth";
import { coin } from "../icons";

export type LeaderboardEntry = {
  username: string | null;
  score: number;
  user_id: string;
  level: number;
};

export async function fetchLeaderboard(
  limit = 10,
): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from("leaderboard")
    .select("user_id, username, score")
    .order("score", { ascending: false })
    .limit(limit);

  return (data ?? []) as LeaderboardEntry[];
}

export async function getMyRank(): Promise<{
  rank: number;
  score: number;
} | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data } = await supabase
    .from("leaderboard")
    .select("user_id, score")
    .order("score", { ascending: false });

  if (!data) return null;

  const idx = data.findIndex((e) => e.user_id === userId);
  if (idx === -1) return null;

  return {
    rank: idx + 1,
    score: data[idx]!.score,
  };
}

export function renderLeaderboard(
  entries: LeaderboardEntry[],
  myUserId: string | null,
  myRank: { rank: number; score: number } | null,
): string {
  const medals = ["🥇", "🥈", "🥉"];

  const lines: string[] = [
    "",
    "  🏆  Milo Leaderboard  🏆",
    "  ─────────────────────────────",
  ];

  entries.forEach((entry, i) => {
    const medal = medals[i] ?? `${i + 1}.`;
    const name = entry.username ?? "anonymous cat";
    const isMe = entry.user_id === myUserId;
    const tag = isMe ? " ← you" : "";
    const score = `${entry.score} ${coin}`;
    lines.push(`  ${medal}  ${name.padEnd(16)} ${score}${tag}`);
  });

  lines.push("  ─────────────────────────────");

  if (myRank) {
    lines.push(
      `  Your rank: #${myRank.rank}  •  ${myRank.score} purr-coins ${coin}`,
    );
  }

  lines.push("");
  return lines.join("\n");
}
