import { z } from 'zod';
import type { Locale } from '../constants/locales';
import { translatedSchema } from '../dto/common';
import { homeSectionKeySchema, projectBadgeSchema, type ProjectBadge } from '../dto/enums';
import { homeContentSchema } from '../dto/home';
import { siteChromeSchema } from '../dto/chrome';
import { processStepSchema } from '../dto/process-step';
import { pricingPlanSchema } from '../dto/pricing';
import { projectSchema, type ProjectFact } from '../dto/project';

/** Item id charset — ids must stay safe inside dot paths and `<collection>:<id>` refs. */
export const CMS_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
export const cmsIdSchema = z.string().regex(CMS_ID_PATTERN);

export const collectionKeySchema = z.enum(['steps', 'pricing', 'projects']);
export type CollectionKey = z.infer<typeof collectionKeySchema>;
export const COLLECTION_KEYS = collectionKeySchema.options;

export function isCollectionKey(value: unknown): value is CollectionKey {
  return typeof value === 'string' && (COLLECTION_KEYS as readonly string[]).includes(value);
}

/** Every `data-cms-section` key; the hideable ones are HOME_SECTION_KEYS. */
export const cmsSectionKeySchema = z.enum([
  'header',
  'hero',
  'process',
  'works',
  'pricing',
  'cta',
  'footer',
  'case',
]);
export type CmsSectionKey = z.infer<typeof cmsSectionKeySchema>;
export const CMS_SECTION_KEYS = cmsSectionKeySchema.options;

// ─── Localized copy ──────────────────────────────────────────────────────────

export const homeCopySchema = homeContentSchema.strict();
export type HomeCopy = z.infer<typeof homeCopySchema>;

export const chromeCopySchema = siteChromeSchema.strict();
export type ChromeCopy = z.infer<typeof chromeCopySchema>;

const stepCopySchema = processStepSchema
  .pick({ title: true, description: true, from: true, result: true })
  .strict();

const pricingCopySchema = pricingPlanSchema
  .pick({
    name: true,
    priceLabel: true,
    termLine: true,
    highlightLabel: true,
    ctaLabel: true,
    description: true,
    examples: true,
    listHeading: true,
    features: true,
    extras: true,
  })
  .strict();

const projectCopySchema = projectSchema
  .pick({
    title: true,
    badge: true,
    typeTag: true,
    metaLine: true,
    facts: true,
    role: true,
    description: true,
    pills: true,
    bullets: true,
    techChips: true,
    seoTitle: true,
    seoDescription: true,
  })
  .strict();

// ─── Collection nodes (array order is sortOrder) ─────────────────────────────

/** `published` is a passthrough the editor never shows; new items are published. */
const nodeBase = { id: cmsIdSchema, published: z.boolean() };

/** A step of the «Процесс и услуги» timeline; its number is its position, never stored. */
export const stepNodeSchema = z
  .object({
    ...nodeBase,
    isMain: z.boolean(),
    ...translatedSchema(stepCopySchema).shape,
  })
  .strict();
export type StepNode = z.infer<typeof stepNodeSchema>;

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
    coverImage: z.string().nullable(),
    screenshots: z.array(z.string()),
    appStoreUrl: z.string(),
    googlePlayUrl: z.string(),
    ...translatedSchema(projectCopySchema).shape,
  })
  .strict();
export type ProjectNode = z.infer<typeof projectNodeSchema>;

export const nodeSchemaByCollection = {
  steps: stepNodeSchema,
  pricing: pricingNodeSchema,
  projects: projectNodeSchema,
} as const satisfies Record<CollectionKey, z.ZodTypeAny>;

/** Any collection item (each node schema is strict, so a value matches at most one). */
export const collectionNodeSchema = z.union([stepNodeSchema, pricingNodeSchema, projectNodeSchema]);

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
    chrome: translatedSchema(chromeCopySchema).strict(),
    steps: collectionSchema(stepNodeSchema),
    pricing: collectionSchema(pricingNodeSchema),
    projects: collectionSchema(projectNodeSchema),
  })
  .strict();
