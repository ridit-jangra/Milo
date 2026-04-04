import { chatWithModel } from "../../utils/chat";
import { taskSchema } from "../schemas";
import { spawnAgent } from "../agent/agent";
import type { Plan } from "../types";
import { safeParseJSON } from "../../utils/json";

export class Orchestrator {
  private async create_plan(prompt: string) {
    const text =
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

    return plan;
  }

  private async spawnAgents(
    plan: Plan,
    results: Record<string, string>,
    completed: Set<string>,
  ) {
    const runTask = async (taskId: string) => {
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

      const { result } = await spawnAgent(t.subtask);
      results[taskId] = result;
      completed.add(taskId);
    };

    await Promise.all(plan.tasks.map((t) => runTask(t.id)));
  }

  private async complete(plan: Plan, results: Record<string, string>) {
    const manifestSummary = Object.entries(results)
      .map(([id, result]) => `[${id}]: ${result}`)
      .join("\n");

    const connection = await spawnAgent(
      `Manifest:\n${manifestSummary}\n\nWire everything together — fix imports, ensure consistency, resolve integration issues.`,
      "connector",
    );

    return {
      success: true,
      plan: plan.tasks.map((t) => t.id),
      result: results,
      connection,
      summary: `Completed ${plan.tasks.length} subtasks and connected all files.`,
    };
  }

  public async startTask(task: string) {
    try {
      const results: Record<string, string> = {};
      const completed = new Set<string>();

      const plan = await this.create_plan(task);
      await this.spawnAgents(plan, results, completed);
      const output = await this.complete(plan, results);
      return output;
    } catch (err) {
      throw err;
    }
  }
}
