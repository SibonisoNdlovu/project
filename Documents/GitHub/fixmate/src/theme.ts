
export type ThemeMode = 'dark' | 'light';

export type ThemePalette = {
  bg: string;
  panel: string;
  panel2: string;
  text: string;
  muted: string;
  primary: string;
  primaryText: string;
  border: string;
  danger: string;
  success: string;
  inputBg: string;
  inputText: string;
  white: string;
};

export const themes: Record<ThemeMode, ThemePalette> = {
  dark: {
    bg: '#101D2B',
    panel: '#192B3D',
    panel2: '#243A4E',
    text: '#F5F8FC',
    muted: '#A5B4C3',
    primary: '#19B99A',
    primaryText: '#092A27',
    border: '#30475B',
    danger: '#FF8A78',
    success: '#55D6A5',
    inputBg: '#22374A',
    inputText: '#F5F8FC',
    white: '#FFFFFF',
  },

  light: {
    bg: '#F3F6FA',
    panel: '#FFFFFF',
    panel2: '#E8F5F1',
    text: '#17263C',
    muted: '#718096',
    primary: '#12A98D',
    primaryText: '#FFFFFF',
    border: '#E0E7EF',
    danger: '#F07865',
    success: '#15966E',
    inputBg: '#F5F7FA',
    inputText: '#17263C',
    white: '#FFFFFF',
  },
};
