import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { GITHUB_REPOS_FILE, MEMORY_DIR } from "../utils/env";

export async function fetchRepos(githubProfile: string): Promise<void> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${githubProfile}/repos?sort=updated&per_page=20`,
    );
    if (!res.ok) return;
    const repos = (await res.json()) as Array<{
      name: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      html_url: string;
    }>;

    const md = `# GitHub Repositories for @${githubProfile}
sorted by recently updated

${repos.map((r) => `- **${r.name}** ${r.language ? `[${r.language}]` : ""} — ${r.description ?? "no description"} (⭐ ${r.stargazers_count})`).join("\n")}
`;

    mkdirSync(MEMORY_DIR, { recursive: true });
    writeFileSync(join(GITHUB_REPOS_FILE), md, "utf-8");
  } catch {
    // silently fail
  }
}
