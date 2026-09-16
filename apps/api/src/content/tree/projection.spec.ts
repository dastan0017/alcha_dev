import type { SeoMeta, SiteSettings } from '@alcha/shared';
import {
  projectAbout,
  projectChrome,
  projectHome,
  projectProject,
  projectProjects,
} from './projection';
import { treeFixture } from './tree.fixture';

const settings = { email: 'hello@alcha.dev' } as SiteSettings;
const seo = { title: 'SEO' } as SeoMeta;
const context = { settings, seo };

describe('projectHome', () => {
  it('maps every section and passes settings, SEO and hidden sections through', () => {
    const tree = treeFixture();
    tree.home.hiddenSections = ['pricing', 'works'];
    const home = projectHome(tree, 'ru', context);

    expect(home.content).toEqual(tree.home.ru);
    expect(home.hiddenSections).toEqual(['pricing', 'works']);
    expect(home.settings).toBe(settings);
    expect(home.seo).toBe(seo);
    expect(home.services[0]).toEqual({
      id: 's1',
      number: '01',
      sortOrder: 0,
      featured: true,
      ...tree.services[0].ru,
    });
    expect(home.pricingPlans.map((plan) => [plan.id, plan.highlighted])).toEqual([
      ['p1', false],
      ['p2', true],
    ]);
  });

  it('keeps only published items, with sortOrder = index in the full collection', () => {
    const tree = treeFixture();
    tree.services[0].published = false;
    tree.pricing[1].published = false;
    const home = projectHome(tree, 'en', context);

    expect(home.services.map((service) => [service.id, service.sortOrder])).toEqual([
      ['s2', 1],
      ['s3', 2],
    ]);
    expect(home.pricingPlans.map((plan) => plan.id)).toEqual(['p1']);
  });

  it('shows the published projects flagged showOnHome', () => {
    const tree = treeFixture();
    expect(projectHome(tree, 'ru', context).projects.map((p) => [p.slug, p.sortOrder])).toEqual([
      ['first', 0],
      ['third-one', 2],
    ]);

    tree.projects[0].published = false;
    expect(projectHome(tree, 'ru', context).projects.map((p) => p.slug)).toEqual(['third-one']);
  });
});

describe('projectAbout', () => {
  it('maps the profile, collections and the CTA banner from home copy', () => {
    const tree = treeFixture();
    tree.about.hiddenSections = ['hobbies'];
    const about = projectAbout(tree, 'en', context);

    expect(about.profile).toEqual({ photoUrl: 'https://cdn/me.jpg', ...tree.about.en });
    expect(about.hiddenSections).toEqual(['hobbies']);
    expect(about.cta).toEqual({
      title: 'home.en.ctaTitle',
      subtitle: 'home.en.ctaSubtitle',
      telegramLabel: 'home.en.ctaTelegramLabel',
      cvLabel: 'home.en.ctaCvLabel',
    });
    expect(about.experiences[1]).toEqual({
      id: 'e2',
      company: 'e2-company',
      sortOrder: 1,
      ...tree.experience[1].en,
    });
    expect(about.stack[0]).toEqual({
      id: 'st1',
      sortOrder: 0,
      title: 'st1.en.title',
      items: ['React', 'Next.js'],
    });
    expect(about.hobbies[0]).toEqual({
      id: 'h1',
      sortOrder: 0,
      handle: '@h1',
      url: 'https://instagram.com/h1',
      imageUrl: null,
      ...tree.hobbies[0].en,
    });
    expect(about.settings).toBe(settings);
    expect(about.seo).toBe(seo);
  });

  it('shows the published projects flagged showOnAbout', () => {
    const tree = treeFixture();
    tree.projects[2].published = false;
    tree.stack[0].published = false;
    const about = projectAbout(tree, 'ru', context);

    expect(about.projects.map((p) => [p.slug, p.sortOrder])).toEqual([['second', 1]]);
    expect(about.stack.map((s) => [s.id, s.sortOrder])).toEqual([['st2', 1]]);
  });
});

describe('projectProjects / projectProject', () => {
  it('lists every published project regardless of page flags', () => {
    const tree = treeFixture();
    tree.projects[1].published = false;
    expect(projectProjects(tree, 'ru').map((p) => [p.slug, p.sortOrder])).toEqual([
      ['first', 0],
      ['third-one', 2],
    ]);
  });

  it('finds a published project by slug with every DTO field', () => {
    const tree = treeFixture();
    expect(projectProject(tree, 'second', 'en')).toEqual({
      id: 'pr2',
      slug: 'second',
      badgeType: 'work',
      sortOrder: 1,
      showOnHome: false,
      showOnAbout: true,
      screenshots: ['https://cdn/pr2.png'],
      coverImage: null,
      ...tree.projects[1].en,
    });
  });

  it('is null for an unknown or unpublished slug', () => {
    const tree = treeFixture();
    tree.projects[0].published = false;
    expect(projectProject(tree, 'first', 'ru')).toBeNull();
    expect(projectProject(tree, 'missing', 'ru')).toBeNull();
  });
});

describe('EN → RU fallback', () => {
  it('fills blank required EN fields from RU, leaving optional ones blank', () => {
    const tree = treeFixture();
    tree.home.en.heroTitle = '';
    tree.home.en.ctaTitle = '   ';
    tree.home.en.eyebrow = '';
    tree.services[1].en.title = '';
    tree.services[1].en.badge = '';
    tree.projects[0].en.metaLine = '';
    tree.projects[0].en.seoTitle = '';
    tree.chrome.en.navCta = '';

    const home = projectHome(tree, 'en', context);
    expect(home.content.heroTitle).toBe('home.ru.heroTitle');
    expect(home.content.ctaTitle).toBe('home.ru.ctaTitle');
    expect(home.content.eyebrow).toBe('');
    expect(home.services[1]).toMatchObject({ title: 's2.ru.title', badge: '' });
    expect(home.projects[0]).toMatchObject({ metaLine: 'pr1.ru.metaLine', seoTitle: '' });
    expect(projectAbout(tree, 'en', context).cta.title).toBe('home.ru.ctaTitle');
    expect(projectChrome(tree, 'en')).toEqual({ ...tree.chrome.en, navCta: 'chrome.ru.navCta' });
  });

  it('never fills RU from EN', () => {
    const tree = treeFixture();
    tree.home.ru.heroTitle = '';
    tree.chrome.ru.navCta = '';
    expect(projectHome(tree, 'ru', context).content.heroTitle).toBe('');
    expect(projectChrome(tree, 'ru').navCta).toBe('');
  });
});
