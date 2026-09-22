import {
  CMS_ATTR,
  CMS_FIELD_MODEL,
  CMS_REQUIRED_FIELDS,
  CMS_SECTION_KEYS,
  CMS_SECTION_LABELS,
  CMS_SOURCE,
  COLLECTION_KEYS,
  CmsPatchError,
  DEFAULT_CHROME,
  LOCALES,
  PROJECT_SLUG_PATTERN,
  applyPatches,
  chromeCopySchema,
  cmsItemRef,
  cmsNodeKey,
  cmsPath,
  contentPatchRequestSchema,
  exclusiveFlagPatches,
  getAtPath,
  hiddenSectionPatch,
  invertPatches,
  isCmsChildMessage,
  isCmsParentMessage,
  newCmsId,
  newCollectionNode,
  nodeSchemaByCollection,
  parseCmsItemRef,
  parseCmsPath,
  siteTreeSchema,
  type CmsLocalizedField,
  type CmsNeutralField,
  type CmsScope,
  type CollectionKey,
  type CollectionNode,
  type ContentPatch,
  type SiteTree,
} from '@alcha/shared';

// ─── Fixture ─────────────────────────────────────────────────────────────────

type FieldKinds = Readonly<Record<string, string>>;

/** Fills every field of a model with a recognisable value (lists get two entries). */
function fill(fields: FieldKinds, tag: string): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([field, kind]) => [
      field,
      kind === 'stringList' ? [`${tag}.${field}.0`, `${tag}.${field}.1`] : `${tag}.${field}`,
    ]),
  );
}

const localized = (fields: FieldKinds, tag: string) => ({
  ru: fill(fields, `${tag}.ru`),
  en: fill(fields, `${tag}.en`),
});

const M = CMS_FIELD_MODEL;

const TREE: SiteTree = siteTreeSchema.parse({
  version: 1,
  home: { hiddenSections: ['works'], ...localized(M.home.localized, 'home') },
  chrome: localized(M.chrome.localized, 'chrome'),
  services: ['s1', 's2', 's3'].map((id, i) => ({
    id,
    published: true,
    number: `0${i + 1}`,
    featured: i === 0,
    ...localized(M.services.localized, id),
  })),
  pricing: ['p1', 'p2', 'p3'].map((id, i) => ({
    id,
    published: true,
    highlighted: i === 1,
    ...localized(M.pricing.localized, id),
  })),
  projects: ['pr1', 'pr2', 'pr3'].map((id, i) => ({
    id,
    published: i !== 2,
    slug: `${id}-slug`,
    badgeType: i === 0 ? 'own' : 'work',
    showOnHome: i !== 1,
    coverImage: i === 0 ? null : `https://cdn/${id}.png`,
    screenshots: [`https://cdn/${id}-0.png`, `https://cdn/${id}-1.png`],
    ...localized(M.projects.localized, id),
  })),
});

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const set = (path: string, value: unknown): ContentPatch => ({ op: 'set', path, value });
const remove = (path: string): ContentPatch => ({ op: 'remove', path });
const move = (path: string, value: number): ContentPatch => ({ op: 'move', path, value });
const insert = (path: CollectionKey, value: CollectionNode, index?: number): ContentPatch =>
  index === undefined ? { op: 'insert', path, value } : { op: 'insert', path, value, index };
const idsOf = (tree: SiteTree, collection: CollectionKey) =>
  (tree[collection] as readonly CollectionNode[]).map((node) => node.id);
const apply = (patches: ContentPatch[], tree: SiteTree = TREE) => applyPatches(tree, patches);
const expectPatchError = (patches: ContentPatch[], tree: SiteTree = TREE) =>
  expect(() => applyPatches(tree, patches)).toThrow(CmsPatchError);

const NEW_SERVICE: CollectionNode = { ...clone(TREE.services[0]), id: 'nNew', featured: false };

// ─── Tree schema ─────────────────────────────────────────────────────────────

describe('siteTreeSchema', () => {
  it('accepts the fixture (field model and schemas agree)', () => {
    expect(siteTreeSchema.safeParse(clone(TREE)).success).toBe(true);
  });

  const mutations: Array<[string, (tree: Record<string, any>) => void]> = [
    ['extra root key', (t) => (t.extra = 1)],
    ['extra home key', (t) => (t.home.extra = 1)],
    ['extra localized copy key', (t) => (t.home.ru.extra = '')],
    ['extra chrome key', (t) => (t.chrome.ru.extra = '')],
    ['extra item key', (t) => (t.services[0].sortOrder = 0)],
    ['extra item copy key', (t) => (t.projects[0].en.extra = '')],
    ['missing localized field', (t) => delete t.chrome.en.navWorks],
    ['wrong version', (t) => (t.version = 2)],
    ['bad id charset', (t) => (t.pricing[0].id = 'a.b')],
    ['unknown hidden section', (t) => (t.home.hiddenSections = ['experience'])],
    ['bad badgeType', (t) => (t.projects[0].badgeType = 'client')],
    ['duplicate item id', (t) => (t.services[2].id = 's1')],
    ['duplicate home hidden section', (t) => (t.home.hiddenSections = ['works', 'works'])],
    ['removed about scope', (t) => (t.about = {})],
    ['removed hobbies collection', (t) => (t.hobbies = [])],
    ['removed showOnAbout flag', (t) => (t.projects[0].showOnAbout = true)],
    ['removed navAbout label', (t) => (t.chrome.ru.navAbout = 'Обо мне')],
    ['removed worksLinkLabel', (t) => (t.home.en.worksLinkLabel = '')],
  ];
  it.each(mutations)('rejects %s', (_, mutate) => {
    const tree = clone(TREE) as Record<string, any>;
    mutate(tree);
    expect(siteTreeSchema.safeParse(tree).success).toBe(false);
  });

  it('reports a duplicate id at the repeated item', () => {
    const tree = clone(TREE) as Record<string, any>;
    tree.pricing[2].id = 'p1';
    const result = siteTreeSchema.safeParse(tree);
    expect(result.success ? [] : result.error.issues.map((issue) => issue.path)).toEqual([
      ['pricing', 2, 'id'],
    ]);
  });
});

