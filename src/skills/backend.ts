export const BACKEND_SKILL = `
## Skill: Backend Development

### API Design
- RESTful conventions:
\`\`\`
GET    /users          → list users
GET    /users/:id      → get user
POST   /users          → create user
PUT    /users/:id      → replace user
PATCH  /users/:id      → update user
DELETE /users/:id      → delete user
\`\`\`
- Use proper HTTP status codes:
  - 200 OK, 201 Created, 204 No Content
  - 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable
  - 500 Internal Server Error
- Consistent error shape:
\`\`\`ts
{ error: string; code?: string; details?: unknown }
\`\`\`

### Validation
- Always validate at the boundary (route handler), never trust input:
\`\`\`ts
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150).optional(),
});

app.post('/users', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({ error: 'Validation failed', details: result.error.flatten() });
  }
  // result.data is now typed and safe
});
\`\`\`

### Error Handling
- Never expose stack traces to clients
- Use a global error handler:
\`\`\`ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
\`\`\`
- Wrap async handlers:
\`\`\`ts
const asyncHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);
\`\`\`

### Architecture
- Keep route handlers thin:
\`\`\`ts
// ❌ wrong — logic in handler
app.post('/users', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const user = await db.insert(users).values({ ...req.body, password: hash });
  res.json(user);
});

// ✅ correct — handler delegates to service
app.post('/users', asyncHandler(async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json(user);
}));
\`\`\`
- Secrets via environment variables only — never hardcode
- Use middleware for auth, logging, rate limiting
`;
