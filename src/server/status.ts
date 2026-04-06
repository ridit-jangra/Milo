import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { PORT_FILE } from "../utils/env";

export async function status() {
  let port: string;
  try {
    port = readFileSync(PORT_FILE, "utf-8").trim();
  } catch {
    console.log("milo is not running");
    process.exit(0);
  }

  try {
    const res = await fetch(`http://localhost:${port}/health`);
    const data = (await res.json()) as unknown as any;
    console.log(`🐱 milo is running on port ${data.port}`);
  } catch {
    console.log(
      `port file says ${port} but daemon not responding — stale port file 💀`,
    );
  }
}
