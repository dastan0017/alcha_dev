import {
  CMS_REQUIRED_FIELDS,
  CMS_SECTION_KEYS,
  CMS_SECTION_LABELS,
  LOCALE_LABELS,
  PROJECT_SLUG_PATTERN,
  cmsPath,
  newCmsId,
  newCollectionNode,
  parseCmsPath,
  type CMS_FIELD_MODEL,
  type CmsFieldKind,
  type CmsLocalizedField,
  type CmsNeutralField,
  type CmsScope,
  type CmsSectionKey,
  type CollectionKey,
  type CollectionNode,
  type CollectionNodeMap,
  type Locale,
  type SiteTree,
} from '@alcha/shared';

// ─── Field schema ────────────────────────────────────────────────────────────

/** The drawer control that edits a field. */
export type FieldType =
  'text' | 'textarea' | 'list' | 'tags' | 'image' | 'images' | 'boolean' | 'select';

/** The singleton a section field is stored in. */
export type SectionScope = 'home' | 'chrome';

export interface FieldOption {
  value: string;
  label: string;
}

/** One drawer field; a `localized` field renders an RU control above an EN one. */
export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  localized: boolean;
  /** Set on every section field: the singleton that holds the value. */
  scope?: SectionScope;
  /** Placeholder with an example value. */
  hint?: string;
  /** `list`: text of the add button. */
  addLabel?: string;
  /** `select`: the choices. */
  options?: readonly FieldOption[];
  /** `boolean`: switching it on switches it off on every other item (one featured service, one highlighted plan). */
  exclusive?: boolean;
  /** `boolean`: value text next to the switch (defaults «Да» / «Нет»). */
  onLabel?: string;
  offLabel?: string;
  /** `text`: an inline error message that blocks saving, or null. */
  validate?: (value: string) => string | null;
}

/** Controls that can hold each value kind of the shared field model. */
type FieldTypeByKind = {
  string: 'text' | 'textarea';
  nullableString: 'image';
  boolean: 'boolean';
  badgeType: 'select';
  stringList: 'list' | 'tags' | 'images';
  sectionList: never;
};

type FieldModel = typeof CMS_FIELD_MODEL;
type FieldMeta = Omit<FieldSchema, 'key' | 'type' | 'localized' | 'scope'>;

type DeclaredFieldOf<Kinds, Localized extends boolean> = {
  [K in keyof Kinds & string]: FieldMeta & {
    key: K;
    localized: Localized;
    type: FieldTypeByKind[Kinds[K] & CmsFieldKind];
  };
}[keyof Kinds & string];

/** A field of scope `S` whose key, locale split and control match CMS_FIELD_MODEL at compile time. */
type DeclaredField<S extends CmsScope> =
  | DeclaredFieldOf<FieldModel[S]['localized'], true>
  | DeclaredFieldOf<FieldModel[S]['neutral'], false>;

type SectionField = { [S in SectionScope]: DeclaredField<S> & { scope: S } }[SectionScope];

/** What the drawer edits; `focusPath` (a CMS path) focuses and scrolls to that control on open. */
export type DrawerTarget =
  | { kind: 'item'; collection: CollectionKey; id: string; focusPath?: string }
  | { kind: 'section'; section: CmsSectionKey; focusPath?: string };

export type ItemDrawerTarget = Extract<DrawerTarget, { kind: 'item' }>;

// ─── Collections ─────────────────────────────────────────────────────────────

export interface BlankContext {
  /** The page the item is added on: projects added on the homepage show there. */
  page: 'home' | 'case';
  /** The draft the item joins. */
  tree: SiteTree;
}

export interface CollectionSchema<C extends CollectionKey = CollectionKey> {
  /** Mono caption above the drawer title, e.g. «ТАРИФ». */
  kind: string;
  /** Sentence-case name for labels, e.g. «Тариф». */
  noun: string;
  /** «Добавить …» action text. */
  addLabel: string;
  /** Display title; «Без названия» when blank. */
  title: (node: CollectionNodeMap[C], locale: Locale) => string;
  fields: readonly FieldSchema[];
  /** A new item with placeholder copy in both locales, ready for an `insert` patch. */
  blank: (ctx: BlankContext) => CollectionNodeMap[C];
  /** A deep copy for «Копия»: new id, « — копия» / « — copy» titles, exclusive flags off, fresh slug. */
  duplicate: (node: CollectionNodeMap[C]) => CollectionNodeMap[C];
}

