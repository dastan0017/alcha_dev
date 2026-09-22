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
    prisma.processStep.deleteMany(),
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
            processEyebrow: 'ПРОЦЕСС И УСЛУГИ',
            processHeading: 'Понятный план работы над вашим проектом',
            processSubheading:
              'Ваше участие нужно только на старте — обсудить бизнес и утвердить макет. Всю техническую часть (скорость, SEO, панель и сервер) я беру на себя и отдаю вам готовый сайт.',
            processPill: 'ОТ 1 ДО 6 НЕДЕЛЬ',
            processFromLabel: 'ОТ ВАС',
            processResultLabel: 'РЕЗУЛЬТАТ',
            processMainLabel: 'ГЛАВНОЕ',
            processAnnotationLabel: 'МОЯ ГЛАВНАЯ СИЛА',
            processAnnotationText:
              'Этим занимаюсь лично и глубже всего: моя работа — понятно показать сильные стороны вашего бизнеса и сделать так, чтобы сайт с первых секунд вызывал доверие.',
            worksEyebrow: 'РАБОТЫ',
            worksHeading: 'Работы',
            worksLede:
              'Каждый проект — от начала до конца лично мной. Беру немного клиентов, поэтому каждому — максимум внимания.',
            pricingEyebrow: 'ЦЕНЫ',
            pricingHeading: 'Сколько это стоит',
            pricingNote:
              'Точная смета за 24 часа после первого разговора. Панель для правок входит в любой тариф, CRM — в «Сайт + CRM».',
            pricingExamplesLabel: 'Например:',
            pricingOptionalLabel: 'По желанию:',
            pricingFootnote:
              'Оплата в 3 этапа: 50% на старте, 30% после утверждения дизайна, 20% при запуске. Домен и хостинг оформляю на вас: платите провайдеру напрямую, без моей наценки.',
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
            processEyebrow: 'PROCESS & SERVICES',
            processHeading: 'A clear plan for your project',
            processSubheading:
              'You’re only needed at the start — to talk through your business and approve the design. I take on everything technical (speed, SEO, the panel and the server) and hand you a finished website.',
            processPill: '1 TO 6 WEEKS',
            processFromLabel: 'FROM YOU',
            processResultLabel: 'RESULT',
            processMainLabel: 'KEY STEP',
            processAnnotationLabel: 'MY CORE STRENGTH',
            processAnnotationText:
              'I handle this personally and in the most depth: my job is to show your business’s strengths clearly and make the site earn trust from the very first seconds.',
            worksEyebrow: 'WORK',
            worksHeading: 'Selected work',
            worksLede:
              'Every project is done end to end by me personally. I take on few clients, so each one gets my full attention.',
            pricingEyebrow: 'PRICING',
            pricingHeading: 'How much it costs',
            pricingNote:
              'A precise quote within 24 hours of our first conversation. The editing panel comes with every plan, the CRM with “Website + CRM”.',
            pricingExamplesLabel: 'For example:',
            pricingOptionalLabel: 'Optional:',
            pricingFootnote:
              'Paid in 3 stages: 50% up front, 30% once the design is approved, 20% at launch. The domain and hosting are registered in your name: you pay the provider directly, with no markup from me.',
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

