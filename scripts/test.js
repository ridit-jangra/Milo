const BASE = "http://localhost:6969";

function log(tag, msg) {
  const time = new Date().toISOString().slice(11, 23);
  console.log(`[${time}] ${tag.padEnd(12)} ${msg}`);
}

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// Read an SSE stream line by line, calling onEvent for each parsed data line.
// Resolves when the stream closes.
async function readSSE(res, onEvent) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop(); // keep incomplete last line
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          onEvent(JSON.parse(line.slice(6)));
        } catch {
          onEvent(line.slice(6));
        }
      }
    }
  }
}

async function chat(sessionId, prompt, { autoAllow = false } = {}) {
  log("chat →", JSON.stringify(prompt).slice(0, 60));

  const res = await fetch(`${BASE}/sessions/${sessionId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  let result = null;

  await readSSE(res, async (event) => {
    if (typeof event !== "object") return;

    switch (event.type) {
      case "tool_call":
        log("tool_call", `${event.toolName} (${event.id})`);
        break;

      case "tool_result":
        log("tool_result", `${event.toolName} (${event.id})`);
        break;

      case "permission_request":
        log("permission", `tool=${event.tool} permId=${event.id}`);
        if (autoAllow) {
          log("permission", `auto-allowing...`);
          const pr = await fetch(
            `${BASE}/sessions/${sessionId}/permissions/${event.id}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ allow: true, allowSession: false }),
            },
          );
          log("permission", `resolved → ${pr.status}`);
        } else {
          log("permission", `waiting — resolve manually: POST /sessions/${sessionId}/permissions/${event.id}`);
        }
        break;

      case "compacted":
        log("compacted", "context compacted");
        break;

      case "done":
        log("done ←", (event.text ?? "").slice(0, 80));
        result = event.text;
        break;

      case "error":
        log("error", event.message);
        break;

      default:
        log("event", JSON.stringify(event));
    }
  });

  return result;
}

async function run() {
  // ── health ────────────────────────────────────────────────────────────────
  log("health", "checking...");
  const health = await fetch(`${BASE}/health`).then(json);
  log("health", JSON.stringify(health));

  // ── create session ────────────────────────────────────────────────────────
  log("session", "creating...");
  const { id: sessionId, mode } = await fetch(`${BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "agent" }),
  }).then(json);
  log("session", `created id=${sessionId} mode=${mode}`);

  // ── list sessions ─────────────────────────────────────────────────────────
  const sessions = await fetch(`${BASE}/sessions`).then(json);
  log("sessions", `${sessions.length} active`);

  // ── simple chat (no tools) ────────────────────────────────────────────────
  await chat(sessionId, "Say exactly: pong");

  // ── chat that triggers a permission-gated tool ────────────────────────────
  await chat(
    sessionId,
    "Create a file called hello.txt with the content 'hello from milo'",
    { autoAllow: true },
  );

  // ── deny a permission ─────────────────────────────────────────────────────
  log("---", "testing deny...");
  const denyRes = await fetch(`${BASE}/sessions/${sessionId}`, {
    method: "DELETE",
  });
  log("session", `deleted → ${denyRes.status}`);

  // ── fresh session, deny the permission ────────────────────────────────────
  const { id: sessionId2 } = await fetch(`${BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "agent" }),
  }).then(json);
  log("session", `created id=${sessionId2} for deny test`);

  const chatPromise = chat(
    sessionId2,
    "Create a file called denied.txt with the content 'this should be denied'",
    { autoAllow: false },
  );

  // Wait briefly for the permission_request SSE event to arrive, then deny it.
  await new Promise((r) => setTimeout(r, 2000));

  // Find the pending permId from the sessions list isn't possible directly,
  // so this test relies on autoAllow=false logging the permId — in a real
  // client you'd parse it from the SSE stream. Here we just let it time out
  // to show the hang scenario; press Ctrl+C or resolve manually.
  log("deny-test", "send: POST /sessions/:id/permissions/:permId with {allow:false} to resolve");

  await chatPromise;

  // ── cleanup ───────────────────────────────────────────────────────────────
  await fetch(`${BASE}/sessions/${sessionId2}`, { method: "DELETE" });

  log("done", "all tests complete");
}

run().catch((err) => {
  console.error("fatal:", err.message);
  process.exit(1);
});
