import { readFile } from "fs/promises";
import { tool } from "ai";
import { z } from "zod";
import { resolve } from "path";
import { PROMPT, DESCRIPTION } from "./prompt.js";
import { addLineNumbers, findSimilarFile } from "../../utils/file";

export const FileReadTool = tool({
  description: DESCRIPTION + "\n\n" + PROMPT,
  title: "ReadFile",
  inputSchema: z.object({
    path: z.string().describe("The file path to read"),
    offset: z.number().optional().describe("Line offset to start reading from"),
    limit: z.number().optional().describe("Max number of lines to read"),
  }),
  execute: async ({ path, offset, limit }) => {
    try {
      const absolutePath = resolve(path);
      let lines = (await readFile(absolutePath, "utf-8")).split("\n");
      const totalLines = lines.length;
      if (offset) lines = lines.slice(offset);
      if (limit) lines = lines.slice(0, limit);
      const content = addLineNumbers(lines.join("\n"), offset ? offset + 1 : 1);
      return { success: true, content, totalLines };
    } catch (err) {
      const similar = findSimilarFile(path);
      return {
        success: false,
        error: String(err),
        suggestion: similar ? `Did you mean: ${similar}?` : undefined,
      };
    }
  },
});
