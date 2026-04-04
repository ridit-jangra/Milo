export const CICD_SKILL = `
## Skill: CI/CD

### GitHub Actions Structure
\`\`\`yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
\`\`\`

### Best Practices
- Fail fast — run quick checks first (lint, type-check) before slow ones (tests, build)
- Cache dependencies:
\`\`\`yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: \${{ runner.os }}-node-\${{ hashFiles('**/package-lock.json') }}
\`\`\`
- Use secrets for credentials — never hardcode:
\`\`\`yaml
env:
  DATABASE_URL: \${{ secrets.DATABASE_URL }}
  API_KEY: \${{ secrets.API_KEY }}
\`\`\`
- Deploy to staging before production
- Always have a rollback plan — keep previous build artifacts
- Use semantic versioning for releases with automated changelog

### Deployment Pattern
\`\`\`
PR opened → lint + test
PR merged to main → test + build + deploy to staging
Tag pushed (v*) → deploy to production
\`\`\`
`;
