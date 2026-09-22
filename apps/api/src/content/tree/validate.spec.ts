import { validateTree } from './validate';
import { treeFixture } from './tree.fixture';

describe('validateTree', () => {
  it('passes a fully filled tree', () => {
    expect(validateTree(treeFixture())).toEqual({ errors: [], warnings: [] });
  });

  it('reports blank required RU fields as errors and EN ones as warnings', () => {
    const tree = treeFixture();
    tree.home.ru.heroTitle = '';
    tree.chrome.ru.navWorks = '  \n';
    tree.pricing[0].ru.name = '';
    tree.home.en.heroSubtitle = '';
    tree.chrome.en.footerRights = '';
    tree.services[1].en.description = '';

    const { errors, warnings } = validateTree(tree);
    expect(errors.map(({ path, locale }) => [path, locale])).toEqual([
      ['home.ru.heroTitle', 'ru'],
      ['chrome.ru.navWorks', 'ru'],
      ['pricing.p1.ru.name', 'ru'],
    ]);
    expect(warnings.map(({ path, locale }) => [path, locale])).toEqual([
      ['home.en.heroSubtitle', 'en'],
      ['chrome.en.footerRights', 'en'],
      ['services.s2.en.description', 'en'],
    ]);
    for (const issue of [...errors, ...warnings]) expect(issue.message).toMatch(/[а-яё]/i);
  });

  it('reports blank required neutral fields as errors without a locale', () => {
    const tree = treeFixture();
    tree.services[0].number = '';
    tree.services[2].number = ' ';
    tree.projects[1].slug = '';

    expect(validateTree(tree).errors.map(({ path, locale }) => [path, locale])).toEqual([
      ['services.s1.number', null],
      ['services.s3.number', null],
      ['projects.pr2.slug', null],
    ]);
  });

  it('ignores blank optional fields', () => {
    const tree = treeFixture();
    tree.home.ru.eyebrow = '';
    tree.home.ru.heroSubtitleMobile = '';
    tree.home.en.heroBullets = [];
    tree.services[0].ru.badge = '';
    tree.projects[0].ru.seoTitle = '';
    tree.projects[0].screenshots = [];
    tree.pricing[0].en.highlightLabel = '';

    expect(validateTree(tree)).toEqual({ errors: [], warnings: [] });
  });

  it.each(['Bad', 'with space', 'under_score', '-lead', 'trail-', 'double--dash', 'кейс'])(
    'rejects the malformed slug %j',
    (slug) => {
      const tree = treeFixture();
      tree.projects[1].slug = slug;
      expect(validateTree(tree).errors).toEqual([
        { path: 'projects.pr2.slug', locale: null, message: expect.stringMatching(/[а-яё]/i) },
      ]);
    },
  );

  it('accepts kebab-case slugs with digits', () => {
    const tree = treeFixture();
    tree.projects[1].slug = 'alcha-dev-2';
    tree.projects[2].slug = '42';
    expect(validateTree(tree).errors).toEqual([]);
  });

  it('reports a blank slug once, as a required field', () => {
    const tree = treeFixture();
    tree.projects[0].slug = '';
    expect(validateTree(tree).errors.map(({ path }) => path)).toEqual(['projects.pr1.slug']);
  });

  it('reports every project sharing a slug', () => {
    const tree = treeFixture();
    tree.projects[2].slug = 'first';
    const { errors } = validateTree(tree);
    expect(errors.map(({ path }) => path)).toEqual(['projects.pr1.slug', 'projects.pr3.slug']);
    expect(errors[0].message).toContain('first');
  });
});
