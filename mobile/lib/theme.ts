/**
 * Shared design tokens for the Clientflow mobile app.
 * Mirrors AGENTS.md section 5 (Design direction), translated to React Native.
 *
 * - White base, #5AB2FF is the single UI accent (buttons, links, active states,
 *   the current step in the project tracker). The soft landing-page blues
 *   (#CAF4FF / #A0DEFF) are NOT used here — mobile is dashboard-equivalent.
 * - Status badges (Paid/Due/Overdue, project stages) use standard semantic
 *   colors, kept visually separate from the brand accent.
 * - Spacing is a strict 4px grid: 4/8/12/16/24/32.
 * - Borders are 1px hairline, light gray, never black.
 */

export const color = {
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
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

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

export const fontsToLoad = {
  // populated in app/_layout.tsx via @expo-google-fonts/inter
};
