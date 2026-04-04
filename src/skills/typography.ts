export const TYPOGRAPHY_SKILL = `
## Skill: Typography

### Type Scale
- Use a consistent ratio — 1.25x (Major Third) or 1.333x (Perfect Fourth):
\`\`\`
xs:   12px
sm:   14px
base: 16px
lg:   20px
xl:   24px
2xl:  32px
3xl:  40px
4xl:  48px
\`\`\`

### Readability
- Body text: 16px minimum, 1.5-1.6 line height
- Limit line length: 60-75 characters (45-75ch)
- Heading line height: 1.1-1.3 (tighter than body)
\`\`\`css
body {
  font-size: 16px;
  line-height: 1.6;
  max-width: 65ch;
}

h1, h2, h3 {
  line-height: 1.2;
}
\`\`\`

### Font Pairing
- Max 2-3 typefaces per design
- Classic combos:
  - Inter + Fraunces (sans + serif)
  - Geist + Geist Mono (code-friendly)
  - DM Sans + DM Serif Display
- Use system font stack when performance matters:
\`\`\`css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
\`\`\`

### Weight & Style
- Body: 400
- UI labels, captions: 500
- Headings: 600-700
- Never use 500 for headings — jump from 400 to 600+
- Letter spacing:
  - Headings: -0.02em (tighten)
  - All caps / labels: 0.05-0.1em (loosen)
  - Body: 0 (default)

### Colors
- Never pure black for body text — use #111 or #1a1a1a
- Hierarchy through weight and size, not just color
`;
