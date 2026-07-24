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
 *   - the About bio paragraph,
 *   - the Kurabu / Chargers project cards (role lines, descriptions, bullets),
 *   - the About-card bullet lists for Chaban / Kit Store,
 *   - the real contact handles in SiteSettings.
 */
import { PrismaClient, ProjectBadge } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
    prisma.experience.deleteMany(),
    prisma.stackCategory.deleteMany(),
    prisma.hobbyCard.deleteMany(),
    prisma.seoMeta.deleteMany(),
    prisma.homeContent.deleteMany(),
    prisma.aboutProfile.deleteMany(),
    prisma.siteSettings.deleteMany(),
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

async function seedHome(): Promise<void> {
  await prisma.homeContent.create({
    data: {
      published: true,
      translations: {
        create: [
          {
            locale: 'ru',
            eyebrow: 'САЙТЫ · CRM · ПОД КЛЮЧ',
            heroTitle: 'Сайт, который работает.\nА не просто существует.',
            heroSubtitle:
              'Помогаю малому бизнесу получать клиентов из Google. Разрабатываю эффективные продающие сайты:',
            heroBullets: [
              'Дизайн, вызывающий доверие',
              'Тексты, которые продают',
              'SEO — вас находят в Google',
              'CRM — сайт под вашим контролем',
            ],
            heroNote: 'От $300. Запуск — от 1 недели.',
            heroCtaPrimary: 'Обсудить проект',
            heroCtaSecondary: 'Смотреть работы ↓',
            trustLine: '5+ лет в продакшене — React · TypeScript · Next.js',
            servicesEyebrow: 'УСЛУГИ',
            servicesHeading: 'От первого макета до запуска и передачи ключей',
            servicesLede:
              'Сайт продают дизайн и тексты — это мой главный фокус. Остальное — по умолчанию: быстрый код, SEO, CRM и сервер.',
            servicesSecondaryLabel: 'И ВСЕГДА В КОМПЛЕКТЕ',
            worksEyebrow: 'РАБОТЫ',
            worksHeading: 'Работы',
            worksLede:
              'Каждый проект — от начала до конца лично мной. Беру немного клиентов, поэтому каждому — максимум внимания.',
            worksLinkLabel: 'Все проекты →',
            pricingEyebrow: 'ЦЕНЫ',
            pricingHeading: 'Сколько это стоит',
            pricingNote: 'Точная смета — за 24 часа после первого разговора',
            pricingFootnote:
              'Рассрочка 50 / 30 / 20 — по этапам: 50% на старте, 30% после утверждения дизайна, 20% при запуске.',
            ctaTitle: 'Нужен такой инженер в проект?',
            ctaSubtitle: 'Фриланс, аутстафф или ваш продукт целиком — обсудим.',
            ctaTelegramLabel: 'Написать в Telegram',
            ctaCvLabel: 'Скачать CV ↓',
          },
          {
            locale: 'en',
            eyebrow: 'WEBSITES · CRM · TURNKEY',
            heroTitle: 'A website that works.\nNot one that merely exists.',
            heroSubtitle:
              'I help small businesses win customers from Google. I build effective websites that sell:',
            heroBullets: [
              'Design that earns trust',
              'Copy that sells',
              'SEO — clients find you in Google',
              'CRM — the site under your control',
            ],
            heroNote: 'From $300. Launch in as little as 1 week.',
            heroCtaPrimary: 'Discuss a project',
            heroCtaSecondary: 'See the work ↓',
            trustLine: '5+ years in production — React · TypeScript · Next.js',
            servicesEyebrow: 'SERVICES',
            servicesHeading: 'From the first mockup to launch and handover',
            servicesLede:
              'Websites are sold by design and copy — that is my main focus. Everything else comes by default: fast code, SEO, a CRM and the server.',
            servicesSecondaryLabel: 'AND ALWAYS INCLUDED',
            worksEyebrow: 'WORK',
            worksHeading: 'Selected work',
            worksLede:
              'Every project is done end to end by me personally. I take on few clients, so each one gets my full attention.',
            worksLinkLabel: 'All projects →',
            pricingEyebrow: 'PRICING',
            pricingHeading: 'How much it costs',
            pricingNote: 'A precise quote within 24 hours of our first conversation',
            pricingFootnote:
              '50 / 30 / 20 instalments — by stage: 50% up front, 30% once the design is approved, 20% at launch.',
            ctaTitle: 'Need an engineer like this on your project?',
            ctaSubtitle: 'Freelance, staff augmentation, or your product end to end — let’s talk.',
            ctaTelegramLabel: 'Message on Telegram',
            ctaCvLabel: 'Download CV ↓',
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
      showOnAbout: false,
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
      showOnAbout: true,
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
      showOnAbout: true,
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
    {
      // TODO(dastan): reconstructed — replace with verbatim content from the design file.
      slug: 'kurabu',
      badgeType: ProjectBadge.work,
      sortOrder: 3,
      showOnHome: false,
      showOnAbout: true,
      ru: {
        title: 'Kurabu',
        badge: 'B2B SAAS · ГЕРМАНИЯ',
        metaLine:
          'B2B SaaS для управления клубами и секциями: участники, абонементы, платежи и коммуникации в одном кабинете.',
        role: 'Lead Frontend · Германия',
        description:
          'B2B SaaS для управления клубами и спортивными секциями: участники, абонементы, платежи и коммуникации в одном кабинете. Отвечал за архитектуру фронтенда и качество ключевых модулей.',
        pills: ['Веб-приложение', 'Модуль абонементов', 'Платежи', 'Роли и права'],
        bullets: [
          'Вёл фронтенд-архитектуру продукта',
          'Проектировал переиспользуемые UI-компоненты',
          'Согласовывал API-контракты с бэкендом',
          'Ускорял тяжёлые экраны и таблицы данных',
        ],
        techChips: ['React', 'TypeScript', 'Redux', 'REST'],
        seoTitle: 'Kurabu — B2B SaaS, Lead Frontend',
        seoDescription:
          'B2B SaaS для управления клубами: участники, абонементы, платежи. Роль Lead Frontend, Германия.',
      },
      en: {
        title: 'Kurabu',
        badge: 'B2B SAAS · GERMANY',
        metaLine:
          'A B2B SaaS for managing clubs and classes: members, memberships, payments and communication in one dashboard.',
        role: 'Lead Frontend · Germany',
        description:
          'A B2B SaaS for managing clubs and sports classes: members, memberships, payments and communication in one dashboard. I owned the frontend architecture and the quality of the core modules.',
        pills: ['Web app', 'Memberships module', 'Payments', 'Roles & permissions'],
        bullets: [
          'Owned the product’s frontend architecture',
          'Designed reusable UI components',
          'Aligned API contracts with the backend',
          'Sped up heavy screens and data tables',
        ],
        techChips: ['React', 'TypeScript', 'Redux', 'REST'],
        seoTitle: 'Kurabu — B2B SaaS, Lead Frontend',
        seoDescription:
          'A B2B SaaS for club management: members, memberships, payments. Lead Frontend role, Germany.',
      },
    },
    {
      // TODO(dastan): reconstructed — replace with verbatim content from the design file.
      slug: 'chargers',
      badgeType: ProjectBadge.work,
      sortOrder: 4,
      showOnHome: false,
      showOnAbout: true,
      ru: {
        title: 'Chargers',
        badge: 'IoT-ПЛАТФОРМА · США',
        metaLine:
          'IoT-платформа для сети зарядных станций: мониторинг зарядок в реальном времени, тарифы, сессии и отчёты.',
        role: 'Frontend Engineer · США',
        description:
          'IoT-платформа для сети зарядных станций электромобилей: мониторинг зарядных сессий в реальном времени, тарифы, отчёты и управление станциями. Работал в распределённой Agile-команде в часовом поясе США.',
        pills: ['Веб-дашборд', 'Реальное время', 'Графики и отчёты', 'Управление станциями'],
        bullets: [
          'Дашборд мониторинга зарядных сессий',
          'Визуализация телеметрии в реальном времени',
          'Интерфейсы тарификации и отчётов',
          'Работа в Agile-команде в часовом поясе США',
        ],
        techChips: ['React', 'TypeScript', 'TanStack Query', 'REST'],
        seoTitle: 'Chargers — IoT-платформа зарядных станций',
        seoDescription:
          'IoT-платформа для сети зарядных станций: мониторинг в реальном времени, тарифы, сессии и отчёты.',
      },
      en: {
        title: 'Chargers',
        badge: 'IoT PLATFORM · USA',
        metaLine:
          'An IoT platform for a network of charging stations: real-time charge monitoring, tariffs, sessions and reports.',
        role: 'Frontend Engineer · USA',
        description:
          'An IoT platform for an EV charging-station network: real-time monitoring of charging sessions, tariffs, reports and station management. I worked in a distributed Agile team in the US time zone.',
        pills: ['Web dashboard', 'Real time', 'Charts & reports', 'Station management'],
        bullets: [
          'A dashboard to monitor charging sessions',
          'Real-time telemetry visualisation',
          'Tariff and reporting interfaces',
          'Work in an Agile team in the US time zone',
        ],
        techChips: ['React', 'TypeScript', 'TanStack Query', 'REST'],
        seoTitle: 'Chargers — EV charging IoT platform',
        seoDescription:
          'An IoT platform for a charging-station network: real-time monitoring, tariffs, sessions and reports.',
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
        showOnAbout: p.showOnAbout,
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

async function seedExperience(): Promise<void> {
  const experiences = [
    {
      company: 'Wellnuts',
      sortOrder: 0,
      ru: {
        role: 'Frontend Engineer',
        meta: 'авг 2023 — сейчас · 3 года · удалённо · США и Европа',
        description:
          'За 3 года вырос из junior/mid в senior frontend через 3 продуктовые команды: Charger, Mainteny и Kurabu. Работаю в англоязычных Agile-командах в часовых поясах США и Европы, участвую в выработке фронтенд-стандартов и API-контрактов.',
      },
      en: {
        role: 'Frontend Engineer',
        meta: 'Aug 2023 — present · 3 years · remote · US & Europe',
        description:
          'In 3 years I grew from junior/mid to senior frontend across 3 product teams: Charger, Mainteny and Kurabu. I work in English-speaking Agile teams across US and European time zones, contributing to frontend standards and API contracts.',
      },
    },
    {
      company: 'TimelySoft',
      sortOrder: 1,
      ru: {
        role: 'Frontend Developer',
        meta: 'июн 2021 — янв 2023 · 1 год 8 мес · гибрид · Бишкек, Кыргызстан',
        description:
          'Строил и выпускал SPA на React и Angular в TypeScript — 5 коммерческих проектов. Проектировал структуру фронтенда на двух greenfield-проектах, ускорял тяжёлые экраны и покрывал ключевые сценарии E2E-тестами.',
      },
      en: {
        role: 'Frontend Developer',
        meta: 'Jun 2021 — Jan 2023 · 1 yr 8 mos · hybrid · Bishkek, Kyrgyzstan',
        description:
          'Built and shipped React and Angular SPAs in TypeScript — 5 commercial projects. Designed the frontend structure on two greenfield projects, sped up heavy screens and covered key flows with E2E tests.',
      },
    },
  ];

  for (const e of experiences) {
    await prisma.experience.create({
      data: {
        company: e.company,
        sortOrder: e.sortOrder,
        published: true,
        translations: {
          create: [
            { locale: 'ru', ...e.ru },
            { locale: 'en', ...e.en },
          ],
        },
      },
    });
  }
  console.log(`✓ Experience (${experiences.length})`);
}

async function seedAbout(): Promise<void> {
  await prisma.aboutProfile.create({
    data: {
      photoUrl: null,
      translations: {
        create: [
          {
            locale: 'ru',
            name: 'Dastan Rakhmanzhanov',
            photoCaption: 'Senior Frontend Engineer · Бишкек',
            // TODO(dastan): replace with the verbatim bio paragraph from the design file.
            bioHtml:
              '<p><strong>Senior Frontend Engineer</strong> с более чем 5-летним опытом разработки веб- и мобильных продуктов для распределённых команд стартапов из США и Европы. Специализируюсь на <strong>React и TypeScript</strong> и опираюсь на <strong>full-stack базу</strong> (Node.js, NestJS, GraphQL, AWS), поэтому веду продукт <strong>от первой идеи и дизайна до production</strong>. За плечами — опыт работы в <strong>удалённых международных командах</strong> (США, Германия): от проектирования архитектуры фронтенда до запуска и поддержки.</p>',
            experienceHeading: 'Опыт',
            projectsHeading: 'Проекты',
            stackHeading: 'Стек',
            hobbiesHeading: 'Вне работы',
          },
          {
            locale: 'en',
            name: 'Dastan Rakhmanzhanov',
            photoCaption: 'Senior Frontend Engineer · Bishkek',
            bioHtml:
              '<p><strong>Senior Frontend Engineer</strong> with 5+ years building web and mobile products for distributed startup teams in the US and Europe. I specialise in <strong>React and TypeScript</strong>, backed by a <strong>full-stack foundation</strong> (Node.js, NestJS, GraphQL, AWS), which lets me carry a product <strong>from the first idea and design through to production</strong>. I have worked in <strong>remote international teams</strong> (US, Germany) — from designing frontend architecture to launch and maintenance.</p>',
            experienceHeading: 'Experience',
            projectsHeading: 'Projects',
            stackHeading: 'Stack',
            hobbiesHeading: 'Outside work',
          },
        ],
      },
    },
  });
  console.log('✓ About profile');
}

async function seedStack(): Promise<void> {
  const categories = [
    {
      sortOrder: 0,
      items: [
        'React',
        'Next.js',
        'React Native',
        'Expo',
        'TypeScript',
        'Tailwind CSS',
        'Material UI',
      ],
      ru: { title: 'Фронтенд' },
      en: { title: 'Frontend' },
    },
    {
      sortOrder: 1,
      items: ['GraphQL', 'Apollo', 'TanStack Query', 'Redux', 'REST'],
      ru: { title: 'Данные и API' },
      en: { title: 'Data & API' },
    },
    {
      sortOrder: 2,
      items: ['Node.js', 'NestJS', 'Prisma', 'PostgreSQL', 'MongoDB', 'JWT'],
      ru: { title: 'Бэкенд' },
      en: { title: 'Backend' },
    },
    {
      sortOrder: 3,
      items: ['Docker', 'GitHub Actions', 'AWS S3', 'CloudFront', 'Yandex Cloud'],
      ru: { title: 'DevOps и облака' },
      en: { title: 'DevOps & cloud' },
    },
    {
      sortOrder: 4,
      items: ['Cypress', 'Vite', 'Webpack'],
      ru: { title: 'Тесты и сборка' },
      en: { title: 'Testing & build' },
    },
  ];

  for (const c of categories) {
    await prisma.stackCategory.create({
      data: {
        sortOrder: c.sortOrder,
        items: c.items,
        published: true,
        translations: {
          create: [
            { locale: 'ru', ...c.ru },
            { locale: 'en', ...c.en },
          ],
        },
      },
    });
  }
  console.log(`✓ Stack categories (${categories.length})`);
}

async function seedHobbies(): Promise<void> {
  const hobbies = [
    {
      handle: '@arashan_televyshka',
      url: 'https://www.instagram.com/arashan_televyshka',
      sortOrder: 0,
      ru: {
        title: '@arashan_televyshka',
        description: 'Делюсь опытом в фермерстве: разведение арашанских овец и жизнь хозяйства.',
      },
      en: {
        title: '@arashan_televyshka',
        description: 'Sharing my farming experience: breeding Arashan sheep and life on the ranch.',
      },
    },
    {
      handle: '@dastich_fantastich_r',
      url: 'https://www.instagram.com/dastich_fantastich_r',
      sortOrder: 1,
      ru: {
        title: 'Фермер-айтишник',
        description:
          '@dastich_fantastich_r — личный блог: опыт в IT и фермерстве, интересные моменты из жизни.',
      },
      en: {
        title: 'Farmer in tech',
        description:
          '@dastich_fantastich_r — a personal blog: experiences in IT and farming, and moments from life.',
      },
    },
  ];

  for (const h of hobbies) {
    await prisma.hobbyCard.create({
      data: {
        handle: h.handle,
        url: h.url,
        imageUrl: null,
        sortOrder: h.sortOrder,
        published: true,
        translations: {
          create: [
            { locale: 'ru', ...h.ru },
            { locale: 'en', ...h.en },
          ],
        },
      },
    });
  }
  console.log(`✓ Hobby cards (${hobbies.length})`);
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
    {
      page: 'about' as const,
      locale: 'ru' as const,
      title: 'Обо мне — Dastan Rakhmanzhanov, Frontend',
      description:
        'Senior Frontend Engineer из Бишкека. 5+ лет на React, TypeScript и Next.js. Опыт в командах из США и Европы. Резюме и проекты.',
      keywords: [
        'Dastan Rakhmanzhanov',
        'Senior Frontend Engineer Бишкек',
        'React разработчик Бишкек',
        'frontend Кыргызстан',
      ],
    },
    {
      page: 'about' as const,
      locale: 'en' as const,
      title: 'About — Dastan Rakhmanzhanov, Frontend',
      description:
        'Senior Frontend Engineer based in Bishkek. 5+ years with React, TypeScript and Next.js. Experience in US and European teams. CV and projects.',
      keywords: [
        'Dastan Rakhmanzhanov',
        'hire React developer Bishkek',
        'frontend developer Kyrgyzstan',
        'Next.js developer',
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
  await seedHome();
  await seedServices();
  await seedPricing();
  await seedProjects();
  await seedExperience();
  await seedAbout();
  await seedStack();
  await seedHobbies();
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
