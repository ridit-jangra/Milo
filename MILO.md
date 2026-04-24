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
- **LLM SDK:** `ai` with providers `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/groq`, `ai-sdk-ollama`, `@openrouter/ai-sdk-provider`.
- **State / Hooks:** Custom React hooks (`useChat`, `useTerminalSize`, `useTextInput`).
- **Utilities:** `lodash-es`, `chalk`, `figures`, `marked`, `diff`, `cli-truncate`, `glob`, `@vscode/ripgrep`.
- **CLI Framework:** `commander` for CLI argument parsing and subcommands.
- **Platform:** Windows (cmd syntax, path separators `\`).

## 3. Package Manager
Bun is the sole manager.
- **Install:** `bun install`
- **Run (dev REPL):** `bun dev` or `bun src/index.tsx`
- **Build:** `bun build src/index.tsx --target node --outfile dist/index.mjs --external react-devtools-core --external ink --external react --external chalk --external commander --external figures --external ink-spinner`
- **Post‑build (make executable):** `node -e "const fs=require('fs');const f='dist/index.mjs';fs.writeFileSync(f,'#!/usr/bin/env node\\n'+fs.readFileSync(f,'utf8'))"`
- **Publish:** `npm run build` (prepublishOnly runs the build).

## 4. Platform Considerations
- Uses Windows‑style paths (`\`).
- Scripts run via `bun` which works on win32; avoid Unix‑only tools.
- No `node`‑specific globals – relies on Bun’s built‑ins (e.g., `Bun.file`).

## 5. Build & Dev Commands
| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Start REPL (dev) | `bun dev` or `bun src/index.tsx` |
| Start daemon | `bun src/index.tsx serve` |
| Build for production | `bun build src/index.tsx --target node --outfile dist/index.mjs --external react-devtools-core --external ink --external react --external chalk --external commander --external figures --external ink-spinner` |
| Run built CLI | `node dist/index.mjs` (or `./dist/index.mjs` after post‑build chmod) |
| Type‑check | `bunx tsc --noEmit` (relies on TypeScript compiler) |
| Test | `bun test` (if test files exist) |

## 6. Project Structure
```
Milo/
├─ src/
│   ├─ index.tsx           # CLI entry – commander setup with serve/kill/status subcommands
│   ├─ screens/REPL.tsx    # main REPL UI
│   ├─ components/         # UI pieces (Message, Header, Spinner, TextInput, etc.)
│   ├─ hooks/              # custom React hooks (useChat, useTerminalSize, useTextInput)
│   ├─ utils/              # LLM glue, model selection, session, tools, compaction, theme
│   ├─ tools/              # individual tool implementations (FileReadTool, BashTool, AgentTool, etc.)
│   ├─ agents/             # multi‑agent orchestration
│   ├─ skills/             # built‑in skill definitions
│   ├─ server/             # daemon server for background operation (serve, kill, status)
│   ├─ commands/           # local slash‑commands
│   └─ types.ts            # shared TypeScript types (ChatMessage, Mode, Session, etc.)
│   └─ human.ts            # human memory management
│   └─ pet.ts              # XP system and pet state
│   └─ permissions.ts      # permission request/resolve flow
│   └─ history.ts          # command history persistence
│   └─ shortcuts.ts        # keyboard shortcuts
│   └─ icons.ts            # CLI icons and symbols
├─ package.json
├─ tsconfig.json
└─ README / other docs
```
Key folders:
- **components/** – pure UI, each file ≤150 lines, functional, typed props.
- **hooks/** – encapsulate reusable logic, no direct UI.
- **utils/** – LLM orchestration, session persistence, model handling, tool definitions.
- **tools/** – individual tool implementations with consistent interfaces.
- **server/** – daemon server for background operation (HTTP server on port 6969).
- **commands/** – command definitions used by `findCommand`.

## 7. Code Style
- **Functional components** with explicit prop interfaces.
- **Strict TypeScript** (`strict:true`, no `any`). Uses `verbatimModuleSyntax`, `moduleResolution: "bundler"`, `target: "ESNext"`.
- **Naming:** PascalCase for components, camelCase for hooks/functions, UPPER_SNAKE for constants.
- **Error handling:** try/catch around async LLM calls; errors displayed as assistant messages.
- **State immutability:** `setState(prev => [...prev, new])` – never mutate arrays directly.
- **Formatting:** imports are grouped by external vs internal, React first, then third‑party, then local.
- **Tool calls:** LLM tool calls are emitted via callbacks (`onToolCall`, `onToolResult`). Tools are imported from `src/tools/` directory.
- **Permission flow:** `onPermissionRequest`/`resolvePermission` decouple UI from logic via `permissions.ts`.
- **XP system:** `awardXP` updates pet state; level‑up messages are injected via `pet.ts`.
- **Daemon architecture:** CLI uses `commander` with `serve`, `kill`, `status` subcommands for background operation.

## 8. Architecture Notes
- Built with Ink's React renderer for CLI.
- `useChat` hook maintains state: message array, session, mode, permissions, XP.
- `runLLM` (utils/llm.ts) handles SDK integration and streaming across multiple providers.
- Tools are defined in `src/tools/` with consistent interfaces and imported via `utils/tools.ts`.
- Multi‑agent system in `agents/` directory for complex task delegation.
- Skills framework in `skills/` for built‑in capabilities.
- Daemon server in `server/` allows background operation via HTTP (port 6969).
- Sessions persist to disk with context continuity and auto‑compaction.
- Extensible via files in `/commands` or custom tools in `/tools`.
- Human memory and pet XP systems persist across sessions.

---
*All information pulled from the actual source – no placeholders.*
