import { z } from 'zod';
import type { Locale } from '../constants/locales';
import { translatedSchema } from '../dto/common';
import {
  aboutSectionKeySchema,
  homeSectionKeySchema,
  projectBadgeSchema,
  type ProjectBadge,
} from '../dto/enums';
import { homeContentSchema } from '../dto/home';
import { aboutProfileSchema } from '../dto/about';
import { siteChromeSchema } from '../dto/chrome';
import { serviceSchema } from '../dto/service';
import { pricingPlanSchema } from '../dto/pricing';
import { projectSchema } from '../dto/project';
import { experienceSchema } from '../dto/experience';
import { stackCategorySchema } from '../dto/stack';
import { hobbyCardSchema } from '../dto/hobby';

/** Item id charset — ids must stay safe inside dot paths and `<collection>:<id>` refs. */
export const CMS_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
export const cmsIdSchema = z.string().regex(CMS_ID_PATTERN);

export const collectionKeySchema = z.enum([
  'services',
  'pricing',
  'projects',
  'experience',
  'stack',
  'hobbies',
]);
export type CollectionKey = z.infer<typeof collectionKeySchema>;
export const COLLECTION_KEYS = collectionKeySchema.options;

export function isCollectionKey(value: unknown): value is CollectionKey {
  return typeof value === 'string' && (COLLECTION_KEYS as readonly string[]).includes(value);
}

/** Every `data-cms-section` key; the hideable ones are HOME_SECTION_KEYS / ABOUT_SECTION_KEYS. */
export const cmsSectionKeySchema = z.enum([
  'header',
  'hero',
  'services',
  'works',
  'pricing',
  'cta',
  'footer',
  'aboutHero',
  'experience',
  'projects',
  'stack',
  'hobbies',
  'case',
]);
export type CmsSectionKey = z.infer<typeof cmsSectionKeySchema>;
export const CMS_SECTION_KEYS = cmsSectionKeySchema.options;

// ─── Localized copy ──────────────────────────────────────────────────────────

export const homeCopySchema = homeContentSchema.strict();
export type HomeCopy = z.infer<typeof homeCopySchema>;

export const aboutCopySchema = aboutProfileSchema.omit({ photoUrl: true }).strict();
export type AboutCopy = z.infer<typeof aboutCopySchema>;

export const chromeCopySchema = siteChromeSchema.strict();
export type ChromeCopy = z.infer<typeof chromeCopySchema>;

const serviceCopySchema = serviceSchema
  .pick({ title: true, description: true, badge: true, bullets: true, techLine: true })
  .strict();

const pricingCopySchema = pricingPlanSchema
  .pick({
    name: true,
    priceLabel: true,
    termLine: true,
    highlightLabel: true,
    description: true,
    features: true,
  })
  .strict();

const projectCopySchema = projectSchema
  .pick({
    title: true,
    badge: true,
    typeTag: true,
    metaLine: true,
    factsLine: true,
    role: true,
    description: true,
    pills: true,
    bullets: true,
    techChips: true,
    seoTitle: true,
    seoDescription: true,
  })
  .strict();

const experienceCopySchema = experienceSchema
  .pick({ role: true, meta: true, description: true })
  .strict();

const stackCopySchema = stackCategorySchema.pick({ title: true }).strict();

const hobbyCopySchema = hobbyCardSchema.pick({ title: true, description: true }).strict();

// ─── Collection nodes (array order is sortOrder) ─────────────────────────────

/** `published` is a passthrough the editor never shows; new items are published. */
const nodeBase = { id: cmsIdSchema, published: z.boolean() };

export const serviceNodeSchema = z
  .object({
    ...nodeBase,
    number: z.string(),
    featured: z.boolean(),
    ...translatedSchema(serviceCopySchema).shape,
  })
  .strict();
export type ServiceNode = z.infer<typeof serviceNodeSchema>;

export const pricingNodeSchema = z
  .object({
    ...nodeBase,
    highlighted: z.boolean(),
    ...translatedSchema(pricingCopySchema).shape,
  })
  .strict();
export type PricingNode = z.infer<typeof pricingNodeSchema>;