async function seedSteps(): Promise<void> {
  // «Процесс и услуги» copy rules to keep when editing it: no promise of leads or Google
  // rankings, no framework names, no Lighthouse scores, no untranslated acronyms in card titles.
  // A step's number is its position, never stored.
  const steps = [
    {
      isMain: false,
      ru: {
        title: 'Разговор о бизнесе',
        description:
          'Задаю вопросы о вашем продукте, клиентах и конкурентах. Вместе находим, чем вы сильнее других и почему клиент должен выбрать именно вас. Отсюда и берутся тексты.',
        from: '1 час времени',
        result: 'Разбор бизнеса и структура страниц',
      },
      en: {
        title: 'Talking business',
        description:
          'I ask about your product, your customers and your competitors. Together we find where you’re stronger than the rest and why a customer should choose you. That’s where the copy comes from.',
        from: '1 hour of your time',
        result: 'Business breakdown and page structure',
      },
    },
    {
      isMain: true,
      ru: {
        title: 'Дизайн и продающие тексты',
        description: 'Собираю макет и пишу продающие тексты. Правки вносим до утверждения макета.',
        from: 'Примеры сайтов и согласование макета',
        result: 'Макет всех страниц с текстами',
      },
      en: {
        title: 'Design and sales copy',
        description:
          'I put together the design and write copy that sells. We make revisions until the design is approved.',
        from: 'Example sites and design approval',
        result: 'Design of every page, with copy',
      },
    },
    {
      isMain: false,
      ru: {
        title: 'Разработка и SEO',
        description:
          'Переношу утверждённый макет в быстрый код и собираю к нему панель управления. Сайт загружается мгновенно, удобен на телефоне и правильно настроен для Google.',
        from: 'Ничего',
        result: 'Работающий сайт и панель на тестовом адресе',
      },
      en: {
        title: 'Development and SEO',
        description:
          'I turn the approved design into fast code and build the site panel to go with it. The site loads instantly, works well on phones and is set up properly for Google.',
        from: 'Nothing',
        result: 'Working site and panel on a test address',
      },
    },
    {
      isMain: false,
      ru: {
        title: 'Учу управлять сайтом',
        description:
          'Созваниваемся, и я показываю панель управления: как поменять текст или цену, заменить фото, добавить карточку или целый раздел. Остаётся короткое видео, чтобы потом вспомнить.',
        from: '30 минут на созвон',
        result: 'Панель управления, доступы и видеоинструкция',
      },
      en: {
        title: 'Teaching you to run the site',
        description:
          'We get on a call and I walk you through the panel: how to change text or a price, replace a photo, add a card or a whole section. You keep a short video to look back on.',
        from: '30 minutes for a call',
        result: 'Site panel, logins and a video guide',
      },
    },
    {
      isMain: false,
      ru: {
        title: 'Запуск и передача прав',
        description:
          'Запускаю сайт на вашем домене: на существующем или зарегистрирую новый на вас. Отдаю исходный код, доступы к серверу и все настройки. Дальше сайт сможет вести любой разработчик.',
        from: 'Домен, если он уже есть',
        result: 'Сайт работает, код и все доступы у вас',
      },
      en: {
        title: 'Launch and handover',
        description:
          'I launch the site on your domain — the one you already have, or a new one I register in your name. You get the source code, server access and every setting. From then on, any developer can run the site.',
        from: 'Your domain, if you already have one',
        result: 'The site is live; the code and all access are yours',
      },
    },
  ];

  for (const [sortOrder, s] of steps.entries()) {
    await prisma.processStep.create({
      data: {
        sortOrder,
        published: true,
        isMain: s.isMain,
        translations: {
          create: [
            { locale: 'ru', ...s.ru },
            { locale: 'en', ...s.en },
          ],
        },
      },
    });
  }
  console.log(`✓ Process steps (${steps.length})`);
}

