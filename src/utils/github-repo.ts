export async function fetchAndSaveRepos(githubProfile: string) {
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
  fetched at setup · sorted by recently updated
  
  ${repos.map((r) => `- **${r.name}** ${r.language ? `[${r.language}]` : ""} — ${r.description ?? "no description"} (⭐ ${r.stargazers_count})`).join("\n")}
  `;

    const { mkdirSync, writeFileSync } = await import("fs");
    const { join, dirname } = await import("path");
    const { MEMORY_DIR } = await import("../utils/env");
    const filePath = join(MEMORY_DIR, "github-repos.md");
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, md, "utf-8");
  } catch {
    // silently fail — not critical
  }
}
