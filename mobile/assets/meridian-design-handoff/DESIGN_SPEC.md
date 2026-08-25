# Meridian Client Portal — Design Spec

Handoff reference for implementing the Meridian Client Portal UI. This document
describes the design system and screen-by-screen structure. Pair it with the
HTML/CSS files in `screens/` — those are the visual and structural source of
truth; this doc explains the *why* and gives you copy-pasteable values.

Client-facing mobile app for a freelance consulting relationship. Client:
Jordan Ellis (Meridian Consulting). Freelancer: Maya Chen. 5 screens × light/dark
mode = 12 reference files, plus a Project Detail subscreen.

## Files in this bundle

```
screens/
  home-light.html            home-dark.html
  projects-light.html        projects-dark.html
  project-detail-light.html  project-detail-dark.html
  invoices-light.html        invoices-dark.html
  notifications-light.html   notifications-dark.html
  account-light.html         account-dark.html
```

Each is a standalone HTML file — open any of them directly in a browser. Each
has its own embedded `<style>` block (no shared stylesheet) so you can diff
light vs. dark, or screen vs. screen, without cross-referencing anything else.
The screen content sits inside a `.screen` div sized to a 390×844 frame
(iPhone-ish); everything is plain flexbox, no CSS framework.

## Fonts

Two-font pairing, loaded from Google Fonts:

```
https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap
```

- **Lora** (serif) — headlines, big numbers, and names. Used sparingly, only
  where something should feel like a statement: page titles (`Home`,
  `Projects`, `Account`...), the client's name, dollar amounts, section
  titles, and the "3 / 5" phase counter on Project Detail.
- **Plus Jakarta Sans** (sans) — everything else: body text, labels, buttons,
  tab bar, list rows. This is the workhorse font for the whole UI.

```css
--font-serif: 'Lora', Georgia, serif;
/* body font is set directly, not tokenized: */
body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
```

Apply the serif via `font-family: var(--font-serif); font-weight: 600;` — it's
a targeted accent, not a wholesale font swap. If you scan a screen file and
count `font-family: var(--font-serif)` usages, that's the complete list of
where serif applies on that screen.

## Color tokens

Teal/forest accent on a warm neutral (light) / near-black (dark) base. Every
screen defines the same token set as CSS custom properties on `:root`, so a
new screen just needs this block adjusted for its needs (not every screen uses
every token).

**Light mode:**

```css
--bg: #F5F6F3;
--surface: #FFFFFF;
--surface-sage: #ECF0EA;        /* tinted card/row background, see below */
--border: #DCE3DB;
--text: #182524;
--text-2: #58655F;
--text-3: #93A19A;
--accent: #1D6F5B;
--accent-hover: #175A49;
--accent-tint: #DCEEE6;
--accent-ink: #0E211D;
--neutral-tint: #E9ECE7;
--neutral-text: #5B665F;
--warning: #93630F;
--warning-tint: #F2E8D3;
--danger: #9C3F35;
--danger-tint: #F3E0DC;
--radius-sm: 12px;
--radius-md: 14px;
--radius-lg: 18px;
```

**Dark mode:**

```css
--bg: #12181A;
--surface: #1A2224;
--surface-sage: #1E2C29;
--border: #2A3436;
--text: #EDF2F0;
--text-2: #9FB0AB;
--text-3: #6C7C77;
--accent: #2FBF9F;
--accent-hover: #29A88B;
--accent-tint: #1B332D;
--accent-ink: #0E211D;
--neutral-tint: #212B2C;
--neutral-text: #B9C4C0;
--danger: #E28277;
--danger-tint: #3A211D;
```

Not every screen declares every token above (e.g. Account never needed
`--surface-sage`) — copy whichever subset a given screen's `<style>` block
actually uses rather than assuming the full set applies everywhere.

## The "sage row" pattern

The most-repeated structural pattern in the app: a tinted, rounded row with a
thin accent bar on the left edge, used for notification items and inset list
items (invoice rows, message previews inside Project Detail, etc.).

