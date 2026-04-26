import { readFile, writeFile, mkdir } from "fs/promises";
import { readFileSync } from "fs";
import { dirname } from "path";
import { EDGE_BASE, PET_FILE } from "./utils/env";
import type { Pet } from "./types";
import { getAccessToken, isLoggedIn } from "./auth";
import { checkAchievements } from "./achievements";

export const XP_PER_TOOL: Record<string, number> = {
  ThinkTool: 2,
  GrepTool: 5,
  GlobTool: 5,
  FileReadTool: 5,
  FileWriteTool: 15,
  FileEditTool: 15,
  BashTool: 10,
  AgentTool: 25,
  OrchestratorTool: 50,
  WebSearchTool: 5,
  WebFetchTool: 5,
  RecallTool: 3,
  MemoryReadTool: 2,
  MemoryWriteTool: 5,
  MemoryEditTool: 5,
};

type LocalPet = {
  hunger: number;
  mood: Pet["mood"];
};

const DEFAULT_LOCAL: LocalPet = {
  hunger: 0,
  mood: "happy",
};

const DEFAULT_PET: Pet = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  mood: "happy",
  hunger: 0,
  streak: 1,
  lastActive: new Date(),
  totalTasks: 0,
};

async function readLocalPet(): Promise<LocalPet> {
  try {
    const raw = await readFile(PET_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      hunger: parsed.hunger ?? 0,
      mood: parsed.mood ?? "happy",
    };
  } catch {
    return { ...DEFAULT_LOCAL };
  }
}

function readLocalPetSync(): LocalPet {
  try {
    const raw = readFileSync(PET_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      hunger: parsed.hunger ?? 0,
      mood: parsed.mood ?? "happy",
    };
  } catch {
    return { ...DEFAULT_LOCAL };
  }
}

async function writeLocalPet(local: LocalPet): Promise<void> {
  await mkdir(dirname(PET_FILE), { recursive: true });
  await writeFile(PET_FILE, JSON.stringify(local, null, 2), "utf-8");
}

function calcMood(hunger: number): Pet["mood"] {
  if (hunger >= 80) return "sad";
  if (hunger >= 50) return "sleepy";
  return "happy";
}

type DbStats = {
  level: number;
  xp: number;
  xp_to_next: number;
  streak: number;
  total_tasks: number;
  leveled_up: boolean;
  old_level: number;
  coins_earned: number;
};

