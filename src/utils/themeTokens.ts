export type ThemeMode = 'dark' | 'light';

export interface LiquidThemeTokens {
  mode: ThemeMode;
  isDark: boolean;
  // Fondos base y orbes ambientales
  canvasBg: string;
  canvasGradient: [string, string, string];
  orbPrimary: string;
  orbSecondary: string;
  orbAccent: string;

  // Superficies Liquid Glass (tarjetas, cápsulas e inputs)
  glassCardGradient: [string, string];
  glassHeroGradient: [string, string, string];
  glassInsetBg: string;
  glassPillBg: string;
  glassBorder: string;
  glassSpecularTop: string;
  glassShadowColor: string;
  glassShadowOpacity: number;

  // Barra de navegación (Floating Dock) y Modal Sheet
  tabBarBg: string;
  tabBarBorder: string;
  modalBackdrop: string;
  modalSheetGradient: [string, string];

  // Tipografía y bordes
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;

  // Colores semánticos y gráficos
  emerald: string;
  rose: string;
  amber: string;
  indigo: string;
  chartRulesColor: string;
  chartAxisTextColor: string;
  progressTrackBg: string;
}

const DARK_LIQUID_TOKENS: LiquidThemeTokens = {
  mode: 'dark',
  isDark: true,
  canvasBg: '#050811',
  canvasGradient: ['#050811', '#0B1325', '#070B16'],
  orbPrimary: 'rgba(16, 185, 129, 0.16)',
  orbSecondary: 'rgba(99, 102, 241, 0.15)',
  orbAccent: 'rgba(6, 182, 212, 0.12)',

  glassCardGradient: ['rgba(30, 41, 59, 0.66)', 'rgba(15, 23, 42, 0.46)'],
  glassHeroGradient: [
    'rgba(16, 185, 129, 0.20)',
    'rgba(30, 41, 59, 0.72)',
    'rgba(15, 23, 42, 0.60)',
  ],
  glassInsetBg: 'rgba(9, 13, 24, 0.62)',
  glassPillBg: 'rgba(30, 41, 59, 0.74)',
  glassBorder: 'rgba(255, 255, 255, 0.13)',
  glassSpecularTop: 'rgba(255, 255, 255, 0.28)',
  glassShadowColor: '#000000',
  glassShadowOpacity: 0.42,

  tabBarBg: 'rgba(15, 23, 42, 0.88)',
  tabBarBorder: 'rgba(255, 255, 255, 0.15)',
  modalBackdrop: 'rgba(2, 6, 23, 0.72)',
  modalSheetGradient: ['rgba(30, 41, 59, 0.96)', 'rgba(15, 23, 42, 0.98)'],

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  divider: 'rgba(255, 255, 255, 0.08)',

  emerald: '#10B981',
  rose: '#F43F5E',
  amber: '#F59E0B',
  indigo: '#6366F1',
  chartRulesColor: 'rgba(255, 255, 255, 0.07)',
  chartAxisTextColor: '#94A3B8',
  progressTrackBg: 'rgba(15, 23, 42, 0.85)',
};

const LIGHT_LIQUID_TOKENS: LiquidThemeTokens = {
  mode: 'light',
  isDark: false,
  canvasBg: '#EEF2FF',
  canvasGradient: ['#F0FDF4', '#EEF2FF', '#F8FAFC'],
  orbPrimary: 'rgba(16, 185, 129, 0.18)',
  orbSecondary: 'rgba(99, 102, 241, 0.16)',
  orbAccent: 'rgba(14, 165, 233, 0.15)',

  glassCardGradient: ['rgba(255, 255, 255, 0.84)', 'rgba(255, 255, 255, 0.62)'],
  glassHeroGradient: [
    'rgba(209, 250, 229, 0.78)',
    'rgba(255, 255, 255, 0.88)',
    'rgba(238, 242, 255, 0.76)',
  ],
  glassInsetBg: 'rgba(241, 245, 249, 0.78)',
  glassPillBg: 'rgba(255, 255, 255, 0.82)',
  glassBorder: 'rgba(148, 163, 184, 0.28)',
  glassSpecularTop: 'rgba(255, 255, 255, 0.95)',
  glassShadowColor: '#0F172A',
  glassShadowOpacity: 0.08,

  tabBarBg: 'rgba(255, 255, 255, 0.88)',
  tabBarBorder: 'rgba(148, 163, 184, 0.30)',
  modalBackdrop: 'rgba(15, 23, 42, 0.40)',
  modalSheetGradient: ['rgba(255, 255, 255, 0.96)', 'rgba(241, 245, 249, 0.98)'],

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  divider: 'rgba(148, 163, 184, 0.20)',

  emerald: '#059669',
  rose: '#E11D48',
  amber: '#D97706',
  indigo: '#4F46E5',
  chartRulesColor: 'rgba(148, 163, 184, 0.22)',
  chartAxisTextColor: '#475569',
  progressTrackBg: 'rgba(203, 213, 225, 0.65)',
};

export function getThemeTokens(mode: ThemeMode): LiquidThemeTokens {
  return mode === 'light' ? LIGHT_LIQUID_TOKENS : DARK_LIQUID_TOKENS;
}
