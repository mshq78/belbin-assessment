import { ItemA, ScenarioB, MiniGameC, RoleCode } from './types';
import { ROLE_CODES_LIST } from './config';

export const SECTION_A_ITEMS: ItemA[] = [
  {
    id: 'A01',
    card1: {
      code: 'PL',
      title: 'راه تازه پیدا کردن',
      imageDescription: 'تخته‌ای با چند مسیر متفاوت و یک طرح غیرمنتظره برای حل مسئله',
      imagePath: '/images/A01_1.jpg',
    },
    card2: {
      code: 'RI',
      title: 'فرصت بیرون را پیدا کردن',
      imageDescription: 'فرد در حال ارتباط با افراد یا منابع خارج از تیم و یافتن ارتباط تازه',
      imagePath: '/images/A01_2.jpg',
    },
  },
  {
    id: 'A02',
    card1: {
      code: 'RI',
      title: 'پیدا کردن آدم مناسب',
      imageDescription: 'شبکه‌ای از افراد و منابع و انتخاب یک ارتباط مناسب',
      imagePath: '/images/A02_1.jpg',
    },
    card2: {
      code: 'CO',
      title: 'روشن کردن نقش‌ها',
      imageDescription: 'اعضای تیم دور میز و مشخص شدن مسئولیت هر نفر',
      imagePath: '/images/A02_2.jpg',
    },
  },
  {
    id: 'A03',
    card1: {
      code: 'CO',
      title: 'هماهنگ کردن تیم',
      imageDescription: 'فعالیت‌های پراکنده که حول یک هدف مشترک سازماندهی می‌شوند',
      imagePath: '/images/A03_1.jpg',
    },
    card2: {
      code: 'SH',
      title: 'جلو بردن کار',
      imageDescription: 'تیم متوقف شده و یک نفر حرکت بعدی را آغاز می‌کند',
      imagePath: '/images/A03_2.jpg',
    },
  },
  {
    id: 'A04',
    card1: {
      code: 'SH',
      title: 'حرکت دادن تصمیم',
      imageDescription: 'چند گزینه روی میز و یک مسیر برای اقدام انتخاب شده است',
      imagePath: '/images/A04_1.jpg',
    },
    card2: {
      code: 'ME',
      title: 'سنجیدن گزینه‌ها',
      imageDescription: 'چند مسیر همراه با اطلاعات، ریسک و مزایا در حال مقایسه',
      imagePath: '/images/A04_2.jpg',
    },
  },
  {
    id: 'A05',
    card1: {
      code: 'ME',
      title: 'بررسی شواهد',
      imageDescription: 'اطلاعات، نمودارها و اسناد مختلف در حال مقایسه',
      imagePath: '/images/A05_1.jpg',
    },
    card2: {
      code: 'TW',
      title: 'وصل کردن آدم‌ها',
      imageDescription: 'دو عضو تیم اختلاف دارند و نفر سوم گفت‌وگو را برقرار می‌کند',
      imagePath: '/images/A05_2.jpg',
    },
  },
  {
    id: 'A06',
    card1: {
      code: 'TW',
      title: 'حفظ همکاری تیم',
      imageDescription: 'اعضای تیم در حال کمک به یکدیگر برای عبور از مانع',
      imagePath: '/images/A06_1.jpg',
    },
    card2: {
      code: 'IMP',
      title: 'ساختن برنامه عملی',
      imageDescription: 'هدف کلی در حال تبدیل شدن به برنامه، مراحل و کارهای مشخص',
      imagePath: '/images/A06_2.jpg',
    },
  },
  {
    id: 'A07',
    card1: {
      code: 'IMP',
      title: 'تبدیل تصمیم به اجرا',
      imageDescription: 'برنامه روی تخته تبدیل به فعالیت‌های واقعی شده است',
      imagePath: '/images/A07_1.jpg',
    },
    card2: {
      code: 'CF',
      title: 'بستن جزئیات نهایی',
      imageDescription: 'چک‌لیست نهایی و کنترل موارد باقیمانده پیش از تحویل',
      imagePath: '/images/A07_2.jpg',
    },
  },
  {
    id: 'A08',
    card1: {
      code: 'CF',
      title: 'کنترل آخرین جزئیات',
      imageDescription: 'بازبینی دقیق یک خروجی پیش از تحویل',
      imagePath: '/images/A08_1.jpg',
    },
    card2: {
      code: 'SP',
      title: 'رفتن تا عمق مسئله',
      imageDescription: 'نقشه فنی یا مسئله تخصصی پیچیده در حال بررسی عمیق',
      imagePath: '/images/A08_2.jpg',
    },
  },
  {
    id: 'A09',
    card1: {
      code: 'SP',
      title: 'حل بخش تخصصی',
      imageDescription: 'تمرکز عمیق بر یک مسئله تخصصی پیچیده',
      imagePath: '/images/A09_1.jpg',
    },
    card2: {
      code: 'PL',
      title: 'ساختن راه متفاوت',
      imageDescription: 'یک مانع و مسیری جدید که قبلاً وجود نداشته است',
      imagePath: '/images/A09_2.jpg',
    },
  },
  {
    id: 'A10',
    card1: {
      code: 'PL',
      title: 'خلق گزینه‌های تازه',
      imageDescription: 'چند ایده متفاوت برای یک مسئله واحد',
      imagePath: '/images/A10_1.jpg',
    },
    card2: {
      code: 'CO',
      title: 'مشخص کردن مسئولیت‌ها',
      imageDescription: 'کارها میان اعضا به شکل روشن توزیع می‌شوند',
      imagePath: '/images/A10_2.jpg',
    },
  },
  {
    id: 'A11',
    card1: {
      code: 'RI',
      title: 'کشف فرصت تازه',
      imageDescription: 'ارتباط با دنیای بیرون، مشتری، تأمین‌کننده یا متخصص',
      imagePath: '/images/A11_1.jpg',
    },
    card2: {
      code: 'SH',
      title: 'شکستن توقف',
      imageDescription: 'کار متوقف‌شده و آغاز حرکت سریع به سمت هدف',
      imagePath: '/images/A11_2.jpg',
    },
  },
  {
    id: 'A12',
    card1: {
      code: 'CO',
      title: 'جمع کردن تیم حول هدف',
      imageDescription: 'چند نفر و فعالیت مختلف که حول هدف واحد هم‌راستا می‌شوند',
      imagePath: '/images/A12_1.jpg',
    },
    card2: {
      code: 'ME',
      title: 'مقایسه منطقی راه‌ها',
      imageDescription: 'چند گزینه با شواهد و پیامدها در کنار یکدیگر مقایسه می‌شوند',
      imagePath: '/images/A12_2.jpg',
    },
  },
  {
    id: 'A13',
    card1: {
      code: 'SH',
      title: 'فشار برای پیشرفت',
      imageDescription: 'حرکت دادن کار در موقعیتی که تیم کند یا متوقف شده است',
      imagePath: '/images/A13_1.jpg',
    },
    card2: {
      code: 'TW',
      title: 'کم کردن اصطکاک تیم',
      imageDescription: 'گفت‌وگو و نزدیک کردن دو دیدگاه متفاوت در تیم',
      imagePath: '/images/A13_2.jpg',
    },
  },
  {
    id: 'A14',
    card1: {
      code: 'ME',
      title: 'پیدا کردن علت واقعی',
      imageDescription: 'ردگیری داده و شواهد برای یافتن ریشه مسئله',
      imagePath: '/images/A14_1.jpg',
    },
    card2: {
      code: 'IMP',
      title: 'سامان دادن اجرا',
      imageDescription: 'تبدیل کارهای پراکنده به ترتیب و برنامه عملی',
      imagePath: '/images/A14_2.jpg',
    },
  },
  {
    id: 'A15',
    card1: {
      code: 'TW',
      title: 'کمک به همکاری',
      imageDescription: 'کمک به اعضای تیم برای هماهنگی و پشتیبانی از یکدیگر',
      imagePath: '/images/A15_1.jpg',
    },
    card2: {
      code: 'CF',
      title: 'اطمینان از کامل بودن',
      imageDescription: 'کنترل نهایی برای اطمینان از نبودن کار باز یا خطای باقیمانده',
      imagePath: '/images/A15_2.jpg',
    },
  },
  {
    id: 'A16',
    card1: {
      code: 'IMP',
      title: 'ساختن فرآیند اجرایی',
      imageDescription: 'ایجاد توالی روشن مراحل برای اجرای یک هدف',
      imagePath: '/images/A16_1.jpg',
    },
    card2: {
      code: 'SP',
      title: 'حل مسئله تخصصی',
      imageDescription: 'تمرکز بر بخش فنی یا دانشی پیچیده مسئله',
      imagePath: '/images/A16_2.jpg',
    },
  },
  {
    id: 'A17',
    card1: {
      code: 'CF',
      title: 'پیدا کردن نقص باقیمانده',
      imageDescription: 'کشف یک ایراد کوچک اما مهم پیش از تحویل',
      imagePath: '/images/A17_1.jpg',
    },
    card2: {
      code: 'PL',
      title: 'بازطراحی راه‌حل',
      imageDescription: 'بازنگری کامل در مسیر و طراحی راه متفاوت',
      imagePath: '/images/A17_2.jpg',
    },
  },
  {
    id: 'A18',
    card1: {
      code: 'SP',
      title: 'تمرکز بر دانش تخصصی',
      imageDescription: 'کار عمیق با دانش و جزئیات تخصصی',
      imagePath: '/images/A18_1.jpg',
    },
    card2: {
      code: 'RI',
      title: 'پیدا کردن منبع تازه',
      imageDescription: 'جست‌وجوی یک فرد، منبع یا ارتباط تازه برای حل مسئله',
      imagePath: '/images/A18_2.jpg',
    },
  },
];

