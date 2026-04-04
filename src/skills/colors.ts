export const COLORS_SKILL = `
## Skill: Colors & Dark Mode

### Color System
- Use HSL for manipulation — easier to reason about:
\`\`\`css
--color-primary: hsl(220, 90%, 56%);
--color-primary-light: hsl(220, 90%, 70%);
--color-primary-dark: hsl(220, 90%, 40%);
\`\`\`
- Semantic naming — never name by value:
\`\`\`css
/* ❌ wrong */
--color-blue: #3b82f6;
--color-red: #ef4444;

/* ✅ correct */
--color-primary: #3b82f6;
--color-error: #ef4444;
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-info: #06b6d4;
\`\`\`

### Palette Structure
- 1 primary (brand color)
- 1 secondary (accent)
- Neutrals (gray scale, 9-11 steps)
- Semantic (success, error, warning, info)
- Never use pure colors — desaturate slightly:
\`\`\`
❌ #ff0000 (pure red)
✅ #ef4444 (slightly desaturated)
\`\`\`

### Contrast
- WCAG AA minimum:
  - Normal text: 4.5:1
  - Large text (18px+ or 14px+ bold): 3:1
  - UI components (borders, icons): 3:1
- Tools: use oklch() for perceptually uniform colors

### Dark Mode
- Don't just invert — rethink:
\`\`\`css
:root {
  --bg: #ffffff;
  --bg-subtle: #f9fafb;
  --text: #111827;
  --text-muted: #6b7280;
  --border: #e5e7eb;
}

[data-theme="dark"] {
  --bg: #0f0f0f;
  --bg-subtle: #1a1a1a;
  --text: #f9fafb;
  --text-muted: #9ca3af;
  --border: #2a2a2a;
}
\`\`\`
- Dark mode: use #0f0f0f or #121212 not pure black
- Reduce saturation in dark mode — vivid colors look harsh
- Elevate surfaces with subtle lightness, not shadows:
\`\`\`
Layer 0 (base):    #0f0f0f
Layer 1 (cards):   #1a1a1a
Layer 2 (modals):  #242424
Layer 3 (tooltip): #2e2e2e
\`\`\`
- Never use color as the only differentiator — always pair with icon/label
`;
