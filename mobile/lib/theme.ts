import * as SecureStore from 'expo-secure-store';
import { createContext, createElement, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
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
}

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F8FA',
  accent: '#5AB2FF',
  accentPressed: '#4098E0',
  accentSoft: '#EAF5FF',
  textPrimary: '#14171A',
  textSecondary: '#5B6270',
  textMuted: '#8B92A0',
  textOnAccent: '#FFFFFF',
  border: '#E6E8EB',
  borderStrong: '#D6D9DE',
  success: '#15803D',
  successBg: '#E7F6EC',
  successBorder: '#BEE6C9',
  warning: '#B45309',
  warningBg: '#FEF3C7',
  warningBorder: '#FBE1A3',
  danger: '#C0362C',
  dangerBg: '#FCEAE8',
  dangerBorder: '#F3C3BE',
  neutral: '#5B6270',
  neutralBg: '#F0F1F3',
  neutralBorder: '#DFE1E5',
};

export const darkColors: ThemeColors = {
  background: '#101418',
  surface: '#171C22',
  surfaceMuted: '#20262E',
  accent: '#74BFFF',
  accentPressed: '#9BD2FF',
  accentSoft: '#18364D',
  textPrimary: '#F4F7FA',
  textSecondary: '#C1C9D3',
  textMuted: '#8C98A6',
  textOnAccent: '#07131D',
  border: '#2B333D',
  borderStrong: '#3A4552',
  success: '#6DDB93',
  successBg: '#163A27',
  successBorder: '#285C3D',
  warning: '#F5BE67',
  warningBg: '#44351B',
  warningBorder: '#745922',
  danger: '#FF8E83',
  dangerBg: '#482321',
  dangerBorder: '#783D38',
  neutral: '#C1C9D3',
  neutralBg: '#29313A',
  neutralBorder: '#414B57',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;
export const fontSize = {
  meta: 12,
  caption: 13,
  body: 14,
  cardTitle: 15,
  sectionTitle: 16,
  heading: 20,
  headingLg: 22,
} as const;

const THEME_KEY = 'clientflow.preferences.theme';

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }
  return globalThis.localStorage;
}

async function readThemePreference(): Promise<ThemeMode | null> {
  const value = Platform.OS === 'web'
    ? getWebStorage()?.getItem(THEME_KEY)
    : await SecureStore.getItemAsync(THEME_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

async function writeThemePreference(mode: ThemeMode) {
  if (Platform.OS === 'web') {
    if (mode === 'system') getWebStorage()?.removeItem(THEME_KEY);
    else getWebStorage()?.setItem(THEME_KEY, mode);
    return;
  }
  if (mode === 'system') await SecureStore.deleteItemAsync(THEME_KEY);
  else await SecureStore.setItemAsync(THEME_KEY, mode);
}

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: ResolvedTheme;
  color: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const resolvedMode: ResolvedTheme = mode === 'system'
    ? systemScheme === 'dark' ? 'dark' : 'light'
    : mode;

  useEffect(() => {
    let active = true;
    void readThemePreference().then((stored) => {
      if (active && stored) setModeState(stored);
    });
    return () => { active = false; };
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    resolvedMode,
    color: resolvedMode === 'dark' ? darkColors : lightColors,
    setMode: (nextMode) => {
      setModeState(nextMode);
      void writeThemePreference(nextMode);
    },
    toggleTheme: () => {
      const nextMode: ThemeMode = resolvedMode === 'dark' ? 'light' : 'dark';
      setModeState(nextMode);
      void writeThemePreference(nextMode);
    },
  }), [mode, resolvedMode]);

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

// Kept as a light-theme compatibility export for non-rendering helpers. Rendered
// components use useTheme().color so a preference change updates immediately.
export const color = lightColors;
