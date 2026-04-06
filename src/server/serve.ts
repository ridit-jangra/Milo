import { createServer } from "http";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { MILO_BASE_DIR, PORT_FILE } from "../utils/env";
import { resolvePermission } from "./permissions";
import type { PermissionDecision } from "../permissions";
import {
  createDaemonSession,
  deleteDaemonSession,
  listDaemonSessions,
} from "./sessions";
import { handleChat } from "./chat";

export async function serve({ port = 6969 }: { port?: number } = {}) {
  // ensure ~/.milo exists
  mkdirSync(MILO_BASE_DIR, { recursive: true });

  const server = createServer((req, res) => {
    const url = new URL(req.url!, `http://localhost:${port}`);

    // health check
    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", port }));
      return;
    }

    // graceful shutdown
    if (req.method === "DELETE" && url.pathname === "/shutdown") {
      res.writeHead(200);
      res.end();
      cleanup(port);
      server.close();
      process.exit(0);
    }

    if (
      req.method === "POST" &&
      url.pathname.match(/\/sessions\/.+\/permissions\/.+/)
    ) {
      const [, , sessionId, , permId] = url.pathname.split("/");

      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        const { allow, allowSession } = JSON.parse(body);
        const decision: PermissionDecision = allowSession
          ? "allow_session"
          : allow
            ? "allow"
            : "deny";

        const ok = resolvePermission(permId!, decision);
        res.writeHead(ok ? 200 : 404);
        res.end();
      });
      return;
    }
    if (req.method === "GET" && url.pathname === "/sessions") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(listDaemonSessions()));
      return;
    }

    // POST /sessions
    if (req.method === "POST" && url.pathname === "/sessions") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const { mode } = body ? JSON.parse(body) : {};
        const entry = createDaemonSession(mode ?? "agent");
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: entry.session.id, mode: entry.mode }));
      });
      return;
    }

    // DELETE /sessions/:id
    const deleteMatch = url.pathname.match(/^\/sessions\/([^/]+)$/);
    if (req.method === "DELETE" && deleteMatch) {
      const deleted = deleteDaemonSession(deleteMatch[1]!);
      res.writeHead(deleted ? 200 : 404);
      res.end();
      return;
    }

    const chatMatch = url.pathname.match(/^\/sessions\/([^/]+)\/chat$/);
    if (req.method === "POST" && chatMatch) {
      handleChat(req, res, chatMatch[1]!);
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => {
    // write port to ~/.milo/milo.port
    writeFileSync(PORT_FILE, String(port));
    console.log(`🐱 milo daemon running on port ${port}`);
  });

  // cleanup on exit
  process.on("SIGINT", () => cleanup(port));
  process.on("SIGTERM", () => cleanup(port));
}

function cleanup(port: number) {
  try {
    const current = readFileSync(PORT_FILE, "utf-8").trim();
    if (current === String(port)) {
      // only delete if it's our port
      const { unlinkSync } = require("fs");
      unlinkSync(PORT_FILE);
    }
  } catch {}
}
