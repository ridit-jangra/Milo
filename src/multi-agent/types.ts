export interface Plan {
  tasks: {
    id: string;
    subtask: string;
    tools: string[];
    dependsOn?: string[];
  }[];
}