const UNTITLED = 'Без названия';
const titleOrUntitled = (title: string) => title.trim() || UNTITLED;
const COPY_SUFFIX: Record<Locale, string> = { ru: ' — копия', en: ' — copy' };

const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** The highest numeric service number plus one, zero-padded: «01», «02»… → «03». */
function nextServiceNumber(tree: SiteTree): string {
  const numbers = tree.services.flatMap(({ number }) =>
    /^\d+$/.test(number) ? [Number(number)] : [],
  );
  return String(Math.max(0, ...numbers) + 1).padStart(2, '0');
}

function randomSlugPart(length: number): string {
  return Array.from(
    globalThis.crypto.getRandomValues(new Uint8Array(length)),
    (byte) => SLUG_ALPHABET[byte % SLUG_ALPHABET.length],
  ).join('');
}

export const COLLECTION_SCHEMAS: { readonly [C in CollectionKey]: CollectionSchema<C> } = {
  services: {
    kind: 'УСЛУГА',
    noun: 'Услуга',
    addLabel: 'Добавить услугу',
    title: (node, locale) => titleOrUntitled(node[locale].title),
    fields: [
      { key: 'number', label: 'Номер', type: 'text', localized: false, hint: '02' },
      { key: 'title', label: 'Заголовок', type: 'text', localized: true },
      { key: 'description', label: 'Описание', type: 'textarea', localized: true },
      {
        key: 'bullets',
        label: 'Что входит',
        type: 'list',
        localized: true,
        addLabel: 'Добавить пункт',
      },
      {
        key: 'techLine',
        label: 'Технологии (необязательно)',
        type: 'text',
        localized: true,
        hint: 'React · Next.js',
      },
      {
        key: 'badge',
        label: 'Плашка главной услуги',
        type: 'text',
        localized: true,
        hint: 'МОЯ ГЛАВНАЯ СИЛА',
      },
      {
        key: 'featured',
        label: 'Главная услуга — большая карточка',
        type: 'boolean',
        localized: false,
        exclusive: true,
      },
    ] satisfies readonly DeclaredField<'services'>[],
    blank: ({ tree }) => {
      const node = newCollectionNode('services');
      return {
        ...node,
        number: nextServiceNumber(tree),
        ru: {
          ...node.ru,
          title: 'Новая услуга',
          description: 'Коротко опишите, что входит и какую задачу это решает для клиента.',
          bullets: ['Что получает клиент'],
        },
        en: {
          ...node.en,
          title: 'New service',
          description:
            'Briefly describe what is included and which problem it solves for the client.',
          bullets: ['What the client gets'],
        },
      };
    },
    duplicate: (node) => {
      const copy = structuredClone(node);
      return {
        ...copy,
        id: newCmsId(),
        featured: false,
        ru: { ...copy.ru, title: copy.ru.title + COPY_SUFFIX.ru },
        en: { ...copy.en, title: copy.en.title + COPY_SUFFIX.en },
      };
    },
  },

  pricing: {
    kind: 'ТАРИФ',
    noun: 'Тариф',
    addLabel: 'Добавить тариф',
    title: (node, locale) => titleOrUntitled(node[locale].name),
    fields: [
      { key: 'name', label: 'Название тарифа', type: 'text', localized: true },
      { key: 'priceLabel', label: 'Цена', type: 'text', localized: true, hint: 'от $700' },
      { key: 'termLine', label: 'Срок и условия', type: 'text', localized: true },
      { key: 'description', label: 'Для кого', type: 'textarea', localized: true },
      {
        key: 'features',
        label: 'Что входит',
        type: 'list',
        localized: true,
        addLabel: 'Добавить пункт',
      },
      {
        key: 'highlighted',
        label: 'Выделить как популярный',
        type: 'boolean',
        localized: false,
        exclusive: true,
        onLabel: 'Да, выделить рамкой и бейджем',
        offLabel: 'Нет, обычный тариф',
      },
      {
        key: 'highlightLabel',
        label: 'Текст бейджа',
        type: 'text',
        localized: true,
        hint: 'ЧАЩЕ ВСЕГО ВЫБИРАЮТ',
      },
    ] satisfies readonly DeclaredField<'pricing'>[],
    blank: () => {
      const node = newCollectionNode('pricing');
      return {
        ...node,
        ru: {
          ...node.ru,
          name: 'Новый тариф',
          priceLabel: 'от $0',
          termLine: 'СРОК — ПО ЗАДАЧЕ',
          description: 'Для кого этот тариф.',
          features: ['Что входит'],
        },
        en: {
          ...node.en,
          name: 'New plan',
          priceLabel: 'from $0',
          termLine: 'TIMELINE — BY SCOPE',
          description: 'Who this plan is for.',
          features: ['What is included'],
        },
      };
    },
    duplicate: (node) => {
      const copy = structuredClone(node);
      return {
        ...copy,
        id: newCmsId(),
        highlighted: false,
        ru: { ...copy.ru, name: copy.ru.name + COPY_SUFFIX.ru },
        en: { ...copy.en, name: copy.en.name + COPY_SUFFIX.en },
      };
    },
  },

  projects: {
    kind: 'РАБОТА В ПОРТФОЛИО',
    noun: 'Работа',
    addLabel: 'Добавить работу',
    title: (node, locale) => titleOrUntitled(node[locale].title),
    fields: [
      { key: 'coverImage', label: 'Обложка 16:10', type: 'image', localized: false },
      { key: 'title', label: 'Название проекта', type: 'text', localized: true },
      {
        key: 'slug',
        label: 'Адрес страницы (slug)',
        type: 'text',
        localized: false,
        hint: 'латиница, через дефис',
        validate: (value) => {
          if (value.trim() === '') return 'Укажите адрес страницы';
          return PROJECT_SLUG_PATTERN.test(value)
            ? null
            : 'Только строчная латиница, цифры и одиночные дефисы, например my-project';
        },
      },
      {
        key: 'badgeType',
        label: 'Тип',
        type: 'select',
        localized: false,
        options: [
          { value: 'work', label: 'Клиентский проект' },
          { value: 'own', label: 'Свой продукт' },
        ],
      },
      {
        key: 'badge',
        label: 'Бейдж',
        type: 'text',
        localized: true,
        hint: 'APP STORE + GOOGLE PLAY',
      },
      {
        key: 'typeTag',
        label: 'Тег типа',
        type: 'text',
        localized: true,
        hint: 'СОБСТВЕННЫЙ ПРОДУКТ',
      },
      { key: 'metaLine', label: 'Описание для карточки', type: 'textarea', localized: true },
      { key: 'factsLine', label: 'Строка с цифрами', type: 'text', localized: true },
      { key: 'role', label: 'Роль', type: 'text', localized: true },
      { key: 'description', label: 'Полное описание', type: 'textarea', localized: true },
      { key: 'pills', label: 'Что сделано', type: 'tags', localized: true },
      {
        key: 'bullets',
        label: 'Пункты подробно',
        type: 'list',
        localized: true,
        addLabel: 'Добавить пункт',
      },
      { key: 'techChips', label: 'Технологии', type: 'tags', localized: true },
      { key: 'screenshots', label: 'Скриншоты', type: 'images', localized: false },
      { key: 'showOnHome', label: 'Показывать на главной', type: 'boolean', localized: false },
      { key: 'seoTitle', label: 'SEO title', type: 'text', localized: true },
      { key: 'seoDescription', label: 'SEO description', type: 'textarea', localized: true },
    ] satisfies readonly DeclaredField<'projects'>[],
    blank: ({ page }) => {
      const node = newCollectionNode('projects');
      return {
        ...node,
        slug: `project-${randomSlugPart(6)}`,
        badgeType: 'work',
        showOnHome: page === 'home',
        ru: {
          ...node.ru,
          title: 'Новый проект',
          typeTag: 'КЛИЕНТСКИЙ ПРОЕКТ',
          metaLine: 'С какой задачей пришёл клиент и что получилось в результате.',
          factsLine: '×× показатель · ×× показатель',
          pills: ['Тег'],
          techChips: ['Стек проекта'],
        },
        en: {
          ...node.en,
          title: 'New project',
          typeTag: 'CLIENT PROJECT',
          metaLine: 'What the client came with and what came out of it.',
          factsLine: '×× metric · ×× metric',
          pills: ['Tag'],
          techChips: ['Project stack'],
        },
      };
    },
    duplicate: (node) => {
      const copy = structuredClone(node);
      return {
        ...copy,
        id: newCmsId(),
        slug: `${copy.slug || 'project'}-copy-${randomSlugPart(4)}`,
        ru: { ...copy.ru, title: copy.ru.title + COPY_SUFFIX.ru },
        en: { ...copy.en, title: copy.en.title + COPY_SUFFIX.en },
      };
    },
  },
};

