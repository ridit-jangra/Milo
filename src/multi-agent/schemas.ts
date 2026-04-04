import { z } from "zod";

export const taskSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      subtask: z.string(),
      tools: z.array(z.string()),
      dependsOn: z.array(z.string()), // no .optional(), no .default()
    }),
  ),
});
