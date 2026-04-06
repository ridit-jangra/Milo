import { chatWithModel } from "../../utils/chat";
import { taskSchema } from "../schemas";
import { spawnAgent } from "../agent/agent";
import type { Plan } from "../types";
import { safeParseJSON } from "../../utils/json";
import type { OnOrchestratorEvent } from "../../types";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "fs";
import { EXECUTION_STATE_FILE, MILO_BASE_DIR } from "../../utils/env";

type ExecutionState = {
  task: string;
  plan: Plan;
  results: Record<string, string>;
  completed: string[];
};

function saveState(state: ExecutionState) {
  mkdirSync(MILO_BASE_DIR, { recursive: true });
  writeFileSync(EXECUTION_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

function loadState(): ExecutionState | null {
  if (!existsSync(EXECUTION_STATE_FILE)) return null;
  try {
    return JSON.parse(
      readFileSync(EXECUTION_STATE_FILE, "utf-8"),
    ) as ExecutionState;
  } catch {
    return null;
  }
}

function clearState() {
  if (existsSync(EXECUTION_STATE_FILE)) unlinkSync(EXECUTION_STATE_FILE);
}

export class Orchestrator {
  constructor(private onEvent?: OnOrchestratorEvent) {}

  private async create_plan(prompt: string) {
    const { text } =
      await chatWithModel(`Break this task into subtasks. Respond with ONLY valid JSON, no markdown, no explanation:
  {
    "tasks": [
      { "id": "1", "subtask": "...", "tools": [], "dependsOn": [] }
    ]
  }
  Rules:
  - dependsOn must be an array (empty if no dependencies)
  - Each subtask must include the full absolute path of the file it creates
  - Keep subtasks small and self-contained
  
  Task: ${prompt}`);

    const clean = text.replace(/```json|```/g, "").trim();
    const plan = taskSchema.parse(safeParseJSON(clean));
    this.onEvent?.({ type: "plan_created", tasks: plan.tasks });
    return plan;
  }

  private async spawnAgents(
    plan: Plan,
    results: Record<string, string>,
    completed: Set<string>,
    task: string,
  ) {
    const runTask = async (taskId: string) => {
      if (completed.has(taskId)) return;

      const t = plan.tasks.find((t) => t.id === taskId)!;

      if (t.dependsOn?.length) {
        await Promise.all(
          t.dependsOn.map(
            (dep) =>
              new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                  if (completed.has(dep)) {
                    clearInterval(interval);
                    resolve();
                  }
                }, 100);
              }),
          ),
        );
      }

      const { result } = await spawnAgent(
        t.subtask,
        "agent",
        this.onEvent,
        taskId,
      );
      results[taskId] = result;
      completed.add(taskId);

      saveState({ task, plan, results, completed: [...completed] });
    };

    await Promise.all(plan.tasks.map((t) => runTask(t.id)));
  }

  private async complete(plan: Plan, results: Record<string, string>) {
    this.onEvent?.({ type: "connecting" });
    const manifestSummary = Object.entries(results)
      .map(([id, result]) => `[${id}]: ${result}`)
      .join("\n");

    const { result } = await spawnAgent(
      `Manifest:\n${manifestSummary}\n\nDo NOT rewrite or recreate any files. The files already exist. Only fix broken imports or missing wiring between already-created files. Make the smallest possible edits using BashTool if needed.`,
      "connector",
    );

    clearState();
    this.onEvent?.({ type: "done" });
    return {
      success: true,
      plan: plan.tasks.map((t) => t.id),
      result: results,
      connection: result,
      summary: `Completed ${plan.tasks.length} subtasks and connected all files.`,
    };
  }

  public async startTask(task: string) {
    try {
      const saved = loadState();
      let plan: Plan;
      let results: Record<string, string>;
      let completed: Set<string>;

      if (saved && saved.task === task) {
        plan = saved.plan;
        results = saved.results;
        completed = new Set(saved.completed);
        this.onEvent?.({ type: "plan_created", tasks: plan.tasks });
      } else {
        results = {};
        completed = new Set<string>();
        plan = await this.create_plan(task);
        saveState({ task, plan, results, completed: [] });
      }

      await this.spawnAgents(plan, results, completed, task);
      const output = await this.complete(plan, results);
      return output;
    } catch (err) {
      throw err;
    }
  }
}