/**
 * `COLLECTION_SCHEMAS[collection]` that stays callable for a union key: with
 * `CollectionKey`, `title` / `duplicate` accept any node (pass one from `tree[collection]`).
 */
export function collectionSchema<C extends CollectionKey>(collection: C): CollectionSchema<C> {
  return COLLECTION_SCHEMAS[collection];
}

/** The item with `id`, while the collection still has it. */
export function findItem(
  tree: SiteTree,
  collection: CollectionKey,
  id: string,
): CollectionNode | undefined {
  const items: readonly CollectionNode[] = tree[collection];
  return items.find((item) => item.id === id);
}

// ─── Sections ────────────────────────────────────────────────────────────────

/**
 * Every section has its own copy in `fields` (across the home / chrome singletons).
 * `item: true` marks a section that renders one collection item (the case page,
 * `data-cms-section-item`): its chip opens that item's drawer, while `fields` holds the
 * section's shared chrome labels.
 */
export interface SectionSchema {
  label: string;
  fields: readonly FieldSchema[];
  item?: true;
}

const sectionFields = (fields: readonly SectionField[]): readonly FieldSchema[] => fields;

export const SECTION_SCHEMAS: Record<CmsSectionKey, SectionSchema> = {
  header: {
    label: CMS_SECTION_LABELS.header,
    fields: sectionFields([
      {
        scope: 'chrome',
        key: 'navWorks',
        label: 'Пункт меню «Работы»',
        type: 'text',
        localized: true,
      },
      {
        scope: 'chrome',
        key: 'navPricing',
        label: 'Пункт меню «Цены»',
        type: 'text',
        localized: true,
      },
      { scope: 'chrome', key: 'navCta', label: 'Кнопка в шапке', type: 'text', localized: true },
      {
        scope: 'chrome',
        key: 'navCtaShort',
        label: 'Кнопка в шапке на телефоне',
        type: 'text',
        localized: true,
      },
    ]),
  },
  hero: {
    label: CMS_SECTION_LABELS.hero,
    fields: sectionFields([
      { scope: 'home', key: 'eyebrow', label: 'Надзаголовок', type: 'text', localized: true },
      { scope: 'home', key: 'heroTitle', label: 'Заголовок', type: 'textarea', localized: true },
      {
        scope: 'home',
        key: 'heroSubtitle',
        label: 'Подзаголовок',
        type: 'textarea',
        localized: true,
      },
      {
        scope: 'home',
        key: 'heroSubtitleMobile',
        label: 'Подзаголовок на телефоне',
        type: 'textarea',
        localized: true,
      },
      {
        scope: 'home',
        key: 'heroBullets',
        label: 'Пункты',
        type: 'list',
        localized: true,
        addLabel: 'Добавить пункт',
      },
      {
        scope: 'home',
        key: 'heroNote',
        label: 'Строка с ценой и сроком',
        type: 'text',
        localized: true,
      },
      {
        scope: 'home',
        key: 'heroCtaPrimary',
        label: 'Главная кнопка',
        type: 'text',
        localized: true,
      },
      {
        scope: 'home',
        key: 'heroCtaSecondary',
        label: 'Вторая кнопка',
        type: 'text',
        localized: true,
      },
    ]),
  },
  services: {
    label: CMS_SECTION_LABELS.services,
    fields: sectionFields([
      {
        scope: 'home',
        key: 'servicesEyebrow',
        label: 'Надзаголовок',
        type: 'text',
        localized: true,
      },
      { scope: 'home', key: 'servicesHeading', label: 'Заголовок', type: 'text', localized: true },
      {
        scope: 'home',
        key: 'servicesLede',
        label: 'Вступление',
        type: 'textarea',
        localized: true,
      },
      {
        scope: 'home',
        key: 'servicesSecondaryLabel',
        label: 'Подпись над остальными услугами',
        type: 'text',
        localized: true,
        hint: 'И ВСЕГДА В КОМПЛЕКТЕ',
      },
    ]),
  },
  works: {
    label: CMS_SECTION_LABELS.works,
    fields: sectionFields([
      { scope: 'home', key: 'worksEyebrow', label: 'Надзаголовок', type: 'text', localized: true },
      { scope: 'home', key: 'worksHeading', label: 'Заголовок', type: 'text', localized: true },
      { scope: 'home', key: 'worksLede', label: 'Вступление', type: 'textarea', localized: true },
      {
        scope: 'chrome',
        key: 'viewCaseLabel',
        label: 'Ссылка на кейс в карточке',
        type: 'text',
        localized: true,
      },
    ]),
  },
  pricing: {
    label: CMS_SECTION_LABELS.pricing,
    fields: sectionFields([
      {
        scope: 'home',
        key: 'pricingEyebrow',
        label: 'Надзаголовок',
        type: 'text',
        localized: true,
      },
      { scope: 'home', key: 'pricingHeading', label: 'Заголовок', type: 'text', localized: true },
      {
        scope: 'home',
        key: 'pricingNote',
        label: 'Примечание под заголовком',
        type: 'textarea',
        localized: true,
      },
      {
        scope: 'home',
        key: 'pricingFootnote',
        label: 'Сноска под тарифами',
        type: 'textarea',
        localized: true,
      },
      {
        scope: 'chrome',
        key: 'pricingSwipeHint',
        label: 'Подсказка «листайте» на телефоне',
        type: 'text',
        localized: true,
      },
    ]),
  },
  cta: {
    label: CMS_SECTION_LABELS.cta,
    fields: sectionFields([
      { scope: 'home', key: 'ctaTitle', label: 'Заголовок', type: 'text', localized: true },
      {
        scope: 'home',
        key: 'ctaSubtitle',
        label: 'Подзаголовок',
        type: 'textarea',
        localized: true,
      },
      {
        scope: 'home',
        key: 'ctaTelegramLabel',
        label: 'Кнопка Telegram',
        type: 'text',
        localized: true,
      },
      { scope: 'home', key: 'ctaCvLabel', label: 'Кнопка резюме', type: 'text', localized: true },
    ]),
  },
  footer: {
    label: CMS_SECTION_LABELS.footer,
    fields: sectionFields([
      { scope: 'chrome', key: 'footerTagline', label: 'Слоган', type: 'text', localized: true },
      {
        scope: 'chrome',
        key: 'footerNavHeading',
        label: 'Заголовок меню',
        type: 'text',
        localized: true,
      },
      {
        scope: 'chrome',
        key: 'footerContactsHeading',
        label: 'Заголовок контактов',
        type: 'text',
        localized: true,
      },
      {
        scope: 'chrome',
        key: 'footerRights',
        label: 'Строка о правах',
        type: 'text',
        localized: true,
      },
      {
        scope: 'chrome',
        key: 'footerMadeIn',
        label: 'Строка «Сделано в …»',
        type: 'text',
        localized: true,
      },
    ]),
  },
  case: {
    label: CMS_SECTION_LABELS.case,
    item: true,
    fields: sectionFields([
      {
        scope: 'chrome',
        key: 'backToHomeLabel',
        label: 'Ссылка «На главную»',
        type: 'text',
        localized: true,
      },
      {
        scope: 'chrome',
        key: 'allWorksLabel',
        label: 'Ссылка «Все работы»',
        type: 'text',
        localized: true,
      },
      { scope: 'chrome', key: 'roleLabel', label: 'Подпись «Роль»', type: 'text', localized: true },
      {
        scope: 'chrome',
        key: 'whatWasDoneLabel',
        label: 'Подпись «Что сделано»',
        type: 'text',
        localized: true,
      },
      {
        scope: 'chrome',
        key: 'stackLabel',
        label: 'Подпись «Стек»',
        type: 'text',
        localized: true,
      },
    ]),
  },
};

