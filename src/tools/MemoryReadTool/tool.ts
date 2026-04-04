import { tool } from "ai";
import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { MEMORY_DIR } from "../../utils/env";
import { DESCRIPTION, PROMPT } from "./prompt";

const memoryCache = new Map<string, string>();

export const MemoryReadTool = tool({
  title: "MemoryRead",
  description: DESCRIPTION + "\n\n" + PROMPT,
  inputSchema: z.object({
    file_path: z
      .string()
      .describe("Relative path inside memory dir e.g. MEMORY.md"),
  }),
  execute: async ({ file_path }) => {
    try {
      if (memoryCache.has(file_path)) {
        return {
          success: true,
          content: memoryCache.get(file_path)!,
          cached: true,
        };
      }

      const fullPath = join(MEMORY_DIR, file_path);
      if (!fullPath.startsWith(MEMORY_DIR)) {
        return { success: false, error: "Invalid memory file path" };
      }
      if (!existsSync(fullPath)) {
        return {
          success: true,
          content: "",
          message: "Memory file does not exist yet",
        };
      }
      const content = readFileSync(fullPath, "utf-8");

      memoryCache.set(file_path, content);
      return { success: true, content };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
});
