import { readFile } from "fs/promises";
import { tool } from "ai";
import { z } from "zod";
import { resolve } from "path";
import { PROMPT, DESCRIPTION } from "./prompt.js";
import { addLineNumbers, findSimilarFile } from "../../utils/file";

const MAX_LINES_TO_READ = 2000;

const FileEntry = z.object({
  path: z.string().describe("Absolute path to the file"),
  line_start: z
    .number()
    .optional()
    .describe("Line to start reading from (1-indexed)"),
  line_end: z
    .number()
    .optional()
    .describe("Line to stop reading at (inclusive)"),
});

export const ReadManyFilesTool = tool({
  description: DESCRIPTION + "\n\n" + PROMPT,
  title: "ReadManyFiles",
  inputSchema: z.object({
    files: z.array(FileEntry).min(1).max(20).describe("List of files to read"),
  }),
  execute: async ({ files }) => {
    const results = await Promise.all(
      files.map(async ({ path, line_start, line_end }) => {
        try {
          const absolutePath = resolve(path);
          let lines = (await readFile(absolutePath, "utf-8")).split("\n");
          const totalLines = lines.length;

          const start = line_start ? line_start - 1 : 0;
          const end = line_end ?? Math.min(lines.length, MAX_LINES_TO_READ);

          lines = lines.slice(start, end);
          const content = addLineNumbers(lines.join("\n"), start + 1);
          return { path, success: true, content, totalLines };
        } catch (err) {
          const similar = findSimilarFile(path);
          return {
            path,
            success: false,
            error: String(err),
            suggestion: similar ? `Did you mean: ${similar}?` : undefined,
          };
        }
      }),
    );

    return { results };
  },
});
