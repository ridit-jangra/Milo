import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createRequire } from "module";
import type { StepToolCall, StepToolResult } from "../types";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

export async function mcp() {
  for (const level of ["log", "info", "warn", "error", "debug"] as const) {
    console[level] = (...args: unknown[]) =>
      process.stderr.write(args.join(" ") + "\n");
  }

  const { createAgent } = await import("../agents/agent");
  const { createSession, loadSession } = await import("../utils/session");

  const server = new McpServer({ name: "milo", version });

  let defaultSession = createSession();

  server.registerTool(
    "ask_milo",
    {
      title: "Ask Milo",
      description:
        "Delegate a coding task to Milo, an autonomous coding agent that can read, " +
        "write, and edit files, run shell commands, search the web, and more in the " +
        "current working directory. Provide a clear, self-contained instruction. " +
        "Pass a sessionId to continue a previous conversation; the returned sessionId " +
        "can be reused on the next call. If the client sends a progressToken, Milo " +
        "streams each tool call/result as a progress notification.",
      inputSchema: {
        prompt: z
          .string()
          .describe(
            "The task or question for Milo, e.g. 'Add a /health route to the server'",
          ),
        sessionId: z
          .string()
          .optional()
          .describe(
            "Resume a specific conversation. Omit to use this connection's default session. " +
              "Reuse the sessionId returned by a previous call to keep context.",
          ),
      },
      outputSchema: {
        sessionId: z
          .string()
          .describe(
            "Session id to pass back in to continue this conversation.",
          ),
        text: z.string().describe("Milo's final text response."),
      },
    },
    async ({ prompt, sessionId }, extra) => {
      try {
        const active = sessionId
          ? (loadSession(sessionId) ?? createSession(sessionId))
          : defaultSession;

        const progressToken = extra._meta?.progressToken;
        const wantsLive = progressToken !== undefined;
        let progress = 0;

        const send = (message: string) => {
          if (!wantsLive) return;
          void extra.sendNotification({
            method: "notifications/progress",
            params: { progressToken, progress: ++progress, message },
          });
        };

        const onToolCall = (t: StepToolCall) => send(`→ ${t.toolName}`);
        const onToolResult = (t: StepToolResult) => send(`✓ ${t.toolName}`);

        const onText = wantsLive ? (delta: string) => send(delta) : undefined;

        const { text, session: next } = await createAgent(
          prompt,
          active,
          onToolCall,
          onToolResult,
          extra.signal,
          onText,
        );

        if (!sessionId) defaultSession = next;

        const out = { sessionId: next.id, text: text || "(no output)" };
        return {
          structuredContent: out,
          content: [{ type: "text", text: out.text }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            { type: "text", text: `Milo failed: ${(err as Error).message}` },
          ],
        };
      }
    },
  );

  server.registerTool(
    "reset_milo",
    {
      title: "Reset Milo",
      description:
        "Clear the default session's conversation history and start fresh. " +
        "Does not affect named sessions resumed via sessionId.",
      inputSchema: {},
    },
    async () => {
      defaultSession = createSession();
      return { content: [{ type: "text", text: "Milo session reset." }] };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`milo mcp server v${version} ready (stdio)\n`);
}