```css
.notif-row {
  position: relative;
  background: var(--surface-sage);
  border-radius: 12px;
  padding: 14px 14px 14px 20px;
}
.notif-row::before {
  content: '';
  position: absolute;
  left: 8px; top: 12px; bottom: 12px;
  width: 3px;
  border-radius: 3px;
  background: var(--accent);
}
.notif-row.is-danger::before {
  background: var(--danger);
}
```

Project Detail uses the identical pattern under the class name `.inset-row` /
`.inset-row.is-danger` — same CSS, different class name because it evolved on
that screen independently. Treat them as the same component.

This pattern is deliberately *not* a hairline-divided list — no borders
between rows, no flat list background. Each row is its own soft, tinted
capsule with `gap: 10px` between rows in the parent container. This is a
core visual signature of the app; don't flatten it into a bordered table.

Account's settings list (`.list-row`) is the one exception — that screen uses
plain hairline dividers on a white/dark card instead, which is intentional:
Account reads as a denser settings/list-style menu, not an activity feed.

## The three progress visualizations (important)

The app shows "what phase is this project in" (out of 5: Discovery → Design →
Development → Review → Launch) in **three different visual treatments**,
one per screen, deliberately distinct from each other so the same underlying
data doesn't look repetitive as the user moves through the app:

**1. Home — phase-chip dash row** (`home-light.html` / `home-dark.html`)

A compact row of 5 small rounded-rect dashes, filled or unfilled, next to a
text label. This is the most glanceable/summary version — it's a small
element inside the "current project" card on the dashboard.

```html
<div style="display:flex;align-items:center;gap:10px;">
  <div style="display:flex;gap:5px;">
    <span class="phase-chip active"></span>
    <span class="phase-chip active"></span>
    <span class="phase-chip active"></span>
    <span class="phase-chip"></span>
    <span class="phase-chip"></span>
  </div>
  <span style="font-size:12.5px;font-weight:700;">Development phase</span>
</div>
```

```css
.phase-chip { width: 20px; height: 6px; border-radius: 3px; background: var(--neutral-tint); }
.phase-chip.active { background: var(--accent); }
```

**2. Projects (list) — linear percentage bar** (`projects-light.html` /
`projects-dark.html`)

Each project card in the list shows a full-width progress track with a
percentage label — appropriate for a scannable list where you're comparing
multiple projects' completion at a glance.

```css
.progress-track { height: 7px; border-radius: 4px; background: var(--neutral-tint); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; background: var(--accent); }
```

Paired with a "Development phase" / "50%" label row above the bar, and a
"View details →" link below.

**3. Project Detail — circular segmented ring gauge** (`project-detail-light.html` /
`project-detail-dark.html`)

The most detailed treatment, since this is the screen dedicated to one
project. A ring built from 5 separate `<circle>` segments (one per phase),
with completed/current phases in `--accent` and upcoming phases in `--border`,
plus a big serif "3 / 5" counter centered inside the ring, and a row of 5
small icon chips below it — one per phase, each visually marked done /
current / upcoming.

```html
<div style="position:relative;width:136px;height:136px;">
  <svg width="136" height="136" viewBox="0 0 120 120" style="transform:rotate(-90deg);">
    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" stroke-width="10"
            pathLength="100" stroke-dasharray="18 82" stroke-dashoffset="0" />
    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" stroke-width="10"
            pathLength="100" stroke-dasharray="18 82" stroke-dashoffset="-20" />
    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" stroke-width="10"
            pathLength="100" stroke-dasharray="18 82" stroke-dashoffset="-40" />
    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="10"
            pathLength="100" stroke-dasharray="18 82" stroke-dashoffset="-60" />
    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="10"
            pathLength="100" stroke-dasharray="18 82" stroke-dashoffset="-80" />
  </svg>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
    <div style="font-size:30px;font-family:var(--font-serif);font-weight:600;line-height:1;">
      3<span style="font-size:15px;color:var(--text-3);"> / 5</span>
    </div>
    <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;">PHASES</div>
    <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;">ACTIVE</div>
  </div>
</div>
```

