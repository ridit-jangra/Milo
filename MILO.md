# Milo CLI – Project Overview

## 1. Project Overview
Milo is a **terminal‑based AI assistant** built with **Ink** (React for CLIs). It runs as an interactive REPL where you type commands or natural language queries. Milo can:
- Chat with LLMs (OpenAI, Anthropic, Groq, Google, Ollama).
- Run **multi‑agent orchestrations** (sub‑agents, tool calls, permissions).
- Manage a tiny pet‑XP system that levels up the cat.
- Provide built‑in commands (`/help`, `/mode`, `/feed`, `/roast`, etc.).
- Persist session memory and compact it when context grows.

## 2. Tech Stack
- **Language:** TypeScript (strict mode, no `any`).
- **Runtime / Package Manager:** **Bun** (scripts use `bun`).
- **UI:** `ink` (React rendering in the terminal).
- **LLM SDK:** `ai` with providers `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/groq`, `ai-sdk-ollama`.
- **State / Hooks:** Custom React hooks (`useChat`, `useTerminalSize`, `useTextInput`).
- **Utilities:** `lodash-es`, `chalk`, `figures`, `marked`, `diff`.
- **Platform:** Windows (cmd syntax, path separators `\`).

## 3. Package Manager
Bun is the sole manager.
- **Install:** `bun install`
- **Run (dev REPL):** `bun src/index.tsx`
- **Build:** `bun build src/index.tsx --target node --outfile dist/index.mjs ...`
- **Post‑build (make executable):** `node -e "..."`
- **Publish:** `npm run build` (prepublishOnly runs the build).

## 4. Platform Considerations
- Uses Windows‑style paths (`\`).
- Scripts run via `bun` which works on win32; avoid Unix‑only tools.
- No `node`‑specific globals – relies on Bun’s built‑ins (e.g., `Bun.file`).

## 5. Build & Dev Commands
| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Start REPL (dev) | `bun src/index.tsx` |
| Build for production | `bun build src/index.tsx --target node --outfile dist/index.mjs --external ...` |
| Run built CLI | `node dist/index.mjs` (or `./dist/index.mjs` after post‑build chmod) |
| Lint / Type‑check | not defined – rely on TypeScript compiler (`bun run type-check` if added) |
| Test | `bun test` (if test files exist) |

## 6. Project Structure
```
Milo/
├─ .cursor/                # cursor rules (bun‑first policy)
│   └─ rules/use-bun…mdc
├─ src/
│   ├─ index.tsx           # entry – renders <REPL />
│   ├─ screens/REPL.tsx    # main REPL UI
│   ├─ components/        # UI pieces (Message, Header, Spinner, etc.)
│   ├─ hooks/            # custom React hooks (useChat, useTerminalSize…)
│   ├─ utils/            # LLM glue, model selection, session, tools, compaction
│   ├─ commands/         # local slash‑commands
│   └─ types/            # shared TypeScript types (ChatMessage, Mode…)
├─ package.json
├─ tsconfig.json
└─ README / other docs
```
Key folders:
- **components/** – pure UI, each file ≤150 lines, functional, typed props.
- **hooks/** – encapsulate reusable logic, no direct UI.
- **utils/** – LLM orchestration, session persistence, model handling, tool definitions.
- **commands/** – command definitions used by `findCommand`.

## 7. Code Style
- **Functional components** with explicit prop interfaces.
- **Strict TypeScript** (`strict:true`, no `any`).
- **Naming:** PascalCase for components, camelCase for hooks/functions, UPPER_SNAKE for constants.
- **Error handling:** try/catch around async LLM calls; errors displayed as assistant messages.
- **State immutability:** `setState(prev => [...prev, new])` – never mutate arrays directly.
- **Formatting:** likely Prettier (not enforced in repo). Imports are grouped, absolute paths via `src/…` alias (tsconfig `baseUrl` not shown but used).
- **Tool calls:** LLM tool calls are emitted via callbacks (`onToolCall`, `onToolResult`).
- **Permission flow:** `onPermissionRequest`/`resolvePermission` decouple UI from logic.
- **XP system:** `awardXP` updates pet state; level‑up messages are injected.

## 8. Architecture Notes
- **Entry → REPL**: `index.tsx` renders `<REPL />` using Ink.
- **REPL** orchestrates UI layout, reads input, shows static message list, status bar, command suggestions.
- **useChat hook** is the brain: maintains message array, session, loading flag, mode, pending permission/wizard, XP, and handles submission logic.
- **LLM integration**: `runLLM` (utils/llm.ts) builds a session, adds system prompts, calls `generateText` from the `ai` SDK, streams tool calls/results back to UI.
- **Tool ecosystem**: `utils/tools.ts` defines functions exposed to the LLM (e.g., file ops, web fetch, image paste). Tools are scoped per mode (chat, agent, sub‑agent) and wrapped with `withCompact` for context compaction.
- **Orchestration**: `useChat` listens for orchestrator events (plan creation, agent start/done) and updates UI accordingly.
- **Session persistence**: `utils/session.ts` saves/loads session to disk, enabling context continuity across runs.
- **Cursor rule**: enforces Bun usage across the codebase, discouraging npm/yarn/vite.
- **Extensibility**: Adding a new command or tool only requires placing a file in `src/commands` or `src/utils/tools` and exporting the appropriate interface.

---
*All information pulled from the actual source – no placeholders.*
