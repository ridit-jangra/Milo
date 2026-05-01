// WRITTEN BY CLAUDE

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf8"),
);

const bump = process.argv[2] ?? "patch"; // patch | minor | major
if (
  !["patch", "minor", "major"].test?.(bump) &&
  !["patch", "minor", "major"].includes(bump)
) {
  console.error(`❌ Invalid bump type: "${bump}". Use patch, minor, or major.`);
  process.exit(1);
}

function run(cmd) {
  console.log(`→ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function hasUnstagedChanges() {
  try {
    execSync("git diff --quiet && git diff --cached --quiet");
    return false;
  } catch {
    return true;
  }
}

console.log(`\n🐱 milo release — current version: v${pkg.version}\n`);

// 1. Stage everything if there are changes
if (hasUnstagedChanges()) {
  run("git add .");
  run(`git commit -m "chore: pre-release"`);
}

// 2. Bump version + create tag commit
run(`npm version ${bump} -m "chore: release v%s"`);

// 3. Read the new version
const newPkg = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf8"),
);
console.log(`\n✅ Bumped to v${newPkg.version}\n`);

// 4. Push commits + tags → triggers GitHub Actions
run("git push --follow-tags");

console.log(
  `\n🚀 Released v${newPkg.version} — GitHub Actions will publish to npm.\n`,
);