async function seedPricing(): Promise<void> {
  // «Цены» copy rules to keep when editing it (design «Pricing Section Options» 1a): no promise
  // of leads or Google rankings; optional items go in `extras` (a «+», never a ✓, and the
  // «По желанию:» label is added by the page); the badge says who the plan suits, not how
  // popular it is; `termLine` is timing only — payment terms live in the section footnote.
  const plans = [
    {
      sortOrder: 0,
      highlighted: false,
      ru: {
        name: 'Лендинг',
        priceLabel: 'от $300',
        termLine: '1–2 НЕДЕЛИ',
        highlightLabel: '',
        ctaLabel: 'Обсудить лендинг',
        description:
          'Одно предложение: услуга, товар, курс или событие. Вы приводите людей из рекламы и Instagram, а сайт отвечает на вопросы и превращает интерес в заявку.',
        examples: 'тур, мастер-класс, запуск курса, открытие кафе',
        listHeading: 'Что входит:',
        features: [
          'Дизайн и продающие тексты',
          'Готов к поиску в Google (SEO): быстро открывается и удобен на телефоне',
          'Заявки приходят в Telegram или WhatsApp',
          'Панель управления (CMS): тексты, цены и фото на сайте меняете сами',
          'Сервер и домен оформляю на вас: все доступы ваши',
        ],
        extras: [],
      },
      en: {
        name: 'Landing page',
        priceLabel: 'from $300',
        termLine: '1–2 WEEKS',
        highlightLabel: '',
        ctaLabel: 'Discuss a landing page',
        description:
          'One offer: a service, a product, a course or an event. You bring people in from ads and Instagram, and the site answers their questions and turns interest into a lead.',
        examples: 'a tour, a workshop, a course launch, a café opening',
        listHeading: 'What’s included:',
        features: [
          'Design and copy that sells',
          'Ready for Google search (SEO): loads fast and is easy to use on a phone',
          'Leads arrive in Telegram or WhatsApp',
          'Site panel (CMS): change the texts, prices and photos on the site yourself',
          'Server and domain registered in your name: all access is yours',
        ],
        extras: [],
      },
    },
    {
      sortOrder: 1,
      highlighted: true,
      ru: {
        name: 'Сайт компании',
        priceLabel: 'от $700',
        termLine: '3–6 НЕДЕЛЬ',
        highlightLabel: 'СОВЕТУЮ КОМПАНИЯМ',
        ctaLabel: 'Обсудить сайт компании',
        description:
          'Несколько услуг или товаров, и вы хотите, чтобы клиенты находили вас в Google сами, а не только через рекламу.',
        examples: 'клиника, автосервис, турфирма, гостевой дом',
        listHeading: 'Всё из «Лендинга», плюс:',
        features: [
          'Отдельная страница под каждую услугу: так её проще найти в Google',
          'Страница о компании и раздел с работами',
          'Сами добавляете новые услуги и кейсы в панели: покажу, как',
        ],
        extras: [
          'Блог для SEO (оцениваю отдельно)',
          'интернет-магазин с корзиной и оплатой (оцениваю отдельно)',
        ],
      },
      en: {
        name: 'Company website',
        priceLabel: 'from $700',
        termLine: '3–6 WEEKS',
        highlightLabel: 'RECOMMENDED FOR COMPANIES',
        ctaLabel: 'Discuss a company website',
        description:
          'Several services or products, and you want customers to find you on Google on their own, not only through ads.',
        examples: 'a clinic, a car repair shop, a travel agency, a guesthouse',
        listHeading: 'Everything in “Landing page”, plus:',
        features: [
          'A separate page for each service, so it’s easier to find on Google',
          'An about page and a portfolio section',
          'Add new services and case studies in the panel yourself: I’ll show you how',
        ],
        extras: [
          'a blog for SEO (quoted separately)',
          'an online store with a cart and payments (quoted separately)',
        ],
      },
    },
    {
      sortOrder: 2,
      highlighted: false,
      ru: {
        name: 'Сайт + CRM',
        priceLabel: 'от $1 500',
        termLine: 'ОТ 6 НЕДЕЛЬ',
        highlightLabel: '',
        ctaLabel: 'Обсудить сайт с CRM',
        description:
          'Заявки приходят с сайта, из Instagram, WhatsApp и Telegram. Вы хотите видеть их в одном окне, чтобы ни одна не потерялась.',
        examples: 'турфирма с менеджерами, учебный центр, салон с онлайн-записью',
        listHeading: 'Всё из «Сайта компании», плюс:',
        features: [
          'CRM: заявки, клиенты, оплаты и отчёты в одном окне',
          'Заявки из Instagram, WhatsApp и Telegram попадают в CRM',
          'Интеграции: онлайн-оплата и Telegram-бот',
        ],
        extras: ['Мобильное приложение для App Store и Google Play (оцениваю отдельно)'],
      },
      en: {
        name: 'Website + CRM',
        priceLabel: 'from $1,500',
        termLine: 'FROM 6 WEEKS',
        highlightLabel: '',
        ctaLabel: 'Discuss a website with a CRM',
        description:
          'Leads come in from the site, Instagram, WhatsApp and Telegram. You want to see them in one window so that none of them get lost.',
        examples: 'a travel agency with managers, a training centre, a salon with online booking',
        listHeading: 'Everything in “Company website”, plus:',
        features: [
          'CRM: leads, clients, payments and reports in one window',
          'Leads from Instagram, WhatsApp and Telegram land in the CRM',
          'Integrations: online payments and a Telegram bot',
        ],
        extras: ['a mobile app for the App Store and Google Play (quoted separately)'],
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
  await seedSteps();
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
