# «Сайт» visual editor — architecture & contract

The CRM edits the real site: `apps/crm` `/site` renders `apps/web` in an iframe
in **draft preview mode** and draws an editing overlay from rects that a
preview-only bridge script posts from inside the iframe. All content edits go
to a **draft tree**; «Опубликовать» materializes it into the content tables and
revalidates the ISR tags.

```
CRM /site ──PATCH /admin/content/draft──▶ API ContentDraft.tree (JSON, both locales)
   │  ▲                                        │ publish: validate → write tables → revalidateTag
   │  └──postMessage (nodes, hover, commits)   ▼
   └──iframe  web  ?preview=<token>  ──▶ draftMode + GET /content/draft/* (no-store)
```

## 0. Decisions (where the brief was silent or needed adjusting)

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Why                                                                                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Draft = one `ContentDraft` row: `tree` (site-wide JSON, RU+EN) + `base` (the published tree it forked from). Content tables stay the published copy. Reset = delete the row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Public endpoints never read the draft, so drafts cannot leak; «Сбросить всё» and the change counter are trivial.                                                             |
| D2  | Preview uses **Next.js Draft Mode**. `?preview=<token>&locale=` on any page URL is caught by middleware → `/api/preview` verifies the token with the API, enables draft mode, stores the token in an httpOnly cookie and redirects to the clean localized path (same-origin only). A missing or invalid token clears the preview cookies and redirects to the clean **published** page. `/api/preview?token=&refresh=1` only renews the cookie: 204, or 401 leaving the current cookies alone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Reading `searchParams` in a page makes it dynamic for every visitor; draft mode keeps SSG/ISR for the public. A stray `?preview=` never shows visitors or crawlers an error. |
| D3  | `GET /admin/content/tree` is site-wide (no `page`/`locale` params).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Projects and button labels span pages; the drawer needs both locales.                                                                                                        |
| D4  | Nav / footer / button labels move from `messages/*.json` into a `SiteChrome` DB singleton; the web falls back to the seeded `DEFAULT_CHROME` when the fetch fails. Contact modal, a11y, 404, EN hint and the hero illustration strings stay in messages.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | The brief lists «тексты кнопок, футер» as site content; the prototype edits nav + CTA inline.                                                                                |
| D5  | Contacts, socials, CV, analytics stay in **Настройки** (saved + published directly, as today).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Sidebar spec puts them there; they are settings, not copy.                                                                                                                   |
| D6  | Old admin CRUD endpoints for content (`/admin/home`, `/admin/services`, `/admin/projects`, `/admin/pricing`, `/admin/experience`, `/admin/about`, `/admin/stack`, `/admin/hobbies`) are removed. Public endpoints keep their contracts and are projected from the same tree loader.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Writes that bypass the draft would be silently overwritten by the next publish.                                                                                              |
| D7  | The iframe scrolls internally (the site header is `position: sticky`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | A full-height iframe would break sticky/fixed chrome and «Просмотр identical to production».                                                                                 |
| D8  | «+ Добавить …» ghost slots and hidden-section strips are rendered **in-flow by the web** (preview only); transient affordances (hover outlines, card toolbars, section chips, image scrim, edit ring) are drawn by the CRM overlay.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Grid/stack placement is automatic and persistent affordances never lag behind scroll.                                                                                        |
| D9  | `published` stays on collection items as a passthrough (not exposed in the editor). New items are `published: true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Publishing must not destroy rows the owner had unpublished.                                                                                                                  |
| D10 | The section chip has «Изменить» (the prototype chip only has the label and «Скрыть секцию»); on the case page it opens the project.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Section copy (headings, ledes) needs a drawer.                                                                                                                               |
| D11 | «Сбросить всё» asks for confirmation (`ResetDialog`, focus on «Отмена»); the prototype resets at once.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | It discards every unpublished change and cannot be undone.                                                                                                                   |
| D12 | The onboarding strip is dismissed per browser (localStorage keyed by user id), not per account.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Per account needs a user flag in the API.                                                                                                                                    |
| D13 | Analytics (GA4, Metrika) are not rendered in preview.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Editor sessions are not visits, and draft titles / URLs must not reach the trackers.                                                                                         |
| D14 | `POST /publish` keeps its `home` / `projects` (+ `slug`) targets although the CRM only sends `settings` and `all`; content goes through `/admin/content/publish`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Contract stability: `publishTargetSchema` is a shared public contract.                                                                                                       |
| D15 | The About page (`/about`) was removed on 2026-09-17 with its content: the `about` singleton, the `experience` / `stack` / `hobbies` collections, `showOnAbout`, `navAbout`, `worksLinkLabel` and the About SEO rows. Migration `20260917090000_remove_about_page` also strips those keys from a stored draft and deletes the Kurabu / Chargers projects only About showed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Not needed for launch; a different About will be designed from scratch later.                                                                                                |
| D16 | The «Услуги» section was replaced on 2026-09-22 by «Процесс и услуги» (`process`): the `services` collection, the four `services*` home fields and the `Service` tables gave way to an ordered `steps` collection and nine `process*` home fields. A step's number («01»…) is its position, never stored. One exclusive `isMain` step gets the purple circle and border, the «ГЛАВНОЕ» badge and the annotation, which follows whichever step is main. The «ОТ ВАС» / «РЕЗУЛЬТАТ» / «ГЛАВНОЕ» labels are home fields, editable like the other on-page labels (D4). Migration `20260922150000_process_section` fills the copy into an existing DB and a stored draft and un-hides the slot: a hidden `services` is dropped, the new section starts visible. The page order is hero → process → works → pricing → CTA on every width (the phone-only reorder that put works first is gone). Five columns ≥1024px, one column below (header stacked, pill under the lede; phone type scale ≤768px). The desktop row fits at most `MAX_PROCESS_STEPS` = 6 steps at 1024px, so publish refuses a seventh and the preview drops «+ Добавить шаг» at six. Copy rules for every later edit: no promise of leads or Google rankings («приводит клиентов», «выйдете в топ»), no framework names, no Lighthouse scores, no untranslated acronyms in card titles. | Approved design «Services Section Options»: 4a (desktop) and 5a (mobile). The copy rules come from its spec (§2); those claims and that jargon were removed deliberately.    |

## 1. Content tree — `packages/shared/src/cms/tree.ts`

Zod schemas (`.strict()`), inferred types exported. Strings may be empty in a
draft; required-ness is checked at publish (§3). Collection array order **is**
`sortOrder`.

```ts
type Localized<T> = { ru: T; en: T };

HomeCopy    = homeContentSchema                    // existing 28 fields (heroBullets: string[])
ChromeCopy  = { navWorks; navPricing; navCta; navCtaShort;
                footerTagline; footerNavHeading; footerContactsHeading; footerRights; footerMadeIn;
                viewCaseLabel; allWorksLabel; backToHomeLabel; roleLabel; stackLabel; whatWasDoneLabel;
                pricingSwipeHint }

HomeSectionKey  = 'process' | 'works' | 'pricing'
CollectionKey   = 'steps' | 'pricing' | 'projects'

SiteTree = {
  version: 1;
  home:  { hiddenSections: HomeSectionKey[] } & Localized<HomeCopy>;
  chrome: Localized<ChromeCopy>;
  steps:    StepNode[];
  pricing:  PricingNode[];
  projects: ProjectNode[];
}

StepNode       = { id; published; isMain }                                            & Localized<{ title; description; from; result }>
PricingNode    = { id; published; highlighted }                                       & Localized<{ name; priceLabel; termLine; highlightLabel; description; features: string[] }>
ProjectNode    = { id; published; slug; badgeType: 'work'|'own'; showOnHome;
                   coverImage: string | null; screenshots: string[] }                 & Localized<{ title; badge; typeTag; metaLine; factsLine; role; description;
                                                                                                  pills: string[]; bullets: string[]; techChips: string[]; seoTitle; seoDescription }>
```

Ids of existing rows are the DB ids; new items get `newCmsId()` (`n` + 24 base36
chars, `crypto.getRandomValues`). Id charset: `[A-Za-z0-9_-]`. Item ids are
unique per collection and `hiddenSections` holds each key at most once.

## 2. Paths — `packages/shared/src/cms/paths.ts`

Dot-separated; collection items are addressed **by id**, string-list entries by
numeric index.

```
home.hiddenSections
home.<locale>.<field>[.<index>]
chrome.<locale>.<field>
<collection>                                insert target
<collection>.<id>                           remove / move target
<collection>.<id>.<neutralField>[.<index>]  e.g. projects.<id>.coverImage, projects.<id>.screenshots.2
<collection>.<id>.<locale>.<field>[.<index>] e.g. steps.<id>.ru.title, pricing.<id>.en.features.0
```

Exports: `cmsPath` builders (`home(locale, field, index?)`, `homeNeutral(field)`,
`chrome(locale, field)`,
`collection(c)`, `item(c, id)`, `itemField(c, id, field, index?)`,
`itemLocale(c, id, locale, field, index?)`), `parseCmsPath(path)` → a
discriminated `ParsedCmsPath | null` (rejects unknown fields), `getAtPath(tree, path)`.

## 3. Patch API — `packages/shared/src/cms/patch.ts`

```ts
type ContentPatch =
  | { op: 'set';    path: string; value: unknown }                          // leaf, list entry (index === length appends) or whole list
  | { op: 'insert'; path: CollectionKey; value: CollectionNode; index?: number } // upsert by value.id; default index = end
  | { op: 'remove'; path: string }                                          // <collection>.<id>
  | { op: 'move';   path: string; value: number };                          // <collection>.<id> → absolute index in the full collection

applyPatches(tree, patches) → { tree, applied, skipped }   // pure + immutable
invertPatches(treeBefore, patches) → ContentPatch[]         // exact undo, already in reverse order
exclusiveFlagPatches(tree, collection, id, flag, value)     // e.g. highlighted: sets the others false
hiddenSectionPatch(tree, section, hidden)                   // whole-list set, always in section-key order
```

All ops are **idempotent**: `set` is absolute; `insert` of an existing id
replaces it in place; `remove`/`set` on a missing item id is a no-op counted in
`skipped`; `move` clamps into range. A malformed path or a value of the wrong
type throws `CmsPatchError` (API → 400). Business invariants (one main step,
one highlighted plan) are expressed as explicit extra patches by the client, so
`applyPatches` stays dumb and `invertPatches` stays exact.

### Endpoints (JWT, `apps/api/src/content`)

| Method | Path                           | Body → Response                                                                                            |
| ------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| GET    | `/admin/content/tree`          | → `ContentTreeResponse`                                                                                    |
| PATCH  | `/admin/content/draft`         | `{ patches: ContentPatch[] }` (1–200) → `ContentTreeResponse & { applied; skipped }`, or **503** when busy |
| DELETE | `/admin/content/draft`         | → `ContentTreeResponse` (draft reset to published), or **503** when busy                                   |
| POST   | `/admin/content/publish`       | → `ContentPublishResponse`, **422** `{ message, errors: CmsIssue[] }`, or **503** when busy                |
| POST   | `/admin/content/preview-token` | → `{ token; expiresAt }`                                                                                   |

```ts
ContentTreeResponse    = { tree: SiteTree; changes: number; hasDraft: boolean; updatedAt: string | null;
                           issues: { errors: CmsIssue[]; warnings: CmsIssue[] } }
ContentPublishResponse = { ok: true; tags: string[]; revalidated: boolean; warnings: CmsIssue[] }
CmsIssue               = { path: string; locale: Locale | null; message: string }
```

PATCH, DELETE and publish each run in one transaction under
`pg_advisory_xact_lock`. The lock wait is capped at 10 s (`lock_timeout`) and the
transaction at the lock wait + 30 s; running out of either answers **503**
«Черновик сейчас занят — повторите через пару секунд». `PATCH` creates the draft
row on first write (`base = tree = loadPublishedTree()`), validates the result
with `siteTreeSchema`, and returns the new tree. `changes` = leaf-level diff
between `base` and `tree` (singleton fields, a string list counts as one leaf,
`hiddenSections` compared as a set, per-collection added + removed + changed
leaves + 1 when the relative order of common items changed).

**Publish**: `validateTree` → errors (blank required RU field, blank required
neutral field, bad/duplicate slug — `PROJECT_SLUG_PATTERN`, a published step past
`MAX_PROCESS_STEPS` = 6) block with 422; blank
required EN fields are returned as `warnings` and do not block. Then the same
transaction writes the tree into the tables (delete missing ids, upsert by id
with `sortOrder = index`, upsert both translation rows; slug swaps must not trip
the unique index), the draft row is deleted, and after commit the existing
revalidate pipeline fires `ALL_STATIC_CONTENT_TAGS` (now incl. `content:chrome`)
plus `project:<slug>` for every slug in `base ∪ tree`.

### Draft reads for the web (preview token, `@Public()` + `PreviewTokenGuard`)

`GET /content/draft/verify` → `{ expiresAt }` · `GET /content/draft/home?locale=` →
`HomeResponse` ·
`/content/draft/chrome?locale=` → `SiteChrome` · `/content/draft/projects/:slug?locale=` → `Project`.

Preview tokens are JWTs with audience `alcha-preview`, TTL `PREVIEW_TOKEN_TTL`
(default `2h`), signed with a secret **derived** from `JWT_SECRET` — so a preview
token is never accepted as an admin access token.

### Projection (API) — one code path for published and draft reads

`projectHome / projectProjects / projectProject / projectChrome`
turn a tree into the existing public DTOs: filter `published`, home projects =
`showOnHome`, `sortOrder` = index; a blank **required** EN field falls back to
RU. `HomeResponse` gains `hiddenSections`. New public `GET /content/chrome?locale=` (tag
`content:chrome`).

Required fields (`CMS_REQUIRED_FIELDS`) — RU errors / EN warnings:
home `heroTitle heroSubtitle heroCtaPrimary heroCtaSecondary processHeading worksHeading pricingHeading ctaTitle ctaSubtitle ctaTelegramLabel ctaWhatsappLabel` ·
chrome all · steps `title description` · pricing `name priceLabel termLine description ctaLabel` ·
projects `title badge metaLine description` (+ `slug`).

## 4. Data-attribute contract (web → bridge) — `packages/shared/src/cms/bridge.ts`

Emitted **only in preview mode**. `cmsAttrs(enabled, locale)` in
`apps/web/src/lib/cms.ts` returns attribute helpers (`field`, `image`, `item`,
`list`, `section` — each `{}` unless enabled, so production HTML is unchanged)
and path builders bound to the page locale (`home`, `chrome`, `itemLocale`,
`itemField`).

A field element must hold nothing but its text: where a label shares its element
with an icon, an arrow or other nodes, the text sits in its own `<span>` carrying
the attributes (`ContactButton` renders that span only when given attributes).

| Attribute                                                                                                                      | On                                                                                                                              | Example                                                   |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `data-cms-field="<path>"`                                                                                                      | leaf element whose only child is the text                                                                                       | `home.ru.heroTitle`, `pricing.<id>.en.features.1`         |
| `data-cms-multiline`                                                                                                           | + multiline text (Enter = newline; rendered with `white-space: pre-line`)                                                       | descriptions, ledes                                       |
| `data-cms-value="<raw>"`                                                                                                       | + when rendered text ≠ stored value                                                                                             | pricing amount split into «от» + «$300»                   |
| `data-cms-rich`                                                                                                                | + field that must not be edited inline (opens its section drawer)                                                               | none rendered today                                       |
| `data-cms-image="<path>"`                                                                                                      | image wrapper                                                                                                                   | `projects.<id>.coverImage`, `projects.<id>.screenshots.0` |
| `data-cms-item="<collection>:<id>"`                                                                                            | card root                                                                                                                       | `pricing:<id>`                                            |
| `data-cms-list="<collection>"` + `data-cms-list-layout="grid\|stack"`                                                          | container directly holding the cards                                                                                            | `steps` grid, `projects` stack                            |
| `data-cms-section="<key>"` + `data-cms-section-label` (+ `data-cms-section-hideable`, `data-cms-section-item="projects:<id>"`) | section root                                                                                                                    | `pricing` «Цены»                                          |
| `data-cms-add="<collection>"`                                                                                                  | ghost slot button (last child of the list), or the «+ Добавить …» button of the strip rendered in place of an **empty** section | «+ Добавить тариф»                                        |
| `data-cms-hidden="<section>"`                                                                                                  | «Показать» button of the strip rendered in place of a **hidden** section                                                        | «Секция «Цены» скрыта …»                                  |
| `data-cms-preview-ui`                                                                                                          | root of a ghost slot or strip; hidden in view mode and while no bridge runs (a draft tab outside the CRM)                       |                                                           |
| `data-locale-nav="<href>"`                                                                                                     | locale controls (`LocaleSwitch`, `EnLocaleHint`); rendered for visitors too, so not `data-cms-*`                                | `/en/works/chaban`                                        |

Sections (★ = hideable): home — `header` Шапка, `hero` Первый экран,
`process`★ Процесс и услуги, `works`★ Работы, `pricing`★ Цены,
`cta` Призыв к действию, `footer` Подвал · case page — `case` Кейс проекта
(`data-cms-section-item`).

## 5. Bridge protocol — `packages/shared/src/cms/bridge.ts`

Every message is `{ source: 'alcha-cms', type, ... }`. The parent checks
`event.origin === SITE_URL origin` and `event.source === iframe.contentWindow`;
the bridge checks `event.origin === CRM_URL origin`.

```ts
CmsNode = { key; kind: 'field'|'image'|'item'|'list'|'section'|'add'|'hidden';
            rect: { x; y; w; h };             // iframe viewport coords (getBoundingClientRect)
            path?; collection?; id?; section?; label?; hideable?; sectionItem?;
            layout?: 'grid'|'stack'; multiline?; rich?;
            listKey?; sectionKey? }           // nearest enclosing list / section node
// keys: field:<path>#n · image:<path>#n · item:<collection>:<id> · list:<collection>#n
//       section:<key> · add:<collection> · hidden:<section>      (#n = DOM-order duplicate index)

// iframe → CRM
ready        { pathname; locale; nodes; viewport: { w; h; scrollY; docH } }
nodes        { nodes; viewport }                  // rAF-throttled: scroll, resize, DOM mutations
hover        { field; image; item; section }      // node keys or null, all levels at once
edit-start   { path; key }     edit-commit { path; value }     edit-end { path }
open-field   { path }            // click on a data-cms-rich field or a field inside button/label/summary;
                                 // Enter on a focused card (<collection>.<id>) or image (its path)
add          { collection }                        // ghost slot / empty-section button clicked
show-section { section }                           // strip «Показать» clicked
navigation-blocked { href }

// CRM → iframe
mode          { mode: 'edit' | 'view' }
patch         { path; value }                      // optimistic text on every matching leaf
refresh       {}                                   // router.refresh(), held back while editing inline
scroll-to     { key }
preview-token { token }                            // renews the cookie via /api/preview?refresh=1 (204), no reload
scroll-by     { dx; dy }                           // wheel over an overlay control (card toolbar, chip, photo scrim)
```

Inline editing lives in the bridge: click a field in edit mode →
`contentEditable="plaintext-only"` (engines without it get `"true"` with
Cmd/Ctrl+B/I/U blocked), caret at the click; Enter commits single-line fields,
Esc reverts, blur commits; paste inserts plain text. On end the bridge
**restores the original DOM nodes** (updating the single text node's value) so
React's fibers never point at detached nodes. A `refresh` that arrives mid-edit
is held: it runs when the edit ends without a commit (after the click that may
start the next edit), and is dropped after a commit, whose own refresh follows.

Clicks: in edit mode links, buttons and forms are swallowed; in view mode only
cross-page navigation and form submits are. In both modes locale controls
(`data-locale-nav`) are swallowed and reported as `navigation-blocked` — the
CRM's RU/EN switch picks the locale.

Keyboard: in edit mode every card and image without its own `tabindex` gets
`tabindex="0"` (removed again in view mode). Focus posts `hover` exactly like the
pointer; Enter posts `open-field`; Escape blurs and clears the hover.

## 6. CRM

Sidebar: **Сайт** `/site` · **Заявки** `/leads` (landing, lead counters in its
header) · **Медиа** · **SEO** · **Настройки**. `/site` is full-bleed (icon-rail
sidebar, no Ant header) with editor chrome in the site tokens (Golos Text /
JetBrains Mono, ink `#17121F`, purple `#5B34C9`, bg `#FAF8FC`); the other four
pages stay Ant Design.

Editor state: TanStack Query owns `['content-tree']`; every action is
`apply(patches)` → optimistic `applyPatches` on the cache + history entry
`{ forward, inverse: invertPatches(before, forward), label }` → PATCH, queued
strictly in order → the server tree, with still-queued patches re-applied,
replaces the cache → `refresh` to the iframe once the queue drains, after
**every** change (the bridge cannot patch split values or structure); text
changes are also sent as `patch` at once. Clearing a list entry inline removes
the entry (a whole-list `set`). Reorder takes the neighbour from the DOM order
of `item` nodes sharing a `listKey`, then `move`s to the neighbour's index in the
full collection.

History: at most 50 entries. Undo (top-bar button, toast «Вернуть» for the latest
entry, or Cmd/Ctrl+Z outside text inputs, inline edits and dialogs) sends the
top inverse and adds no entry. A save the server applied 0 patches of drops its
entry; a failed PATCH drops its entry and every later one (their inverses build
on it); a failed undo, reset and publish clear the history. After a failure the
tree is refetched once the queue is idle, the failed `set`s are patched back
into the preview with the server values, then `refresh`.

Preview frame: the token is captured when the page or locale changes; a
re-issued token is sent as `preview-token` to a ready iframe, and on every
accepted `ready` whose URL carries an older token. The iframe stays hidden («Загружаем сайт…») until `ready`
arrives and the mode is sent; a document that loads but never sends `ready` (an
error page) is shown after 4 s. A `ready` whose `pathname` (localized) or
`locale` differs from the page the frame was opened for is rejected and the
expected URL reloaded, at most twice in a row. Only a failed first load replaces
the canvas; a failed background refetch keeps the iframe under a retry banner.

Overlay: the section chip straddles the section's top edge at its left end, else
its right end, preferring a spot that covers no content; it never covers the
hovered or edited field or image, and is hidden while a card is hovered (the card
toolbar wins). Toolbars are kept inside the frame; move arrows are ↑↓ when the
neighbouring card shares the column, ←→ otherwise. A toolbar is wider than a
process step's card, so it overhangs the previous column: the hover waits 250 ms
before leaving the hovered card (150 ms after leaving the frame), letting the
pointer cross a gap or a neighbour to reach it. The image scrim lets the wheel
through; only «Заменить фото» takes the pointer.

Hidden sections: the site also drops every link to a hidden section, in preview
too, so «Просмотр» matches production. Hiding `works` / `pricing` removes their
header, mobile menu and footer links on every page (the layout reads the
draft-aware home); hiding `works` also removes the hero's `#works` CTA and, on
case pages, «Все работы» (the breadcrumb goes to `/`). The homepage JSON-LD
carries only the pricing offers (`makesOffer`), left out while `pricing` is
hidden; the services `OfferCatalog` went with the «Услуги» section (D16).

Env: web `CRM_URL` (default `http://localhost:5173`), crm `VITE_SITE_URL`
(default `http://localhost:3000`), api `PREVIEW_TOKEN_TTL` (default `2h`).

Same-site requirement: the preview cookies are first-party only while CRM and
site share a registrable domain (`localhost`, or `crm.alcha.dev` + `alcha.dev`).
