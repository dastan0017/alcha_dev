import { CMS_FIELD_MODEL, siteTreeSchema, type SiteTree } from '@alcha/shared';

type FieldKinds = Readonly<Record<string, string>>;

/** Both locales with every field set to `<tag>.<locale>.<field>` (lists get one entry). */
function copy(fields: FieldKinds, tag: string) {
  const fill = (locale: string) =>
    Object.fromEntries(
      Object.entries(fields).map(([field, kind]) => {
        const value = `${tag}.${locale}.${field}`;
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
    about: {
      photoUrl: 'https://cdn/me.jpg',
      hiddenSections: [],
      ...copy(M.about.localized, 'about'),
    },
    chrome: copy(M.chrome.localized, 'chrome'),
    services: ['s1', 's2', 's3'].map((id, i) => ({
      id,
      published: true,
      number: `0${i + 1}`,
      featured: i === 0,
      ...copy(M.services.localized, id),
    })),
    pricing: ['p1', 'p2'].map((id, i) => ({
      id,
      published: true,
      highlighted: i === 1,
      ...copy(M.pricing.localized, id),
    })),
    projects: [
      { id: 'pr1', slug: 'first', showOnHome: true, showOnAbout: false },
      { id: 'pr2', slug: 'second', showOnHome: false, showOnAbout: true },
      { id: 'pr3', slug: 'third-one', showOnHome: true, showOnAbout: true },
    ].map((project) => ({
      ...project,
      published: true,
      badgeType: 'work',
      coverImage: null,
      screenshots: [`https://cdn/${project.id}.png`],
      ...copy(M.projects.localized, project.id),
    })),
    experience: ['e1', 'e2'].map((id) => ({
      id,
      published: true,
      company: `${id}-company`,
      ...copy(M.experience.localized, id),
    })),
    stack: ['st1', 'st2'].map((id) => ({
      id,
      published: true,
      items: ['React', 'Next.js'],
      ...copy(M.stack.localized, id),
    })),
    hobbies: ['h1'].map((id) => ({
      id,
      published: true,
      handle: `@${id}`,
      url: `https://instagram.com/${id}`,
      imageUrl: null,
      ...copy(M.hobbies.localized, id),
    })),
  });
}
