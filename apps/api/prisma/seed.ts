/**
 * Seed script — loads the full alcha.dev copy deck (RU verbatim, EN natural
 * translations) plus the admin user. The site looks finished right after this.
 *
 * Idempotent: content tables are wiped and recreated on every run; the admin
 * user is upserted; leads and media assets are left untouched.
 *
 * TODO(dastan): a few pieces are reconstructed from the brief because the hi-fi
 * design file was not available at build time — swap them for the verbatim text
 * from `Homepage Directions.dc.html` (section 3a):
 *   - the case-page bullet lists for Chaban / Kit Store,
 *   - the real contact handles in SiteSettings.
 */
import { PrismaClient, ProjectBadge } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_CHROME } from '@alcha/shared';

const prisma = new PrismaClient();

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@alcha.dev';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123';
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, role: 'ADMIN' },
  });
  console.log(`✓ Admin user ready: ${email}`);
}

async function wipeContent(): Promise<void> {
  // Parent deletes cascade to their translation rows.
  await prisma.$transaction([
    prisma.service.deleteMany(),
    prisma.project.deleteMany(),
    prisma.pricingPlan.deleteMany(),
    prisma.seoMeta.deleteMany(),
    prisma.homeContent.deleteMany(),
    prisma.siteChrome.deleteMany(),
    prisma.siteSettings.deleteMany(),
    // A visual-editor draft forked from the old content would republish it.
    prisma.contentDraft.deleteMany(),
  ]);
}

async function seedSettings(): Promise<void> {
  await prisma.siteSettings.create({
    data: {
      email: 'dastan.rakhmanzhanov@gmail.com',
      telegram: 'https://t.me/rakhmanzhanov', // TODO(dastan): real Telegram handle
      whatsapp: 'https://wa.me/996706304803', // TODO(dastan): real WhatsApp number
      github: 'https://github.com/dastan0017', // TODO(dastan): real GitHub username
      linkedin: 'https://www.linkedin.com/in/dastan-rakhmanzhanov', // TODO(dastan)
      instagram: 'https://www.instagram.com/dastich_fantastich_r',
      cvUrl: '/cv/dastan-rakhmanzhanov.pdf', // TODO(dastan): upload real CV in the CRM
      addressLocality: 'Bishkek',
      addressRegion: 'Chüy',
      addressCountry: 'KG',
      priceRange: '$300+',
      gaId: null,
      yandexMetrikaId: null,
    },
  });
  console.log('✓ Site settings');
}

async function seedChrome(): Promise<void> {
  await prisma.siteChrome.create({
    data: {
      translations: {
        create: [
          { locale: 'ru', ...DEFAULT_CHROME.ru },
          { locale: 'en', ...DEFAULT_CHROME.en },
        ],
      },
    },
  });
  console.log('✓ Site chrome');
}

