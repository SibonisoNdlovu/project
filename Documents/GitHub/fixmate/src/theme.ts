export type ThemeMode = 'dark' | 'light';
export type ThemePalette = {
  bg: string; panel: string; panel2: string; text: string; muted: string;
  primary: string; primaryText: string; border: string; danger: string;
  success: string; inputBg: string; inputText: string; white: string;
};

export const themes: Record<ThemeMode, ThemePalette> = {
  dark: {
    bg: '#101820', panel: '#192630', panel2: '#223440', text: '#F5F7F8',
    muted: '#A7B4BC', primary: '#E6A23C', primaryText: '#171B1E',
    border: '#344651', danger: '#F07878', success: '#67C69A',
    inputBg: '#223440', inputText: '#F5F7F8', white: '#FFFFFF'
  },
  light: {
    bg: '#F4F6F7', panel: '#FFFFFF', panel2: '#EAF0F2', text: '#15232B',
    muted: '#687982', primary: '#D99022', primaryText: '#FFFFFF',
    border: '#D9E1E5', danger: '#C84D4D', success: '#25875B',
    inputBg: '#F0F3F4', inputText: '#15232B', white: '#FFFFFF'
  }
};
