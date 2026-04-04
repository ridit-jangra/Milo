export const DOCKER_SKILL = `
## Skill: Docker

### Dockerfile Best Practices
- Multi-stage builds to keep images small:
\`\`\`dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER app
EXPOSE 3000
CMD ["node", "dist/index.js"]
\`\`\`
- Never use \`latest\` tag — pin versions: \`node:20.11-alpine\`
- Never run as root — always create and use a non-root user
- Use .dockerignore:
\`\`\`
node_modules
.env
.git
dist
*.log
\`\`\`

### Docker Compose
\`\`\`yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
\`\`\`

### Rules
- One process per container
- Use COPY over ADD unless extracting tarballs
- Set WORKDIR explicitly — never rely on default
- Use ARG for build-time, ENV for runtime variables
- Health checks on all services
`;
