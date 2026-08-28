import { createContext, createElement, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as SecureStore from 'expo-secure-store';

export interface ThemeColors {
  background: string;
  canvas: string;
  surface: string;
  surfaceMuted: string;
  surfaceSage: string;
  surfaceGradientStart: string;
  surfaceGradientEnd: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  accentText: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;
  border: string;
  borderStrong: string;
  success: string;
  successBg: string;
  successBorder: string;
  warning: string;
  warningBg: string;
  warningBorder: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  neutral: string;
  neutralBg: string;
  neutralBorder: string;
  shadow: string;
  navBackground: string;
  navActive: string;
  navInactive: string;
  navActiveBg: string;
  glassBorder: string;
  glassBorderStrong: string;
  glowStart: string;
  glowEnd: string;
  darkGlass: string;
  darkGlassBorder: string;
  violet: string;
  violetSoft: string;
  violetText: string;
}

// Meridian is intentionally warm and quiet: the canvas carries the page while
// white cards and sage activity rows provide only the separation they need.
export const backgroundGradientStops: readonly [offset: string, color: string][] = [
  ['0%', '#F5F6F3'],
  ['100%', '#F5F6F3'],
];

export const colors: ThemeColors = {
  background: '#F5F6F3',
  canvas: '#F5F6F3',
  surface: '#FFFFFF',
  surfaceMuted: '#E9ECE7',
  surfaceSage: '#DCEEE6',
  surfaceGradientStart: '#FFFFFF',
  surfaceGradientEnd: '#FFFFFF',
  accent: '#1D6F5B',
  accentPressed: '#1D6F5B',
  accentSoft: '#DCEEE6',
  accentText: '#1D6F5B',
  textPrimary: '#182524',
  textSecondary: '#58655F',
  textMuted: '#58655F',
  textOnAccent: '#FFFFFF',
  border: '#DCE3DB',
  borderStrong: '#C9D5CC',
  success: '#16A34A',
  successBg: '#DCFCE7',
  successBorder: '#BBF7D0',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  warningBorder: '#FDE68A',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  dangerBorder: '#FECACA',
  neutral: '#58655F',
  neutralBg: '#E9ECE7',
  neutralBorder: '#DCE3DB',
  shadow: '#58655F',
  navBackground: '#FFFFFF',
  navActive: '#1D6F5B',
  navInactive: '#58655F',
  navActiveBg: '#DCEEE6',
  glassBorder: '#DCE3DB',
  glassBorderStrong: '#C9D5CC',
  glowStart: '#FFFFFF',
  glowEnd: '#FFFFFF',
  darkGlass: '#E9ECE7',
  darkGlassBorder: '#DCE3DB',
  violet: '#93630F',
  violetSoft: '#F2E8D3',
  violetText: '#76500C',
};

const darkColors: ThemeColors = {
  ...colors,
  background: '#12181A',
  canvas: '#12181A',
  surface: '#1A2224',
  surfaceMuted: '#212B2C',
  surfaceSage: '#1B332D',
  surfaceGradientStart: '#1A2224',
  surfaceGradientEnd: '#1A2224',
  accent: '#2FBF9F',
  accentPressed: '#2FBF9F',
  accentSoft: '#1B332D',
  accentText: '#2FBF9F',
  textPrimary: '#EDF2F0',
  textSecondary: '#9FB0AB',
  textMuted: '#9FB0AB',
  border: '#2A3436',
  borderStrong: '#334042',
  success: '#4ADE80',
  successBg: '#14532D',
  successBorder: '#166534',
  warning: '#FBBF24',
  warningBg: '#451A03',
  warningBorder: '#92400E',
  danger: '#F87171',
  dangerBg: '#450A0A',
  dangerBorder: '#991B1B',
  neutral: '#9FB0AB',
  neutralBg: '#212B2C',
  neutralBorder: '#2A3436',
  shadow: '#9FB0AB',
  navBackground: '#1A2224',
  navActive: '#2FBF9F',
  navInactive: '#9FB0AB',
  navActiveBg: '#1B332D',
  glassBorder: '#2A3436',
  glassBorderStrong: '#334042',
  glowStart: '#1A2224',
  glowEnd: '#1A2224',
  darkGlass: '#212B2C',
  darkGlassBorder: '#2A3436',
  violet: '#D6A94F',
  violetSoft: '#3A301D',
  violetText: '#D6A94F',
};

// Applied to large headings that can land over the lighter part of the
// atmosphere gradient, so white text stays legible regardless of position.
export const textShadow = {
  textShadowColor: 'transparent',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 0,
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { xs: 8, sm: 12, md: 14, lg: 18, xl: 18, pill: 999 } as const;
export const fontFamily = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  // Headings used a separate serif (Georgia) for an editorial look; per
  // 2026-08-28 direction, Figtree replaces it everywhere, headings
  // included — this token is kept (rather than removed) so call sites
  // don't need touching, it just now resolves to the same family at the
  // heavier of the two weights the design direction allows for headings.
  serif: 'Figtree_600SemiBold',
} as const;
// A wider spread than a typical scale on purpose: meta/caption stay small and
// quiet so heading and hero sizes read as a real jump, not a nudge.
export const fontSize = {
  meta: 12,
  caption: 12,
  body: 14,
  cardTitle: 14,
  sectionTitle: 16,
  heading: 19,
  headingLg: 24,
  hero: 46,
} as const;

export type ThemeMode = 'light' | 'dark';

// Same persistence pattern as lib/i18n.ts's language preference, so a
// reload or relaunch doesn't silently drop the user's theme choice back
// to the 'light' default.
const THEME_KEY = 'clientflow.preferences.theme';

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return null;
  return globalThis.localStorage;
}

