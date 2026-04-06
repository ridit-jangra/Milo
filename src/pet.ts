import { readFile, writeFile, mkdir } from "fs/promises";
import { readFileSync } from "fs";
import { dirname } from "path";
import { PET_FILE } from "./utils/env";
import type { Pet } from "./types";

const XP_PER_TOOL: Record<string, number> = {
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

const XP_TO_NEXT_BASE = 100;
const XP_SCALING = 1.4;

function calcXpToNext(level: number): number {
  return Math.floor(XP_TO_NEXT_BASE * Math.pow(XP_SCALING, level - 1));
}

function calcMood(pet: Pet): Pet["mood"] {
  if (pet.hunger >= 80) return "sad";
  if (pet.hunger >= 50) return "sleepy";
  return "happy";
}

function todayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

const DEFAULT_PET: Pet = {
  level: 1,
  xp: 0,
  xpToNext: XP_TO_NEXT_BASE,
  mood: "happy",
  hunger: 0,
  streak: 1,
  lastActive: new Date(),
  totalTasks: 0,
};

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

export function readPetSync(): Pet {
  try {
    const raw = readFileSync(PET_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PET,
      ...parsed,
      lastActive: new Date(parsed.lastActive),
    };
  } catch {
    return { ...DEFAULT_PET };
  }
}

export async function readPet(): Promise<Pet> {
  try {
    const raw = await readFile(PET_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PET,
      ...parsed,
      lastActive: new Date(parsed.lastActive),
    };
  } catch {
    return { ...DEFAULT_PET };
  }
}

export async function writePet(pet: Pet): Promise<void> {
  await mkdir(dirname(PET_FILE), { recursive: true });
  await writeFile(PET_FILE, JSON.stringify(pet, null, 2), "utf-8");
}

export type AwardXPResult = {
  pet: Pet;
  leveledUp: boolean;
  oldLevel: number;
};

export async function awardXP(toolName: string): Promise<AwardXPResult> {
  const pet = await readPet();
  const oldLevel = pet.level;
  const xp = XP_PER_TOOL[toolName] ?? 1;

  const today = todayString();
  const lastActive = pet.lastActive.toISOString().split("T")[0]!;
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0]!;
  const streak =
    lastActive === today
      ? pet.streak
      : lastActive === yesterday
        ? pet.streak + 1
        : 1;

  const hunger = Math.min(100, pet.hunger + 1);

  let newXp = pet.xp + xp;
  let level = pet.level;
  let xpToNext = pet.xpToNext;

  while (newXp >= xpToNext) {
    newXp -= xpToNext;
    level++;
    xpToNext = calcXpToNext(level);
  }

  const updated: Pet = {
    level,
    xp: newXp,
    xpToNext,
    hunger,
    streak,
    lastActive: new Date(),
    totalTasks: pet.totalTasks + 1,
    mood: "happy",
  };

  updated.mood = calcMood(updated);
  await writePet(updated);

  return { pet: updated, leveledUp: level > oldLevel, oldLevel };
}

export async function feedPet(): Promise<Pet> {
  const pet = await readPet();
  const updated: Pet = {
    ...pet,
    hunger: 0,
    mood: "happy",
    lastActive: new Date(),
  };
  await writePet(updated);
  return updated;
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
