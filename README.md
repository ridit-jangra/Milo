# Milo

A tiny cat that lives in your terminal.

You talk to it. It writes code, reads files, runs commands, searches the web, and remembers things across sessions. It also gains XP, levels up, and gets sad if you don't feed it.

---

## Install

```bash
npm install -g @ridit/milo
```

Or with bun:

```bash
bun add -g @ridit/milo
```

Then run:

```bash
milo
```

On first launch, run `/provider add` to configure your AI provider.

---

## What it does

Milo runs as an interactive CLI with three modes:

**Agent** — full access. reads files, writes code, runs commands, fixes bugs. this is the default.

**Chat** — read-only. answers questions, explains code, searches the web. no changes to your files.

**Plan** — spawns multiple parallel agents to tackle large tasks. good for "build me an auth system" type prompts.

Switch modes with `ctrl+t` or `/mode agent | chat | plan`.

---

## Commands

| Command     | What it does                                                    |
| ----------- | --------------------------------------------------------------- |
| `/help`     | list all commands                                               |
| `/mode`     | switch between agent, chat, plan                                |
| `/init`     | generate a `MILO.md` for your project                           |
| `/provider` | manage AI providers                                             |
| `/pet`      | check milo's stats                                              |
| `/feed`     | feed milo 🍖                                                    |
| `/roast`    | milo roasts your codebase. brutally. _(unlocks at level 3)_     |
| `/vibe`     | vibe check on your project _(unlocks at level 5)_               |
| `/crimes`   | milo files a rap sheet on your codebase _(unlocks at level 10)_ |
| `/clear`    | clear the conversation                                          |
| `/genz`     | you don't want to know                                          |

---

## Providers

Milo supports multiple AI providers:

- **Groq** — fast inference
- **OpenAI** — gpt-4o and friends
- **Anthropic** — claude
- **Ollama** — local models, no API key needed

Add a provider:

```
/provider add
```

Switch mid-session:

```
/provider use <name>
```

Remove a provider:

```
/provider remove
```

Provider configs and API keys are stored at `~/.milo/providers.json`.

---

## The cat

Milo has a pet system. every tool call earns XP. level up to unlock commands and make milo progressively more unhinged.

- level 3 — `/roast` unlocked
- level 5 — `/vibe` unlocked
- level 10 — `/crimes` unlocked
- level 6+ — full feral mode

**4 evolution stages** — milo's ASCII art, colors, and personality change as you level up:

| stage     | levels | vibe                    |
| --------- | ------ | ----------------------- |
| kitten    | 1–4    | just getting started 🐱 |
| teen      | 5–9    | getting dangerous 😼    |
| adult     | 10–14  | absolute unit 😤        |
| legendary | 15+    | feared by dogs 👑       |

milo gets hungry over time. run `/feed` or it gets sad.

---

## Memory

Milo remembers things across sessions. global preferences live at `~/.milo/memory/MEMORY.md`. project-specific context lives in `MILO.md` at your project root — run `/init` to generate it.

---

## Built with

- [Vercel AI SDK](https://sdk.vercel.ai) — model routing and tool calling
- [Ink](https://github.com/vadimdemedes/ink) — React for CLIs

---

## Daemon mode

Milo can run as a background HTTP daemon — useful for Meridia, Echo, or any tool that wants to talk to Milo programmatically.

```bash
milo serve        # start daemon on port 6969
milo status       # check if running
milo kill         # stop daemon
```

Sessions and chat are available over HTTP:

```
POST   /sessions                         create a session
GET    /sessions                         list sessions
DELETE /sessions/:id                     delete a session
POST   /sessions/:id/chat                send a message (SSE stream)
POST   /sessions/:id/permissions/:permId resolve a permission request
```

---

## License

MIT
