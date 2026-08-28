import { useCallback, useRef } from 'react';

const DEFAULT_COOLDOWN_MS = 800;

/**
 * Wraps a callback (typically a navigation action) so a burst of rapid taps
 * — the button mashed before the resulting screen has had a chance to take
 * over — only fires it once. `router.push`/`navigation.navigate` have no
 * built-in de-dup, so without this a triple-tap on a list row or CTA stacks
 * the same screen three times, and the user has to back out three times to
 * return to where they started.
 */
export function useSingleFire<Args extends unknown[]>(
  callback: (...args: Args) => void,
  cooldownMs = DEFAULT_COOLDOWN_MS,
) {
  const lastFiredAt = useRef(0);
  return useCallback(
    (...args: Args) => {
      const now = Date.now();
      if (now - lastFiredAt.current < cooldownMs) return;
      lastFiredAt.current = now;
      callback(...args);
    },
    [callback, cooldownMs],
  );
}
