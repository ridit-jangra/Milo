import { tool } from "ai";
import { z } from "zod";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { MEMORY_DIR } from "../../utils/env";
import { DESCRIPTION, PROMPT } from "./prompt";

export const MemoryWriteTool = tool({
  title: "MemoryWrite",
  description: DESCRIPTION + "\n\n" + PROMPT,
  inputSchema: z.object({
    file_path: z
      .string()
      .describe("Relative path inside memory dir e.g. MEMORY.md"),
    content: z.string().describe("Full content to write to the memory file"),
  }),
  execute: async ({ file_path, content }) => {
    try {
      const fullPath = join(MEMORY_DIR, file_path);
      if (!fullPath.startsWith(MEMORY_DIR)) {
        return { success: false, error: "Invalid memory file path" };
      }
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, content, "utf-8");
      return { success: true, message: "Memory saved" };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
});
