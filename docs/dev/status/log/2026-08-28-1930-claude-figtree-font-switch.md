# 2026-08-28 — Claude Code — typography: Inter → Figtree

Mentor changed the typography direction from Inter to Figtree. Updated `AGENTS.md`'s design direction section (the shared source of truth for all lanes) to reflect this, noting the change and date so it doesn't read as an unexplained inconsistency later.

On mobile:

- `app/_layout.tsx`: `useFonts` now loads `Figtree_400Regular`/`Figtree_500Medium`/`Figtree_600SemiBold`/`Figtree_700Bold` from the new `@expo-google-fonts/figtree` package instead of the `Inter_*` equivalents.
- `lib/theme.ts`: `fontFamily.regular/medium/semibold/bold` now point at those Figtree weights.
- Found and fixed a pre-existing bug along the way: `fontFamily`'s tokens were actually all hardcoded to `'Georgia'`, not `Inter_*` — meaning the app's real rendered typography never matched Inter despite Inter being the loaded font, a divergence from AGENTS.md's original spec that had nothing to do with today's Figtree request. Asked the user directly whether Figtree should also replace this Georgia serif look on headings (project names, page titles) or just body text; confirmed "everywhere, including headings" — so the `serif` token (previously `'Georgia'`) now also resolves to Figtree, at `Figtree_600SemiBold` (the heaviest weight the design direction allows for headings).

Package install: `@expo-google-fonts/figtree` required `npx expo install`, which only the user/Buna can run per the working agreement. Printed the exact command, the user ran it, confirmed with `done`, then verified `npx tsc --noEmit` passes clean before treating this as complete. `@expo-google-fonts/inter` is now unused but left in `package.json` — removing it needs an uninstall too, flagged for the user to run whenever (`npx expo uninstall @expo-google-fonts/inter`).

## Not done here

- The web app (`app/layout.tsx`, outside this lane's directory ownership) still loads `Inter` via `next/font/google`. That's a one-line, no-install change (`next/font/google` bundles fonts directly), but belongs to the web lane — flagged to the user rather than touched here.

## Files touched

- `AGENTS.md`
- `mobile/app/_layout.tsx`
- `mobile/lib/theme.ts`

## Verification

- `npx tsc --noEmit` from `mobile/` passes after the package install.
- Not visually confirmed on device that Figtree actually renders (vs. falling back to a system font) — worth a look once next on a device, though the mechanism here (useFonts + fontFamily string match) is the same one Inter/Georgia already used successfully all session, so risk is low.
