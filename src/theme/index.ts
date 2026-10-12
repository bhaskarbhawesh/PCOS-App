import { useColorScheme } from 'react-native';

export const palette = {
  plum: '#6C4F8F',
  blush: '#F6E6EE',
  sage: '#A8C3A0',
  cream: '#FFFAF5',
  ink: '#2B2433',
  aubergine: '#1B1522',
};

export interface Theme {
  dark: boolean;
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  border: string;
  danger: string;
  flow: string;
}

const light: Theme = {
  dark: false,
  bg: palette.cream,
  card: '#FFFFFF',
  cardAlt: palette.blush,
  text: palette.ink,
  textMuted: '#655B70', // 6.3:1 on cream
  primary: palette.plum, // 6.9:1 with white text
  onPrimary: '#FFFFFF',
  accent: '#4F7A47', // darker sage for text/icons (4.9:1 on white)
  accentSoft: '#E3EEE0',
  border: '#ECE3EA',
  danger: '#A3364A',
  flow: '#B0416A',
};

const dark: Theme = {
  dark: true,
  bg: palette.aubergine,
  card: '#2A2133',
  cardAlt: '#3A2C47',
  text: '#F4EEF7',
  textMuted: '#BFB3C9',
  primary: '#C4A8E6',
  onPrimary: '#1B1522',
  accent: '#B9D6B1',
  accentSoft: '#2F3D2D',
  border: '#3A2F44',
  danger: '#F2A0B0',
  flow: '#F08FB4',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const radius = { card: 18, pill: 999, control: 12 } as const;
/** Minimum tap target (Apple HIG). */
export const TAP = 44;
