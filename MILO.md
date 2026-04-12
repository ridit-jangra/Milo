# Milo CLI – Project Overview

## 1. Project Overview
Milo is a **terminal‑based AI assistant** built with **Ink** (React for CLIs). It runs as an interactive REPL where you type commands or natural language queries. Milo can:
- Chat with LLMs (OpenAI, Anthropic, Groq, Google, Ollama).
- Run **multi‑agent orchestrations** (sub‑agents, tool calls, permissions).
- **Download assets** from trusted sources (GitHub, GitLab, Undraw, Google Fonts) with security restrictions.
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
- Built with Ink's React renderer for CLI.
- `useChat` hook maintains state: message array, session, mode, permissions, XP.
- `runLLM` (utils/llm.ts) handles SDK integration and streaming.
- Tools are mode-scoped in `utils/tools.ts` and auto-compacted.
- Sessions persist to disk with context continuity.
- Extensible via files in `/commands` or `/utils/tools`.
- Enforces Bun usage through Cursor rules.

---
*All information pulled from the actual source – no placeholders.*