async function seedHome(): Promise<void> {
  await prisma.homeContent.create({
    data: {
      published: true,
      translations: {
        create: [
          {
            locale: 'ru',
            eyebrow: 'САЙТЫ · ЗАЯВКИ · ПОД КЛЮЧ',
            heroTitle: 'Сайты, которые помогают бизнесу получать клиентов',
            heroSubtitle:
              'Вы получаете готовый сайт и простую панель, где сами меняете тексты, цены и фото. Заявки с сайта, WhatsApp и Instagram собираются в одном месте, чтобы ни один клиент не потерялся.',
            heroSubtitleMobile:
              'Готовый сайт и простая панель: тексты, цены и фото меняете сами. Заявки с сайта, WhatsApp и Instagram — в одном месте.',
            heroBullets: [
              'Дизайн и тексты, которым доверяют',
              'Вас находят в Google (SEO)',
              'Меняете сайт сами, без программиста (CMS)',
              'Все заявки и клиенты в одном месте (CRM)',
            ],
            heroNote: 'От $300 · Запуск от 1 недели',
            heroCtaPrimary: 'Обсудить проект',
            heroCtaSecondary: 'Смотреть работы ↓',
            servicesEyebrow: 'УСЛУГИ',
            servicesHeading: 'От первого макета до запуска и передачи ключей',
            servicesLede:
              'Сайт продают не технологии, а дизайн и тексты. Остальное уже включено: быстрый код, SEO, CRM и сервер.',
            servicesSecondaryLabel: 'И ВСЕГДА В КОМПЛЕКТЕ',
            worksEyebrow: 'РАБОТЫ',
            worksHeading: 'Работы',
            worksLede:
              'Каждый проект — от начала до конца лично мной. Беру немного клиентов, поэтому каждому — максимум внимания.',
            pricingEyebrow: 'ЦЕНЫ',
            pricingHeading: 'Сколько это стоит',
            pricingNote: 'Точная смета — за 24 часа после первого разговора',
            pricingFootnote:
              'Рассрочка 50 / 30 / 20 — по этапам: 50% на старте, 30% после утверждения дизайна, 20% при запуске.',
            ctaTitle: 'Опишите задачу в двух словах.',
            ctaSubtitle: 'Отвечу сегодня. Смета и план — за 24 часа.',
            ctaTelegramLabel: 'Написать в Telegram',
            ctaWhatsappLabel: 'Написать в WhatsApp',
          },
          {
            locale: 'en',
            eyebrow: 'WEBSITES · LEADS · TURNKEY',
            heroTitle: 'Websites that help your business win customers',
            heroSubtitle:
              'You get a finished website and a simple panel where you change the texts, prices and photos yourself. Leads from the site, WhatsApp and Instagram all land in one place, so no customer gets lost.',
            heroSubtitleMobile:
              'A finished website and a simple panel: change texts, prices and photos yourself. Leads from the site, WhatsApp and Instagram — in one place.',
            heroBullets: [
              'Design and copy people trust',
              'Clients find you in Google (SEO)',
              'Edit the site yourself, no developer (CMS)',
              'All leads and clients in one place (CRM)',
            ],
            heroNote: 'From $300 · Launch from 1 week',
            heroCtaPrimary: 'Discuss a project',
            heroCtaSecondary: 'See the work ↓',
            servicesEyebrow: 'SERVICES',
            servicesHeading: 'From the first mockup to launch and handover',
            servicesLede:
              'Websites aren’t sold by technology — they’re sold by design and copy. Everything else is already included: fast code, SEO, a CRM and the server.',
            servicesSecondaryLabel: 'AND ALWAYS INCLUDED',
            worksEyebrow: 'WORK',
            worksHeading: 'Selected work',
            worksLede:
              'Every project is done end to end by me personally. I take on few clients, so each one gets my full attention.',
            pricingEyebrow: 'PRICING',
            pricingHeading: 'How much it costs',
            pricingNote: 'A precise quote within 24 hours of our first conversation',
            pricingFootnote:
              '50 / 30 / 20 instalments — by stage: 50% up front, 30% once the design is approved, 20% at launch.',
            ctaTitle: 'Describe your project in a few words.',
            ctaSubtitle: 'I’ll reply today. A quote and a plan — within 24 hours.',
            ctaTelegramLabel: 'Message on Telegram',
            ctaWhatsappLabel: 'Message on WhatsApp',
          },
        ],
      },
    },
  });
  console.log('✓ Home content');
}

