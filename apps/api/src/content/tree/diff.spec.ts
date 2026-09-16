import { applyPatches, newCollectionNode, type ContentPatch, type SiteTree } from '@alcha/shared';
import { countChanges } from './diff';
import { treeFixture } from './tree.fixture';

const base = treeFixture();
const changesAfter = (patches: ContentPatch[], from: SiteTree = base) =>
  countChanges(from, applyPatches(from, patches).tree);
const set = (path: string, value: unknown): ContentPatch => ({ op: 'set', path, value });

describe('countChanges', () => {
  it('is 0 for identical trees and for a set back to the original value', () => {
    expect(countChanges(base, treeFixture())).toBe(0);
    expect(
      changesAfter([set('home.ru.heroTitle', 'x'), set('home.ru.heroTitle', 'home.ru.heroTitle')]),
    ).toBe(0);
  });

  it('counts one per changed singleton leaf, per locale', () => {
    expect(changesAfter([set('home.ru.heroTitle', 'x')])).toBe(1);
    expect(changesAfter([set('home.ru.heroTitle', 'x'), set('home.en.heroTitle', 'y')])).toBe(2);
    expect(changesAfter([set('about.en.bioHtml', '<p>x</p>'), set('chrome.ru.navCta', 'x')])).toBe(
      2,
    );
    expect(changesAfter([set('about.photoUrl', null), set('home.hiddenSections', ['works'])])).toBe(
      2,
    );
  });

  it('counts a string list as one leaf however many entries changed', () => {
    expect(changesAfter([set('home.ru.heroBullets', ['a', 'b', 'c'])])).toBe(1);
    expect(changesAfter([set('stack.st1.items.0', 'Vue'), set('stack.st1.items.2', 'Nest')])).toBe(
      1,
    );
    expect(changesAfter([set('stack.st1.items', ['Next.js', 'React'])])).toBe(1);
  });

  it('compares hidden sections as a set, ignoring their order', () => {
    const hidden = applyPatches(base, [
      set('home.hiddenSections', ['pricing', 'works']),
      set('about.hiddenSections', ['stack', 'hobbies']),
    ]).tree;
    expect(
      changesAfter(
        [
          set('home.hiddenSections', ['works', 'pricing']),
          set('about.hiddenSections', ['hobbies', 'stack']),
        ],
        hidden,
      ),
    ).toBe(0);
    expect(changesAfter([set('home.hiddenSections', ['works'])], hidden)).toBe(1);
    expect(changesAfter([set('home.hiddenSections', ['works', 'services'])], hidden)).toBe(1);
  });

  it('counts one per added and per removed item, not their leaves', () => {
    const added = newCollectionNode('services');
    expect(changesAfter([{ op: 'insert', path: 'services', value: added }])).toBe(1);
    expect(
      changesAfter([
        { op: 'remove', path: 'pricing.p1' },
        { op: 'remove', path: 'hobbies.h1' },
      ]),
    ).toBe(2);
  });

  it('counts changed leaves of common items, `published` included', () => {
    expect(
      changesAfter([
        set('services.s1.ru.title', 'x'),
        set('services.s1.en.bullets', []),
        set('services.s1.number', '9'),
        set('projects.pr2.showOnHome', true),
      ]),
    ).toBe(4);
    const unpublished = { ...base.experience[0], published: false };
    expect(changesAfter([{ op: 'insert', path: 'experience', value: unpublished }])).toBe(1);
  });

  it('adds one when the relative order of common items changed', () => {
    expect(changesAfter([{ op: 'move', path: 'services.s3', value: 0 }])).toBe(1);
    expect(
      changesAfter([
        { op: 'move', path: 'services.s3', value: 0 },
        { op: 'move', path: 'projects.pr1', value: 2 },
      ]),
    ).toBe(2);
    expect(
      changesAfter([
        { op: 'move', path: 'services.s3', value: 0 },
        { op: 'move', path: 'services.s1', value: 0 },
      ]),
    ).toBe(1);
  });

  it('does not count a removal or an insertion as a reorder', () => {
    expect(changesAfter([{ op: 'remove', path: 'services.s1' }])).toBe(1);
    const added = newCollectionNode('services');
    expect(changesAfter([{ op: 'insert', path: 'services', value: added, index: 0 }])).toBe(1);
  });
});
