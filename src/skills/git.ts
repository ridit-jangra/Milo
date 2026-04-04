export const GIT_SKILL = `
## Skill: Git

### Commit Conventions
- Use conventional commits:
\`\`\`
feat: add user authentication
fix: resolve login redirect loop
chore: update dependencies
refactor: extract auth middleware
docs: add API documentation
test: add unit tests for UserService
style: format with prettier
\`\`\`
- Imperative mood: "add feature" not "added feature"
- Keep subject under 72 characters
- Reference issues: \`fix: resolve login bug (#123)\`

### Branching
\`\`\`
main          → production
feat/auth     → new features
fix/login     → bug fixes
chore/deps    → maintenance
release/1.2.0 → release prep
\`\`\`

### Best Practices
- Small, focused commits — one logical change per commit
- Never commit: .env files, secrets, node_modules, build artifacts
- Always pull before pushing on shared branches
- Squash WIP commits before merging:
\`\`\`bash
git rebase -i HEAD~3
\`\`\`
- Tag releases with semantic versioning:
\`\`\`bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
\`\`\`

### .gitignore essentials
\`\`\`
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
\`\`\`
`;