async function seedServices(): Promise<void> {
  const services = [
    {
      number: '01',
      sortOrder: 0,
      featured: true,
      ru: {
        title: 'Дизайн и тексты',
        description:
          'Дизайн и тексты, которые превращают посетителей в клиентов, — а не просто «красиво». Этим занимаюсь лично и глубже всего.',
        badge: 'МОЯ ГЛАВНАЯ СИЛА',
        bullets: [
          'Макет — до начала разработки',
          'Тексты — на языке ваших клиентов',
          'Правки — пока не скажете «да»',
        ],
        techLine: '',
      },
      en: {
        title: 'Design & copy',
        description:
          'Design and copy that turn visitors into customers — not just something that “looks nice”. This is what I do personally, and go deepest on.',
        badge: 'MY CORE STRENGTH',
        bullets: [
          'A mockup — before development starts',
          'Copy — in your customers’ language',
          'Revisions — until you say “yes”',
        ],
        techLine: '',
      },
    },
    {
      number: '02',
      sortOrder: 1,
      featured: false,
      ru: {
        title: 'Разработка + SEO',
        description: 'Сайт грузится мгновенно и виден в Google — клиенты находят вас сами.',
        badge: '',
        bullets: ['Lighthouse 95+', 'Идеально на телефоне'],
        techLine: 'React · Next.js · TypeScript',
      },
      en: {
        title: 'Development + SEO',
        description: 'The site loads instantly and is visible in Google — clients find you themselves.',
        badge: '',
        bullets: ['Lighthouse 95+', 'Flawless on mobile'],
        techLine: 'React · Next.js · TypeScript',
      },
    },
    {
      number: '03',
      sortOrder: 2,
      featured: false,
      ru: {
        title: 'CRM и контент',
        description:
          'Меняете тексты, фото и цены сами — без программиста. CRM считает заявки и продажи.',
        badge: '',
        bullets: ['Обновления — без разработчика', 'Отчёты и цифры бизнеса'],
        techLine: '',
      },
      en: {
        title: 'CRM & content',
        description:
          'Change text, photos and prices yourself — no developer needed. The CRM counts leads and sales.',
        badge: '',
        bullets: ['Updates — without a developer', 'Reports and business numbers'],
        techLine: '',
      },
    },
    {
      number: '04',
      sortOrder: 3,
      featured: false,
      ru: {
        title: 'Сервер и передача',
        description: 'Запускаю на вашем домене и отдаю все доступы. Всё — ваше.',
        badge: '',
        bullets: ['Сервер и домен — на вас', 'Код и доступы — ваши'],
        techLine: '',
      },
      en: {
        title: 'Server & handover',
        description: 'I launch on your domain and hand over every credential. Everything is yours.',
        badge: '',
        bullets: ['Server and domain — in your name', 'Code and access — yours'],
        techLine: '',
      },
    },
  ];

  for (const s of services) {
    await prisma.service.create({
      data: {
        number: s.number,
        sortOrder: s.sortOrder,
        published: true,
        featured: s.featured,
        translations: {
          create: [
            { locale: 'ru', ...s.ru },
            { locale: 'en', ...s.en },
          ],
        },
      },
    });
  }
  console.log(`✓ Services (${services.length})`);
}

async function seedPricing(): Promise<void> {
  const plans = [
    {
      sortOrder: 0,
      highlighted: false,
      ru: {
        name: 'Лендинг',
        priceLabel: 'от $300',
        termLine: '1–2 НЕДЕЛИ',
        highlightLabel: '',
        description: 'Одна страница, которая продаёт вашу услугу — а не просто «есть в интернете».',
        features: [
          'Тексты, которые продают',
          'SEO — вас находят в Google',
          'Заявки с сайта — сразу вам в Telegram',
          'Быстрый, идеальный на телефоне',
          'Сервер и домен — доступы ваши',
        ],
      },
      en: {
        name: 'Landing page',
        priceLabel: 'from $300',
        termLine: '1–2 WEEKS',
        highlightLabel: '',
        description: 'A single page that sells your service — not just “being online.”',
        features: [
          'Copy that sells',
          'SEO — clients find you in Google',
          'Leads from the site — straight to your Telegram',
          'Fast, flawless on mobile',
          'Server & domain — access is yours',
        ],
      },
    },
    {
      sortOrder: 1,
      highlighted: true,
      ru: {
        name: 'Сайт с админкой',
        priceLabel: 'от $700',
        termLine: '3–6 НЕДЕЛЬ · РАССРОЧКА 50 / 30 / 20',
        highlightLabel: 'ЧАЩЕ ВСЕГО ВЫБИРАЮТ',
        description: '3–7 страниц: сайт живёт и обновляется без программиста.',
        features: [
          'Всё из тарифа «Лендинг»',
          'Структура под ваш бизнес: услуги, о компании, контакты',
          'Админка: тексты, фото и цены меняете сами',
          'Показываю, как всем управлять',
          'Блог для SEO — добавлю в смету, если нужен',
        ],
      },
      en: {
        name: 'Website with an admin panel',
        priceLabel: 'from $700',
        termLine: '3–6 WEEKS · 50 / 30 / 20 INSTALMENTS',
        highlightLabel: 'MOST POPULAR',
        description: '3–7 pages: the site lives and updates without a developer.',
        features: [
          'Everything in “Landing page”',
          'Structure built around your business: services, about, contacts',
          'Admin panel: change text, photos and prices yourself',
          'I show you how to run all of it',
          'A blog for SEO — added to the quote if you need one',
        ],
      },
    },
    {
      sortOrder: 2,
      highlighted: false,
      ru: {
        name: 'Индивидуальный',
        priceLabel: 'от $1 500',
        termLine: 'СРОК И РАССРОЧКА — ПО ЗАДАЧЕ',
        highlightLabel: '',
        description: 'Сайт + CRM под вашу задачу: заказы, клиенты, интеграции.',
        features: [
          'Всё из тарифа «Сайт с админкой»',
          'CRM: заказы, клиенты, отчёты — цифры бизнеса перед глазами',
          'Интеграции: платежи, WhatsApp, Telegram',
          'Мобильное приложение — если нужно (App Store + Google Play)',
        ],
      },
      en: {
        name: 'Custom',
        priceLabel: 'from $1,500',
        termLine: 'TIMELINE & INSTALMENTS — PER SCOPE',
        highlightLabel: '',
        description: 'Website + CRM for your task: orders, clients, integrations.',
        features: [
          'Everything in “Website with an admin panel”',
          'CRM: orders, clients, reports — your business numbers at a glance',
          'Integrations: payments, WhatsApp, Telegram',
          'A mobile app — if you need one (App Store + Google Play)',
        ],
      },
    },
  ];

  for (const p of plans) {
    await prisma.pricingPlan.create({
      data: {
        sortOrder: p.sortOrder,
        highlighted: p.highlighted,
        published: true,
        translations: {
          create: [
            { locale: 'ru', ...p.ru },
            { locale: 'en', ...p.en },
          ],
        },
      },
    });
  }
  console.log(`✓ Pricing plans (${plans.length})`);
}

