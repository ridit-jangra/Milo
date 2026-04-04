import { createAgent } from "../../utils/agent";

export async function spawnAgent(subtask: string, mode = "agent") {
  const result = await createAgent(subtask, mode);
  return { subtask, result };
}