export type SiteTree = z.infer<typeof siteTreeSchema>;

export type CollectionNodeMap = { [K in CollectionKey]: SiteTree[K][number] };
export type CollectionNode = CollectionNodeMap[CollectionKey];

// ─── Field model (what paths may address and what a `set` must carry) ────────

export type CmsFieldKind =
  'string' | 'nullableString' | 'boolean' | 'stringList' | 'sectionList' | 'badgeType' | 'factList';

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
            : [T] extends [ProjectFact[]]
              ? 'factList'
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
      processEyebrow: 'string',
      processHeading: 'string',
      processSubheading: 'string',
      processPill: 'string',
      processFromLabel: 'string',
      processResultLabel: 'string',
      processMainLabel: 'string',
      processAnnotationLabel: 'string',
      processAnnotationText: 'string',
      worksEyebrow: 'string',
      worksHeading: 'string',
      worksLede: 'string',
      pricingEyebrow: 'string',
      pricingHeading: 'string',
      pricingNote: 'string',
      pricingExamplesLabel: 'string',
      pricingOptionalLabel: 'string',
      pricingFootnote: 'string',
      ctaTitle: 'string',
      ctaSubtitle: 'string',
      ctaTelegramLabel: 'string',
      ctaWhatsappLabel: 'string',
    },
  },
  chrome: {
    neutral: {},
    localized: {
      navWorks: 'string',
      navPricing: 'string',
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
    },
  },
  steps: {
    neutral: { isMain: 'boolean' },
    localized: {
      title: 'string',
      description: 'string',
      from: 'string',
      result: 'string',
    },
  },
  pricing: {
    neutral: { highlighted: 'boolean' },
    localized: {
      name: 'string',
      priceLabel: 'string',
      termLine: 'string',
      highlightLabel: 'string',
      ctaLabel: 'string',
      description: 'string',
      examples: 'string',
      listHeading: 'string',
      features: 'stringList',
      extras: 'stringList',
    },
  },
  projects: {
    neutral: {
      slug: 'string',
      badgeType: 'badgeType',
      showOnHome: 'boolean',
      coverImage: 'nullableString',
      screenshots: 'stringList',
      appStoreUrl: 'string',
      googlePlayUrl: 'string',
    },
    localized: {
      title: 'string',
      badge: 'string',
      typeTag: 'string',
      metaLine: 'string',
      facts: 'factList',
      role: 'string',
      description: 'string',
      pills: 'stringList',
      bullets: 'stringList',
      techChips: 'stringList',
      seoTitle: 'string',
      seoDescription: 'string',
    },
  },
} as const satisfies {
  home: ScopeFieldModel<Omit<SiteTree['home'], Locale>, HomeCopy>;
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
 * The most process steps publish accepts: the desktop timeline keeps every step on one row,
 * and at 1024px a seventh column is too narrow for the copy (docs/visual-editor.md D16).
 */
export const MAX_PROCESS_STEPS = 6;

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
      'processHeading',
      'worksHeading',
      'pricingHeading',
      'ctaTitle',
      'ctaSubtitle',
      'ctaTelegramLabel',
      'ctaWhatsappLabel',
    ],
  },
  chrome: {
    neutral: [],
    localized: Object.keys(CMS_FIELD_MODEL.chrome.localized) as CmsLocalizedField<'chrome'>[],
  },
  steps: { neutral: [], localized: ['title', 'description'] },
  pricing: {
    neutral: [],
    localized: ['name', 'priceLabel', 'termLine', 'ctaLabel', 'description', 'listHeading'],
  },
  projects: { neutral: ['slug'], localized: ['title', 'badge', 'metaLine', 'description'] },
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
  factList: [],
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