async function seedProjects(): Promise<void> {
  const projects = [
    {
      slug: 'alcha-dev',
      badgeType: ProjectBadge.own,
      sortOrder: 0,
      showOnHome: true,
      ru: {
        title: 'alcha.dev',
        badge: 'ЭТОТ САЙТ',
        typeTag: '',
        metaLine:
          'Портфолио и витрина услуг — сайт, на котором вы сейчас находитесь. Спроектирован, написан и запущен целиком мной: от текстов и дизайна до сервера.',
        factsLine: 'Lighthouse 95+ · два языка (RU / EN) · заявки — в Telegram',
        role: 'Свой продукт · дизайн, разработка и сервер',
        description:
          'Портфолио и витрина услуг — сайт, на котором вы сейчас находитесь. Спроектирован, написан и запущен целиком мной: от текстов и дизайна до сервера. Статическая генерация, две языковые версии и CRM для управления контентом без программиста.',
        pills: ['Дизайн и тексты', 'SEO', 'Сервер и передача'],
        bullets: [],
        techChips: ['React', 'Next.js', 'TypeScript'],
        seoTitle: 'alcha.dev — портфолио и услуги',
        seoDescription:
          'Портфолио и витрина услуг: дизайн, разработка, SEO и CRM. Спроектирован и запущен целиком мной.',
      },
      en: {
        title: 'alcha.dev',
        badge: 'THIS SITE',
        typeTag: '',
        metaLine:
          'A portfolio and services showcase — the very site you’re on now. Designed, written and shipped entirely by me: from copy and design to the server.',
        factsLine: 'Lighthouse 95+ · two languages (RU / EN) · leads — to Telegram',
        role: 'Own product · design, development and server',
        description:
          'A portfolio and services showcase — the very site you’re on now. Designed, written and shipped entirely by me: from copy and design to the server. Static generation, two language versions and a CRM to manage content without a developer.',
        pills: ['Design & copy', 'SEO', 'Server & handover'],
        bullets: [],
        techChips: ['React', 'Next.js', 'TypeScript'],
        seoTitle: 'alcha.dev — portfolio and services',
        seoDescription:
          'A portfolio and services showcase: design, development, SEO and a CRM. Designed and shipped entirely by me.',
      },
    },
    {
      slug: 'chaban',
      badgeType: ProjectBadge.own,
      sortOrder: 1,
      showOnHome: true,
      ru: {
        title: 'Чабан',
        badge: 'APP STORE + GOOGLE PLAY',
        typeTag: 'СОБСТВЕННЫЙ ПРОДУКТ',
        metaLine:
          'Заводчики арашанских овец искали племенных животных через знакомых и базары. Теперь — карта проверенных ферм, электронные родословные и объявления «на племя» в одном приложении: покупка породы стала прозрачной.',
        // TODO(dastan): подставьте реальные цифры (×× ферм / родословных).
        factsLine: 'Карта проверенных ферм · электронные родословные · календарь ухода за стадом',
        role: 'Свой продукт · дизайн, разработка, сервер',
        description:
          'Заводчики арашанских овец искали племенных животных через знакомых и базары. Теперь — карта проверенных ферм, электронные родословные и объявления «на племя» в одном приложении: покупка породы стала прозрачной.',
        pills: [
          'Мобильное приложение (iOS + Android)',
          'Админка',
          'Карта ферм',
          'Вход по WhatsApp-коду',
        ],
        bullets: [
          'Карта проверенных ферм с профилями хозяйств',
          'Электронные родословные животных',
          'Объявления «на племя» и база знаний',
          'Календарь ухода за стадом с напоминаниями',
          'Админ-панель для модерации и контента',
        ],
        techChips: ['React Native', 'Expo', 'NestJS', 'GraphQL', 'PostgreSQL'],
        seoTitle: 'Чабан — приложение для заводчиков овец',
        seoDescription:
          'Сообщество заводчиков арашанских овец: карта ферм, родословные, объявления и календарь ухода за стадом.',
      },
      en: {
        title: 'Chaban',
        badge: 'APP STORE + GOOGLE PLAY',
        typeTag: 'OWN PRODUCT',
        metaLine:
          'Arashan sheep breeders used to find breeding animals through acquaintances and markets. Now a map of verified farms, digital pedigrees and breeding listings live in one app — buying a breed became transparent.',
        factsLine: 'Verified farm map · digital pedigrees · herd-care calendar',
        role: 'Own product · design, development, server',
        description:
          'Arashan sheep breeders used to find breeding animals through acquaintances and markets. Now a map of verified farms, digital pedigrees and breeding listings live in one app — buying a breed became transparent.',
        pills: [
          'Mobile app (iOS + Android)',
          'Admin panel',
          'Farm map',
          'WhatsApp-code login',
        ],
        bullets: [
          'A map of verified farms with ranch profiles',
          'Digital pedigrees for animals',
          'Breeding listings and a knowledge base',
          'A herd-care calendar with reminders',
          'An admin panel for moderation and content',
        ],
        techChips: ['React Native', 'Expo', 'NestJS', 'GraphQL', 'PostgreSQL'],
        seoTitle: 'Chaban — an app for sheep breeders',
        seoDescription:
          'A community for Arashan sheep breeders: farm map, pedigrees, listings and a herd-care calendar.',
      },
    },
    {
      slug: 'kit-store',
      badgeType: ProjectBadge.work,
      sortOrder: 2,
      showOnHome: true,
      ru: {
        title: 'Kit Store',
        badge: 'APP STORE + GOOGLE PLAY',
        typeTag: 'КЛИЕНТСКИЙ ПРОЕКТ',
        metaLine:
          'Магазины заказывают товар у дистрибьютора прямо с телефона — как в интернет-магазине. Раньше заказы собирали торговые агенты вручную; теперь каталог, заказы и клиенты — в CRM у менеджеров.',
        // TODO(dastan): подставьте реальные цифры (×× магазинов-партнёров).
        factsLine: 'Магазины заказывают сами · заказы без звонков · уведомления в WhatsApp',
        role: 'Клиентский проект · мобильное приложение, CRM и сервер',
        description:
          'Магазины заказывают товар у дистрибьютора прямо с телефона — как в интернет-магазине. Раньше заказы собирали торговые агенты вручную; теперь каталог, заказы и клиенты — в CRM у менеджеров.',
        pills: [
          'Мобильное приложение (iOS + Android)',
          'CRM для персонала',
          'Каталог и заказы',
          'Сервер и передача',
        ],
        bullets: [
          'Магазины-партнёры оформляют заказы сами',
          'Менеджеры ведут каталог, заказы и клиентов в CRM',
          'Уведомления о заказах в WhatsApp',
          'Аналитика продаж и остатков',
          'Развёртывание и поддержка на сервере',
        ],
        techChips: ['React Native', 'Expo', 'React', 'NestJS', 'GraphQL', 'PostgreSQL'],
        seoTitle: 'Kit Store — приложение и CRM для дистрибьютора',
        seoDescription:
          'Магазины заказывают у дистрибьютора с телефона; каталог, заказы и клиенты — в CRM у менеджеров.',
      },
      en: {
        title: 'Kit Store',
        badge: 'APP STORE + GOOGLE PLAY',
        typeTag: 'CLIENT PROJECT',
        metaLine:
          'Stores order goods from the distributor straight from their phone — like an online shop. Orders used to be collected by sales reps by hand; now the catalogue, orders and clients live in the managers’ CRM.',
        factsLine: 'Stores order themselves · orders without calls · WhatsApp notifications',
        role: 'Client project · mobile app, CRM and server',
        description:
          'Stores order goods from the distributor straight from their phone — like an online shop. Orders used to be collected by sales reps by hand; now the catalogue, orders and clients live in the managers’ CRM.',
        pills: [
          'Mobile app (iOS + Android)',
          'CRM for staff',
          'Catalogue & orders',
          'Server & handover',
        ],
        bullets: [
          'Partner stores place orders themselves',
          'Managers run the catalogue, orders and clients in a CRM',
          'Order notifications via WhatsApp',
          'Sales and stock analytics',
          'Deployment and maintenance on the server',
        ],
        techChips: ['React Native', 'Expo', 'React', 'NestJS', 'GraphQL', 'PostgreSQL'],
        seoTitle: 'Kit Store — app and CRM for a distributor',
        seoDescription:
          'Stores order from the distributor by phone; the catalogue, orders and clients live in the managers’ CRM.',
      },
    },
  ];

  for (const p of projects) {
    await prisma.project.create({
      data: {
        slug: p.slug,
        badgeType: p.badgeType,
        sortOrder: p.sortOrder,
        showOnHome: p.showOnHome,
        published: true,
        screenshots: [],
        coverImage: null,
        translations: {
          create: [
            { locale: 'ru', ...p.ru },
            { locale: 'en', ...p.en },
          ],
        },
      },
    });
  }
  console.log(`✓ Projects (${projects.length})`);
}

