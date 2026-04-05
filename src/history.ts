import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { join } from "path";
import { homedir } from "os";

const HISTORY_FILE = join(homedir(), ".milo", "history.json");
const MAX_HISTORY = 100;

export async function getHistory(): Promise<string[]> {
  try {
    const raw = await readFile(HISTORY_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addToHistory(input: string): Promise<void> {
  const history = await getHistory();
  if (history[0] === input) return;
  history.unshift(input);
  await mkdir(dirname(HISTORY_FILE), { recursive: true });
  await writeFile(
    HISTORY_FILE,
    JSON.stringify(history.slice(0, MAX_HISTORY), null, 2),
  );
}
