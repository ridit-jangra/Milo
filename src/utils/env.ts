import { join } from "path";
import { homedir } from "os";
import { cwd } from "process";

export const MILO_BASE_DIR =
  process.env.MILO_CONFIG_DIR ?? join(homedir(), ".milo");
export const MEMORY_DIR = join(MILO_BASE_DIR, "memory");
export const GLOBAL_MEMORY_FILE = join(MEMORY_DIR, "MEMORY.md");
export const PROJECT_MEMORY_FILE = join(cwd(), "MILO.md");
export const SESSIONS_DIR = join(MILO_BASE_DIR, "sessions");
export const PET_FILE = join(MILO_BASE_DIR, "pet.json");
