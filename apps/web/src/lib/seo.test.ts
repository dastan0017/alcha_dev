import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMetadata, localizedPath } from './seo';

test('localizedPath keeps RU at the root and prefixes EN with /en', () => {
  assert.equal(localizedPath('/', 'ru'), '/');
  assert.equal(localizedPath('/', 'en'), '/en');
  assert.equal(localizedPath('/works/chaban', 'ru'), '/works/chaban');
  assert.equal(localizedPath('/works/chaban', 'en'), '/en/works/chaban');
});

test('buildMetadata sets a canonical and hreflang alternates', () => {
  const meta = buildMetadata({
    title: 'Test title',
    description: 'Test description',
    keywords: ['bishkek'],
    path: '/works/chaban',
    locale: 'en',
  });

  assert.ok(String(meta.alternates?.canonical).endsWith('/en/works/chaban'));

  const languages = meta.alternates?.languages as Record<string, string>;
  assert.ok(languages.ru.endsWith('/works/chaban'));
  assert.ok(languages.en.endsWith('/en/works/chaban'));
  assert.equal(languages['x-default'], languages.ru);
});

test('buildMetadata uses an absolute title so the layout template does not double the brand', () => {
  const meta = buildMetadata({ title: 'My Page — alcha.dev', description: 'x', path: '/', locale: 'ru' });
  assert.deepEqual(meta.title, { absolute: 'My Page — alcha.dev' });
});
