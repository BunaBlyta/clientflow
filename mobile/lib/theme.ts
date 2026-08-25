import { createContext, createElement, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';

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
  surfaceSage: '#ECF0EA',
  surfaceGradientStart: '#FFFFFF',
  surfaceGradientEnd: '#FFFFFF',
  accent: '#1D6F5B',
  accentPressed: '#175A49',
  accentSoft: '#DCEEE6',
  accentText: '#1D6F5B',
  textPrimary: '#182524',
  textSecondary: '#58655F',
  textMuted: '#93A19A',
  textOnAccent: '#FFFFFF',
  border: '#DCE3DB',
  borderStrong: '#C9D5CC',
  success: '#1D6F5B',
  successBg: '#DCEEE6',
  successBorder: '#C6E3D9',
  warning: '#93630F',
  warningBg: '#F2E8D3',
  warningBorder: '#E5D5B8',
  danger: '#9C3F35',
  dangerBg: '#F3E0DC',
  dangerBorder: '#E6C4BE',
  neutral: '#5B665F',
  neutralBg: '#E9ECE7',
  neutralBorder: '#DCE3DB',
  shadow: '#93A19A',
  navBackground: '#FFFFFF',
  navActive: '#1D6F5B',
  navInactive: '#93A19A',
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
  surfaceSage: '#1E2C29',
  surfaceGradientStart: '#1A2224',
  surfaceGradientEnd: '#1A2224',
  accent: '#2FBF9F',
  accentPressed: '#29A88B',
  accentSoft: '#1B332D',
  accentText: '#2FBF9F',
  textPrimary: '#EDF2F0',
  textSecondary: '#9FB0AB',
  textMuted: '#6C7C77',
  border: '#2A3436',
  borderStrong: '#334042',
  success: '#2FBF9F',
  successBg: '#1B332D',
  successBorder: '#285446',
  warning: '#D6A94F',
  warningBg: '#3A301D',
  warningBorder: '#59491F',
  danger: '#E28277',
  dangerBg: '#3A211D',
  dangerBorder: '#61352F',
  neutral: '#B9C4C0',
  neutralBg: '#212B2C',
  neutralBorder: '#2A3436',
  shadow: '#0E1516',
  navBackground: '#1A2224',
  navActive: '#2FBF9F',
  navInactive: '#6C7C77',
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
  regular: Platform.select({ ios: 'SFProText-Regular', default: 'Inter_400Regular' }) ?? 'Inter_400Regular',
  medium: Platform.select({ ios: 'SFProText-Medium', default: 'Inter_500Medium' }) ?? 'Inter_500Medium',
  semibold: Platform.select({ ios: 'SFProText-Semibold', default: 'Inter_600SemiBold' }) ?? 'Inter_600SemiBold',
  bold: Platform.select({ ios: 'SFProText-Semibold', default: 'Inter_600SemiBold' }) ?? 'Inter_600SemiBold',
  // The handoff uses Lora for deliberate statement text. Georgia is the
  // closest system-safe serif fallback without adding another font package.
  serif: Platform.select({ ios: 'Georgia', default: 'serif' }) ?? 'serif',
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

interface ThemeContextValue {
  color: ThemeColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const value = useMemo<ThemeContextValue>(
    () => ({ color: mode === 'dark' ? darkColors : colors, mode, setMode }),
    [mode],
  );
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
