import { getAllAchievements, getUnlockedAchievements } from "../achievements";

export async function renderAchievements(): Promise<string> {
  const [all, unlocked] = await Promise.all([
    getAllAchievements(),
    getUnlockedAchievements(),
  ]);

  const unlockedIds = new Set(unlocked.map((u) => u.achievement_id));

  const lines: string[] = [
    "",
    "  🐾  Milo Achievements  🐾",
    "  ─────────────────────────────────────────",
  ];

  for (const a of all) {
    const done = unlockedIds.has(a.id);
    const icon = done ? "✅" : "🔒";
    const reward = `+${a.reward} 🪙`;
    lines.push(`  ${icon}  ${a.title.padEnd(22)} ${reward}`);
    lines.push(`       ${a.description}`);
    lines.push("");
  }

  const count = unlockedIds.size;
  const total = all.length;
  lines.push(`  ─────────────────────────────────────────`);
  lines.push(
    `  Unlocked: ${count}/${total}  ${count === total ? "🎉 all done bestie!" : ""}`,
  );
  lines.push("");

  return lines.join("\n");
}
