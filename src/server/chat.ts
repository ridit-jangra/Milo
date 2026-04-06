import type { IncomingMessage, ServerResponse } from "http";
import { createAgent } from "../utils/agent";
import { chatWithModel } from "../utils/chat";
import { getDaemonSession, updateDaemonSession } from "./sessions";
import { requestPermission, resolvePermission } from "./permissions";
import type { Mode } from "../types";

// SSE helper
function sseWrite(res: ServerResponse, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export async function handleChat(
  req: IncomingMessage,
  res: ServerResponse,
  sessionId: string,
) {
  const entry = getDaemonSession(sessionId);
  if (!entry) {
    res.writeHead(404);
    res.end();
    return;
  }

  // parse body
  let body = "";
  await new Promise<void>((resolve) => {
    req.on("data", (c) => (body += c));
    req.on("end", resolve);
  });

  const { prompt } = JSON.parse(body);
  if (!prompt) {
    res.writeHead(400);
    res.end();
    return;
  }

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const { session, mode } = entry;

  try {
    const onToolCall = (t: {
      id: string;
      toolName: string;
      input: unknown;
    }) => {
      sseWrite(res, { type: "tool_call", ...t });
    };

    const onToolResult = (t: {
      id: string;
      toolName: string;
      output: unknown;
    }) => {
      sseWrite(res, { type: "tool_result", ...t });
    };

    const onCompact = (compacted: typeof session) => {
      updateDaemonSession(sessionId, compacted);
      sseWrite(res, { type: "compacted" });
    };

    const result =
      mode === "chat"
        ? await chatWithModel(
            prompt,
            session,
            onToolCall,
            onToolResult,
            onCompact,
          )
        : await createAgent(
            prompt,
            session,
            onToolCall,
            onToolResult,
            onCompact,
          );

    updateDaemonSession(sessionId, result.session);

    sseWrite(res, { type: "done", text: result.text });
  } catch (err) {
    sseWrite(res, { type: "error", message: (err as Error).message });
  } finally {
    res.end();
  }
}