export const SECTION_B_SCENARIOS: ScenarioB[] = [
  {
    id: 'B01',
    title: 'پروژه عقب‌افتاده',
    context:
      'تا موعد تحویل فقط دو روز باقی مانده است. بخشی از پروژه عقب است و تیم درباره علت اصلی آن اتفاق‌نظر ندارد.',
    options: [
      {
        code: 'PL',
        text: 'یک مسیر متفاوت برای رسیدن به نتیجه طراحی می‌کنم.',
      },
      {
        code: 'CO',
        text: 'مشخص می‌کنم چه کسی مسئول هر قسمت است و تصمیم‌ها را یکپارچه می‌کنم.',
      },
      {
        code: 'IMP',
        text: 'کار باقیمانده را به فعالیت‌های مشخص و یک برنامه جدید تبدیل می‌کنم.',
      },
      {
        code: 'ME',
        text: 'اول داده‌ها و گلوگاه واقعی را بررسی می‌کنم.',
      },
    ],
  },
  {
    id: 'B02',
    title: 'یک فرصت جدید',
    context:
      'مشتری پیشنهادی داده که می‌تواند پروژه بزرگی ایجاد کند، اما زمان پاسخ بسیار محدود است.',
    options: [
      {
        code: 'RI',
        text: 'سریع با افراد و منابع مرتبط بیرون از تیم تماس می‌گیرم.',
      },
      {
        code: 'SH',
        text: 'یک حرکت اولیه تعریف می‌کنم تا فرصت از دست نرود.',
      },
      {
        code: 'TW',
        text: 'مطمئن می‌شوم اعضای تیم نگرانی‌ها و اطلاعاتشان را مطرح کرده‌اند.',
      },
      {
        code: 'CF',
        text: 'پیش از ارسال پاسخ، جزئیات و تعهدات را دقیق کنترل می‌کنم.',
      },
    ],
  },
  {
    id: 'B03',
    title: 'مسئله فنی ناشناخته',
    context:
      'تیم با مسئله‌ای روبه‌رو شده که تجربه قبلی درباره آن کم است.',
    options: [
      {
        code: 'SP',
        text: 'بخش تخصصی مسئله را عمیق بررسی می‌کنم.',
      },
      {
        code: 'PL',
        text: 'یک راه متفاوت و غیرمعمول طراحی می‌کنم.',
      },
      {
        code: 'CO',
        text: 'افراد مناسب را کنار هم می‌آورم و مشخص می‌کنم چه کسی چه چیزی را بررسی کند.',
      },
      {
        code: 'IMP',
        text: 'مسئله را به چند اقدام عملی کوچک‌تر تبدیل می‌کنم.',
      },
    ],
  },
  {
    id: 'B04',
    title: 'اختلاف تیم',
    context:
      'دو نفر از اعضای اصلی تیم درباره تصمیم آینده اختلاف جدی دارند و اطلاعات هم کاملاً روشن نیست.',
    options: [
      {
        code: 'ME',
        text: 'ادعاها را از شواهد جدا می‌کنم و اطلاعات موجود را می‌سنجم.',
      },
      {
        code: 'RI',
        text: 'نمونه یا تجربه‌ای خارج از تیم پیدا می‌کنم که بتواند مسئله را روشن کند.',
      },
      {
        code: 'SH',
        text: 'برای تصمیم زمان مشخص تعیین می‌کنم تا تیم از توقف خارج شود.',
      },
      {
        code: 'TW',
        text: 'فضایی ایجاد می‌کنم که هر دو طرف حرفشان را کامل مطرح کنند.',
      },
    ],
  },
  {
    id: 'B05',
    title: 'تغییر دقیقه آخر',
    context:
      'در آستانه تحویل، مشتری یک تغییر مهم درخواست کرده است.',
    options: [
      {
        code: 'CF',
        text: 'اثر تغییر را روی جزئیات، خطاها و کیفیت نهایی بررسی می‌کنم.',
      },
      {
        code: 'SP',
        text: 'پیامد تخصصی تغییر را بررسی می‌کنم.',
      },
      {
        code: 'PL',
        text: 'راهی متفاوت پیدا می‌کنم که خواسته جدید با کمترین تغییر ممکن اجرا شود.',
      },
      {
        code: 'CO',
        text: 'اولویت‌ها و مسئولیت‌ها را دوباره با تیم روشن می‌کنم.',
      },
    ],
  },
  {
    id: 'B06',
    title: 'مشکل تکرارشونده در عملیات',
    context:
      'یک خطا برای سومین بار در فرآیند رخ داده است.',
    options: [
      {
        code: 'IMP',
        text: 'فرآیند را اصلاح و روش اجرایی مشخصی تعریف می‌کنم.',
      },
      {
        code: 'ME',
        text: 'داده‌ها را بررسی می‌کنم تا علت اصلی از حدس‌ها جدا شود.',
      },
      {
        code: 'RI',
        text: 'تجربه مجموعه‌های دیگر یا متخصصان بیرونی را پیدا می‌کنم.',
      },
      {
        code: 'SH',
        text: 'برای مهار فوری مسئله تصمیم می‌گیرم و مسئول اقدام را مشخص می‌کنم.',
      },
    ],
  },
  {
    id: 'B07',
    title: 'تیم خسته',
    context:
      'چند هفته فشار کاری باعث افت انرژی و افزایش اشتباهات شده است.',
    options: [
      {
        code: 'TW',
        text: 'ابتدا اصطکاک‌ها و فشارهای میان اعضای تیم را بررسی می‌کنم.',
      },
      {
        code: 'CF',
        text: 'موارد باز و ناتمام را جمع می‌کنم تا دوباره‌کاری کمتر شود.',
      },
      {
        code: 'SP',
        text: 'بخش پیچیده‌ای را که تخصص من در آن کمک می‌کند شخصاً برمی‌دارم.',
      },
      {
        code: 'PL',
        text: 'روش متفاوتی برای انجام کار طراحی می‌کنم که فشار را کاهش دهد.',
      },
    ],
  },
  {
    id: 'B08',
    title: 'شروع پروژه با زمان محدود',
    context:
      'قرار است پروژه‌ای تازه سریع شروع شود و هنوز همه چیز مشخص نیست.',
    options: [
      {
        code: 'CO',
        text: 'هدف، نقش‌ها و مسئولیت تصمیم‌ها را روشن می‌کنم.',
      },
      {
        code: 'IMP',
        text: 'یک برنامه اجرایی اولیه می‌سازم تا کار شروع شود.',
      },
      {
        code: 'ME',
        text: 'فرضیات و ریسک‌های اصلی را بررسی می‌کنم.',
      },
      {
        code: 'RI',
        text: 'منابع و ارتباطات بیرونی موردنیاز را سریع پیدا می‌کنم.',
      },
    ],
  },
  {
    id: 'B09',
    title: 'اختلاف نظر تخصصی',
    context:
      'دو متخصص درباره بهترین راه‌حل به جمع‌بندی نمی‌رسند.',
    options: [
      {
        code: 'SH',
        text: 'معیار تصمیم و زمان نهایی انتخاب را مشخص می‌کنم.',
      },
      {
        code: 'TW',
        text: 'کمک می‌کنم اختلاف نظر تبدیل به گفت‌وگوی سازنده شود.',
      },
      {
        code: 'CF',
        text: 'جزئیات دو گزینه را با الزامات نهایی تطبیق می‌دهم.',
      },
      {
        code: 'SP',
        text: 'موضوع را از نظر تخصصی عمیق‌تر بررسی می‌کنم.',
      },
    ],
  },
];

