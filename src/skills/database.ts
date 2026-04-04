export const DATABASE_SKILL = `
## Skill: Database

### Queries
- Always use parameterized queries — never concatenate SQL:
\`\`\`ts
// ❌ wrong
db.query(\`SELECT * FROM users WHERE id = \${userId}\`);

// ✅ correct
db.query('SELECT * FROM users WHERE id = $1', [userId]);

// ✅ with ORM (Drizzle)
db.select().from(users).where(eq(users.id, userId));
\`\`\`
- Never SELECT * in production — specify columns:
\`\`\`ts
db.select({ id: users.id, name: users.name, email: users.email }).from(users);
\`\`\`

### Schema Design
- Always have a primary key
- Use \`created_at\` and \`updated_at\` timestamps on every table
- Soft delete with \`deleted_at\` when data matters:
\`\`\`ts
const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
\`\`\`
- Index foreign keys and search columns:
\`\`\`sql
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_users_email ON users(email);
\`\`\`

### Transactions
- Use transactions for atomic operations:
\`\`\`ts
await db.transaction(async (tx) => {
  const [order] = await tx.insert(orders).values(orderData).returning();
  await tx.insert(orderItems).values(items.map(i => ({ ...i, orderId: order.id })));
  await tx.update(inventory).set({ stock: sql\`stock - 1\` }).where(eq(inventory.id, item.id));
});
\`\`\`

### Migrations
- Never alter production schema directly — always use migrations
- Make migrations reversible (up + down)
- Test migrations on staging before production
`;
