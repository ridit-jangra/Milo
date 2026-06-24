import { EventEmitter } from "events";

const KEY = "__milo_agent_stream__";

type ProcessWithStream = NodeJS.Process & Record<string, unknown>;

const proc = process as ProcessWithStream;

if (!proc[KEY]) {
  proc[KEY] = new EventEmitter();
  (proc[KEY] as EventEmitter).setMaxListeners(0);
}

export const agentStream: EventEmitter = proc[KEY] as EventEmitter;

export type AgentStartEvent = { id: string; task: string; prompt: string };
export type AgentActivityEvent = { id: string; activity: string };
export type AgentToolCallEvent = {
  id: string;
  call: { id: string; toolName: string; input: unknown };
};
export type AgentToolResultEvent = {
  id: string;
  result: { id: string; toolName: string; input?: unknown; output: unknown };
};
export type AgentDoneEvent = { id: string; success: boolean; text: string };
