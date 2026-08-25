import { createContext, createElement, PropsWithChildren, useContext, useMemo } from 'react';
import { Platform } from 'react-native';

export interface ThemeColors {
  background: string;
  canvas: string;
  surface: string;
  surfaceMuted: string;
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

// The vertical atmosphere the whole app sits on: the brand sky blue at the
// top, through a midnight navy, down to near-black at the floor. Rendered
// by AtmosphereBackground behind every screen; card tones below are picked
// to hold their own contrast regardless of where they land on that
// gradient.
export const backgroundGradientStops: readonly [offset: string, color: string][] = [
  ['0%', '#F5F6F3'],
  ['100%', '#F5F6F3'],
];

export const colors: ThemeColors = {
  background: '#F5F6F3',
  canvas: '#F5F6F3',
  surface: '#FFFFFF',
  surfaceMuted: '#E9EDE8',
  surfaceGradientStart: '#E9EDE8',
  surfaceGradientEnd: '#E9EDE8',
  accent: '#1D7A68',
  accentPressed: '#155F53',
  accentSoft: '#DCEFE9',
  accentText: '#1D7162',
  textPrimary: '#122027',
  textSecondary: '#52615D',
  textMuted: '#98A39F',
  textOnAccent: '#FFFFFF',
  border: '#DCE2DD',
  borderStrong: '#C9D3CD',
  success: '#1D7A68',
  successBg: '#DCEFE9',
  successBorder: '#C6E3D9',
  warning: '#A87920',
  warningBg: '#F4EBD8',
  warningBorder: '#E8D9B5',
  danger: '#A64C43',
  dangerBg: '#F7DEDA',
  dangerBorder: '#EBC7C1',
  neutral: '#71807B',
  neutralBg: '#E9EDE8',
  neutralBorder: '#D9E0DB',
  shadow: '#6A756F',
  navBackground: '#FFFFFF',
  navActive: '#1D7A68',
  navInactive: '#98A39F',
  navActiveBg: '#DCEFE9',
  glassBorder: '#DCE2DD',
  glassBorderStrong: '#C9D3CD',
  glowStart: '#FFFFFF',
  glowEnd: '#FFFFFF',
  darkGlass: '#E9EDE8',
  darkGlassBorder: '#DCE2DD',
  violet: '#A87920',
  violetSoft: '#F4EBD8',
  violetText: '#85671E',
};

// Applied to large headings that can land over the lighter part of the
// atmosphere gradient, so white text stays legible regardless of position.
export const textShadow = {
  textShadowColor: 'transparent',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 0,
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { xs: 8, sm: 12, md: 16, lg: 20, xl: 26, pill: 999 } as const;
export const fontFamily = {
  regular: Platform.select({ ios: 'SFProText-Regular', default: 'Inter_400Regular' }) ?? 'Inter_400Regular',
  medium: Platform.select({ ios: 'SFProText-Medium', default: 'Inter_500Medium' }) ?? 'Inter_500Medium',
  semibold: Platform.select({ ios: 'SFProText-Semibold', default: 'Inter_600SemiBold' }) ?? 'Inter_600SemiBold',
  bold: Platform.select({ ios: 'SFProText-Semibold', default: 'Inter_600SemiBold' }) ?? 'Inter_600SemiBold',
} as const;
// A wider spread than a typical scale on purpose: meta/caption stay small and
// quiet so heading and hero sizes read as a real jump, not a nudge.
export const fontSize = {
  meta: 12,
  caption: 14,
  body: 15,
  cardTitle: 16,
  sectionTitle: 20,
  heading: 28,
  headingLg: 32,
  hero: 46,
} as const;

interface ThemeContextValue {
  color: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const value = useMemo<ThemeContextValue>(() => ({ color: colors }), []);
  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

// Kept as a compatibility export for non-rendering helpers that need colors
// outside a component tree.
export const color = colors;