export const projectNodeSchema = z
  .object({
    ...nodeBase,
    slug: z.string(),
    badgeType: projectBadgeSchema,
    showOnHome: z.boolean(),
    showOnAbout: z.boolean(),
    coverImage: z.string().nullable(),
    screenshots: z.array(z.string()),
    ...translatedSchema(projectCopySchema).shape,
  })
  .strict();
export type ProjectNode = z.infer<typeof projectNodeSchema>;

export const experienceNodeSchema = z
  .object({
    ...nodeBase,
    company: z.string(),
    ...translatedSchema(experienceCopySchema).shape,
  })
  .strict();
export type ExperienceNode = z.infer<typeof experienceNodeSchema>;

export const stackNodeSchema = z
  .object({
    ...nodeBase,
    items: z.array(z.string()),
    ...translatedSchema(stackCopySchema).shape,
  })
  .strict();
export type StackNode = z.infer<typeof stackNodeSchema>;

export const hobbyNodeSchema = z
  .object({
    ...nodeBase,
    handle: z.string(),
    url: z.string(),
    imageUrl: z.string().nullable(),
    ...translatedSchema(hobbyCopySchema).shape,
  })
  .strict();
export type HobbyNode = z.infer<typeof hobbyNodeSchema>;

export const nodeSchemaByCollection = {
  services: serviceNodeSchema,
  pricing: pricingNodeSchema,
  projects: projectNodeSchema,
  experience: experienceNodeSchema,
  stack: stackNodeSchema,
  hobbies: hobbyNodeSchema,
} as const satisfies Record<CollectionKey, z.ZodTypeAny>;

/** Any collection item (each node schema is strict, so a value matches at most one). */
export const collectionNodeSchema = z.union([
  serviceNodeSchema,
  pricingNodeSchema,
  projectNodeSchema,
  experienceNodeSchema,
  stackNodeSchema,
  hobbyNodeSchema,
]);

// ─── Site tree ───────────────────────────────────────────────────────────────

/** Collection items with unique ids: every item op and publish's upsert address items by id. */
const collectionSchema = <T extends z.ZodType<{ id: string }>>(node: T) =>
  z.array(node).superRefine((items, ctx) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      if (seen.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'id'],
          message: `duplicate id ${item.id}`,
        });
      }
      seen.add(item.id);
    });
  });

/** Hidden section keys, each at most once (one canonical form per set of hidden sections). */
const hiddenSectionsSchema = <T extends z.ZodTypeAny>(key: T) =>
  z.array(key).refine((keys) => new Set(keys).size === keys.length, 'duplicate section');

/** The whole editable site, both locales. Strings may be blank in a draft; publish checks them. */
export const siteTreeSchema = z
  .object({
    version: z.literal(1),
    home: z
      .object({
        hiddenSections: hiddenSectionsSchema(homeSectionKeySchema),
        ...translatedSchema(homeCopySchema).shape,
      })
      .strict(),
    about: z
      .object({
        photoUrl: z.string().nullable(),
        hiddenSections: hiddenSectionsSchema(aboutSectionKeySchema),
        ...translatedSchema(aboutCopySchema).shape,
      })
      .strict(),
    chrome: translatedSchema(chromeCopySchema).strict(),
    services: collectionSchema(serviceNodeSchema),
    pricing: collectionSchema(pricingNodeSchema),
    projects: collectionSchema(projectNodeSchema),
    experience: collectionSchema(experienceNodeSchema),
    stack: collectionSchema(stackNodeSchema),
    hobbies: collectionSchema(hobbyNodeSchema),
  })
  .strict();
export type SiteTree = z.infer<typeof siteTreeSchema>;

export type CollectionNodeMap = { [K in CollectionKey]: SiteTree[K][number] };
export type CollectionNode = CollectionNodeMap[CollectionKey];

// ─── Field model (what paths may address and what a `set` must carry) ────────

export type CmsFieldKind =
  'string' | 'nullableString' | 'boolean' | 'stringList' | 'sectionList' | 'badgeType';

type KindOf<T> = [T] extends [ProjectBadge]
  ? 'badgeType'
  : [T] extends [string]
    ? 'string'
    : [T] extends [string | null]
      ? 'nullableString'
      : [T] extends [boolean]
        ? 'boolean'
        : [T] extends [CmsSectionKey[]]
          ? 'sectionList'
          : [T] extends [string[]]
            ? 'stringList'
            : never;

