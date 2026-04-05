# VEIN – Project Overview
**Vein** is a Gen‑Z‑styled CLI AI assistant built with a Turborepo‑style monorepo. It provides an interactive terminal UI (Ink + React) and a suite of built‑in tools (file, git, bash, grep, etc.) that let the agent read/write files, run commands, and even spawn sub‑agents. The core loop is a REPL where the user types `/commands` and the AI responds, can call tools, and maintains session memory.

---

## Tech Stack
- **Language**: TypeScript 5 (strict)
- **Runtime / Package manager**: **Bun** (`bun install`, `bun run`)
- **UI**: React 19 + Ink (TTY rendering)
- **AI SDK**: `@ai-sdk/*` (Anthropic, OpenAI, Groq, Google) + `open-multi-agent`
- **Utilities**: `chalk`, `figures`, `lodash‑es`, `marked`, `jsonwebtoken`, `bcryptjs`
- **Testing**: Bun’s built‑in test runner (`bun test`)
- **Other**: `glob`, `ripgrep`, `shell-quote`

---

## Platform
- Target OS: **Windows (win32)** – uses `dir`/`findstr` in scripts, back‑slashes in paths.
- No native Linux‑only binaries; all Bun APIs work cross‑platform.

---

## Build & Development Commands
```bash
# install deps (Bun auto‑loads .env)
bun install

# run the REPL
bun src/index.tsx        # or: bun run src/index.tsx

# hot‑reload during dev (Bun dev server)
bun --hot src/index.tsx

# run tests
bun test

# lint / type‑check (via scripts if added)
bun lint                # placeholder – add eslint if needed
bun check               # placeholder – add tsc --noEmit if needed
```
*(The repo has no npm scripts; commands are run directly with `bun`.)*

---

## Project Structure
```
src/
│─ components/            # Ink React components (Header, Message, Spinner, etc.)
│─ hooks/                 # Custom React hooks (useChat, useTextInput, etc.)
│─ screens/               # REPL screen component
│─ commands/              # CLI commands (clear, help, mode, init, genz)
│─ multi‑agent/           # Agent orchestration (Orchestrator, sub‑agents)
│─ skills/                # Built‑in knowledge bases (frontend, backend, …)
│─ tools/                 # Tool implementations (FileRead, Bash, Grep, …)
│─ utils/                 # Helpers (env, session, chat, llm, theme, etc.)
│─ icons.ts               # Unicode icons used in UI
│─ types.ts               # Shared TypeScript types
│─ index.tsx              # Entry point (Ink render)
│─ commands.ts            # Command registry & parser
```
Additional roots: `.cursor/rules/` (editor‑level lint rules) and `.gitignore`, `bun.lock`, `tsconfig.json`.

---

## Code Style
| Aspect | Convention |
|--------|-------------|
| **Imports** | Absolute/relative paths, grouped, no wildcard except `* as` when needed |
| **Formatting** | `prettier`‑compatible (2‑space indent, trailing commas, single quotes) |
| **TS Config** | `strict`, `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `noImplicitOverride` |
| **Naming** | `PascalCase` for components, `camelCase` for functions/variables, `UPPER_SNAKE` for constants |
| **Error handling** | Central `global error handler` in Express server (if used) and consistent `{ error, code?, details? }` shape; tool wrappers catch & re‑throw with context |
| **State** | React state via hooks, session memory stored in `~/.vein/memory` |
| **No `any`** – use `unknown` + type guards |

---

## Architecture Notes
* **Tool‑first design** – every side‑effect is a tool (FileRead, Bash, Grep, etc.). The AI decides which tool to invoke, keeping business logic pure.
* **PersistentShell** – a single Bash process lives for the CLI session, enabling stateful command execution.
* **Session memory** – per‑run JSON saved under `sessions/`, loaded into the AI context each turn. Global memory (`MEMORY.md`) stores long‑term preferences.
* **Sub‑agent delegation** – complex tasks trigger `AgentTool`, which spawns a focused sub‑agent with full tool access.
* **Multi‑agent orchestration** – `Orchestrator` coordinates multiple agents for large workloads (e.g., scaffolding a new feature).
* **Frontend via Bun.serve** – static HTML imports React components directly; no Vite/Webpack. The rule file `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc` enforces this.
* **Express fallback** – present in `package.json` but discouraged by Cursor rules; primary server is `Bun.serve`.

---

*we move 🫡*