export const SECTION_C_MINIGAMES: MiniGameC[] = [
  {
    id: 'C01',
    title: 'پروژه‌ای تازه به شما داده شده است',
    prompt: 'اگر اختیار داشته باشید، کدام سه کار را زودتر برمی‌دارید؟',
    cards: [
      { code: 'PL', text: 'چند راه متفاوت برای انجام پروژه طراحی کنم.' },
      { code: 'RI', text: 'افراد، ارتباطات و منابع مفید بیرون از تیم را پیدا کنم.' },
      { code: 'CO', text: 'هدف و مسئولیت اعضا را روشن کنم.' },
      { code: 'SH', text: 'اولین نقطه حرکت را مشخص کنم تا کار جلو بیفتد.' },
      { code: 'ME', text: 'فرضیات و ریسک‌های اصلی را بررسی کنم.' },
      { code: 'TW', text: 'مطمئن شوم اعضای تیم برای همکاری آماده‌اند.' },
      { code: 'IMP', text: 'هدف را به برنامه و فعالیت‌های مشخص تبدیل کنم.' },
      { code: 'CF', text: 'معیارهای کیفیت و کنترل نهایی را مشخص کنم.' },
      { code: 'SP', text: 'الزامات تخصصی پروژه را عمیق بررسی کنم.' },
    ],
  },
  {
    id: 'C02',
    title: 'پروژه گیر کرده است',
    prompt: 'کدام سه اقدام احتمالاً بیشتر به شما سپرده می‌شود یا خودتان برمی‌دارید؟',
    cards: [
      { code: 'PL', text: 'طراحی یک راه کاملاً متفاوت' },
      { code: 'RI', text: 'پیدا کردن تجربه یا منبع بیرونی' },
      { code: 'CO', text: 'بازتنظیم مسئولیت اعضای تیم' },
      { code: 'SH', text: 'شکستن توقف و ایجاد حرکت' },
      { code: 'ME', text: 'تشخیص علت واقعی بر اساس شواهد' },
      { code: 'TW', text: 'کاهش تنش و برگرداندن همکاری' },
      { code: 'IMP', text: 'بازطراحی برنامه اجرایی' },
      { code: 'CF', text: 'پیدا کردن خطاها و کارهای ناتمام' },
      { code: 'SP', text: 'حل پیچیده‌ترین بخش تخصصی' },
    ],
  },
  {
    id: 'C03',
    title: 'فقط ۲۴ ساعت تا تحویل مانده است',
    prompt: 'سه کاری که احتمال بیشتری دارد شخصاً به آنها ورود کنید کدام است؟',
    cards: [
      { code: 'PL', text: 'پیدا کردن یک راه جایگزین' },
      { code: 'RI', text: 'پیدا کردن فوری یک منبع یا ارتباط کمکی' },
      { code: 'CO', text: 'هماهنگ کردن مسئولان بخش‌های باقیمانده' },
      { code: 'SH', text: 'تصمیم درباره اینکه چه چیزی باید فوراً جلو برود' },
      { code: 'ME', text: 'بررسی مهم‌ترین ریسک یا فرضیه' },
      { code: 'TW', text: 'کمک به عضوی که تبدیل به گلوگاه شده است' },
      { code: 'IMP', text: 'جلو بردن برنامه نهایی اجرا' },
      { code: 'CF', text: 'کنترل آخرین خطاها قبل از تحویل' },
      { code: 'SP', text: 'اعتبارسنجی بخش فنی حساس' },
    ],
  },
];

