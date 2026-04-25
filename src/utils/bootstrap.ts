import { existsSync, writeFileSync } from "fs";
import { BOOTSTRAP_FILE, HUMAN_FILE } from "./env";

export function isBootstrap(): boolean {
  return !existsSync(BOOTSTRAP_FILE) || !existsSync(HUMAN_FILE);
}

export function markBootstrapDone() {
  if (existsSync(BOOTSTRAP_FILE)) return;
  try {
    writeFileSync(BOOTSTRAP_FILE, "");
  } catch {
    // fail silently
  }
}
