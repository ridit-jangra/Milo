import { randomUUID } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import { createAgent } from "../agents/agent";
import { chatWithModel } from "../utils/chat";
import { onPermissionRequest, allowInSession } from "../permissions";
import { getDaemonSession, updateDaemonSession } from "./sessions";
import { requestPermission as serverRequestPermission } from "./permissions";
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

  let removePermissionListener: () => void;

  const permissionHandler = async ({
    resolve,
    toolName,
    input,
  }: {
    resolve: (d: import("../types").PermissionDecision) => void;
    toolName: string;
    input: unknown;
  }) => {
    // Deregister while awaiting so concurrent sessions/requests don't also handle this.
    removePermissionListener();

    const permId = randomUUID();
    console.log(`[permission] request  tool=${toolName} permId=${permId}`);
    sseWrite(res, {
      type: "permission_request",
      id: permId,
      tool: toolName,
      args: input,
    });

    const decision = await serverRequestPermission({
      id: permId,
      toolName,
      input,
    });
    console.log(
      `[permission] resolved tool=${toolName} permId=${permId} decision=${decision}`,
    );
    if (decision === "allow_session") allowInSession(toolName);
    resolve(decision);

    // Re-register so the next tool call in this session can still be handled.
    removePermissionListener = onPermissionRequest(permissionHandler);
  };

  removePermissionListener = onPermissionRequest(permissionHandler);

  console.log(`[chat] start session=${sessionId} mode=${mode}`);

  try {
    const onToolCall = (t: {
      id: string;
      toolName: string;
      input: unknown;
    }) => {
      console.log(`[tool] call  ${t.toolName} (${t.id})`);
      sseWrite(res, { type: "tool_call", ...t });
    };

    const onToolResult = (t: {
      id: string;
      toolName: string;
      output: unknown;
    }) => {
      console.log(`[tool] result ${t.toolName} (${t.id})`);
      sseWrite(res, { type: "tool_result", ...t });
    };

    const onCompact = (compacted: typeof session) => {
      console.log(`[chat] compacted session=${sessionId}`);
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

    console.log(`[chat] done  session=${sessionId}`);
    sseWrite(res, { type: "done", text: result.text });
  } catch (err) {
    console.error(`[chat] error session=${sessionId}:`, (err as Error).message);
    sseWrite(res, { type: "error", message: (err as Error).message });
  } finally {
    removePermissionListener();
    res.end();
  }
}