/** `<scope>.<key>` → its section; every singleton field belongs to exactly one section. */
const SECTION_BY_FIELD = new Map(
  CMS_SECTION_KEYS.flatMap((section) =>
    SECTION_SCHEMAS[section].fields.map(
      (field) => [`${field.scope}.${field.key}`, { section, field }] as const,
    ),
  ),
);

// ─── Path helpers ────────────────────────────────────────────────────────────

/** CMS path of `field` on `target`; `locale` is ignored for language-neutral fields. */
export function fieldPath(target: DrawerTarget, field: FieldSchema, locale: Locale): string {
  // Keys are checked against CMS_FIELD_MODEL where the schemas are declared, so the casts hold.
  if (target.kind === 'item') {
    const { collection, id } = target;
    return field.localized
      ? cmsPath.itemLocale(collection, id, locale, field.key as CmsLocalizedField<CollectionKey>)
      : cmsPath.itemField(collection, id, field.key as CmsNeutralField<CollectionKey>);
  }
  switch (field.scope) {
    case 'home':
      return field.localized
        ? cmsPath.home(locale, field.key as CmsLocalizedField<'home'>)
        : cmsPath.homeNeutral(field.key as CmsNeutralField<'home'>);
    case 'chrome':
      return cmsPath.chrome(locale, field.key as CmsLocalizedField<'chrome'>);
    case undefined:
      throw new Error(`Section field "${field.key}" has no scope`);
  }
}

