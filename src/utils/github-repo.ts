import { mkdirSync, writeFileSync, existsSync, statSync } from "fs";
import { GITHUB_REPOS_FILE, MEMORY_DIR } from "../utils/env";

const ONE_DAY = 24 * 60 * 60 * 1000;

export async function fetchRepos(githubProfile: string): Promise<void> {
  try {
    if (
      existsSync(GITHUB_REPOS_FILE) &&
      Date.now() - statSync(GITHUB_REPOS_FILE).mtimeMs < ONE_DAY
    )
      return;

    const res = await fetch(
      `https://api.github.com/users/${githubProfile}/repos?sort=updated&per_page=20`,
    );
    if (!res.ok) return;

    const repos = (await res.json()) as Array<{
      name: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
    }>;

    const md = `# GitHub Repositories for @${githubProfile}\n\n${repos
      .map(
        (r) =>
          `- **${r.name}**${r.language ? ` [${r.language}]` : ""} — ${r.description ?? "no description"} (⭐ ${r.stargazers_count})`,
      )
      .join("\n")}\n`;

    mkdirSync(MEMORY_DIR, { recursive: true });
    writeFileSync(GITHUB_REPOS_FILE, md, "utf-8");
  } catch {
    // fail silently
  }
}
