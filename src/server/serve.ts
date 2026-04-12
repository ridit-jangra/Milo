import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { MILO_BASE_DIR, PORT_FILE } from "../utils/env";
import { resolvePermission } from "./permissions";
import type { PermissionDecision } from "../permissions";
import {
  createDaemonSession,
  deleteDaemonSession,
  listDaemonSessions,
} from "./sessions";
import { handleChat } from "./chat";

const DEFAULT_PORT = 6969;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  match: RegExpMatchArray,
) => Promise<void>;

const routes: Array<{
  method: string;
  pattern: RegExp;
  handler: Handler;
}> = [
  {
    method: "GET",
    pattern: /^\/health$/,
    handler: async (_req, res) => {
      json(res, 200, { status: "ok" });
    },
  },
  {
    method: "GET",
    pattern: /^\/sessions$/,
    handler: async (_req, res) => {
      json(res, 200, listDaemonSessions());
    },
  },
  {
    method: "POST",
    pattern: /^\/sessions$/,
    handler: async (req, res) => {
      const body = await readBody(req);
      const { mode } = body ? JSON.parse(body) : {};
      const entry = createDaemonSession(mode ?? "agent");
      console.log(`[session] created id=${entry.session.id} mode=${entry.mode}`);
      json(res, 201, { id: entry.session.id, mode: entry.mode });
    },
  },
  {
    method: "DELETE",
    pattern: /^\/sessions\/([^/]+)$/,
    handler: async (_req, res, match) => {
      const deleted = deleteDaemonSession(match[1]!);
      if (deleted) console.log(`[session] deleted id=${match[1]}`);
      res.writeHead(deleted ? 200 : 404);
      res.end();
    },
  },
  {
    method: "POST",
    pattern: /^\/sessions\/([^/]+)\/chat$/,
    handler: async (req, res, match) => {
      handleChat(req, res, match[1]!);
    },
  },
  {
    method: "POST",
    pattern: /^\/sessions\/([^/]+)\/permissions\/([^/]+)$/,
    handler: async (req, res, match) => {
      const body = await readBody(req);
      const { allow, allowSession } = JSON.parse(body);
      const decision: PermissionDecision = allowSession
        ? "allow_session"
        : allow
          ? "allow"
          : "deny";
      const ok = resolvePermission(match[2]!, decision);
      res.writeHead(ok ? 200 : 404);
      res.end();
    },
  },
  {
    method: "DELETE",
    pattern: /^\/shutdown$/,
    handler: async (_req, res) => {
      res.writeHead(200);
      res.end();
      cleanup();
      server.closeAllConnections();
      server.close(() => process.exit(0));
    },
  },
];

let server: ReturnType<typeof createServer>;
let currentPort: number;
let cleanedUp = false;

function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  try {
    const current = readFileSync(PORT_FILE, "utf-8").trim();
    if (current === String(currentPort)) unlinkSync(PORT_FILE);
  } catch {}
}

export async function serve({ port = 6969 }: { port?: number } = {}) {
  currentPort = port;
  mkdirSync(MILO_BASE_DIR, { recursive: true });

  server = createServer(async (req, res) => {
    const pathname = new URL(req.url!, `http://localhost:${port}`).pathname;
    const start = Date.now();

    const originalEnd = res.end.bind(res);
    (res as any).end = (...args: Parameters<typeof res.end>) => {
      const ms = Date.now() - start;
      console.log(`${req.method} ${pathname} → ${res.statusCode} (${ms}ms)`);
      return originalEnd(...args);
    };

    for (const route of routes) {
      if (req.method !== route.method) continue;
      const match = pathname.match(route.pattern);
      if (!match) continue;
      try {
        await route.handler(req, res, match);
      } catch (err) {
        console.error("handler error:", err);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end();
        }
      }
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => {
    writeFileSync(PORT_FILE, String(port));
    console.log(`🐱 milo daemon running on port ${port}`);
  });

  process.on("SIGINT", () => {
    cleanup();
    server.closeAllConnections();
    server.close(() => process.exit(0));
  });

  process.on("SIGTERM", () => {
    cleanup();
    server.closeAllConnections();
    server.close(() => process.exit(0));
  });

  process.on("exit", cleanup);
}