describe('newCmsId', () => {
  it('is n + 24 base36 chars, unique and path-safe', () => {
    const ids = Array.from({ length: 200 }, () => newCmsId());
    for (const id of ids) {
      expect(id).toMatch(/^n[0-9a-z]{24}$/);
      expect(parseCmsPath(`services.${id}`)).toEqual({ kind: 'item', collection: 'services', id });
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('newCollectionNode', () => {
  const BLANK: Record<string, unknown> = {
    string: '',
    nullableString: null,
    boolean: false,
    stringList: [],
    badgeType: 'work',
  };

  it.each(COLLECTION_KEYS)('builds a blank, published, insertable %s item', (collection) => {
    const node = newCollectionNode(collection) as Record<string, any>;
    expect(nodeSchemaByCollection[collection].safeParse(node).success).toBe(true);
    expect(node.id).toMatch(/^n[0-9a-z]{24}$/);
    expect(node.published).toBe(true);
    for (const [field, kind] of Object.entries(M[collection].neutral))
      expect(node[field]).toEqual(BLANK[kind]);
    for (const locale of ['ru', 'en']) {
      for (const [field, kind] of Object.entries(M[collection].localized))
        expect(node[locale][field]).toEqual(BLANK[kind]);
    }
    expect(idsOf(apply([insert(collection, node as CollectionNode)]).tree, collection)).toContain(
      node.id,
    );
  });

  it('never shares ids or lists between items', () => {
    const [a, b] = [newCollectionNode('projects'), newCollectionNode('projects')];
    expect(a.id).not.toBe(b.id);
    expect(a.screenshots).not.toBe(b.screenshots);
    expect(a.ru.pills).not.toBe(b.ru.pills);
    expect(a.ru.pills).not.toBe(a.en.pills);
  });
});

describe('CMS_REQUIRED_FIELDS', () => {
  it('lists only string fields of the field model (chrome in full)', () => {
    for (const scope of Object.keys(CMS_REQUIRED_FIELDS) as CmsScope[]) {
      const model: { neutral: FieldKinds; localized: FieldKinds } = M[scope];
      const required = CMS_REQUIRED_FIELDS[scope];
      for (const field of required.neutral)
        expect([scope, field, model.neutral[field]]).toEqual([scope, field, 'string']);
      for (const field of required.localized)
        expect([scope, field, model.localized[field]]).toEqual([scope, field, 'string']);
    }
    expect(CMS_REQUIRED_FIELDS.chrome.localized).toEqual(Object.keys(M.chrome.localized));
    expect(CMS_REQUIRED_FIELDS.projects.neutral).toEqual(['slug']);
  });
});

describe('DEFAULT_CHROME', () => {
  it.each(LOCALES)('is complete, non-blank %s chrome copy', (locale) => {
    expect(chromeCopySchema.safeParse(DEFAULT_CHROME[locale]).success).toBe(true);
    expect(Object.values(DEFAULT_CHROME[locale]).every((label) => label.trim().length > 0)).toBe(
      true,
    );
  });
});

describe('PROJECT_SLUG_PATTERN', () => {
  it.each<[string, boolean]>([
    ['pr1-slug', true],
    ['alcha-dev-2', true],
    ['2024', true],
    ['', false],
    ['-app', false],
    ['app-', false],
    ['my--app', false],
    ['-', false],
    ['My-App', false],
    ['app_1', false],
    ['app.1', false],
    ['курс', false],
  ])('%j → %s', (slug, valid) => {
    expect(PROJECT_SLUG_PATTERN.test(slug)).toBe(valid);
  });
});

describe('field model types', () => {
  it('distribute over a collection union, so generic drawer code can build paths', () => {
    const collection = 'projects' as CollectionKey;
    const neutral: CmsNeutralField<CollectionKey> = 'screenshots';
    const localizedField: CmsLocalizedField<CollectionKey> = 'title';
    expect(cmsPath.itemField(collection, 'pr1', neutral, 0)).toBe('projects.pr1.screenshots.0');
    expect(cmsPath.itemLocale(collection, 'pr1', 'en', localizedField)).toBe(
      'projects.pr1.en.title',
    );
  });
});

// ─── Paths ───────────────────────────────────────────────────────────────────

describe('parseCmsPath', () => {
  const field = (
    scope: string,
    locale: string | null,
    name: string,
    fieldKind: string,
    index: number | null = null,
  ) => ({ kind: 'field', scope, locale, field: name, fieldKind, index });
  const itemField = (
    collection: string,
    id: string,
    locale: string | null,
    name: string,
    fieldKind: string,
    index: number | null = null,
  ) => ({ kind: 'itemField', collection, id, locale, field: name, fieldKind, index });

  const accepted: Array<[string, object]> = [
    ['home.hiddenSections', field('home', null, 'hiddenSections', 'sectionList')],
    ['home.ru.heroTitle', field('home', 'ru', 'heroTitle', 'string')],
    ['home.en.heroBullets', field('home', 'en', 'heroBullets', 'stringList')],
    ['home.en.heroBullets.12', field('home', 'en', 'heroBullets', 'stringList', 12)],
    ['chrome.en.pricingSwipeHint', field('chrome', 'en', 'pricingSwipeHint', 'string')],
    ['services', { kind: 'collection', collection: 'services' }],
    ['pricing.Ab_9-x', { kind: 'item', collection: 'pricing', id: 'Ab_9-x' }],
    ['projects.pr1.coverImage', itemField('projects', 'pr1', null, 'coverImage', 'nullableString')],
    ['projects.pr1.badgeType', itemField('projects', 'pr1', null, 'badgeType', 'badgeType')],
    ['projects.pr1.showOnHome', itemField('projects', 'pr1', null, 'showOnHome', 'boolean')],
    [
      'projects.pr1.screenshots.0',
      itemField('projects', 'pr1', null, 'screenshots', 'stringList', 0),
    ],
    ['services.s1.ru.title', itemField('services', 's1', 'ru', 'title', 'string')],
    ['pricing.p1.en.features.0', itemField('pricing', 'p1', 'en', 'features', 'stringList', 0)],
    ['pricing.ru.ru.name', itemField('pricing', 'ru', 'ru', 'name', 'string')],
  ];
  it.each(accepted)('accepts %s', (path, expected) => {
    expect(parseCmsPath(path)).toEqual(expected);
  });

  it.each([
    '',
    'foo',
    'home',
    'home.ru',
    'home.de.heroTitle',
    'home.ru.nope',
    'home.ru.hiddenSections',
    'home.heroTitle',
    'home.hiddenSections.0',
    'home.ru.heroTitle.0',
    'home.ru.heroBullets.x',
    'home.ru.heroBullets.-1',
    'home.ru.heroBullets.01',
    'home.ru.heroBullets.1.5',
    'home.ru.heroBullets.0.1',
    'home.ru.heroBullets.',
    'home.ru.constructor',
    'home.__proto__',
    'about.photoUrl',
    'about.ru.bioHtml',
    'hobbies.h1',
    'stack.st1.items.0',
    'projects.pr1.showOnAbout',
    'chrome.ru.navAbout',
    'home.ru.worksLinkLabel',
    'chrome.navCta',
    'chrome.ru.navCta.0',
    'widgets',
    'widgets.a',
    'services.',
    'services..ru.title',
    'services.bad id',
    'services.a:b',
    'services.s1.id',
    'services.s1.published',
    'services.s1.ru',
    'services.s1.title',
    'services.s1.ru.number',
    'services.s1.ru.title.0',
    'projects.pr1.coverImage.0',
    'projects.pr1.screenshots.1.2',
    'pricing.p1.fr.name',
  ])('rejects %j', (path) => {
    expect(parseCmsPath(path)).toBeNull();
  });

  it('builders emit paths that parse back', () => {
    const built = [
      cmsPath.home('ru', 'heroTitle'),
      cmsPath.home('en', 'heroBullets', 3),
      cmsPath.homeNeutral('hiddenSections'),
      cmsPath.chrome('ru', 'navCta'),
      cmsPath.collection('pricing'),
      cmsPath.item('pricing', 'p1'),
      cmsPath.itemField('projects', 'pr1', 'screenshots', 2),
      cmsPath.itemField('projects', 'pr1', 'coverImage'),
      cmsPath.itemLocale('pricing', 'p1', 'en', 'features', 0),
      cmsPath.itemLocale('services', 's1', 'ru', 'title'),
    ];
    expect(built).toEqual([
      'home.ru.heroTitle',
      'home.en.heroBullets.3',
      'home.hiddenSections',
      'chrome.ru.navCta',
      'pricing',
      'pricing.p1',
      'projects.pr1.screenshots.2',
      'projects.pr1.coverImage',
      'pricing.p1.en.features.0',
      'services.s1.ru.title',
    ]);
    for (const path of built) expect(parseCmsPath(path)).not.toBeNull();
  });
});

describe('getAtPath', () => {
  it('reads leaves, list entries, items and collections', () => {
    expect(getAtPath(TREE, 'home.ru.heroTitle')).toBe('home.ru.heroTitle');
    expect(getAtPath(TREE, 'home.hiddenSections')).toEqual(['works']);
    expect(getAtPath(TREE, 'projects.pr2.coverImage')).toBe('https://cdn/pr2.png');
    expect(getAtPath(TREE, 'pricing.p2.en.features.1')).toBe('p2.en.features.1');
    expect(getAtPath(TREE, 'projects.pr2.screenshots.0')).toBe('https://cdn/pr2-0.png');
    expect(getAtPath(TREE, 'projects.pr1.coverImage')).toBeNull();
    expect(getAtPath(TREE, 'services.s2')).toBe(TREE.services[1]);
    expect(getAtPath(TREE, 'pricing')).toBe(TREE.pricing);
  });

  it('is undefined for missing ids, indexes and invalid paths', () => {
    expect(getAtPath(TREE, 'services.ghost')).toBeUndefined();
    expect(getAtPath(TREE, 'services.ghost.ru.title')).toBeUndefined();
    expect(getAtPath(TREE, 'projects.pr1.screenshots.9')).toBeUndefined();
    expect(getAtPath(TREE, 'home.ru.nope')).toBeUndefined();
  });
});

// ─── set ─────────────────────────────────────────────────────────────────────

describe('applyPatches: set', () => {
  it('sets leaves of every kind', () => {
    const { tree, applied, skipped } = apply([
      set('home.ru.heroTitle', 'Новый'),
      set('home.hiddenSections', ['services', 'pricing']),
      set('chrome.en.navCta', 'Talk'),
      set('services.s2.featured', true),
      set('services.s2.number', '42'),
      set('projects.pr2.badgeType', 'own'),
      set('projects.pr2.coverImage', null),
      set('projects.pr1.coverImage', 'https://cdn/pr1.png'),
      set('pricing.p1.en.features', ['a']),
      set('services.s3.ru.bullets.1', 'changed'),
    ]);
    expect({ applied, skipped }).toEqual({ applied: 10, skipped: 0 });
    expect(tree.home.ru.heroTitle).toBe('Новый');
    expect(tree.home.hiddenSections).toEqual(['services', 'pricing']);
    expect(tree.chrome.en.navCta).toBe('Talk');
    expect(tree.services[1]).toMatchObject({ featured: true, number: '42' });
    expect(tree.projects[1]).toMatchObject({ badgeType: 'own', coverImage: null });
    expect(tree.projects[0].coverImage).toBe('https://cdn/pr1.png');
    expect(tree.pricing[0].en.features).toEqual(['a']);
    expect(tree.services[2].ru.bullets).toEqual(['s3.ru.bullets.0', 'changed']);
  });

  it.each<[string, unknown]>([
    ['home.ru.heroTitle', 1],
    ['home.ru.heroTitle', null],
    ['home.ru.heroTitle', undefined],
    ['home.ru.heroBullets', 'not a list'],
    ['home.ru.heroBullets', ['ok', 2]],
    ['home.ru.heroBullets.0', ['nested']],
    ['home.hiddenSections', ['experience']],
    ['home.hiddenSections', 'works'],
    ['projects.pr2.coverImage', 5],
    ['projects.pr1.coverImage', undefined],
    ['projects.pr3.coverImage', false],
    ['services.s1.featured', 'yes'],
    ['services.s1.number', 1],
    ['projects.pr1.badgeType', 'client'],
    ['projects.pr1.screenshots.0', 3],
    ['projects.pr1.screenshots', [null]],
    ['home.ru.heroBullets', new Array(2)],
    ['home.hiddenSections', new Array(1)],
    ['home.hiddenSections', ['works', 'works']],
  ])('rejects %s = %j', (path, value) => {
    expectPatchError([set(path, value)]);
  });

  it.each<[string, unknown]>([
    ['services.ghost.featured', 'yes'],
    ['services.ghost.ru.title', 42],
    ['projects.ghost.screenshots', 'not-a-list'],
    ['projects.ghost.badgeType', 'client'],
    ['services.ghost.ru.bullets.0', ['nested']],
    ['projects.ghost.coverImage', undefined],
  ])('rejects %s = %j even though the item is missing', (path, value) => {
    expectPatchError([set(path, value)]);
  });

  it('rejects unknown, collection and item paths with patch context', () => {
    expectPatchError([set('services', [])]);
    expectPatchError([set('services.s1', {})]);
    try {
      apply([set('home.ru.heroTitle', 'ok'), set('home.ru.nope', 'x')]);
      throw new Error('expected a CmsPatchError');
    } catch (error) {
      expect(error).toBeInstanceOf(CmsPatchError);
      expect(error).toMatchObject({ path: 'home.ru.nope', patchIndex: 1 });
    }
  });

  it('appends at index === length and throws past the end', () => {
    const appended = apply([
      set('projects.pr1.screenshots.2', 'c.png'),
      set('projects.pr1.screenshots.3', 'd.png'),
    ]).tree;
    expect(appended.projects[0].screenshots).toEqual([
      'https://cdn/pr1-0.png',
      'https://cdn/pr1-1.png',
      'c.png',
      'd.png',
    ]);
    expectPatchError([set('projects.pr1.screenshots.3', 'c.png')]);
    expectPatchError([set('home.en.heroBullets.5', 'x')]);
  });

  it('skips a well-typed set on a missing item id (the past-end check needs the item)', () => {
    const result = apply([
      set('services.ghost.ru.title', 'x'),
      set('projects.ghost.screenshots.0', 'x'),
      set('projects.ghost.screenshots.9', 'x'),
    ]);
    expect(result).toEqual({ tree: TREE, applied: 0, skipped: 3 });
  });

  it('is immutable and copies only along the path', () => {
    const before = clone(TREE);
    const list = ['a', 'b'];
    const { tree } = apply([set('services.s2.ru.bullets', list)]);
    list.push('mutated');
    expect(TREE).toStrictEqual(before);
    expect(tree.services[1].ru.bullets).toEqual(['a', 'b']);
    expect(tree.services).not.toBe(TREE.services);
    expect(tree.services[0]).toBe(TREE.services[0]);
    expect(tree.services[1].en).toBe(TREE.services[1].en);
    expect(tree.pricing).toBe(TREE.pricing);
    expect(tree.home).toBe(TREE.home);
  });
});

// ─── insert / remove / move ──────────────────────────────────────────────────

describe('applyPatches: insert', () => {
  it('inserts a new item at the end by default', () => {
    const { tree, applied } = apply([insert('services', NEW_SERVICE)]);
    expect(applied).toBe(1);
    expect(idsOf(tree, 'services')).toEqual(['s1', 's2', 's3', 'nNew']);
  });

  it.each([
    [0, ['nNew', 's1', 's2', 's3']],
    [2, ['s1', 's2', 'nNew', 's3']],
    [3, ['s1', 's2', 's3', 'nNew']],
    [-5, ['nNew', 's1', 's2', 's3']],
    [-1, ['nNew', 's1', 's2', 's3']],
    [99, ['s1', 's2', 's3', 'nNew']],
  ])('inserts at clamped index %i', (index, expected) => {
    expect(idsOf(apply([insert('services', NEW_SERVICE, index)]).tree, 'services')).toEqual(
      expected,
    );
  });

  it('replaces an existing id in place, ignoring index', () => {
    const replacement = { ...clone(TREE.services[1]), number: '99' };
    const { tree } = apply([insert('services', replacement, 0)]);
    expect(idsOf(tree, 'services')).toEqual(['s1', 's2', 's3']);
    expect(tree.services[1].number).toBe('99');
  });

  it('stores a parsed copy of the value', () => {
    const node = clone(NEW_SERVICE) as Record<string, any>;
    const { tree } = apply([insert('services', node as CollectionNode)]);
    node.ru.title = 'mutated';
    expect(tree.services[3].ru.title).toBe('s1.ru.title');
  });

  it('rejects invalid nodes and non-collection paths', () => {
    expectPatchError([insert('services', { ...NEW_SERVICE, extra: true } as CollectionNode)]);
    expectPatchError([insert('services', clone(TREE.pricing[0]))]);
    expectPatchError([insert('services', { ...NEW_SERVICE, id: 'bad.id' })]);
    expectPatchError([{ op: 'insert', path: 'services.s1' as CollectionKey, value: NEW_SERVICE }]);
    expectPatchError([{ op: 'insert', path: 'widgets' as CollectionKey, value: NEW_SERVICE }]);
    expectPatchError([insert('services', NEW_SERVICE, 1.5)]);
  });
});

describe('applyPatches: remove', () => {
  it('removes by id and skips a missing id', () => {
    const { tree, applied, skipped } = apply([
      remove('pricing.p2'),
      remove('pricing.p2'),
      remove('pricing.ghost'),
    ]);
    expect(idsOf(tree, 'pricing')).toEqual(['p1', 'p3']);
    expect({ applied, skipped }).toEqual({ applied: 1, skipped: 2 });
  });

  it('rejects non-item paths', () => {
    expectPatchError([remove('pricing')]);
    expectPatchError([remove('pricing.p1.highlighted')]);
    expectPatchError([remove('home.ru.heroTitle')]);
  });
});

describe('applyPatches: move', () => {
  it.each([
    ['services.s3', 0, ['s3', 's1', 's2']],
    ['services.s1', 2, ['s2', 's3', 's1']],
    ['services.s1', 99, ['s2', 's3', 's1']],
    ['services.s3', -2, ['s3', 's1', 's2']],
    ['services.s2', -1, ['s2', 's1', 's3']],
    ['services.s2', 1, ['s1', 's2', 's3']],
  ])('moves %s to %i (clamped)', (path, index, expected) => {
    expect(idsOf(apply([move(path, index)]).tree, 'services')).toEqual(expected);
  });

  it('skips a missing id and rejects bad input', () => {
    expect(apply([move('services.ghost', 0)])).toEqual({ tree: TREE, applied: 0, skipped: 1 });
    expectPatchError([move('services.s1', 1.5)]);
    expectPatchError([move('services', 0)]);
    expectPatchError([move('services.s1.number', 0)]);
  });
});

// ─── Idempotency ─────────────────────────────────────────────────────────────

describe('idempotency', () => {
  // Idempotency is per op: a batch of several moves, or an append then a shrink, is not replay-safe.
  it('replays a batch of absolute sets, upserts, removes and one move to the same tree', () => {
    const batch: ContentPatch[] = [
      set('home.ru.heroTitle', 'x'),
      set('projects.pr1.screenshots.2', 'c.png'),
      set('pricing.p1.en.features', ['only']),
      set('home.hiddenSections', ['pricing']),
      insert('services', NEW_SERVICE, 1),
      insert('services', { ...clone(TREE.services[2]), number: '33' }),
      remove('pricing.p3'),
      move('projects.pr3', 0),
      set('services.nNew.ru.title', 'new title'),
      set('services.ghost.ru.title', 'skipped'),
    ];
    const once = apply(batch).tree;
    expect(apply(batch, once).tree).toStrictEqual(once);
  });
});

// ─── invertPatches ───────────────────────────────────────────────────────────

function expectExactUndo(patches: ContentPatch[], tree: SiteTree = TREE) {
  const before = clone(tree);
  const { tree: after, applied } = applyPatches(tree, patches);
  const inverse = invertPatches(tree, patches);
  expect(inverse).toHaveLength(applied);
  expect(applyPatches(after, inverse).tree).toStrictEqual(before);
  expect(tree).toStrictEqual(before);
}

describe('invertPatches', () => {
  const s1 = TREE.services[0];
  const sequences: Array<[string, ContentPatch[]]> = [
    ['leaf set', [set('home.ru.heroTitle', 'Новый')]],
    ['same leaf twice', [set('home.ru.heroTitle', 'a'), set('home.ru.heroTitle', 'b')]],
    ['list entry', [set('services.s1.en.bullets.0', 'x')]],
    [
      'two appends',
      [set('projects.pr1.screenshots.2', 'c.png'), set('projects.pr1.screenshots.3', 'd.png')],
    ],
    [
      'append then overwrite it',
      [set('home.en.heroBullets.2', 'x'), set('home.en.heroBullets.2', 'y')],
    ],
    [
      'append then shrink list',
      [set('home.en.heroBullets.2', 'x'), set('home.en.heroBullets', [])],
    ],
    [
      'clear list then append',
      [set('projects.pr1.screenshots', []), set('projects.pr1.screenshots.0', 'a.png')],
    ],
    [
      'neutral kinds',
      [
        set('projects.pr2.coverImage', null),
        set('projects.pr2.coverImage', 'https://cdn/new.png'),
        set('home.hiddenSections', []),
        set('projects.pr2.badgeType', 'own'),
        set('projects.pr1.coverImage', 'https://cdn/c.png'),
        set('projects.pr3.showOnHome', false),
        set('services.s2.featured', true),
      ],
    ],
    ['insert at end', [insert('services', NEW_SERVICE)]],
    ['insert at 0', [insert('services', NEW_SERVICE, 0)]],
    ['insert clamped high', [insert('services', NEW_SERVICE, 99)]],
    ['insert clamped low', [insert('services', NEW_SERVICE, -4)]],
    ['insert replace', [insert('services', { ...clone(TREE.services[1]), number: '99' }, 0)]],
    [
      'insert, edit the new item, move it',
      [
        insert('services', NEW_SERVICE, 1),
        set('services.nNew.ru.title', 't'),
        set('services.nNew.ru.bullets.2', 'b'),
        set('services.nNew.featured', true),
        move('services.nNew', 0),
        move('services.nNew', 3),
      ],
    ],
    [
      'insert then replace same id',
      [insert('services', NEW_SERVICE), insert('services', { ...NEW_SERVICE, number: '7' })],
    ],
    ['insert then remove', [insert('services', NEW_SERVICE), remove('services.nNew')]],
    ['remove then re-insert elsewhere', [remove('services.s1'), insert('services', s1, 2)]],
    [
      'remove then re-insert modified',
      [remove('services.s1'), insert('services', { ...clone(s1), number: 'x' })],
    ],
    ['remove middle', [remove('pricing.p2')]],
    ['remove all', [remove('pricing.p1'), remove('pricing.p2'), remove('pricing.p3')]],
    [
      'remove then touch removed',
      [
        remove('services.s1'),
        set('services.s1.ru.title', 'x'),
        move('services.s1', 0),
        remove('services.s1'),
      ],
    ],
    [
      'moves with clamps',
      [move('services.s3', 0), move('services.s1', 99), move('services.s2', -1)],
    ],
    ['move to same index', [move('services.s2', 1)]],
    ['move then remove', [move('projects.pr1', 2), remove('projects.pr1')]],
    ['remove then move neighbour', [remove('projects.pr2'), move('projects.pr3', 0)]],
    [
      'skips interleaved',
      [
        set('services.ghost.ru.title', 'x'),
        set('services.s1.ru.title', 'y'),
        remove('pricing.ghost'),
        move('projects.ghost', 0),
        set('projects.ghost.screenshots.0', 'z'),
      ],
    ],
    ['exclusive flag', exclusiveFlagPatches(TREE, 'pricing', 'p3', 'highlighted', true)],
    [
      'everything across collections',
      [
        insert('projects', { ...clone(TREE.projects[0]), id: 'pr4', slug: 'pr4-slug' }, 0),
        set('projects.pr4.en.title', 'PR4'),
        remove('projects.pr1'),
        move('projects.pr2', 0),
        set('chrome.ru.footerRights', '©'),
        insert('pricing', { ...clone(TREE.pricing[0]), id: 'p4', highlighted: true }, 1),
        ...exclusiveFlagPatches(TREE, 'pricing', 'p4', 'highlighted', true),
        set('pricing.p4.ru.features.2', 'extra'),
        remove('pricing.p4'),
        insert('pricing', { ...clone(TREE.pricing[2]), id: 'p4' }),
        move('pricing.p4', 0),
        set('projects.pr2.screenshots', ['go.png']),
        set('projects.pr2.screenshots.1', 'rust.png'),
        remove('services.s2'),
        insert('services', clone(TREE.services[1]), 0),
      ],
    ],
  ];

  it.each(sequences)('restores the tree exactly: %s', (_, patches) => {
    expectExactUndo(patches);
  });

  it('returns inverses in reverse order against the state before each patch', () => {
    expect(
      invertPatches(TREE, [set('home.ru.heroTitle', 'a'), set('home.ru.heroTitle', 'b')]),
    ).toEqual([set('home.ru.heroTitle', 'a'), set('home.ru.heroTitle', 'home.ru.heroTitle')]);
    expect(invertPatches(TREE, [set('projects.pr1.screenshots.2', 'c.png')])).toEqual([
      set('projects.pr1.screenshots', ['https://cdn/pr1-0.png', 'https://cdn/pr1-1.png']),
    ]);
    expect(
      invertPatches(TREE, [
        insert('services', NEW_SERVICE),
        remove('pricing.p2'),
        move('projects.pr2', 0),
      ]),
    ).toEqual([
      move('projects.pr2', 1),
      insert('pricing', TREE.pricing[1], 1),
      remove('services.nNew'),
    ]);
    expect(invertPatches(TREE, [set('services.ghost.number', '1')])).toEqual([]);
  });

  it('restores the tree exactly for generated sequences (and every op is idempotent)', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const patches = randomSequence(seed);
      expectExactUndo(patches);
      let tree = TREE;
      for (const patch of patches) {
        const once = applyPatches(tree, [patch]).tree;
        expect(applyPatches(once, [patch]).tree).toStrictEqual(once);
        tree = once;
      }
    }
  });
});

/** Deterministic PRNG (mulberry32). */
function prng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A valid (never throwing) mixed sequence; ids include removed, re-inserted and missing ones. */
function randomSequence(seed: number): ContentPatch[] {
  const random = prng(seed);
  const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const pick = <T>(list: readonly T[]): T => list[int(0, list.length - 1)];
  const pool = Object.fromEntries(
    COLLECTION_KEYS.map((c) => [c, [...idsOf(TREE, c), 'ghost']]),
  ) as Record<CollectionKey, string[]>;
  const patches: ContentPatch[] = [];
  let tree = TREE;
  let created = 0;

  const valueFor = (kind: string, scope: string): unknown => {
    switch (kind) {
      case 'nullableString':
        return random() < 0.3 ? null : `v${int(0, 9)}`;
      case 'boolean':
        return random() < 0.5;
      case 'badgeType':
        return pick(['work', 'own']);
      case 'stringList':
        return Array.from({ length: int(0, 3) }, (_, i) => `l${i}.${int(0, 9)}`);
      case 'sectionList':
        return scope === 'home' ? pick([[], ['works'], ['services', 'pricing']]) : [];
      default:
        return `v${int(0, 99)}`;
    }
  };

  const fieldPatch = (base: string, scope: string, fields: FieldKinds): ContentPatch => {
    const [field, kind] = pick(Object.entries(fields));
    const path = `${base}.${field}`;
    if (kind === 'stringList' && random() < 0.6) {
      const length = (getAtPath(tree, path) as string[] | undefined)?.length ?? 0;
      return set(`${path}.${int(0, length)}`, `e${int(0, 99)}`);
    }
    return set(path, valueFor(kind, scope));
  };

  for (let steps = int(1, 14); steps > 0; steps -= 1) {
    const roll = random();
    let patch: ContentPatch;
    if (roll < 0.2) {
      const scope = pick(['home', 'chrome'] as const);
      const neutral: FieldKinds = M[scope].neutral;
      patch =
        Object.keys(neutral).length > 0 && random() < 0.3
          ? fieldPatch(scope, scope, neutral)
          : fieldPatch(`${scope}.${pick(['ru', 'en'])}`, scope, M[scope].localized);
    } else {
      const collection = pick(COLLECTION_KEYS);
      const id = pick(pool[collection]);
      const length = tree[collection].length;
      if (roll < 0.5) {
        patch =
          random() < 0.4
            ? fieldPatch(`${collection}.${id}`, collection, M[collection].neutral)
            : fieldPatch(
                `${collection}.${id}.${pick(['ru', 'en'])}`,
                collection,
                M[collection].localized,
              );
      } else if (roll < 0.7) {
        const template = clone(pick(TREE[collection] as readonly CollectionNode[]));
        const nodeId = random() < 0.6 ? `r${(created += 1)}` : id;
        if (!pool[collection].includes(nodeId)) pool[collection].push(nodeId);
        patch = insert(
          collection,
          { ...template, id: nodeId },
          random() < 0.3 ? undefined : int(-2, length + 2),
        );
      } else if (roll < 0.85) {
        patch = remove(`${collection}.${id}`);
      } else {
        patch = move(`${collection}.${id}`, int(-2, length + 2));
      }
    }
    patches.push(patch);
    tree = applyPatches(tree, [patch]).tree;
  }
  return patches;
}

// ─── exclusiveFlagPatches ────────────────────────────────────────────────────

describe('exclusiveFlagPatches', () => {
  it('turns the flag on and clears it on the others', () => {
    const patches = exclusiveFlagPatches(TREE, 'pricing', 'p3', 'highlighted', true);
    expect(patches).toEqual([
      set('pricing.p3.highlighted', true),
      set('pricing.p2.highlighted', false),
    ]);
    expect(apply(patches).tree.pricing.map((plan) => plan.highlighted)).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('only sets the item when turning the flag off or when no other item has it', () => {
    expect(exclusiveFlagPatches(TREE, 'pricing', 'p2', 'highlighted', false)).toEqual([
      set('pricing.p2.highlighted', false),
    ]);
    expect(exclusiveFlagPatches(TREE, 'services', 's1', 'featured', true)).toEqual([
      set('services.s1.featured', true),
    ]);
    expect(exclusiveFlagPatches(TREE, 'projects', 'pr2', 'showOnHome', true)).toEqual([
      set('projects.pr2.showOnHome', true),
      set('projects.pr1.showOnHome', false),
      set('projects.pr3.showOnHome', false),
    ]);
  });

  it('is empty when the target id is missing, so no other item loses the flag', () => {
    expect(exclusiveFlagPatches(TREE, 'pricing', 'ghost', 'highlighted', true)).toEqual([]);
    expect(exclusiveFlagPatches(TREE, 'services', 'ghost', 'featured', false)).toEqual([]);
  });
});

describe('hiddenSectionPatch', () => {
  it('adds or removes the key on the homepage', () => {
    expect(hiddenSectionPatch(TREE, 'pricing', true)).toEqual(
      set('home.hiddenSections', ['works', 'pricing']),
    );
    expect(hiddenSectionPatch(TREE, 'works', false)).toEqual(set('home.hiddenSections', []));
  });

  it('keeps HOME_SECTION_KEYS order, so equal sets are equal arrays', () => {
    expect(hiddenSectionPatch(TREE, 'services', true)).toEqual(
      set('home.hiddenSections', ['services', 'works']),
    );
    const unordered = apply([set('home.hiddenSections', ['pricing', 'works'])]).tree;
    expect(hiddenSectionPatch(unordered, 'works', true)).toEqual(
      set('home.hiddenSections', ['works', 'pricing']),
    );
    expect(hiddenSectionPatch(unordered, 'services', true)).toEqual(
      set('home.hiddenSections', ['services', 'works', 'pricing']),
    );

    // Hide, show, hide again: the same set as hiding «Цены» once, as the same array.
    const toggles = [
      ['pricing', true],
      ['works', false],
      ['works', true],
    ] as const;
    const toggled = toggles.reduce<SiteTree>(
      (tree, [section, hidden]) => apply([hiddenSectionPatch(tree, section, hidden)], tree).tree,
      TREE,
    );
    expect(set('home.hiddenSections', toggled.home.hiddenSections)).toEqual(
      hiddenSectionPatch(TREE, 'pricing', true),
    );
  });

  it('is a no-op for an already hidden or shown key and never aliases the tree list', () => {
    const tree = apply([set('home.hiddenSections', ['services', 'works'])]).tree;
    const patch = hiddenSectionPatch(tree, 'works', true);
    expect(patch).toEqual(set('home.hiddenSections', ['services', 'works']));
    expect((patch as { value: unknown }).value).not.toBe(tree.home.hiddenSections);
    expect(apply([patch], tree).tree).toStrictEqual(tree);
    expect(apply([hiddenSectionPatch(tree, 'pricing', false)], tree).tree).toStrictEqual(tree);
  });
});

describe('CMS_SECTION_LABELS', () => {
  it('labels every section key', () => {
    expect(Object.keys(CMS_SECTION_LABELS).sort()).toEqual([...CMS_SECTION_KEYS].sort());
    expect(Object.values(CMS_SECTION_LABELS).every((label) => label.length > 0)).toBe(true);
    expect(CMS_SECTION_LABELS.pricing).toBe('Цены');
  });
});

// ─── Request schema + bridge ─────────────────────────────────────────────────

describe('contentPatchRequestSchema', () => {
  it('accepts 1..200 well-formed patches', () => {
    const batch = [
      set('home.ru.heroTitle', 'x'),
      insert('services', NEW_SERVICE, 0),
      remove('services.s1'),
      move('services.s2', 0),
    ];
    expect(contentPatchRequestSchema.parse({ patches: batch })).toEqual({ patches: batch });
    expect(
      contentPatchRequestSchema.safeParse({ patches: Array(200).fill(batch[0]) }).success,
    ).toBe(true);
  });

  it.each<[string, unknown]>([
    ['empty', []],
    ['too many', Array(201).fill({ op: 'remove', path: 'services.s1' })],
    ['unknown op', [{ op: 'patch', path: 'home.ru.heroTitle', value: 'x' }]],
    ['insert into a non-collection', [{ op: 'insert', path: 'home', value: NEW_SERVICE }]],
    ['insert of an invalid node', [{ op: 'insert', path: 'services', value: { id: 'x' } }]],
    ['non-integer move', [{ op: 'move', path: 'services.s1', value: 1.5 }]],
    ['extra key', [{ op: 'remove', path: 'services.s1', value: 1 }]],
  ])('rejects %s', (_, patches) => {
    expect(contentPatchRequestSchema.safeParse({ patches }).success).toBe(false);
  });
});

describe('bridge', () => {
  it('guards messages by source and known type', () => {
    expect(
      isCmsChildMessage({
        source: CMS_SOURCE,
        type: 'edit-commit',
        path: 'home.ru.heroTitle',
        value: 'x',
      }),
    ).toBe(true);
    expect(isCmsChildMessage({ source: CMS_SOURCE, type: 'mode', mode: 'edit' })).toBe(false);
    expect(isCmsChildMessage({ source: 'other', type: 'ready' })).toBe(false);
    expect(isCmsChildMessage({ source: CMS_SOURCE, type: 'toString' })).toBe(false);
    expect(isCmsChildMessage(null)).toBe(false);
    expect(isCmsChildMessage('alcha-cms')).toBe(false);
    expect(isCmsParentMessage({ source: CMS_SOURCE, type: 'preview-token', token: 't' })).toBe(
      true,
    );
    expect(isCmsParentMessage({ source: CMS_SOURCE, type: 'scroll-by', dx: 0, dy: 120 })).toBe(
      true,
    );
    expect(isCmsParentMessage({ source: CMS_SOURCE, type: 'request-nodes' })).toBe(false);
    expect(isCmsParentMessage({ source: CMS_SOURCE, type: 'ready' })).toBe(false);
  });

  it('builds node keys and item refs', () => {
    expect(cmsNodeKey.field('home.ru.heroTitle')).toBe('field:home.ru.heroTitle');
    expect(cmsNodeKey.field('home.ru.heroTitle', 2)).toBe('field:home.ru.heroTitle#2');
    expect(cmsNodeKey.image('projects.pr1.coverImage', 1)).toBe('image:projects.pr1.coverImage#1');
    expect(cmsNodeKey.item('pricing', 'p1')).toBe('item:pricing:p1');
    expect(cmsNodeKey.list('projects', 1)).toBe('list:projects#1');
    expect(cmsNodeKey.section('pricing')).toBe('section:pricing');
    expect(cmsNodeKey.add('pricing')).toBe('add:pricing');
    expect(cmsNodeKey.hidden('works')).toBe('hidden:works');
    expect(cmsItemRef('projects', 'pr1')).toBe('projects:pr1');
    expect(parseCmsItemRef('projects:pr1')).toEqual({ collection: 'projects', id: 'pr1' });
    expect(parseCmsItemRef('widgets:pr1')).toBeNull();
    expect(parseCmsItemRef('projects:a:b')).toBeNull();
    expect(parseCmsItemRef('projects')).toBeNull();
    expect(CMS_ATTR.mode).toBe('data-cms-mode');
  });
});
