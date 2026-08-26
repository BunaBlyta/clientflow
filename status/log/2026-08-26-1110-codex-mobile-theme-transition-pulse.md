# Mobile theme transition pulse fix

- Reworked the theme transition to use one JavaScript-driven animated value, so no animated node can be switched between native and JavaScript drivers.
- Replaced the color-and-opacity interpolation that briefly pulsed with a fixed target-color overlay whose opacity fades in and out smoothly.
- Verified with `npx tsc --noEmit` and `npx expo export --platform ios`.
- Changes remain uncommitted at the user’s request.
