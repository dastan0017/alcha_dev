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
            worksEyebrow: 'ПРОЕКТЫ',
            worksHeading: 'Сделано под ключ',
            worksLede: 'От идеи до запуска — всё необходимое для сайта в одном проекте.',
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
            worksEyebrow: 'PROJECTS',
            worksHeading: 'Built end to end',
            worksLede: 'From idea to launch — everything a website needs, in one project.',
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
      // Picture slots of the detailed case page, in the order the page reads them:
      // [0] hero, [1] the phone shot beside «Что умеет сайт», [2..] the «Экраны» gallery.
      // The pictures themselves are uploaded through the CRM; a slot with no picture
      // renders nothing, so the captions can wait here until it is filled.
      screenshots: [
        { src: '', device: 'desktop' },
        { src: '', device: 'mobile' },
        { src: '', device: 'desktop' },
        { src: '', device: 'mobile' },
        { src: '', device: 'mobile' },
      ],
      editingImages: ['', ''],
      ru: {
        title: 'Сайт, который вы ведёте сами',
        badge: 'ВЫ СЕЙЧАС ЗДЕСЬ',
        // The mono line next to the badge: this project's tag is its domain.
        typeTag: 'alcha.dev',
        metaLine:
          'Вы сейчас на нём. Услуги, цены и кейсы — на одной странице. Тексты и фото меняются в админке без программиста, а заявка с формы приходит в Telegram за секунду.',
        facts: [
          { text: 'Заявка приходит в Telegram и остаётся в списке — не теряется' },
          {
            lead: 'Загрузка меньше 1 секунды',
            text: '— высший балл Google Lighthouse (95+) даже на телефоне в дороге',
          },
          {
            lead: 'Удобная админка',
            text: '— меняйте тексты, цены и фото в пару кликов без разработчика.',
          },
        ],
        role: 'Свой продукт · дизайн, разработка и сервер',
        // The hero lead of the detailed case page.
        description:
          'Вы читаете его прямо сейчас. Снаружи — услуги, цены и кейсы. Внутри — админка: тексты и фото меняются без программиста, а заявки не теряются.',
        pills: ['Дизайн и тексты', 'Админка и заявки', 'Поиск в Google', 'Сервер и запуск'],
        bullets: [],
        siteFeatures: [
          {
            title: 'Услуги и цены рядом',
            text: 'Клиент сразу видит, что вы делаете и сколько это стоит.',
          },
          { title: 'Страницы кейсов', text: 'Каждая работа — отдельная страница. Как эта.' },
          { title: 'Заявка в два поля', text: 'Имя и сообщение. Ничего лишнего.' },
          { title: 'Два языка', text: 'Русский и английский. Переключатель в шапке.' },
          {
            title: 'Открывается меньше чем за секунду',
            text: 'Страницы готовятся заранее. Даже с телефона в дороге.',
          },
          {
            title: 'Находится в Google',
            text: 'У каждой страницы свой заголовок и описание для поиска.',
          },
          {
            title: 'Ссылка с картинкой',
            text: 'Отправили в WhatsApp — собеседник видит карточку, а не голую ссылку.',
          },
        ],
        screenshotCaptions: [
          '',
          'Главная на телефоне',
          'Цены открыто — с тем, что входит в каждый тариф',
          'Страница кейса на телефоне',
          'Заявка в два поля',
        ],
        editingTitle: 'Правите прямо на странице',
        editingLead:
          'Админка выглядит как ваш сайт. Нажали на строку, напечатали — и сразу видно, как будет.',
        editingPoints: [
          {
            title: 'Текст — прямо на странице',
            text: 'Нажали на заголовок и исправили. Шрифт и отступы — как на сайте.',
          },
          {
            title: 'Списки — в боковой панели',
            text: 'Цены, кейсы, шаги работы: добавить, убрать, поменять порядок.',
          },
          {
            title: 'Сначала черновик',
            text: 'Посетители не видят правки, пока вы не нажмёте «Опубликовать». После — сайт обновится за несколько секунд.',
          },
          {
            title: 'Фото — загрузили и готово',
            text: 'Картинка уменьшается сама по себе. Страницы не тормозят.',
          },
          {
            title: 'Два языка в одном месте',
            text: 'Не заполнили английский — покажется русский. Пустых мест не будет.',
          },
        ],
        editingCaptions: [
          'Заголовок правится там же, где его видит клиент',
          'Цены — списком в боковой панели, русский и английский рядом',
        ],
        requestsTitle: 'Ни одна заявка не теряется',
        requestsLead:
          'Заявка приходит в Telegram примерно за секунду. И остаётся в списке, даже если сообщение утонуло в чатах.',
        requestsPoints: [
          {
            title: 'Статус — в один клик',
            text: 'Взяли в работу, получили оплату, закрыли — всё в одной строке.',
          },
          {
            title: 'Видно, кто ждёт ответа',
            text: 'Даже через несколько недель. Новые заявки не прячутся в переписке.',
          },
        ],
        requestsStatuses: ['Новая', 'В работе', 'Оплачена', 'Закрыта'],
        requestsCaption: 'Список заявок: новые — сверху',
        proofLine:
          '**Проверьте сами:** всё, что описано выше, работает на этой странице. [Отправьте заявку] — увидите, как быстро придёт ответ.',
        reliability: [
          { title: 'Свой сервер', text: 'Сайт не зависит от конструктора и его подписки.' },
          { title: 'HTTPS', text: 'Замок в адресной строке. Браузер не пугает посетителей.' },
          {
            title: 'Копия базы каждый день',
            text: 'Если что-то сломается, данные можно вернуть.',
          },
          { title: 'Всё принадлежит вам', text: 'Сайт и исходный код — ваши. Их можно забрать.' },
        ],
        techChips: ['Next.js', 'TypeScript', 'PostgreSQL', 'свой сервер'],
        seoTitle: 'alcha.dev — портфолио и услуги',
        seoDescription:
          'Портфолио и витрина услуг: дизайн, разработка, поиск в Google и админка. Сайт, который вы ведёте сами.',
      },
      en: {
        title: 'A site you can run yourself',
        badge: 'YOU ARE HERE',
        typeTag: 'alcha.dev',
        metaLine:
          'You’re on it right now. Services, prices and cases on one page. Text and photos are edited in the admin panel — no developer — and a form request reaches Telegram in a second.',
        facts: [
          { text: 'Requests arrive in Telegram and stay in a list — nothing gets lost' },
          {
            lead: 'Loads in under 1 second',
            text: '— top Google Lighthouse score (95+), even on a phone on the go',
          },
          {
            lead: 'Easy admin panel',
            text: '— change text, prices and photos in a couple of clicks, no developer needed.',
          },
        ],
        role: 'Own product · design, development and server',
        description:
          'You are reading it right now. On the outside — services, prices and cases. Inside — an admin panel: text and photos change without a developer, and no request gets lost.',
        pills: ['Design & copy', 'Admin & requests', 'Google search', 'Server & launch'],
        bullets: [],
        siteFeatures: [
          {
            title: 'Prices next to services',
            text: 'A client sees what you do and what it costs, straight away.',
          },
          {
            title: 'A page per case',
            text: 'Every piece of work gets its own page. Like this one.',
          },
          { title: 'A request in two fields', text: 'A name and a message. Nothing else.' },
          { title: 'Two languages', text: 'Russian and English, switched from the header.' },
          {
            title: 'Opens in under a second',
            text: 'Pages are built ahead of time. Even on a phone on the move.',
          },
          {
            title: 'Found on Google',
            text: 'Every page carries its own title and description for search.',
          },
          {
            title: 'Links that show a picture',
            text: 'Send one on WhatsApp and the other person sees a card, not a bare link.',
          },
        ],
        screenshotCaptions: [
          '',
          'The homepage on a phone',
          'Prices in the open — with what each plan includes',
          'A case page on a phone',
          'A request in two fields',
        ],
        editingTitle: 'You edit right on the page',
        editingLead:
          'The admin panel looks like your site. Click a line, type, and you see exactly how it will come out.',
        editingPoints: [
          {
            title: 'Text, right on the page',
            text: 'Click a heading and fix it. Same font, same spacing as the live page.',
          },
          {
            title: 'Lists in the side panel',
            text: 'Prices, cases, process steps: add, remove, reorder.',
          },
          {
            title: 'A draft first',
            text: 'Visitors see none of your edits until you press «Publish». After that the site updates within seconds.',
          },
          {
            title: 'Photos: upload and done',
            text: 'A picture is resized on its own. Pages stay fast.',
          },
          {
            title: 'Both languages in one place',
            text: 'Leave the English blank and the Russian shows instead. Nothing is left empty.',
          },
        ],
        editingCaptions: [
          'A heading is edited where the client sees it',
          'Prices as a list in the side panel, Russian and English side by side',
        ],
        requestsTitle: 'No request gets lost',
        requestsLead:
          'A request reaches Telegram in about a second. And it stays in the list even after the message is buried in your chats.',
        requestsPoints: [
          {
            title: 'Status in one click',
            text: 'Took it on, got paid, closed it — all from one row.',
          },
          {
            title: 'You can see who is waiting',
            text: 'Even weeks later. New requests never hide in a chat thread.',
          },
        ],
        requestsStatuses: ['New', 'In progress', 'Paid', 'Closed'],
        requestsCaption: 'The request list, newest first',
        proofLine:
          '**See for yourself:** everything described above runs on this page. [Send a request] and watch how fast the answer comes.',
        reliability: [
          {
            title: 'Your own server',
            text: 'The site does not depend on a website builder or its subscription.',
          },
          {
            title: 'HTTPS',
            text: 'A padlock in the address bar. No browser warnings for visitors.',
          },
          {
            title: 'A copy of the database every day',
            text: 'If something breaks, the data can be brought back.',
          },
          {
            title: 'Everything belongs to you',
            text: 'The site and its source code are yours. You can take them with you.',
          },
        ],
        techChips: ['Next.js', 'TypeScript', 'PostgreSQL', 'own server'],
        seoTitle: 'alcha.dev — portfolio and services',
        seoDescription:
          'A portfolio and services showcase: design, development, Google search and an admin panel. A site you can run yourself.',
      },
    },
    {
      slug: 'chaban',
      badgeType: ProjectBadge.own,
      sortOrder: 1,
      showOnHome: true,
      appStoreUrl: 'https://apps.apple.com/kg/app/%D1%87%D0%B0%D0%B1%D0%B0%D0%BD/id6772493408',
      googlePlayUrl: 'https://play.google.com/store/apps/details?id=kg.arashan.mobile',
      ru: {
        // The mono line next to the badge: this project's tag is its name.
        title: 'Приложение для заводчиков племенных овец',
        badge: 'СОБСТВЕННЫЙ ПРОДУКТ',
        typeTag: 'Чабан',
        metaLine:
          'Раньше хозяйства вели Instagram и YouTube, и покупатель не понимал, кто есть кто, — выбирали по знакомым. Теперь у каждой фермы один профиль: видео, история, достижения и контакты. Все фермы — на одной карте.',
        facts: [
          {
            lead: 'Ферму видят новые покупатели',
            text: '— без рекламы и без цепочки знакомых',
          },
          {
            lead: 'Понятно, с кем имеешь дело',
            text: '— видео, история и достижения хозяйства в одном профиле',
          },
          { lead: 'Пишут напрямую', text: '— WhatsApp и Instagram прямо из профиля' },
        ],
        role: 'Свой продукт · дизайн, разработка, сервер',
        description:
          'Раньше хозяйства вели Instagram и YouTube, и покупатель не понимал, кто есть кто, — выбирали по знакомым. Теперь у каждой фермы один профиль: видео, история, достижения и контакты. Все фермы — на одной карте.',
        pills: ['Мобильное приложение', 'Профили и карта', 'Модерация', 'Вход через WhatsApp'],
        bullets: [
          'Карта проверенных ферм с профилями хозяйств',
          'Электронные родословные животных',
          'Объявления «на племя» и база знаний',
          'Календарь ухода за стадом с напоминаниями',
          'Админ-панель для модерации и контента',
        ],
        techChips: ['React Native', 'NestJS', 'PostgreSQL'],
        seoTitle: 'Чабан — приложение для заводчиков овец',
        seoDescription:
          'Сообщество заводчиков арашанских овец: карта ферм, родословные, объявления и календарь ухода за стадом.',
      },
      en: {
        title: 'An app for pedigree sheep breeders',
        badge: 'OWN PRODUCT',
        typeTag: 'Chaban',
        metaLine:
          'Farms used to run Instagram and YouTube separately, and buyers couldn’t tell who was who — they chose through acquaintances. Now every farm has one profile: videos, history, achievements and contacts. All farms on one map.',
        facts: [
          { lead: 'New buyers find the farm', text: '— no ads, no chain of acquaintances' },
          {
            lead: 'You know who you’re dealing with',
            text: '— the farm’s videos, history and achievements in one profile',
          },
          {
            lead: 'Buyers message directly',
            text: '— WhatsApp and Instagram right from the profile',
          },
        ],
        role: 'Own product · design, development, server',
        description:
          'Farms used to run Instagram and YouTube separately, and buyers couldn’t tell who was who — they chose through acquaintances. Now every farm has one profile: videos, history, achievements and contacts. All farms on one map.',
        pills: ['Mobile app', 'Profiles & map', 'Moderation', 'WhatsApp sign-in'],
        bullets: [
          'A map of verified farms with ranch profiles',
          'Digital pedigrees for animals',
          'Breeding listings and a knowledge base',
          'A herd-care calendar with reminders',
          'An admin panel for moderation and content',
        ],
        techChips: ['React Native', 'NestJS', 'PostgreSQL'],
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
      // TODO(dastan): обложка 6:5 (kitstore-cover-6x5.png, 1560×1300) — ставите её сами.
      coverImage: '',
      appStoreUrl:
        'https://apps.apple.com/kg/app/%D0%BA%D0%B8%D1%82-%D1%82%D1%80%D0%B5%D0%B9%D0%B4/id6760572485',
      googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.nursultan23.kit',
      ru: {
        title: 'Оптовые заказы — без звонков и ручного сбора',
        badge: 'КЛИЕНТСКИЙ ПРОЕКТ',
        // The mono line next to the badge: this project's tag is its name.
        typeTag: 'Kit Store',
        metaLine:
          'Раньше заказы собирали торговые агенты: звонок, блокнот, пересчёт. Теперь магазин заказывает сам с телефона, как в интернет-магазине, а каталог, заказы и клиенты — в CRM у менеджеров.',
        facts: [
          {
            lead: 'Магазин заказывает сам',
            text: '— с телефона, в любое время, без звонка агенту',
          },
          {
            lead: 'Заказы не теряются',
            text: '— каждый падает в CRM со статусом, уведомление сразу в WhatsApp',
          },
          {
            lead: 'Агенты не собирают заказы вручную',
            text: '— каталог и цены обновляются в одном месте',
          },
        ],
        role: 'Клиентский проект · мобильное приложение, CRM и сервер',
        description:
          'Раньше заказы собирали торговые агенты: звонок, блокнот, пересчёт. Теперь магазин заказывает сам с телефона, как в интернет-магазине, а каталог, заказы и клиенты — в CRM у менеджеров.',
        pills: [
          'Мобильное приложение',
          'CRM для менеджеров',
          'Каталог и заказы',
          'Запуск и передача',
        ],
        bullets: [
          'Магазины-партнёры оформляют заказы сами',
          'Менеджеры ведут каталог, заказы и клиентов в CRM',
          'Уведомления о заказах в WhatsApp',
          'Аналитика продаж и остатков',
          'Развёртывание и поддержка на сервере',
        ],
        techChips: ['React Native', 'NestJS', 'PostgreSQL'],
        seoTitle: 'Kit Store — приложение и CRM для дистрибьютора',
        seoDescription:
          'Магазины заказывают у дистрибьютора с телефона; каталог, заказы и клиенты — в CRM у менеджеров.',
      },
      en: {
        title: 'Wholesale orders without calls or paperwork',
        badge: 'CLIENT PROJECT',
        typeTag: 'Kit Store',
        metaLine:
          'Sales reps used to collect orders by hand: a call, a notebook, a recount. Now a store orders by itself from a phone, like in an online shop, and the catalogue, orders and customers live in the managers’ CRM.',
        facts: [
          {
            lead: 'Stores order by themselves',
            text: '— from a phone, any time, without calling a rep',
          },
          {
            lead: 'No order gets lost',
            text: '— each one lands in the CRM with a status, plus an instant WhatsApp notification',
          },
          {
            lead: 'Reps no longer collect orders by hand',
            text: '— catalogue and prices are updated in one place',
          },
        ],
        role: 'Client project · mobile app, CRM and server',
        description:
          'Sales reps used to collect orders by hand: a call, a notebook, a recount. Now a store orders by itself from a phone, like in an online shop, and the catalogue, orders and customers live in the managers’ CRM.',
        pills: ['Mobile app', 'CRM for managers', 'Catalogue & orders', 'Launch & handover'],
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
        screenshots: p.screenshots ?? [],
        editingImages: p.editingImages ?? [],
        coverImage: p.coverImage || null,
        appStoreUrl: p.appStoreUrl ?? '',
        googlePlayUrl: p.googlePlayUrl ?? '',
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