/** The section (and its field) that edits a singleton path such as `home.ru.heroBullets.2`; null otherwise. */
function findSectionForPath(path: string): { section: CmsSectionKey; field: FieldSchema } | null {
  const parsed = parseCmsPath(path);
  if (parsed?.kind !== 'field') return null;
  return SECTION_BY_FIELD.get(`${parsed.scope}.${parsed.field}`) ?? null;
}

/** The drawer that edits `path`, focused on it; null for paths no drawer shows (collections, hidden sections). */
export function drawerTargetForPath(path: string): DrawerTarget | null {
  const parsed = parseCmsPath(path);
  switch (parsed?.kind) {
    case 'item':
      return { kind: 'item', collection: parsed.collection, id: parsed.id };
    case 'itemField':
      return { kind: 'item', collection: parsed.collection, id: parsed.id, focusPath: path };
    case 'field': {
      const hit = findSectionForPath(path);
      return hit && { kind: 'section', section: hit.section, focusPath: path };
    }
    default:
      return null;
  }
}

/** Whether publish requires the field non-blank (RU and neutral block, EN only warns). */
export function isRequired(target: DrawerTarget, field: FieldSchema): boolean {
  const scope: CmsScope | undefined = target.kind === 'item' ? target.collection : field.scope;
  if (!scope) return false;
  const required: { neutral: readonly string[]; localized: readonly string[] } =
    CMS_REQUIRED_FIELDS[scope];
  return (field.localized ? required.localized : required.neutral).includes(field.key);
}

