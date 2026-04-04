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
import { OrchestratorTool } from "../tools/OrchestratorTool/tool";
import { RecallTool } from "../tools/RecallTool/tool";
import { ThinkTool } from "../tools/ThinkTool/tool";
import { WebFetchTool } from "../tools/WebFetchTool/tool";
import { WebSearchTool } from "../tools/WebSearchTool/tool";

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
};

export const chatTools = {
  RecallTool,
  FileReadTool,
  GrepTool,
  MemoryReadTool,
  WebFetchTool,
  WebSearchTool,
};

export const planTools = { OrchestratorTool };
