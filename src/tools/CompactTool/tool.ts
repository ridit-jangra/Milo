import { tool } from "ai";
import { z } from "zod";
import { DESCRIPTION, PROMPT } from "./prompt";
import { compactSession } from "../../utils/compaction.js";
import { saveSession } from "../../utils/session.js";
import type { Session } from "../../utils/session.js";

export function createCompactTool(
  session: Session,
  onCompact: (compacted: Session) => void,
) {
  return tool({
    title: "Compact",
    description: DESCRIPTION + "\n\n" + PROMPT,
    inputSchema: z.object({
      summary: z
        .string()
        .describe(
          "Dense summary of everything important so far — files touched, decisions made, current state, ongoing work",
        ),
    }),
    execute: async ({ summary }) => {
      try {
        const compacted = compactSession(session, summary);
        saveSession(compacted);
        onCompact(compacted);
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });
}