async function callAwardXp(toolName: string): Promise<DbStats | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const xpAmount = XP_PER_TOOL[toolName] ?? 1;

  try {
    const res = await fetch(`${EDGE_BASE}/award-xp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ toolName, xpAmount }),
    });

    if (!res.ok) return null;
    return (await res.json()) as DbStats;
  } catch {
    return null;
  }
}

export const LEVEL_FLAVOR: Record<number, string> = {
  1: "still a kitten 🐱",
  2: "finding your paws 🐾",
  3: "curious cat energy 👀",
  5: "mid-tier cat energy 😼",
  7: "getting dangerous 😈",
  10: "absolute unit 😤",
  15: "senior dev cat 🧠",
  20: "legendary. feared by dogs 👑",
  30: "transcended. one with the terminal 👻",
};

export function getLevelFlavor(level: number): string {
  const keys = Object.keys(LEVEL_FLAVOR)
    .map(Number)
    .sort((a, b) => b - a);
  for (const key of keys) {
    if (level >= key) return LEVEL_FLAVOR[key]!;
  }
  return LEVEL_FLAVOR[1]!;
}

export const LEVEL_UP_MESSAGES: Record<number, string> = {
  3: "purrrr... /roast unlocked 😼",
  5: "getting powerful... /vibe unlocked 😈",
  10: "absolute unit achieved... /crimes unlocked 😤",
};

export const UNLOCKED_AT: Record<string, number> = {
  roast: 3,
  vibe: 5,
  crimes: 10,
};

export function isCommandUnlocked(commandName: string, level: number): boolean {
  const required = UNLOCKED_AT[commandName];
  if (required === undefined) return true;
  return level >= required;
}

export async function readPet(): Promise<Pet> {
  const local = await readLocalPet();

  if (!(await isLoggedIn())) {
    return { ...DEFAULT_PET, hunger: local.hunger, mood: local.mood };
  }

  const token = await getAccessToken();
  if (!token) return { ...DEFAULT_PET, hunger: local.hunger, mood: local.mood };

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      "https://cowlzmdeufmdkksovsis.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd2x6bWRldWZtZGtrc292c2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzkwMjIsImV4cCI6MjA5Mjc1NTAyMn0.saByYOe0VpjwQ9sOXtFU0KcNrTalcLpRW9rFKu6SOLA",
    );

    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user)
      return { ...DEFAULT_PET, hunger: local.hunger, mood: local.mood };

    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data)
      return { ...DEFAULT_PET, hunger: local.hunger, mood: local.mood };

    return {
      level: data.level,
      xp: data.xp,
      xpToNext: data.xp_to_next,
      streak: data.streak,
      totalTasks: data.total_tasks,
      lastActive: new Date(data.last_active),
      hunger: local.hunger,
      mood: local.mood,
    };
  } catch {
    return { ...DEFAULT_PET, hunger: local.hunger, mood: local.mood };
  }
}

export function readPetSync(): Pet {
  const local = readLocalPetSync();

  return { ...DEFAULT_PET, hunger: local.hunger, mood: local.mood };
}

export async function writePet(pet: Pet): Promise<void> {
  await writeLocalPet({ hunger: pet.hunger, mood: pet.mood });
}

export type AwardXPResult = {
  pet: Pet;
  leveledUp: boolean;
  oldLevel: number;
  coinsEarned: number;
  newAchievements: string[];
};

export async function awardXP(toolName: string): Promise<AwardXPResult> {
  const local = await readLocalPet();
  const hunger = Math.min(100, local.hunger + 1);
  const mood = calcMood(hunger);

  await writeLocalPet({ hunger, mood });

  if (!(await isLoggedIn())) {
    return {
      pet: { ...DEFAULT_PET, hunger, mood },
      leveledUp: false,
      oldLevel: 1,
      coinsEarned: 0,
      newAchievements: [],
    };
  }

  const stats = await callAwardXp(toolName);

  if (!stats) {
    return {
      pet: { ...DEFAULT_PET, hunger, mood },
      leveledUp: false,
      oldLevel: 1,
      coinsEarned: 0,
      newAchievements: [],
    };
  }

  const pet: Pet = {
    level: stats.level,
    xp: stats.xp,
    xpToNext: stats.xp_to_next,
    streak: stats.streak,
    totalTasks: stats.total_tasks,
    lastActive: new Date(),
    hunger,
    mood,
  };

  const newAchievements = await checkAchievements({
    totalTasks: stats.total_tasks,
    streak: stats.streak,
    level: stats.level,
    isFirstRun: stats.total_tasks === 1,
  });

  return {
    pet,
    leveledUp: stats.leveled_up,
    oldLevel: stats.old_level,
    coinsEarned: stats.coins_earned,
    newAchievements,
  };
}

export async function feedPet(): Promise<Pet> {
  const updated: LocalPet = { hunger: 0, mood: "happy" };
  await writeLocalPet(updated);

  const pet = await readPet();
  return { ...pet, hunger: 0, mood: "happy" };
}

export function getMoodEmoji(mood: Pet["mood"]): string {
  switch (mood) {
    case "happy":
      return "😺";
    case "sleepy":
      return "😴";
    case "sad":
      return "😿";
  }
}

export function renderXpBar(xp: number, xpToNext: number, width = 20): string {
  const filled = Math.floor((xp / xpToNext) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export function getSpinnerPool(level: number): string[] {
  const base = [
    "Sniffing… 🐱",
    "Pawing… 🐾",
    "Purring… 😌",
    "Staring… 👁️",
    "Vibing… 🎵",
    "We move 🫡",
    "Cooking… 🍳",
    "Napping… 💤",
    "Meow meow 🐱",
    "Understood 📋",
  ];

  const mid = [
    ...base,
    "Feral rn 🐈",
    "Cat brain 🧠",
    "No cap 🧢",
    "Fr fr 😭",
    "Slay mode 💅",
    "Pouncing… 🏹",
    "Zooming… 💨",
    "Plotting… 😼",
  ];

  const feral = [
    ...mid,
    "Judging… 😾",
    "Hairball incoming 💀",
    "Touch grass? 🌿",
    "Midnight mode 🌙",
    "Ate diff 🍽️",
    "Knocking over 🫡",
    "Absolutely unhinged 😈",
    "Sending it 🚀",
    "No thoughts 🫥",
    "Grooming… 🧹",
    "Box sitting 📦",
    "Tail twitching 👀",
    "Ears perked 📡",
    "Claw sharpening ⚡",
    "Paw paw 🐾",
  ];

  if (level >= 6) return feral;
  if (level >= 3) return mid;
  return base;
}

export type PetStage = "kitten" | "teen" | "adult" | "legendary";

export function getPetStage(level: number): PetStage {
  if (level >= 15) return "legendary";
  if (level >= 10) return "adult";
  if (level >= 5) return "teen";
  return "kitten";
}

export function getStageColor(level: number): string {
  const stage = getPetStage(level);
  switch (stage) {
    case "kitten":
      return "#ff9999";
    case "teen":
      return "#ff6b6b";
    case "adult":
      return "#ff4444";
    case "legendary":
      return "#ffd700";
  }
}