async function seedSeo(): Promise<void> {
  const metas = [
    {
      page: 'home' as const,
      locale: 'ru' as const,
      title: 'Создание сайтов в Бишкеке — alcha.dev',
      description:
        'Разработка сайтов, CRM и веб-приложений под ключ в Бишкеке. React, Next.js, SEO и удобная админка. Обсудим ваш проект.',
      keywords: [
        'создание сайтов Бишкек',
        'разработка сайтов Бишкек',
        'заказать сайт Бишкек',
        'сайт под ключ Бишкек',
        'разработка CRM Кыргызстан',
        'веб-разработка Кыргызстан',
        'мобильное приложение на заказ Бишкек',
      ],
    },
    {
      page: 'home' as const,
      locale: 'en' as const,
      title: 'Website Development in Bishkek — alcha.dev',
      description:
        'Turnkey website, CRM and web-app development in Bishkek. React, Next.js, SEO and a friendly admin panel. Let’s discuss your project.',
      keywords: [
        'website development Bishkek',
        'web developer Kyrgyzstan',
        'hire React developer Bishkek',
        'Next.js developer Kyrgyzstan',
      ],
    },
  ];

  for (const m of metas) {
    await prisma.seoMeta.create({ data: { ...m, ogImageUrl: null } });
  }
  console.log(`✓ SEO meta (${metas.length})`);
}

async function main(): Promise<void> {
  console.log('Seeding alcha.dev…');
  await seedAdmin();
  await wipeContent();
  await seedSettings();
  await seedChrome();
  await seedHome();
  await seedServices();
  await seedPricing();
  await seedProjects();
  await seedSeo();
  console.log('Done ✓');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