async function readStoredMode(): Promise<ThemeMode | null> {
  const value = Platform.OS === 'web' ? getWebStorage()?.getItem(THEME_KEY) : await SecureStore.getItemAsync(THEME_KEY);
  return value === 'dark' || value === 'light' ? value : null;
}

async function writeStoredMode(mode: ThemeMode) {
  if (Platform.OS === 'web') { getWebStorage()?.setItem(THEME_KEY, mode); return; }
  await SecureStore.setItemAsync(THEME_KEY, mode);
}

interface ThemeContextValue {
  color: ThemeColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  // True from the moment a theme toggle starts until its screenshot
  // crossfade has fully finished. Lets a component that wants to stay
  // visually live and unobstructed throughout (see ThemeToggle in
  // account.tsx) know how long to keep its own always-on-top overlay
  // mounted, since it can't itself see when the capture/fade is done.
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setCurrentMode] = useState<ThemeMode>('light');
  // Loads whatever the user last picked, same as lib/i18n.ts's language
  // preference. Applied directly (no screenshot crossfade) since this is
  // the initial paint, not a user-initiated toggle — there's nothing
  // visible yet to transition from.
  useEffect(() => {
    void readStoredMode().then((stored) => {
      if (stored) setCurrentMode(stored);
    });
  }, []);
  // Every earlier version of this transition tried to fake a crossfade by
  // masking a live, instant recolor (dimming opacity, layering solid
  // colors) — which always either exposed the mid-transition mismatch as
  // a flash, or read as a filter rather than a real fade, because the
  // content itself never actually changed color gradually. This version
  // does the real thing apps like iOS/Twitter do: capture an actual
  // screenshot of the current (old-theme) screen, hold it as a frozen
  // overlay, swap the live theme underneath instantly while it's hidden
  // behind that frozen image, then fade the frozen image away to reveal
  // the already-correct new-theme content. Because the overlay is a real,
  // static picture — not an approximation built from a handful of shared
  // colors — there's nothing for the two states to mismatch on, and
  // nothing can leak through mid-fade because the picture doesn't change.
  const rootRef = useRef<View>(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const pendingModeRef = useRef<ThemeMode | null>(null);
  // Bumped on every call so a stale capture (e.g. from a rapid double-tap)
  // can recognize it's been superseded and skip applying itself.
  const captureRequestRef = useRef(0);
  const [overlayUri, setOverlayUri] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const setMode = useCallback((nextMode: ThemeMode) => {
    if (nextMode === mode) return;
    setIsTransitioning(true);
    const requestId = ++captureRequestRef.current;
    const node = rootRef.current;
    if (!node) {
      // No mounted view to capture yet (shouldn't happen in practice) —
      // still swap the theme rather than silently doing nothing.
      setCurrentMode(nextMode);
      void writeStoredMode(nextMode);
      setIsTransitioning(false);
      return;
    }
    // Nothing can appear until this resolves, so capture speed directly
    // sets how long the tap feels like it takes to register. This image
    // is only ever on screen for well under half a second while fading
    // out, so full lossless (the default: png, quality 1) fidelity is
    // wasted cost — png encoding is the slow part, and jpeg is much
    // cheaper to encode with no visible difference at that duration.
    captureRef(node, { format: 'jpg', quality: 0.8 })
      .then((uri) => {
        if (captureRequestRef.current !== requestId) return;
        pendingModeRef.current = nextMode;
        overlayOpacity.setValue(1);
        setOverlayUri(uri);
        // The heavy app-wide re-render this causes (~40 files read
        // useTheme(), and every tab stays mounted) now happens entirely
        // behind the frozen screenshot, which is a static image and
        // can't itself judder — so there's no need to defer or gate this
        // the way earlier versions had to.
        setCurrentMode(nextMode);
        void writeStoredMode(nextMode);
      })
      .catch(() => {
        // Capture can fail (e.g. an unusual simulator/permissions edge
        // case) — fall back to an instant swap rather than leaving the
        // toggle stuck doing nothing.
        if (captureRequestRef.current === requestId) {
          setCurrentMode(nextMode);
          void writeStoredMode(nextMode);
          setIsTransitioning(false);
        }
      });
  }, [mode, overlayOpacity]);
  useEffect(() => {
    if (pendingModeRef.current !== mode) return;
    pendingModeRef.current = null;
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setOverlayUri(null);
      setIsTransitioning(false);
    });
  }, [mode, overlayOpacity]);
  const value = useMemo<ThemeContextValue>(
    () => ({ color: mode === 'dark' ? darkColors : colors, mode, setMode, isTransitioning }),
    [mode, setMode, isTransitioning],
  );
  const background = mode === 'dark' ? darkColors.background : colors.background;
  return createElement(
    ThemeContext.Provider,
    { value },
    createElement(
      View,
      // collapsable={false} keeps Android from optimizing this View out
      // of the native tree, which would make it uncapturable.
      { ref: rootRef, collapsable: false, style: { flex: 1, backgroundColor: background } },
      children,
      overlayUri
        ? createElement(Animated.View, {
            pointerEvents: 'none',
            style: [StyleSheet.absoluteFill, { opacity: overlayOpacity }],
          }, createElement(Image, { source: { uri: overlayUri }, style: StyleSheet.absoluteFill }))
        : null,
    ),
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

// Kept as a compatibility export for non-rendering helpers that need colors
// outside a component tree.
export const color = colors;