function itemLabel(tree: SiteTree, collection: CollectionKey, id: string): string {
  const schema = collectionSchema(collection);
  const node = findItem(tree, collection, id);
  return node ? `${schema.noun} «${schema.title(node, 'ru')}»` : schema.noun;
}

/** What a drawer edits, for history entries and toasts: «Тариф «Лендинг»» or «Секция «Цены»». */
export function targetLabel(target: DrawerTarget, tree: SiteTree): string {
  return target.kind === 'item'
    ? itemLabel(tree, target.collection, target.id)
    : `Секция «${SECTION_SCHEMAS[target.section].label}»`;
}

/**
 * Human label of a CMS path for publish issues: «Тариф «Лендинг» · Цена (RU)»,
 * «Цены · Заголовок (EN)»; the raw path when nothing matches.
 */
export function labelForPath(path: string, tree: SiteTree): string {
  const parsed = parseCmsPath(path);
  if (!parsed || parsed.kind === 'collection') return path;
  if (parsed.kind === 'item') return itemLabel(tree, parsed.collection, parsed.id);

  const locale = parsed.locale ? ` (${LOCALE_LABELS[parsed.locale]})` : '';
  if (parsed.kind === 'field') {
    const hit = findSectionForPath(path);
    return hit ? `${SECTION_SCHEMAS[hit.section].label} · ${hit.field.label}${locale}` : path;
  }
  const field = COLLECTION_SCHEMAS[parsed.collection].fields.find(
    ({ key }) => key === parsed.field,
  );
  return `${itemLabel(tree, parsed.collection, parsed.id)} · ${field?.label ?? parsed.field}${locale}`;
}
