export const FRONTEND_SKILL = `
## Skill: Frontend Development

### Component Architecture
- Use functional components with TypeScript — never class components
- Always type props with explicit interfaces:
\`\`\`tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const Button = ({ label, onClick, disabled = false, variant = 'primary' }: ButtonProps) => {
  return <button onClick={onClick} disabled={disabled} className={variant}>{label}</button>;
};
\`\`\`
- Use named exports for components, default exports for pages/routes
- Keep components under 150 lines — split if larger
- One component per file

### Hooks
- Extract reusable logic into custom hooks prefixed with \`use\`:
\`\`\`ts
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
\`\`\`
- Never put business logic directly in components — use hooks
- Keep useEffect dependencies complete — never suppress exhaustive-deps

### State Management
- Local state: useState / useReducer
- Server state: React Query / SWR
- Global state: Zustand or Context (avoid Redux unless needed)
- Never mutate state directly:
\`\`\`ts
// ❌ wrong
state.items.push(newItem);

// ✅ correct
setItems(prev => [...prev, newItem]);
\`\`\`

### Performance
- Memoize expensive computations with useMemo
- Memoize callbacks passed to children with useCallback
- Wrap pure components with React.memo
- Lazy load heavy components:
\`\`\`ts
const HeavyChart = React.lazy(() => import('./HeavyChart'));
\`\`\`

### TypeScript
- No \`any\` — use \`unknown\` and narrow down
- Use discriminated unions for complex state:
\`\`\`ts
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: string };
\`\`\`
`;
