import type { Human } from "./types";
import { readFile, writeFile, mkdir } from "fs/promises";
import { readFileSync } from "fs";
import { HUMAN_FILE } from "./utils/env";
import { dirname } from "path";

const DEFAULT_HUMAN: Human = {
  name: "default-human",
  gender: "other",
  githubProfile: "default-human",
  defaultTheme: "dark",
};

export function readHumanSync(): Human {
  try {
    const raw = readFileSync(HUMAN_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Human;
    return parsed;
  } catch {
    return { ...DEFAULT_HUMAN };
  }
}

export async function readHuman(): Promise<Human> {
  try {
    const raw = await readFile(HUMAN_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Human;
    return parsed;
  } catch {
    return { ...DEFAULT_HUMAN };
  }
}

export async function writeHuman(human: Human): Promise<void> {
  await mkdir(dirname(HUMAN_FILE), { recursive: true });
  await writeFile(HUMAN_FILE, JSON.stringify(human, null, 2), "utf-8");
}
