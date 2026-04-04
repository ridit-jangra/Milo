import { tool } from "ai";
import { z } from "zod";
import { readFile, writeFile } from "fs/promises";
import { createPatch } from "diff";
import { DESCRIPTION, PROMPT } from "./prompt.js";

export const FileEditTool = tool({
  description: DESCRIPTION + "\n\n" + PROMPT,
  inputSchema: z.object({
    path: z.string().describe("The absolute file path to edit"),
    old_string: z.string().describe("The exact string to replace"),
    new_string: z.string().describe("The string to replace it with"),
  }),
  title: "EditFile",
  execute: async ({ path, old_string, new_string }) => {
    try {
      const content = await readFile(path, "utf-8");

      const matches = content.split(old_string).length - 1;
      if (matches === 0)
        return { success: false, error: "old_string not found in file" };
      if (matches > 1)
        return {
          success: false,
          error: `old_string matches ${matches} times, must match exactly once`,
        };

      const newContent = content.replace(old_string, new_string);
      const patch = createPatch(path, content, newContent);

      await writeFile(path, newContent, "utf-8");
      return { success: true, path, patch };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
});
