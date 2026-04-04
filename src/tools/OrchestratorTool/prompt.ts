import { cwd } from "process";

export const DESCRIPTION =
  "Orchestrate complex tasks by breaking them into parallel subtasks and delegating to specialized agents.";

export const PROMPT = `Use this tool when a task is too complex for a single agent — i.e. it requires creating multiple files, systems, or components that can be built independently.

Do not use this tool for simple tasks. Use it only when parallel execution provides a clear benefit.

Current working directory: ${cwd()}

How it works:
1. A planner model breaks the task into subtasks
2. Subtasks run in parallel where possible, sequentially where there are dependencies
3. Each subtask returns a manifest of what it created
4. A connector agent wires everything together

When to use:
- Building a full feature (API + types + tests)
- Scaffolding a project with multiple files
- Any task where subtasks are clearly independent

When NOT to use:
- Single file changes
- Questions or explanations
- Tasks that are inherently sequential`;