type ScopeFieldModel<Neutral, Copy> = {
  neutral: { [K in keyof Neutral]: KindOf<Neutral[K]> };
  localized: { [K in keyof Copy]: KindOf<Copy[K]> };
};

type NodeFieldModel<N extends Record<Locale, unknown>> = ScopeFieldModel<
  Omit<N, 'id' | 'published' | Locale>,
  N[Locale]
>;

/**
 * Every addressable field per scope with its value kind; checked against the
 * schemas at compile time. `id` and `published` are not addressable.
 */
export const CMS_FIELD_MODEL = {
  home: {
    neutral: { hiddenSections: 'sectionList' },
    localized: {
      eyebrow: 'string',
      heroTitle: 'string',
      heroSubtitle: 'string',
      heroSubtitleMobile: 'string',
      heroBullets: 'stringList',
      heroNote: 'string',
      heroCtaPrimary: 'string',
      heroCtaSecondary: 'string',
      servicesEyebrow: 'string',
      servicesHeading: 'string',
      servicesLede: 'string',
      servicesSecondaryLabel: 'string',
      worksEyebrow: 'string',
      worksHeading: 'string',
      worksLede: 'string',
      worksLinkLabel: 'string',
      pricingEyebrow: 'string',
      pricingHeading: 'string',
      pricingNote: 'string',
      pricingFootnote: 'string',
      ctaTitle: 'string',
      ctaSubtitle: 'string',
      ctaTelegramLabel: 'string',
      ctaCvLabel: 'string',
    },
  },
  about: {
    neutral: { photoUrl: 'nullableString', hiddenSections: 'sectionList' },
    localized: {
      name: 'string',
      photoCaption: 'string',
      bioHtml: 'string',
      experienceHeading: 'string',
      projectsHeading: 'string',
      stackHeading: 'string',
      hobbiesHeading: 'string',
    },
  },
  chrome: {
    neutral: {},
    localized: {
      navWorks: 'string',
      navPricing: 'string',
      navAbout: 'string',
      navCta: 'string',
      navCtaShort: 'string',
      footerTagline: 'string',
      footerNavHeading: 'string',
      footerContactsHeading: 'string',
      footerRights: 'string',
      footerMadeIn: 'string',
      viewCaseLabel: 'string',
      allWorksLabel: 'string',
      backToHomeLabel: 'string',
      roleLabel: 'string',
      stackLabel: 'string',
      whatWasDoneLabel: 'string',
      pricingSwipeHint: 'string',
    },
  },
  services: {
    neutral: { number: 'string', featured: 'boolean' },
    localized: {
      title: 'string',
      description: 'string',
      badge: 'string',
      bullets: 'stringList',
      techLine: 'string',
    },
  },
  pricing: {
    neutral: { highlighted: 'boolean' },
    localized: {
      name: 'string',
      priceLabel: 'string',
      termLine: 'string',
      highlightLabel: 'string',
      description: 'string',
      features: 'stringList',
    },
  },
  projects: {
    neutral: {
      slug: 'string',
      badgeType: 'badgeType',
      showOnHome: 'boolean',
      showOnAbout: 'boolean',
      coverImage: 'nullableString',
      screenshots: 'stringList',
    },
    localized: {
      title: 'string',
      badge: 'string',
      typeTag: 'string',
      metaLine: 'string',
      factsLine: 'string',
      role: 'string',
      description: 'string',
      pills: 'stringList',
      bullets: 'stringList',
      techChips: 'stringList',
      seoTitle: 'string',
      seoDescription: 'string',
    },
  },
  experience: {
    neutral: { company: 'string' },
    localized: { role: 'string', meta: 'string', description: 'string' },
  },
  stack: {
    neutral: { items: 'stringList' },
    localized: { title: 'string' },
  },
  hobbies: {
    neutral: { handle: 'string', url: 'string', imageUrl: 'nullableString' },
    localized: { title: 'string', description: 'string' },
  },
} as const satisfies {
  home: ScopeFieldModel<Omit<SiteTree['home'], Locale>, HomeCopy>;
  about: ScopeFieldModel<Omit<SiteTree['about'], Locale>, AboutCopy>;
  chrome: ScopeFieldModel<Omit<SiteTree['chrome'], Locale>, ChromeCopy>;
} & { [K in CollectionKey]: NodeFieldModel<CollectionNodeMap[K]> };

