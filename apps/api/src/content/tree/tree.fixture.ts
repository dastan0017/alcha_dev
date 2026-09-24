import { CMS_FIELD_MODEL, siteTreeSchema, type SiteTree } from '@alcha/shared';

type FieldKinds = Readonly<Record<string, string>>;

/** Both locales with every field set to `<tag>.<locale>.<field>` (lists get one entry). */
function copy(fields: FieldKinds, tag: string) {
  const fill = (locale: string) =>
    Object.fromEntries(
      Object.entries(fields).map(([field, kind]) => {
        const value = `${tag}.${locale}.${field}`;
        if (kind === 'factList') return [field, [{ text: value }]];
        return [field, kind === 'stringList' ? [value] : value];
      }),
    );
  return { ru: fill('ru'), en: fill('en') };
}

const M = CMS_FIELD_MODEL;

/** A fresh, fully filled (so publishable) tree for unit specs. */
export function treeFixture(): SiteTree {
  return siteTreeSchema.parse({
    version: 1,
    home: { hiddenSections: [], ...copy(M.home.localized, 'home') },
    chrome: copy(M.chrome.localized, 'chrome'),
    steps: ['s1', 's2', 's3'].map((id, i) => ({
      id,
      published: true,
      isMain: i === 1,
      ...copy(M.steps.localized, id),
    })),
    pricing: ['p1', 'p2'].map((id, i) => ({
      id,
      published: true,
      highlighted: i === 1,
      ...copy(M.pricing.localized, id),
    })),
    projects: [
      { id: 'pr1', slug: 'first', showOnHome: true },
      { id: 'pr2', slug: 'second', showOnHome: false },
      { id: 'pr3', slug: 'third-one', showOnHome: true },
    ].map((project) => ({
      ...project,
      published: true,
      badgeType: 'work',
      coverImage: null,
      screenshots: [`https://cdn/${project.id}.png`],
      ...copy(M.projects.localized, project.id),
    })),
  });
}
