export const BRAND_CONFIG = {
  appTitle: 'ارزیابی نقش‌های تیمی مبتنی بر چارچوب بلبین',
  shortTitle: 'ارزیابی بلبین',
  subtitle: 'ابزار سنجش رفتاری و کشف الگوهای مشارکت تیمی',
  version: '1.0',
  adminDemoPassword: 'admin', // Demo password (see ASSUMPTIONS.md - replace with OAuth/JWT in prod)
  supportEmail: 'info@belbin-eval.ir',
  weights: {
    A: 0.35,
    B: 0.40,
    C: 0.25,
  },
  themeColors: {
    navyDark: '#0E2340',
    goldPrimary: '#F2C14E',
    goldDark: '#C9A227',
    creamLight: '#FAF4E6',
    inkDark: '#17273D',
  },
} as const;
