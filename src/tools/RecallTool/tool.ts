import { tool } from "ai";
import { z } from "zod";
import { DESCRIPTION, PROMPT } from "./prompt";
import { SESSIONS_DIR } from "../../utils/env";
import { grep } from "../../utils/ripgrep";

export const RecallTool = tool({
  title: "Recall",
  description: DESCRIPTION + "\n\n" + PROMPT,
  inputSchema: z.object({
    query: z
      .string()
      .describe("Keywords or phrase to search for in past sessions"),
    max_results: z
      .number()
      .optional()
      .default(5)
      .describe("Max snippets to return"),
    caseInsensitive: z
      .boolean()
      .optional()
      .default(true)
      .describe("Ignore case when searching"),
  }),
  execute: async ({ query, max_results, caseInsensitive }) => {
    const matches = await grep(query, SESSIONS_DIR, {
      caseInsensitive,
      include: "*.json",
    });

    if (matches.length === 0) {
      return { results: [], message: `No matches found for "${query}"` };
    }

    const top = matches.slice(0, max_results);

    return {
      query,
      total_matches: matches.length,
      results: top.map(({ file, line, match }) => ({
        sessionFile: file.split(/[\\/]/).pop(),
        line,
        snippet: match,
      })),
    };
  },
});
