import { readFileSync } from "fs";
import { PORT_FILE } from "../utils/env";

export async function kill() {
  let port: string;
  try {
    port = readFileSync(PORT_FILE, "utf-8").trim();
  } catch {
    console.log("no milo daemon running");
    process.exit(0);
  }

  try {
    await fetch(`http://localhost:${port}/shutdown`, { method: "DELETE" });
    console.log("🐱 milo daemon stopped");
  } catch {
    console.log("daemon not responding, might already be dead 💀");
  }
}
