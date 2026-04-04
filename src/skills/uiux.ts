export const UIUX_SKILL = `
## Skill: UI/UX Design

### Layout & Spacing
- Use a spacing scale — multiples of 4:
  - 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px
- Mobile first — design small then enhance:
\`\`\`css
.container {
  padding: 16px;
}
@media (min-width: 768px) {
  .container {
    padding: 32px;
  }
}
\`\`\`
- Minimum touch target: 44x44px
- Consistent grid: 12-column or 4/8-column for mobile

### Interaction Design
- Always show loading states for async operations:
  - Use skeleton screens for content, spinners for actions
- Show errors inline, close to the source — not just toasts
- Never disable buttons — show why the action is unavailable
- Keyboard navigation must work for all interactive elements
- Manage focus after modals/dialogs open and close
- Animations under 300ms for UI feedback, 500ms for transitions

### Component Patterns
- Cards: consistent padding (16-24px), subtle shadow or border
- Forms: label above input, error below, helper text below label
- Tables: zebra striping or row hover for readability
- Empty states: illustration + message + action
- 404/Error pages: clear message + way back home

### Accessibility
- Color is never the only differentiator
- Alt text on all meaningful images
- ARIA labels on icon-only buttons
- Focus indicators must be visible
- Contrast: 4.5:1 for text, 3:1 for large text and UI components
`;