export type CmsScope = keyof typeof CMS_FIELD_MODEL;
export type CmsSingletonScope = Exclude<CmsScope, CollectionKey>;
/** Distributes over a union: `CmsNeutralField<CollectionKey>` is any collection's neutral field. */
export type CmsNeutralField<S extends CmsScope> = S extends CmsScope
  ? keyof (typeof CMS_FIELD_MODEL)[S]['neutral'] & string
  : never;
/** Distributes over a union: `CmsLocalizedField<CollectionKey>` is any collection's localized field. */
export type CmsLocalizedField<S extends CmsScope> = S extends CmsScope
  ? keyof (typeof CMS_FIELD_MODEL)[S]['localized'] & string
  : never;

/**
 * Fields publish requires non-blank (docs/visual-editor.md §3): a blank RU or neutral
 * field is an error, a blank EN field a warning (projections fall back to RU).
 */
export const CMS_REQUIRED_FIELDS: {
  [S in CmsScope]: {
    neutral: readonly CmsNeutralField<S>[];
    localized: readonly CmsLocalizedField<S>[];
  };
} = {
  home: {
    neutral: [],
    localized: [
      'heroTitle',
      'heroSubtitle',
      'heroCtaPrimary',
      'heroCtaSecondary',
      'servicesHeading',
      'worksHeading',
      'pricingHeading',
      'ctaTitle',
      'ctaSubtitle',
      'ctaTelegramLabel',
      'ctaCvLabel',
    ],
  },
  about: {
    neutral: [],
    localized: [
      'name',
      'bioHtml',
      'experienceHeading',
      'projectsHeading',
      'stackHeading',
      'hobbiesHeading',
    ],
  },
  chrome: {
    neutral: [],
    localized: Object.keys(CMS_FIELD_MODEL.chrome.localized) as CmsLocalizedField<'chrome'>[],
  },
  services: { neutral: ['number'], localized: ['title', 'description'] },
  pricing: { neutral: [], localized: ['name', 'priceLabel', 'termLine', 'description'] },
  projects: { neutral: ['slug'], localized: ['title', 'badge', 'metaLine', 'description'] },
  experience: { neutral: ['company'], localized: ['role', 'meta', 'description'] },
  stack: { neutral: [], localized: ['title'] },
  hobbies: { neutral: ['handle'], localized: ['title', 'description'] },
};

const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Id for a new collection item: `n` + 24 base36 chars (modulo bias is irrelevant for ids). */
export function newCmsId(): string {
  let id = 'n';
  for (const byte of globalThis.crypto.getRandomValues(new Uint8Array(24))) {
    id += ID_ALPHABET[byte % ID_ALPHABET.length];
  }
  return id;
}

const BLANK_BY_KIND: Record<CmsFieldKind, unknown> = {
  string: '',
  nullableString: null,
  boolean: false,
  stringList: [],
  sectionList: [],
  badgeType: 'work',
};

type FieldKinds = Readonly<Record<string, CmsFieldKind>>;

const blankFields = (fields: FieldKinds) =>
  Object.fromEntries(Object.entries(fields).map(([field, kind]) => [field, BLANK_BY_KIND[kind]]));

/**
 * A blank item for «+ Добавить»: fresh id, `published: true` (D9), every other field
 * empty / null / false and `badgeType: 'work'`. Callers set context flags such as `showOnHome`.
 */
export function newCollectionNode<C extends CollectionKey>(collection: C): CollectionNodeMap[C] {
  const model: { neutral: FieldKinds; localized: FieldKinds } = CMS_FIELD_MODEL[collection];
  const schema: z.ZodType<CollectionNode> = nodeSchemaByCollection[collection];
  // Parsing copies the shared blank arrays and fails loudly if the model and the schema drift.
  return schema.parse({
    id: newCmsId(),
    published: true,
    ...blankFields(model.neutral),
    ru: blankFields(model.localized),
    en: blankFields(model.localized),
  }) as CollectionNodeMap[C];
}