// Balance verification functions
export function verifyBalanceSectionA(): { isBalanced: boolean; counts: Record<RoleCode, number> } {
  const counts = ROLE_CODES_LIST.reduce((acc, code) => {
    acc[code] = 0;
    return acc;
  }, {} as Record<RoleCode, number>);

  for (const item of SECTION_A_ITEMS) {
    counts[item.card1.code]++;
    counts[item.card2.code]++;
  }

  const isBalanced = Object.values(counts).every((c) => c === 4);
  return { isBalanced, counts };
}

export function verifyBalanceSectionB(): { isBalanced: boolean; counts: Record<RoleCode, number> } {
  const counts = ROLE_CODES_LIST.reduce((acc, code) => {
    acc[code] = 0;
    return acc;
  }, {} as Record<RoleCode, number>);

  for (const scenario of SECTION_B_SCENARIOS) {
    for (const option of scenario.options) {
      counts[option.code]++;
    }
  }

  const isBalanced = Object.values(counts).every((c) => c === 4);
  return { isBalanced, counts };
}

export function verifyBalanceSectionC(): { isBalanced: boolean; counts: Record<RoleCode, number> } {
  const counts = ROLE_CODES_LIST.reduce((acc, code) => {
    acc[code] = 0;
    return acc;
  }, {} as Record<RoleCode, number>);

  for (const game of SECTION_C_MINIGAMES) {
    for (const card of game.cards) {
      counts[card.code]++;
    }
  }

  const isBalanced = Object.values(counts).every((c) => c === 3);
  return { isBalanced, counts };
}
