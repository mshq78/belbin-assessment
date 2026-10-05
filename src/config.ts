import { RoleCode, RoleMeta } from './types';

export const INSTRUMENT_VERSION = '1.0';

export const WEIGHTS = {
  A: 0.35,
  B: 0.40,
  C: 0.25,
} as const;

export const ADMIN_PASSWORD = 'admin'; // Demo password (see ASSUMPTIONS.md)

export const ROLES_METADATA: Record<RoleCode, RoleMeta> = {
  PL: {
    code: 'PL',
    englishTitle: 'Plant',
    persianTitle: 'ایده‌پردار',
  },
  RI: {
    code: 'RI',
    englishTitle: 'Resource Investigator',
    persianTitle: 'منابع‌جست‌وجوگر',
  },
  CO: {
    code: 'CO',
    englishTitle: 'Coordinator',
    persianTitle: 'هماهنگ‌کننده',
  },
  SH: {
    code: 'SH',
    englishTitle: 'Shaper',
    persianTitle: 'پیش‌برنده',
  },
  ME: {
    code: 'ME',
    englishTitle: 'Monitor Evaluator',
    persianTitle: 'منطقی‌ارزیاب',
  },
  TW: {
    code: 'TW',
    englishTitle: 'Teamworker',
    persianTitle: 'هم‌تیمی',
  },
  IMP: {
    code: 'IMP',
    englishTitle: 'Implementer',
    persianTitle: 'اجراگر',
  },
  CF: {
    code: 'CF',
    englishTitle: 'Completer Finisher',
    persianTitle: 'دقیق‌تمام‌کننده',
  },
  SP: {
    code: 'SP',
    englishTitle: 'Specialist',
    persianTitle: 'متخصص',
  },
};

export const ROLE_CODES_LIST: RoleCode[] = ['PL', 'RI', 'CO', 'SH', 'ME', 'TW', 'IMP', 'CF', 'SP'];

export const TOOL_TITLE = 'ارزیابی نقش‌های تیمی مبتنی بر چارچوب بلبین';

export const CATEGORY_LABELS = {
  preferred: 'ترجیحی',
  manageable: 'در دسترس',
  leastPreferred: 'گرایش طبیعی کمتر',
} as const;

export const RQI_WARNING_NOTE =
  'ناهماهنگی پاسخ‌ها به معنی دروغ‌گویی یا عدم صداقت نیست؛ فقط ثبات الگوی پاسخ را نشان می‌دهد.';
