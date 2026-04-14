import { join } from "path";
import { homedir } from "os";
import { cwd } from "process";

export const MILO_BASE_DIR =
  process.env.MILO_CONFIG_DIR ?? join(homedir(), ".milo");
export const MEMORY_DIR = join(MILO_BASE_DIR, "memory");
export const PROJECT_MEMORY_FILE = join(cwd(), "MILO.md");
export const SESSIONS_DIR = join(MILO_BASE_DIR, "sessions");
export const PET_FILE = join(MILO_BASE_DIR, "pet.json");
export const HUMAN_FILE = join(MILO_BASE_DIR, "human.json");
export const EXECUTION_STATE_FILE = join(MILO_BASE_DIR, "execution-state.json");
export const PORT_FILE = join(MILO_BASE_DIR, "milo.port");
export const CONFIG_FILE = join(MILO_BASE_DIR, "config.json");
export const BOOTSTRAP_FILE = join(MILO_BASE_DIR, "bootstrap.txt");
export const HUMAN_MEMORY_FILE = join(MEMORY_DIR, "human-memory.md");
export const GITHUB_REPOS_FILE = join(MEMORY_DIR, "github-repos.md");
