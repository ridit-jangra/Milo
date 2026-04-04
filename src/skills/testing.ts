export const TESTING_SKILL = `
## Skill: Testing

### Unit Tests
- Test behavior, not implementation:
\`\`\`ts
// ❌ wrong — testing implementation
expect(component.state.isLoading).toBe(true);

// ✅ correct — testing behavior
expect(screen.getByRole('progressbar')).toBeInTheDocument();
\`\`\`
- Descriptive test names:
\`\`\`ts
describe('UserService', () => {
  it('should throw 404 when user not found', async () => {});
  it('should hash password before saving', async () => {});
  it('should return user without password field', async () => {});
});
\`\`\`
- Always test error paths:
\`\`\`ts
it('should return error when email already exists', async () => {
  await userService.create({ email: 'test@test.com' });
  await expect(userService.create({ email: 'test@test.com' })).rejects.toThrow('Email already exists');
});
\`\`\`

### Mocking
- Mock external dependencies in unit tests:
\`\`\`ts
jest.mock('../db', () => ({
  users: { findOne: jest.fn() }
}));

it('should return null when user not found', async () => {
  mockDb.users.findOne.mockResolvedValue(null);
  const result = await userService.findById('123');
  expect(result).toBeNull();
});
\`\`\`

### Test Data
- Use factories, not hardcoded values:
\`\`\`ts
const createUser = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date(),
  ...overrides,
});

const user = createUser({ name: 'Alice' });
\`\`\`

### Structure
- Keep tests independent — no shared mutable state
- One logical assertion per test
- Arrange → Act → Assert pattern:
\`\`\`ts
it('should update user name', async () => {
  // Arrange
  const user = await createUser();
  
  // Act
  const updated = await userService.update(user.id, { name: 'New Name' });
  
  // Assert
  expect(updated.name).toBe('New Name');
});
\`\`\`
`;
