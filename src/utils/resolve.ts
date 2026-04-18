import { agentTools } from "./tools";

export const resolveTools = (tools: string[]) =>
  Object.fromEntries(
    tools.map((t) => [t, agentTools[t as keyof typeof agentTools]]),
  );
