import { AgentTool } from "../tools/AgentTool/tool";
import { BashTool } from "../tools/BashTool/tool";
import { FileEditTool } from "../tools/FileEditTool/tool";
import { FileReadTool } from "../tools/FileReadTool/tool";
import { FileWriteTool } from "../tools/FileWriteTool/tool";
import { GlobTool } from "../tools/GlobTool/tool";
import { GrepTool } from "../tools/GrepTool/tool";
import { MemoryEditTool } from "../tools/MemoryEditTool/tool";
import { MemoryReadTool } from "../tools/MemoryReadTool/tool";
import { MemoryWriteTool } from "../tools/MemoryWriteTool/tool";
import { createOrchestratorTool } from "../tools/OrchestratorTool/tool";
import { createCompactTool } from "../tools/CompactTool/tool";
import { RecallTool } from "../tools/RecallTool/tool";
import { ThinkTool } from "../tools/ThinkTool/tool";
import { WebFetchTool } from "../tools/WebFetchTool/tool";
import { WebSearchTool } from "../tools/WebSearchTool/tool";
import type { OnOrchestratorEvent } from "../types";
import type { Session } from "../utils/session";
import { ReadManyFilesTool } from "../tools/ReadManyFileTool/tool";

export const agentTools = {
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  GrepTool,
  BashTool,
  AgentTool,
  MemoryReadTool,
  MemoryWriteTool,
  MemoryEditTool,
  ThinkTool,
  GlobTool,
  RecallTool,
  WebFetchTool,
  WebSearchTool,
  ReadManyFilesTool,
};

export const orchestratorAgentTools = {
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  BashTool,
  GrepTool,
  GlobTool,
  ThinkTool,
  ReadManyFilesTool,
};

export const connectorTools = {
  FileReadTool,
  GrepTool,
  GlobTool,
  BashTool,
  ThinkTool,
  ReadManyFilesTool,
};

export const subagentTools = {
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  BashTool,
  GrepTool,
  GlobTool,
  ThinkTool,
  ReadManyFilesTool,
};

export const chatTools = {
  RecallTool,
  FileReadTool,
  GrepTool,
  MemoryReadTool,
  WebFetchTool,
  WebSearchTool,
  ReadManyFilesTool,
};

export function withCompact(
  tools: Record<string, unknown>,
  session: Session,
  onCompact: (s: Session) => void,
) {
  return {
    ...tools,
    CompactTool: createCompactTool(session, onCompact),
  };
}

export function createPlanTools(onEvent?: OnOrchestratorEvent) {
  return {
    OrchestratorTool: createOrchestratorTool(onEvent),
  };
}
