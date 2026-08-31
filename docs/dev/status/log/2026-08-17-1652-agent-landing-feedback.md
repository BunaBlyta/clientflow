### 2026-08-17 16:52 — Codex — landing page PM feedback

Changed:
- Removed layout-shifting button press/hover movement and added a hand cursor to buttons.
- Made the marketing header solid, added smooth anchored scrolling with a sticky-header offset, and constrained the hero copy into a centered triangular wrap.
- Standardized landing section spacing and the visible button radius/gap treatment.
- Disabled hover movement and animation in the “How it works” section.
- Gave standard, popular, and custom package cards separate tones, aligned their content rows, and made the popular card more distinct.
- Moved package request and custom inquiry forms into dialogs. Added required-field asterisks, top-of-form error warnings with icons, consistent dropdown padding/alignment, and bounded resizable textareas.

Tried and abandoned (what didn't work, and why):
- Browser visual inspection was attempted, but no browser instance was available in this session. Local Next startup was also blocked by the sandbox port restriction; the existing project behavior was verified with typecheck, lint, tests, and a webpack production build instead.

Left for next session:
- A human should click through the landing page once in a browser to confirm the exact visual balance of the hero text wrap and package shades.

Assumptions made (flag if wrong):
- “Triangle shaped” hero text means a centered, narrow text measure that wraps as a soft pyramid across lines.
- The contact section remains a CTA surface, while its custom inquiry form is opened in a modal.

Blockers:
- None for implementation. The default Turbopack build remains unavailable in the sandbox because it cannot bind its internal port; `next build --webpack` passed.