Each of the 5 circles is a 18%-of-circumference arc (`pathLength="100"` makes
percentages easy: `stroke-dasharray="18 82"` draws an 18-unit arc then an
82-unit gap), rotated to its own slot via `stroke-dashoffset` in steps of -20.
Segments 1–3 (done/current, for a project 3/5 through) use `--accent`;
segments 4–5 (upcoming) use `--border`. To move the "current phase" pointer,
just change how many circles use `--accent` vs `--border` — the offsets and
`stroke-dasharray` stay fixed.

Below the ring, `.phase-mini` renders 5 small icon circles (magnifying glass /
pencil / arrows / clipboard-check / rocket, for Discovery / Design /
Development / Review / Launch respectively), each state-styled:

```css
.phase-dot { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.phase-dot.done { background: var(--accent); color: #fff; }
.phase-dot.current { background: var(--surface); border: 2px solid var(--accent); color: var(--accent); }
.phase-dot.upcoming { background: var(--neutral-tint); color: var(--text-3); }
.phase-label.current { color: var(--text); font-weight: 700; }
```

**Do not consolidate these three into one shared component** — the
screen-to-screen variety is intentional and was a specific design requirement:
same data, three distinct visual treatments, so the app doesn't feel
repetitive as you move from the dashboard summary → the project list → a
single project's detail view.

## Screen notes

**Home** (`home-light.html` / `home-dark.html`) — Greeting header with avatar
initials, one "current project" card (client name, status pill, phase-chip
row, start/launch dates, View details link), two stat tiles (Next Payment,
Messages), and a "Recent activity" feed using the sage-row pattern.

**Projects** (`projects-light.html` / `projects-dark.html`) — List of project
cards, each with name, client, status pill, percentage progress bar, and
dates. This is the list-level view; tapping into a project goes to Project
Detail.

**Project Detail** (`project-detail-light.html` / `project-detail-dark.html`)
— Header with back button, project/client name. "Project overview" card with
the ring gauge + phase icons + dates. A "Notes" section styled as a message
thread (bubbles: `.bubble.theirs` uses `--surface-sage`, `.bubble.mine` uses
solid `--accent` with white text) representing async client↔freelancer
updates. An invoices-for-this-project section using the sage-row (`.inset-row`)
pattern.

**Invoices** (`invoices-light.html` / `invoices-dark.html`) — Summary stat
row (e.g. total outstanding), then a flat list of invoice rows using the
sage-row (`.inset-row`) pattern — amount in serif, status as a colored pill
(paid/due/overdue map to accent/warning/danger tints).

**Notifications** (`notifications-light.html` / `notifications-dark.html`) —
Grouped "Today" / "Earlier" sections, each a `.notif-list` of sage-rows.
Danger-flagged items (e.g. an overdue invoice) get `.is-danger`, which swaps
the left accent bar and icon-chip tint to `--danger`/`--danger-tint`.

**Account** (`account-light.html` / `account-dark.html`) — Profile card
(avatar, name in serif, email, client-since date), a "Settings" group using
plain hairline `.list-row` dividers (payment methods, notification settings,
help, language), and a standalone danger-tinted "Log out" row.

All five main screens share the same bottom tab bar (Home / Projects /
Invoices / Notifications / Account, each with a line-icon + label, active tab
tinted with `--accent`/`--accent-tint`).

## Implementation notes for your app codebase

- These files intentionally duplicate CSS per-screen (no shared stylesheet)
  since they were authored as independent mockup artboards — when porting to
  your actual component library, factor the tokens and the sage-row /
  phase-chip / progress-bar / ring-gauge patterns into shared
  components/styles rather than copying the inline `<style>` blocks per
  screen.
- All icons are inline SVG (`stroke="currentColor"`, 1.75 stroke-width,
  round caps/joins) — swap for your icon library of choice, but keep the
  visual weight (thin, rounded, ~16–20px) consistent.
- Colors are plain hex values here for portability; if your app already has a
  theming system, map these tokens onto it directly — the names above
  (`--accent`, `--surface-sage`, etc.) are a reasonable starting point for
  your own token names.
