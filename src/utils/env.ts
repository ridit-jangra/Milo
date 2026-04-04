import { join } from "path";
import { homedir } from "os";
import { cwd } from "process";

export const VEIN_BASE_DIR =
  process.env.VEIN_CONFIG_DIR ?? join(homedir(), ".vein");
export const MEMORY_DIR = join(VEIN_BASE_DIR, "memory");
export const GLOBAL_MEMORY_FILE = join(MEMORY_DIR, "MEMORY.md");
export const PROJECT_MEMORY_FILE = join(cwd(), "VEIN.md");
export const SESSIONS_DIR = join(VEIN_BASE_DIR, "sessions");
