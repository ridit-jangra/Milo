import { tool } from "ai";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { DESCRIPTION, PROMPT } from "./prompt.js";

export const FileWriteTool = tool({
  description: DESCRIPTION + "\n\n" + PROMPT,
  inputSchema: z.object({
    path: z.string().describe("The absolute file path to write to"),
    content: z.string().describe("The content to write to the file"),
  }),
  title: "WriteFile",
  execute: async ({ path, content }) => {
    try {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content, "utf-8");
      return { success: true, path };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
});
