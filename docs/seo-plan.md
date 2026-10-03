# alcha.dev SEO strategy and implementation plan: final (2026-10-01)

## TL;DR: the plan in 8 lines

1. **This week, one release:** favicon and logo, `WebSite` + `ProfessionalService` schema (name «alcha.dev», alternate «Alcha Dev»), a visible phone, one identity sentence, «Создание сайтов в Бишкеке» inside the H1, and `data-nosnippet` on the hero mock-up.
2. **Today, with no deploy:** verify Search Console and Yandex by DNS, retitle the homepage and case pages in the CRM, and start writing the service copy. The copy is the critical path.
3. **Demand is small, Russian and on Google.** It is about 15 «услуга + Бишкек» queries. Kyrgyz or English buyer demand is too small to justify pages of their own.
4. **One URL per service** (landing, company site, CRM, mobile apps; online store later), plus `/pricing`, `/works`, `/about` and `/contacts`, all linked from a real header and footer. This is what can rank for service queries and earn sitelinks. Estimate: 2–4 days design, 4–6 days code, 5–8 days copy.
5. **Prices live in one place:** the CMS pricing plans, keyed by a new `serviceSlug`. SEO titles written in the CMS carry no prices.
6. **Google Business Profile only if you really meet clients in person.** If you don't, 2GIS (after the ИП), directories and press carry the local and brand work.
7. **The AI Overview's brand confusion is fixed off the site, not with markup:** consistent profiles, listings and press. Never use «Alcha» on its own.
8. **Measure** with page-level impressions in Search Console, a regex filter on "alcha", manual rank checks from Bishkek and a `generate_lead` event. Day-90 targets (none guaranteed): sitelinks for «alcha.dev», #1 for «alcha dev», top 10 for two service queries.

## Owner decisions (2026-10-03): these override the plan below

| # | Question | Answer | What changes in the plan |
|---|---|---|---|
| Q3 | In-person client meetings? | **No, online only.** | **No Google Business Profile** (Google lists online-only businesses as ineligible). Drop §7 rows 1–2, task 0.21 and the map-block KPIs. Local and brand work goes through 2GIS, directories and press. |
| Q2 | Public phone | **+996 706 304 803** | Stored in Настройки (`SiteSettings.phone`, migration `20261003090000_settings_phone`), shown in the footer and sent as `telephone` / `contactPoint`. Not a code constant (`content/business.ts` is dropped). |
| Q4 | ИП registered? | **Yes** | 2GIS can go ahead now. `/contacts` shows реквизиты (ИНН) once the owner provides them. |
| Q12 | `/about` | **Yes, but completely new: position alcha.dev as an IT company**, not a personal bio | `/about` = «О компании»: what the company does, how it works, its stack and approach, cases and team (the founder as lead engineer). Person schema stays secondary. The identity sentence becomes: «alcha.dev (Alcha Dev) — IT-компания в Бишкеке: разработка сайтов, CRM-систем и мобильных приложений под ключ.» |
| Q10 | Online store / mobile apps | **Online stores on request; include the page for SEO. Mobile apps from $2000.** | `/services/online-store` moves from Phase 2 into Phase 1 (no price in its title until one is set). `/services/mobile-apps` title: «Разработка мобильных приложений в Бишкеке — от $2000 \| alcha.dev». |
| — | Page design | **Designed first in Claude Design** (2026-10-03), then implemented | Phase 1 starts with a design brief for the new pages; code waits for the approved designs. |
| Q17 | Implementation | **Pages must be CMS-editable and served as prerendered ISR HTML** | **Option B is dropped.** Phase 1 uses the CMS: a `services` collection in the draft tree (shaped like `projects`), plus CMS singletons for the about, contacts, pricing and works page copy, with CRM `PageKind`s for each, all rendered SSG + ISR through the existing publish → `revalidateTag` path. Estimate: 8–10 dev-days (codebase-audit option A). |
| Q7 | Who writes the copy | **Claude drafts RU + EN; the owner edits** | Copy ships as a data migration (like `20260922150000_process_section`), then is edited in the CRM. |

Decisions not answered explicitly use the plan's recommendations: «alcha.dev» + alternateName «Alcha Dev» (Q1); the H1 includes the eyebrow (Q5, option b).

### Phase 0 status (2026-10-03): code done locally, not yet deployed
Done:
- Favicon set (`app/favicon.ico`, `icon.png`, `apple-icon.png`; «a.» monogram in Golos 800, generator at `docs/brand/make_icons.py`), `manifest.ts` and `public/brand/logo-512.png`.
- `WebSite` / `ProfessionalService` JSON-LD: name, alternateName, logo, description, telephone, contactPoint, `hasOfferCatalog` with `minPrice`. Personal profiles moved to Person, and the personal Instagram dropped.
- The eyebrow moved inside the `<h1>`; the layout is pixel-identical at 1240, 390 and 320 px.
- `data-nosnippet` on the hero mock-up.
- The brand suffix « | alcha.dev» on CMS titles.
- Sitemap: RU and EN as separate `<url>` entries with x-default.
- The language switch as real `<a>` links.
- `Host:` removed from robots; `/ru` → 308.
- `X-Robots-Tag: noindex` on the API.
- Phone in Настройки and the footer.
- `deploy.sh` checks the icon URLs.

Left for the owner (CRM / accounts):
- Eyebrow RU «Создание сайтов в Бишкеке» / EN «Website development in Bishkek».
- `footerTagline` = the identity sentence.
- Retitle the 3 cases.
- Clear the Instagram field, or replace it with a business account.
- Search Console + Yandex Webmaster via DNS TXT.
- After deploy: Request indexing on `/` and `/en`.

---

**Sources.** Research reports are cited by key: [kw-ru], [kw-ky-en-niche], [competitors], [serp-docs], [local-offpage], [codebase-audit]. Two review passes are cited too:
- [critic]: policy pages fetched again on 2026-10-01, saved in `seo-research/critic/*.txt`.
- [feasibility]: read-only checks of the repo at `41078c5` and of the live site.

[checked] marks the two policy pages re-read for the draft. Every claim about Google's or Yandex's behaviour carries a source URL. Anything I could not verify is marked **UNVERIFIED**.

**Demand signal.** There are no keyword volumes; there is no Ahrefs or Wordstat access. The proxy is **P**: the number of distinct Kyrgyzstan prefixes whose Google Autocomplete list contained the query [kw-ru].
- Autocomplete reflects real searches but is filtered and only shows queries above a threshold (https://support.google.com/websearch/answer/7368877).
- **P is only comparable inside a cluster.** Some seeds were expanded letter by letter (27 Cyrillic letters × 14 seeds) and most were not, so P is inflated for queries near the expanded seeds [critic].
- "#k" is a query's best position in any suggestion list.

---

## 1. Executive summary

- **What is wrong today.**
  - There is no favicon at all, so Google shows a globe [codebase-audit].
  - There are only 4 indexable URLs per language, and the nav links are anchors (`/#works`, `/#pricing`). An anchor is not a separate indexable URL (https://developers.google.com/search/docs/crawling-indexing/url-structure), so there is little for Google to build sitelinks from.
  - The words we want to rank for appear only in `<title>` and meta tags. The H1 is a slogan, and «создание сайт» appears 0 times in the visible copy [codebase-audit].
  - The hero mock-up's fake-client text («ЦЕНТР БИШКЕКА · С 2012 ГОДА», «vasha-klinika.kg») appears 3–5 times in the HTML and can be quoted in snippets and AI answers [feasibility].
  - The business schema has no logo and reuses the founder's personal profiles [codebase-audit].
  - Almost nothing off the site mentions alcha.dev: `"alcha.dev" -site:alcha.dev` returns about 2 unrelated results. So Google's AI fills the gap with ЖК «Алча», alcha.net and "Alchdev" [local-offpage][serp-docs].
- **Demand is small, almost all Russian, and almost all on Google.**
  - Google has about 83% of search-engine *referrals* in Kyrgyzstan and Yandex about 15% (StatCounter, September 2026: 83.44% / 14.64% [critic]). StatCounter counts referrals, not searches (https://gs.statcounter.com/faq).
  - Google Trends shows «создание сайтов» above zero in only 3 of 262 weeks for Kyrgyzstan [critic][kw-ru].
  - The market is about 15 short «сервис + Бишкек» queries. The strongest site queries are «создание сайтов бишкек» (#1 completion of «создание сайтов»), «разработка сайтов бишкек» and «разработка сайта бишкек» (#1 for their bare seeds), and «создание сайтов бишкек цена» (#1 completion of «создание сайтов бишкек») [kw-ru][critic].
  - Kyrgyz and English buyer queries are essentially zero [kw-ky-en-niche].
- **What we will build: service-based structure.**
  - One URL per service, each with its own title and H1: Лендинг/визитка, Сайт компании, CRM, Мобильные приложения, and later Интернет-магазин.
  - Plus `/pricing`, `/works`, `/about` and `/contacts`, all linked from a real header and footer.
  - On Google from a Bishkek IP, page 1 for «создание сайтов бишкек» mixes homepages and service URLs (eweb.kg, 4union-tech.kg/services/web, nova-vs.com/web-development…), mostly from older domains [local-offpage][critic]. Service URLs are needed to compete for service queries, but they are not enough on their own.
  - Separate pages are also the most reliable route to Strapi-style sitelinks. Google can also build sitelinks from "headings, or anchors within that page" (https://developers.google.com/search/docs/appearance/visual-elements-gallery).
- **What we will build: presentation package.**
  - A favicon set and a logo.
  - `ProfessionalService` and `WebSite` schema with the name «alcha.dev» and the alternate name «Alcha Dev».
  - A visible phone number and one identity sentence used everywhere.
  - `data-nosnippet` on the hero mock-up.
- **Google Business Profile (GBP): high value, but only if the business qualifies.**
  - The map block of three local businesses appears for 5 of the 7 buying queries checked, and its #2 listing has only 2 reviews [local-offpage].
  - Google requires that a business "must make in-person contact with customers during its stated hours". It lists "online-only businesses" as ineligible (https://support.google.com/business/answer/13763036). A service-area business is one that "visits or delivers to customers directly" (https://support.google.com/business/answer/9157481).
  - So GBP goes ahead only on an honest yes to §11 Q3. Otherwise 2GIS, directories and press are the local plan.
- **Implementation choice: option B now, option C-lite later.**
  - **Option B:** pages defined in code (`content/services.ts`) that reuse the CMS data that already exists. Two small additions:
    - a `serviceSlug` key on pricing plans, so prices have one source;
    - CRM preview kinds for `/pricing` and `/works`.
  - Realistic effort for option B: **design 2–4 days, code 4–6 days, copy 5–8 days** [feasibility]. The draft's 2–3 days covered code only.
  - **C-lite:** move services into the CMS as their own content type, in Phase 3, at **6–8 days** [feasibility].
- **Timelines.**
  - Favicon: "several days to several weeks" after Google recrawls (https://developers.google.com/search/docs/appearance/favicon-in-search). Yandex: about 2 weeks, or about 3 days after a Переобход (https://yandex.ru/support/webmaster/ru/search-results/favicon.html).
  - Site name: Google already shows «alcha.dev» for the «alcha.dev» query [local-offpage], so our job is to keep it stable. Changes take "a few days to a few weeks" (https://developers.google.com/search/docs/appearance/site-names).
  - Sitelinks: automated, never guaranteed, with no documented timeline (https://developers.google.com/search/docs/appearance/sitelinks). My estimate is 1–3 months after the new pages are indexed (UNVERIFIED).
  - Rankings for head terms: months. The domain was registered on 2026-09-23 [competitors]. How fast results move on Google.kg is UNVERIFIED.
- **The AI Overview can't be edited.** It should improve as independent, consistent sources appear. How long that takes is UNVERIFIED [serp-docs][local-offpage].
- **AI answers matter beyond the brand.** For 5 of 6 commercial queries checked, Google showed an AI answer that named studios (Eweb, 4Union Tech, IDEA KG, Aunimeda) or quoted som prices [local-offpage][critic]. Being named there is a target too (§10).

---

## 2. Diagnosis of today's search result

**Baseline warning.** The owner's screenshot shows alcha.dev at #1 for «alcha dev». A clean browser profile from Bishkek shows it at **#7**, behind ЖК «Алча» and alcha.net [local-offpage]. The screenshot is personalised. Run every check from Search Console or a fresh profile.

| What the screenshot shows | Root cause | Fix | When it should change |
|---|---|---|---|
| **Globe instead of a logo** | `/favicon.ico`, `/icon.png`, `/apple-icon.png` and the manifest all return 404, and the head has no `rel=icon` [serp-docs][codebase-audit][critic] | Icon set in `apps/web/src/app/` (§5.1). Then URL Inspection → Request indexing on `/`, and a Yandex Переобход. | Several days to several weeks (https://developers.google.com/search/docs/appearance/favicon-in-search) |
| **No sitelinks** | 4 URLs per language. The nav anchors are not separate indexable URLs (https://developers.google.com/search/docs/crawling-indexing/url-structure). The only links between pages are 3× «Смотреть кейс →» [codebase-audit]. «alcha dev» has no autocomplete, meaning brand volume is below Google's threshold, not zero [kw-ky-en-niche][critic]. For «alcha dev» we rank #7 on a shared query, where a sitelinks block is unlikely. Sitelinks show only when "relevant for the user's query" (https://developers.google.com/search/docs/appearance/sitelinks). | Separate service, pricing, works, about and contacts pages in the header nav. Each nav label matches the page's H1 and the start of its title (§4). Brand-building off the site (§6–7). | For «alcha.dev» (where we are already #1 with 5+ results): 1–3 months after indexing (UNVERIFIED). For «alcha dev»: reach #1 first. |
| **Separate RU and EN homepage results**, with «Перевести эту страницу» | Normal. Google "generally won't show more than two" results per site, but may show more (https://developers.google.com/search/docs/appearance/ranking-systems-guide). Translated pages are not duplicates (https://developers.google.com/search/docs/specialty/international/localized-versions). A Latin-script query carries no language signal. hreflang is already correct [codebase-audit]. | Do **not** noindex or canonicalize `/en`. Make the language switch a real `<a>` (today it is a `<button>`). Give the EN URLs their own `<url>` entries in the sitemap, with x-default [codebase-audit #6, #7]. Leave the translate link alone. | The EN result may stay. Nothing documented folds it into the sitelinks block [critic]. That is acceptable. |
| **AI Overview confuses the brand**: "Alchdev", ЖК «Алча» / IN Group Development, a "foreign studio". For «alcha dev» it now names alcha.net (Azerbaijan); for «alcha dev бишкек» it describes the ЖК. | No independent mentions. "dev" is read as "Development". Common namesakes. The business node has no logo or description and uses personal `sameAs` links. The GitHub README calls the site a "personal portfolio". The hero mock-up says «с 2012 года» [local-offpage][serp-docs][codebase-audit][feasibility]. | The entity plan in §6: one name policy, an `/about` page, consistent profiles, 2GIS (and GBP if eligible), press, `data-nosnippet` on the mock-up. Report the overview via thumbs-down → "Report a problem" (https://support.google.com/websearch/answer/14901683). | Unknown (UNVERIFIED). Expect gradual change over months. |
| **/works/alcha-dev ranks as a second brand result** | Its title «alcha.dev — портфолио и услуги» reads like a second homepage [codebase-audit #5]. | Retitle it in the CRM: «Кейс: сайт студии со своей CMS \| alcha.dev». The real `/about`, `/pricing` and service pages should take that slot later. | Next recrawl |
| (Not in the screenshot, but it matters) **The H1 is a slogan with no topic words** | H1 «Сайты, которые помогают бизнесу получать клиентов». «Бишкек» appears only inside the mock-up [codebase-audit #4]. | The keyword line goes inside the H1 (§4.2, §11 Q5), and the body text mentions Бишкек/Кыргызстан. | Next recrawl |

---

## 3. What people in Kyrgyzstan search

### 3.1 Keyword map

Signals come from [kw-ru] unless noted. P values are comparable only within a row (see the note at the top). The full list is in the Appendix.

| Cluster | Representative queries (signal) | Intent | Priority | Target URL |
|---|---|---|---|---|
| **Head: sites + city** | создание сайтов бишкек (#1 for «создание сайтов»; top related query in Trends); разработка сайтов бишкек (#1 for «разработка сайтов», P=23); разработка сайта бишкек (#1 for «разработка сайта», P=11); создание сайтов в бишкеке (P=20); создание сайта бишкек (#1 for «создание сайта», P=17); разработка сайтов в бишкеке (P=14); разработка веб сайтов бишкек (P=15); веб разработка бишкек (P=8); разработчики сайта бишкек (P=7) | commercial | **P1** | `/` |
| **Head: country** | разработка сайтов кыргызстан (P=27, but **all from fallback lists**: «разработка сайтов к» completes to Казахстан, Кишинёв…, never Кыргызстан [critic]) | commercial | P2 (secondary phrase) | `/` (body and meta only) |
| **Order** | заказать сайт бишкек (P=14); сделать сайт бишкек (P=13); создать сайт бишкек (P=12); заказать сайт в бишкеке (P=8) | transactional | **P1** | `/` (CTA) |
| **Price** | создание сайтов бишкек цена (#1 completion of «создание сайтов бишкек»; raw P=55, or 24 without the letter-by-letter lists [critic]); сколько стоит создать сайт в бишкеке (P=10); сколько стоит создание сайта (P=10); купить сайт бишкек (P=8); разработка сайтов бишкек цена (P=5); сколько стоит сайт под ключ (P=6) | transactional / comparing | **P1** | `/pricing` (the homepage may also rank; see §4.3) |
| **Landing / business-card site** | сайт визитка бишкек (P=17); лендинг бишкек (P=11) | commercial | **P1** | `/services/landing-page` |
| **Company site / «под ключ»** | сайт под ключ бишкек (P=19); заказать сайт для бизнеса цена (P=5); заказать корпоративный сайт под ключ (P=5). Use «под ключ» without a city, but don't build around it: that phrasing is mostly Russian. | transactional | **P1** | `/services/company-website` |
| **CRM / automation** | crm система бишкек (#2 for «crm система», P=13); crm бишкек (P=12); автоматизация бизнеса бишкек (#1 for its bare seed); crm кыргызстан (P=12). Secondary: разработка crm на заказ (P=14, **but its list is identical under gl=kg, kz and ru**, so this is general Russian demand [critic]); разработка crm системы цена (P=5); амо срм / внедрение срм бишкек (P=2–3) | commercial | **P1** | `/services/crm` |
| **Mobile apps** | разработка мобильных приложений бишкек (P=17; the bare seed completes to Moscow); разработка приложения бишкек (P=16); создание приложений бишкек (P=6) | commercial | **P1** | `/services/mobile-apps` |
| **Brand** | alcha dev, alcha.dev, alcha dev бишкек (below the autocomplete threshold) [local-offpage] | navigational | **P1** | `/`, `/about` |
| **Studio / IT company** | веб студия бишкек (P=18) → `/`; веб студии бишкек (P=11); айти компании в кыргызстане (P=10) | commercial / comparing | P1 (`/`); P2 (list queries) | `/` + article «как выбрать веб-студию» + directories |
| **Web apps / client account** | сколько стоит сайт с личным кабинетом (P=3) | comparing | P2 | section on `/services/mobile-apps` + article |
| **Online store / B2B / payments** | «создание интернет магазина бишкек» has no suggestions (Bing shows a results page for it [competitors]); b2b бишкек (P=2); интернет эквайринг в кыргызстане (P=2, Kyrgyzstan only). оптовый интернет магазин / b2b платформа (~10 each) are **the same in KZ and RU, so they are not Kyrgyz demand** [kw-ky-en-niche][critic]. | commercial / info | P2 | `/services/online-store` + payments article |
| **Tilda** | заказать сайт на тильде цена (P=8); сайт на тильде цена (P=7) | comparing | P2 | article «Tilda или сайт на заказ» |
| **Telegram bot** | телеграм бот бишкек (P=9, noisy); чат бот бишкек (P=8) | commercial | P3, only if offered | article |
| **SEO as a service** | seo продвижение бишкек (P=9) | commercial | P3 | no page; «SEO-настройка включена» on every service page |
| **Redesign / support** | редизайн сайта цена (P≤2); поддержка сайта бишкек (no suggestions) | — | P3 | section on `/services/company-website` |
| **Industries** | сайт для стоматологии, сайт для отеля / туроператора, crm для стоматологии (~10 each, **the same in KZ and RU, so Kyrgyzstan's share is UNVERIFIED**) [kw-ky-en-niche] | commercial | P3 | `/solutions/clinics`, `/solutions/tourism` (Phase 3) |

### 3.2 Geography rules

- **«Бишкек» is the geo word.** It is roughly 3× «Кыргызстан» [kw-ru].
- **«Кыргызстан» is weak for sites.** Both «создание сайтов кыргызстан» and «разработка сайтов к…» complete to Казахстан [kw-ru][critic].
  - It does work in «crm кыргызстан» (P=12) and «айти компании в кыргызстане» (P=10).
  - Use «Кыргызстан» in body copy and meta descriptions. For site queries, keep it out of titles and H1s.
- **«кр» and «Ош» are worth nothing here** [kw-ru].
- **No city or region doorway pages.** Google's spam policy names them (https://developers.google.com/search/docs/essentials/spam-policies).
- **Kazakhstan:** more demand, but entrenched competitors. Not now. Revisiting after 6 months is my call; kw-ru marks its Kazakhstan Trends comparison as unreliable [critic].

### 3.3 Junk: never target [kw-ru]

- **Jobs:** вакансии, зарплата, стажировка, фрилансер работа; «программист бишкек» (universities and salaries).
- **Education:** обучение, курсы, колледж, лекции.
- **DIY:** создать сайт бесплатно, как создать сайт, wix, google sites, с помощью ии, html, «сайт ачуу жолдору».
- **Definitions:** лендинг это, crm это, «… деген эмне».
- **Templates and logins:** шаблон, примеры, amocrm вход.
- **Shoppers:** интернет магазин бишкек одежда / телефоны, «интернет магазин бишкек».
- **Government sites:** сайт налоговой, мэрия.
- **Traps:**
  - «вебкам студии»: webcam modelling studios, which appear under «веб студии»;
  - «визитка кг» / «заказать визитки»: printed business cards;
  - «корпоративные подарки»;
  - «кракен бот»: likely darknet.

### 3.4 Language verdicts

- **Kyrgyz.** Commercial demand is essentially zero. «сайт жасоо», «сайт түзүү» and «сайт керек» suggest only themselves, and every «сайт жасап берүү / баасы» variant is empty [kw-ky-en-niche].
  - **No full `/ky` locale.**
  - **No «кыргызская версия» claim in meta or copy for now.** The studio CMS supports only ru/en (`Locale` in Prisma, `LOCALES`, routing [feasibility]).
  - If the owner can deliver a Kyrgyz version (a custom-quoted static version, or a client CMS with a third locale), list it as «по запросу» on `/pricing`. Owners may care because of the 2023 state-language law, but whether that law applies to private sites is UNVERIFIED.
  - One `/ky` landing page in Phase 3, only with a native-speaker writer. Only 4 of 34 competitors have a Kyrgyz version [competitors].
- **English.** No suggest demand for any "web development bishkek/kyrgyzstan" variant [kw-ky-en-niche].
  - **Correction:** the draft's "weak results page" came from DuckDuckGo, which reflects Bing. Google from Bishkek shows real competitors with English pages: eweb.kg/website-development-in-bishkek, nambamedia.kg, sait.kg (three EN pages), bstudio.kg, safidev.com, callitdev.com [local-offpage][critic].
  - **Decision:** mirror the core pages (services, pricing, works, about, contacts) in EN, **shorter than the RU pages** (300–600 words), and ship them in the same release as RU.
    - The copy model is already bilingual.
    - The language switch then always has a target, so the RU-only plumbing is needed only for the blog.
    - Foreign referrals and NGOs check the brand there.
  - No EN blog and no EN industry pages. Put the English effort into Clutch, TechBehemoths and GoodFirms.
  - *Critique note:* kw-ky-en-niche advised against EN service pages, and [feasibility] suggested shipping EN later. I keep the mirrors, shorter and shipped together with RU, because a later EN release would first need the RU-only hreflang and LocaleSwitch work (§9 2.1).

---

## 4. Target information architecture

### 4.1 Slug convention: English slugs shared across locales

Example: `/services/crm` ↔ `/en/services/crm`.

**This is a trade-off against a Google recommendation.** Google says "Use words in your audience's language in the URL (and, if applicable, transliterated words)" (https://developers.google.com/search/docs/crawling-indexing/url-structure). Its starter guide adds that URL keywords have "hardly any effect beyond appearing in breadcrumbs" (https://developers.google.com/search/docs/fundamentals/seo-starter-guide), and breadcrumbs now show on desktop only. We choose English slugs because:
1. They match the existing `/works/<slug>`, `localizedPath()` and next-intl `localePrefix: 'as-needed'`, which has no `pathnames` config [codebase-audit].
2. hreflang pairs stay 1:1 on the same path.
3. Transliteration varies (sajt/sait/sayt), even among competitors.
4. Clean paths suit a developer studio.

The `/uslugi/...` proposals [kw-ru][competitors] are rejected.

**Slugs are frozen from launch.** Any later rename gets a 301 in `next.config.ts` `redirects()`, where the `/ru` 308 also goes [feasibility].

Blog and industry pages are RU-only. They have no hreflang pair, and they need the RU-only plumbing in §9 2.1 first.

### 4.2 Pages

**Title template:** «{Тема} в Бишкеке — от $X | alcha.dev».
- The brand delimiter becomes " | " in the layout template (`%s — alcha.dev` today), in `buildMetadata` and in the CMS titles, all changed on the same day [feasibility].
- The CRM caps titles at 70 characters and descriptions at 180.
- Google truncates descriptions by device width (https://developers.google.com/search/docs/appearance/snippet).

**Price rule.**
- Prices in service and pricing titles, H1s, meta, copy and JSON-LD are **generated in code from the CMS pricing plans**, joined by a new `PricingPlan.serviceSlug` (§9 1.3).
- The som rate is one constant (≈87 сом/$ [competitors]; the owner sets it).
- SEO strings written in the CMS (homepage, cases) carry no price in the title.
- The homepage meta description and `heroNote` («От $300») are the only hand-written prices. They go on a price-change checklist (§9, owner editing workflow).

**Home: `/` · `/en`**
- **Title:** «Создание и разработка сайтов в Бишкеке | alcha.dev»
- **H1 (recommended option b, §11 Q5):** the eyebrow becomes part of the H1, keeping the slogan:
  `<h1><span data-cms-field="home.eyebrow">Создание сайтов в Бишкеке</span><span class="sr-only">. </span><span data-cms-field="home.heroTitle">Сайты, которые помогают бизнесу получать клиентов</span></h1>`
  The `<h1>` itself loses its field annotation, because the editor contract says a field element "must hold nothing but its text" [feasibility]. Re-test inline editing in the CRM.
- **Meta:** «Создание и разработка сайтов, CRM и мобильных приложений в Бишкеке и по всему Кыргызстану. Лендинг от $300, сайт компании от $700, сайт + CRM от $1500. Сайт правите сами.»
- **EN:** «Website Development in Bishkek, Kyrgyzstan | alcha.dev» · eyebrow «Website development in Bishkek».
- **Keywords.** Primary: создание / разработка сайтов бишкек, создание сайтов в бишкеке, разработка сайта бишкек, веб студия бишкек, заказать сайт бишкек, brand. Secondary: сделать / создать сайт бишкек, разработка веб сайтов, веб разработка бишкек, разработка сайтов кыргызстан (body only).
- **Job:** the brand, the head terms, and the hub for everything else.
- **How the homepage links to services:** no new «Услуги» grid next to «Процесс и услуги». That section is process steps, and it replaced a services block on 2026-09-22 [feasibility]. Instead:
  - each pricing card gets «Подробнее об услуге →» to its service page (via `serviceSlug`);
  - one line under the pricing block links «Также: мобильные приложения · интернет-магазины»;
  - the header dropdown carries all services.
- **Pricing block:** stays full until `/pricing` ships. It becomes compact in the **same release** as `/pricing`.
- **Case anchors:** become descriptive (§9 1.6).
- **Identity:** the identity sentence goes in the footer (§6).
- **Anchors kept:** `id="works"` and `id="pricing"` stay, because the hero CTA and old links use them.

**Services hub: `/services`**
- **Title:** «Услуги: сайты, CRM и приложения в Бишкеке | alcha.dev» · **H1:** «Услуги веб-студии alcha.dev»
- **Meta:** «Лендинги, сайты для компаний, CRM-системы и мобильные приложения. Сравните, что входит, сроки и цены — от $300.»
- **EN:** «Services: Websites, CRM and Apps in Bishkek | alcha.dev»
- **Job:** a "which one do I need" comparison table and the breadcrumb parent. It targets no head term and must not repeat the homepage blocks.

**Landing page: `/services/landing-page`**
- **Title:** «Лендинг и сайт-визитка в Бишкеке — от $300 | alcha.dev» · **H1:** «Лендинг и сайт-визитка в Бишкеке»
- **Meta:** «Одностраничный сайт для услуги, эксперта или акции: дизайн, тексты, заявки в Telegram и WhatsApp, SEO-настройка. От $300 (≈26 000 сом). Правите сами в админке.»
- **EN:** «Landing Page Development in Bishkek — from $300 | alcha.dev»
- **Keywords.** Primary: сайт визитка бишкек, лендинг бишкек. Secondary: одностраничный сайт, заказать лендинг, сколько стоит сайт-визитка.
- **Links:** out to `/pricing`, `/services/company-website` (upsell) and `/works/alcha-dev`.

**Company website: `/services/company-website`**
- **Title:** «Сайт для компании под ключ в Бишкеке — от $700 | alcha.dev» · **H1:** «Сайт для компании под ключ в Бишкеке»
- **Meta:** «Многостраничный сайт: услуги, кейсы, каталог, заявки, версии на русском и английском. Своя CMS — правки без программиста. От $700 (≈61 000 сом).» (Kyrgyz removed: §3.4.)
- **EN:** «Company Website Development in Bishkek — from $700 | alcha.dev»
- **Keywords.** Primary: сайт под ключ бишкек, корпоративный сайт. Secondary: заказать сайт для бизнеса цена, заказать корпоративный сайт под ключ, многостраничный сайт, редизайн сайта.
- **Links:** out to `/services/crm` (upsell), `/pricing` and `/works/alcha-dev`.

**CRM: `/services/crm`**
- **Title:** «Разработка CRM-системы в Бишкеке — сайт + CRM от $1500 | alcha.dev» · **H1:** «Разработка CRM-системы для бизнеса в Бишкеке»
- **Meta:** «CRM под ваши процессы, связанная с сайтом: заявки, клиенты, заказы, склад и отчёты в одной админке. Автоматизация бизнеса без лишних модулей. Сайт + CRM от $1500 (≈130 000 сом).»
- **EN:** «Custom CRM Development in Bishkek — Website + CRM from $1,500 | alcha.dev»
- **Keywords.** Primary: crm система бишкек, crm бишкек, автоматизация бизнеса бишкек. Secondary: crm кыргызстан, разработка crm на заказ, разработка crm системы цена, внедрение срм, альтернатива amoCRM / Битрикс24, автоматизация торговли / магазина.
- **Links:** out to `/works/kit-store`, `/works/chaban` and the CRM article.
- **Note:** a $1,500 site + CRM bundle is a strong hook, but not the cheapest custom CRM. enot sells a CRM from $800 and quasarkg a web app from $750 [competitors][critic]. Differentiate on "site + CRM in one admin", not on "no subscription", which dastudio already uses.

**Mobile apps: `/services/mobile-apps`**
- **Title:** «Разработка мобильных приложений в Бишкеке — от $X | alcha.dev» (add «от $X» once the owner sets the price, §11 Q10) · **H1:** «Разработка мобильных и веб-приложений в Бишкеке»
- **Meta:** «Приложения для iOS и Android и веб-приложения с личным кабинетом — вместе с сервером и CRM. Кейсы: «Чабан» для овцеводов и Kit Store для оптовых заказов.»
- **EN:** «Mobile App Development in Bishkek | alcha.dev»
- **Keywords.** Primary: разработка мобильных приложений бишкек, разработка приложения бишкек. Secondary: создание приложений бишкек, мобильная разработка бишкек, сайт с личным кабинетом, сколько стоит мобильное приложение.
- **Links:** out to both cases. Both are tagged React Native in the seed (`apps/api/prisma/seed.ts:732-854`) [critic].

**Online store: `/services/online-store`** (Phase 2)
- **Title:** «Интернет-магазин и B2B-каталог в Бишкеке | alcha.dev» · **H1:** «Создание интернет-магазина и B2B-каталога в Бишкеке»
- **Meta:** «Магазин с корзиной и онлайн-оплатой или B2B-каталог, где оптовые клиенты заказывают с телефона. Каталог, заказы и клиенты — в CRM. Кейс: Kit Store.»
- **EN:** «Online Store and B2B Ordering in Bishkek | alcha.dev»
- **Keywords.** Primary: создание интернет магазина бишкек, b2b бишкек. Secondary: интернет эквайринг кыргызстан, оптовый интернет магазин.
- **Links:** out to `/works/kit-store` and the payments article.
- **Note:** this page replaces a separate "wholesale B2B" page, to avoid two pages competing for the same queries [kw-ky-en-niche].

**Pricing: `/pricing`**
- **Title:** «Цены на создание сайтов в Бишкеке — от $300 | alcha.dev» · **H1:** «Сколько стоит сайт в Бишкеке: цены alcha.dev»
- **Meta:** «Лендинг от $300 (≈26 000 сом), сайт компании от $700, сайт + CRM от $1500. Что входит в каждый пакет, от чего зависит цена, сроки и что оплачивается отдельно.»
- **EN:** «Website Development Prices in Bishkek — from $300 | alcha.dev»
- **Keywords.** Primary: создание сайтов бишкек цена, сколько стоит создать сайт в бишкеке, сколько стоит создание сайта, разработка сайтов бишкек цена, купить сайт бишкек. Secondary: сколько стоит сайт под ключ, сайт под ключ цена.
- **Job:** the primary owner of price intent. It must be **different from the homepage block**, not a copy of it:
  - a table in сом and dollars;
  - "what affects the price";
  - "studio vs Tilda vs freelancer";
  - payment stages;
  - add-ons.
- It renders the same CMS tree paths as the homepage, so it can be edited once the CRM `PageKind` `pricing` exists (§9 1.8).

**Works: `/works`**
- **Title:** «Портфолио: кейсы по сайтам, CRM и приложениям | alcha.dev» · **H1:** «Кейсы и портфолио»
- **Meta:** «Разборы проектов: мобильное приложение и CRM для овцеводов, B2B-заказы для дистрибьютора, сайт студии со своей CMS. Задача, решение, результат.»
- **EN:** «Portfolio: Case Studies | alcha.dev»

**Case pages (retitle in the CRM)**
- `/works/chaban`: «Кейс «Чабан»: приложение и CRM для овцеводов | alcha.dev»
- `/works/kit-store`: «Кейс Kit Store: B2B-заказы и CRM для дистрибьютора | alcha.dev»
- `/works/alcha-dev`: «Кейс: сайт студии со своей CMS | alcha.dev»
- Each gets «Связанная услуга» and «Следующий проект» links, and its breadcrumb changes from `/#works` to `/works`.

**About: `/about`** (needs owner sign-off, §11 Q12)
- The owner removed a personal About page on 2026-09-22 (`99e50a8`, migration `20260917090000_remove_about_page`) [feasibility]. This one is a **studio and entity page**, not a personal bio.
- **Title:** «О студии alcha.dev — Дастан Рахманжанов, Бишкек» · **H1:** «О студии alcha.dev»
- **Meta:** «alcha.dev (Alcha Dev) — веб-студия Дастана Рахманжанова, Senior Frontend Engineer, в Бишкеке. Сайты, CRM и приложения. Кто отвечает за проект и как мы работаем.»
- **EN:** «About alcha.dev — Dastan Rakhmanzhanov, Bishkek»
- **Job:** brand queries and «кто такие alcha dev».

**Contacts: `/contacts`**
- **Title:** «Контакты — alcha.dev, Бишкек» · **H1:** «Контакты»
- **Meta:** «Телефон, WhatsApp, Telegram и email веб-студии alcha.dev. Работаем с бизнесом в Бишкеке и по всему Кыргызстану.»
- **Contents:** name, phone and email block, hours, реквизиты (ИП/ИНН) once registered, and links to the profiles.
- **Yandex region risk:** Yandex assigns a region from «фактического адреса компании, указанного на сайте» and asks for the full address with postal code (https://yandex.ru/support/webmaster/ru/site-geography/site-region.html). A city-only page may fail region moderation (§7 #5).

**Privacy: `/privacy`** (Phase 0)
- Required before Google Analytics is switched on. The GA Terms say "You must post a Privacy Policy… You must disclose the use of Google Analytics" (https://marketingplatform.google.com/about/analytics/terms/us/).

**Blog: `/blog`, `/blog/<slug>`** (RU only, Phase 2)
- Title pattern: «{Вопрос} — alcha.dev». Each post links to one service page.

**Industry pages: `/solutions/clinics`, `/solutions/tourism`** (Phase 3, RU only)
- Build only with a real case or demo.
- **A ЖК / developer page is on hold.** It would put «alcha» next to «ЖК / застройщик», which is exactly the AI's confusion.

**Kyrgyz page: `/ky`** (Phase 3, optional)
- «Сайт жасоо Бишкекте — alcha.dev».
- This is **L code**, not M. Under `[locale]`, `/ky` is rewritten to the RU locale and renders `lang="ru"`. It needs [feasibility]:
  - a route outside `[locale]` with its own root layout;
  - a middleware matcher exclusion;
  - its own header and footer;
  - `ky` hreflang on the RU and EN homepages and in the sitemap.

### 4.3 Cannibalization rules (one owner per intent)

| Intent | Owner | Other pages may… |
|---|---|---|
| создание / разработка сайтов бишкек, веб студия, заказать сайт, brand | `/` | link to `/` with «Создание сайтов в Бишкеке». They must not use it as an H1 or H2. |
| «цена / сколько стоит» about sites in general | `/pricing` (primary) | show «от $X» for their own service only and link «Все цены». **The homepage may rank for the price query too** (competitors win it with homepages, e.g. idea.kg). Accept either URL. Act only if Search Console → Performance → Pages shows the two URLs swapping for weeks [feasibility]. |
| one service each | its `/services/*` page | the homepage links via pricing cards or the "Также" line, never an H2 with the service query |
| comparison and informational questions | blog posts | link to the service page. Posts never repeat the service H1 phrase. |
| «кто такие» brand queries | `/about` | — |

### 4.4 Navigation built to earn sitelinks

- **Header** (every page, server-rendered `<a href>`): **Услуги ▾** (→ `/services`; the submenu lists Лендинг и визитка · Сайт для компании · CRM-система · Мобильные приложения · [Интернет-магазин]) · **Работы** · **Цены** · **О студии** · **Контакты** · CTA «Обсудить проект».
  - The labels match the H1s and the start of each title (https://developers.google.com/search/docs/appearance/sitelinks).
  - Build the dropdown as a CSS / `<details>` disclosure with no extra client state, for Core Web Vitals.
  - The mobile menu renders only while it is open, so the desktop `<nav>` stays in the HTML at all widths (hidden with CSS is fine), and the footer carries the full link set.
- **`hiddenSections` policy:** hiding a section hides **only its homepage block**. The nav, `/pricing`, `/works`, the offer catalog and breadcrumbs are unaffected. Document this in `docs/visual-editor.md` [feasibility].
- **Footer:**
  - **Услуги:** «Создание лендинга», «Сайт для компании», «Разработка CRM», «Мобильные приложения», «Интернет-магазин».
  - **Студия:** Работы · Цены · О студии · Контакты · Блог.
  - **Кейсы:** Чабан · Kit Store · alcha.dev.
  - **Контакты:** the lockup «Alcha Dev · alcha.dev», phone as text, hello@alcha.dev, «Бишкек, Кыргызстан», hours, links to 2GIS / GBP / Telegram.
  - The identity sentence goes in the existing CMS field `footerTagline` (no migration).
  - Language links as `<a>`.
  - New code-only labels go in `messages/*.json`. List them in `docs/visual-editor.md` as not editable until C-lite.
- **Breadcrumbs** on every inner page: Главная › Услуги › CRM.
- **Only `published` pages are linked.** Every entry in `services.ts` has a `published` flag. That flag alone drives `generateStaticParams`, the header, the footer, the sitemap and `hasOfferCatalog`, so nothing links to an unwritten page [feasibility].

---

## 5. Search-result presentation package

### 5.1 Favicon and icon set

Files go in `apps/web/src/app/` at the root, **not** under `[locale]`:
- `favicon.ico` (16/32/48, multi-size), for browsers.
- `icon.png`, 512×512. This is the ≥96 px PNG `rel=icon` Google needs; Google recommends "larger than 48x48px" (https://developers.google.com/search/docs/appearance/favicon-in-search).
- `icon1.svg`, for browsers and Yandex. Yandex recommends SVG plus 120/32/16 (https://yandex.ru/support/webmaster/ru/search-results/favicon.html).
  - **Use the numeric suffix.** Next 15.5 links only one `icon.*` per base name, resolving ico → jpg → jpeg → png → svg. A plain `icon.svg` next to `icon.png` is silently never linked [feasibility].
- `apple-icon.png`, 180×180.
- `manifest.ts`.

Rules:
- Use the same artwork everywhere, because Yandex may pick any icon.
- It must be legible at 16 px.
- Google does not accept SVG-only favicons.
- **Do not use `app/icon.tsx`.** It is served at `/icon`, which has no dot, so it goes through the next-intl middleware.
- **Time-box the artwork to one day:** a monogram (for example a Golos 800 «a» on #5B34C9). The current `Logo.tsx` text wordmark can't be read at 16 px. Changing the favicon later restarts the recrawl wait [feasibility].

Logo for schema and profiles:
- `public/brand/logo-512.png` at a **stable URL**. `app/icon.png` gets a content-hash query string, so it can't be the schema logo.
- At least 112×112 and readable on white (https://developers.google.com/search/docs/appearance/structured-data/organization).
- Use the same file for GBP, 2GIS and the social avatars.

Check after deploy:
- Add `/favicon.ico`, `/icon.png`, `/apple-icon.png`, `/manifest.webmanifest`, `/brand/logo-512.png` and `/privacy` to the `deploy.sh` verify list, each expecting 200 [feasibility].
- Then URL Inspection → live test → Request indexing on `/` and `/en`, and a Yandex Переобход.

### 5.2 Site name (§11 Q1)

- **`WebSite.name: "alcha.dev"`, `alternateName: ["Alcha Dev"]`**, with `url: https://alcha.dev/`, on the homepages only (`/` and `/en`, identical data). Subdirectories are not supported (https://developers.google.com/search/docs/appearance/site-names).
- Google already shows the site name «alcha.dev» [local-offpage]. This keeps it stable.
  - If Google isn't confident in `name`, it "strongly considers" `alternateName`.
  - A lowercase domain given as the name "will generally" be selected, though Google calls that a "last resort" [checked].
  - The domain is the one string that can't be confused with ЖК «Алча».
- `og:site_name`, `application-name`, the title suffix and the footer lockup all use «alcha.dev». «Alcha Dev» appears visibly too (§6.1).
- Never «Alcha» on its own, «Alchdev», «alchadev» or Cyrillic «Алча».
- *Critique note:* [local-offpage] and [critic] suggested «Alcha Dev» as the name with «alcha.dev» as the alternate. I keep «alcha.dev» because Google already displays it, and flipping it invites a change we don't need.
- **SearchAction:** don't add one. If one exists there is no need to remove it ("Unsupported structured data like this won't cause issues", https://developers.google.com/search/blog/2024/10/sitelinks-search-box).
- Validate with the Schema Markup Validator; the Rich Results Test doesn't cover site names.

### 5.3 Organization graph (replaces `businessNode` and `personNode` in `JsonLd.tsx`)

Contact data is read from a new `apps/web/src/content/business.ts` (phone, hours, identity sentence, som rate). `SiteSettings` has no phone or hours field today; the phone exists only inside the `wa.me` URL [feasibility].

```json
{
  "@type": "ProfessionalService",
  "@id": "https://alcha.dev/#business",
  "name": "alcha.dev",
  "alternateName": ["Alcha Dev"],
  "url": "https://alcha.dev/",
  "logo": {"@type": "ImageObject", "url": "https://alcha.dev/brand/logo-512.png", "width": 512, "height": 512},
  "image": "https://alcha.dev/brand/og-default.png",
  "description": "alcha.dev (Alcha Dev) — веб-студия Дастана Рахманжанова в Бишкеке: сайты, CRM и мобильные приложения.",
  "telephone": "+996XXXXXXXXX",
  "email": "hello@alcha.dev",
  "address": {"@type": "PostalAddress", "addressLocality": "Бишкек", "addressCountry": "KG"},
  "areaServed": [{"@type": "City", "name": "Бишкек"}, {"@type": "Country", "name": "Кыргызстан"}],
  "founder": {"@id": "https://alcha.dev/#person"},
  "foundingDate": "2026",
  "priceRange": "$300–$1500+",
  "contactPoint": {"@type": "ContactPoint", "telephone": "+996XXXXXXXXX", "contactType": "sales", "availableLanguage": ["ru", "en"]},
  "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Услуги", "itemListElement": [
    {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Лендинг и сайт-визитка"},
     "priceSpecification": {"@type": "PriceSpecification", "minPrice": 300, "priceCurrency": "USD"}}
  ]},
  "sameAs": ["https://t.me/alchadev", "https://github.com/alcha-dev", "<LinkedIn company>", "<IG business>", "<2GIS>", "<GBP>", "<Clutch>"]
}
```

- **Phase 0 ships the offers without `url`.** Add `itemOffered.url` in Phase 1, only for `published` services [feasibility].
- `minPrice` values come from the pricing plans (§4.2 price rule), so the markup always matches the page. This replaces `makesOffer` with `price: "300"` [codebase-audit #11].
- The telephone must be visible on the page.
- Add each `sameAs` entry, and `hasMap`, only once that profile exists.
- Add `taxID` once the ИП exists (optional).
- The address stays locality-only unless there is a real office. `LocalBusiness` rich results need a physical address (https://developers.google.com/search/docs/appearance/structured-data/local-business). We are not chasing that result; this markup is for entity facts.
- **Person node:** name, `alternateName` «Дастан Рахманжанов», jobTitle, `image` (a photo), `sameAs` with the personal GitHub and LinkedIn only (**drop the personal Instagram**), `worksFor`.

### 5.4 Schema per page

| Page | Types |
|---|---|
| Service pages | `Service` (name, serviceType, provider `@id`, areaServed, offers.priceSpecification from the pricing plans) + `BreadcrumbList` |
| `/pricing` | `WebPage` + `BreadcrumbList` (offers come from the business graph) |
| `/works/*` | `CreativeWork` (creator `@id` business, image, about) + a 3-level `BreadcrumbList` Главная › Работы › Кейс (extend `WorkJsonLd`) |
| `/about` | `AboutPage` (mainEntity → `#business`) |
| `/contacts` | `ContactPage` |
| Blog posts | `BlogPosting` (author → `#person`, publisher → `#business`, dateModified) |

Breadcrumbs now show on desktop only; Google dropped them from mobile results on 2025-01-23 (https://developers.google.com/search/blog/2025/01/simplifying-breadcrumbs).

### 5.5 Open Graph images

- **Keep `/api/og`**, but restrict it to an allow-list of titles (from `services.ts` and the project titles), and honour its `locale` parameter. Today it draws any text under the brand [codebase-audit #16].
- Don't switch to per-route `opengraph-image.tsx`. With `as-needed` prefixes the generated URLs may carry the internal `/ru/…` path (UNVERIFIED) [feasibility].
- Localize the tagline: EN images still say «САЙТЫ · CRM · ПОД КЛЮЧ».
- Give real dimensions, and prefer the existing `shareImage` field where it is set.

### 5.6 Title and description templates

- **Title:** «{Услуга} в Бишкеке — от $X | alcha.dev». Unique per page, topic first, brand last. Google may drop the brand from the title link, which is fine (https://developers.google.com/search/docs/appearance/title-link).
- `buildMetadata` must append « | alcha.dev» to `seoTitle` titles that lack it [codebase-audit #10]. Cover it in `apps/web/src/lib/seo.test.ts`.
- **Description:** what + city → what's included → «от $X (≈N сом)» → proof (a case) → how to contact. Unique per page, concrete facts first. Google sets "no limit" on length but truncates by width (https://developers.google.com/search/docs/appearance/snippet).
- **`data-nosnippet` on the `HeroStack` root**, so the fake-client mock-up text («Стоматология без страха», «С 2012 ГОДА», «vasha-klinika.kg») isn't used in snippets or AI answers. Google supports it on div/span/section (https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), and it applies to AI features ("use nosnippet, data-nosnippet…", https://developers.google.com/search/docs/appearance/ai-features). `aria-hidden` does nothing for search.
  - Whether the text still feeds Google's understanding of the page is UNVERIFIED. If AI answers keep quoting it, render the mock-up as an image.

### 5.7 Do NOT do

- **FAQPage markup.** No Google rich result since 2026-05-07 (https://developers.google.com/search/updates). Keep FAQs as visible content only.
- **HowTo markup.** Deprecated since 2023-09-13 (https://developers.google.com/search/blog/2023/08/howto-faq-changes).
- **Self-hosted `AggregateRating` or `Review` stars** on Organization or LocalBusiness, including embedded widgets. They get no stars (https://developers.google.com/search/docs/appearance/structured-data/review-snippet). On-site testimonials are visible text only.
- **Product schema for services.**
- **llms.txt or "AEO/GEO" tricks.** Google Search ignores llms.txt and needs no special markup (https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).
- **Keywords meta.** Harmless; drop it when convenient.
- **Sitemap `priority` and `changefreq`.** Google ignores them (https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- **`lastmod` from `new Date()`.**
- **The robots `Host:` line.** Delete it.
- **City doorway pages, bulk directory submissions, site-wide footer credit links.** All are named in the spam policies (https://developers.google.com/search/docs/essentials/spam-policies).
- **A keyword-stuffed GBP name.**
- **Noindexing or canonicalizing `/en`.**
- **Claiming a Kyrgyz version** before it can be delivered.
- **Promising rankings or leads** in service copy (the house copy rule from the «Процесс и услуги» seed).

---

## 6. Brand and entity disambiguation

1. **Name policy.**
   - «alcha.dev» is the primary name on the site and in the schema.
   - **«Alcha Dev» is used visibly as the real-world name**, so the GBP and 2GIS name is backed by evidence:
     - the footer lockup «Alcha Dev · alcha.dev»;
     - the identity sentence;
     - business cards, invoices, contracts and email signatures.
   - Why this matters for GBP:
     - The name must be the "real-world name, as used consistently on your storefront, website, stationery". URLs are banned: "Google.com" → "Google" (https://support.google.com/business/answer/3038177).
     - Video verification needs business documents "that match the name on your Business Profile" (https://support.google.com/business/answer/14271705).
     - An ИП document will show the founder's name. How strictly Google matches it is UNVERIFIED. Branded invoices and cards are our real-world proof.
   - Never «Alcha», «Алча», «Alchdev» or «alchadev».
   - *Critique note:* Google's own "Google.com → Google" example would give «Alcha». I reject it because «Alcha» alone collides with ЖК «Алча», Alcha Hotel and alcha.net. «Alcha Dev» is still URL-free.
2. **One identity sentence, used verbatim** on the homepage footer (`footerTagline`), `/about`, `Organization.description` and every profile bio:
   > «alcha.dev (Alcha Dev) — веб-студия Дастана Рахманжанова в Бишкеке: сайты, CRM и мобильные приложения.»
3. **The `/about` page:**
   - founder photo, role, LinkedIn and GitHub;
   - where the name comes from;
   - Бишкек, phone and email identical to the listings;
   - links to every business profile.
   - **No disclaimer naming ЖК «Алча» or alcha.net.** Mentioning them on our own page could strengthen the association. This is my judgment (UNVERIFIED), against the optional line in [local-offpage].
4. **Separate the person from the business** in the schema (§5.3).
5. **Business accounts** [local-offpage]:
   - Telegram channel @alchadev;
   - GitHub org `alcha-dev` (free today);
   - Instagram business;
   - LinkedIn Company Page;
   - Behance;
   - `hello@alcha.dev`. Set up MX through Cloudflare Email Routing plus SPF and DMARC, and test it **before** replacing Gmail anywhere, or leads get lost [feasibility].
6. **Rewrite the public repo README** (`github.com/dastan0017/alcha_dev`). It calls the site a "personal portfolio" and already shows up as a citation [serp-docs].
7. **Retitle `/works/alcha-dev`** so the case page stops looking like a second homepage.
8. **Hide the mock-up text from snippets** with `data-nosnippet` (§5.6). It removes the «с 2012 года» and clinic text from snippets and AI answers.
9. **Off-site corroboration** is the real fix (§7): 2GIS, GBP if eligible, directories and press. Schema alone won't do it. Business Profiles feed AI responses (https://developers.google.com/search/docs/appearance/ai-features). Seeking inauthentic mentions doesn't help (https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).
10. **Avoid content that sits next to the collisions.** No ЖК or developer page for now. On a tourism page, never place «Alcha» near hotel wording (Alcha Hotel Karakol) [kw-ky-en-niche].
11. **Feedback and monitoring.**
    - Report the wrong AI Overview via thumbs-down → "Report a problem" (https://support.google.com/websearch/answer/14901683).
    - Each month, re-check «alcha dev», «alcha.dev» and «alcha dev бишкек» from a fresh profile in Bishkek.
12. **Bing Webmaster Tools** (import from Search Console) and IndexNow. Bing feeds DuckDuckGo [competitors]. Whether it also feeds the AI assistants that repeat the confusion is UNVERIFIED.
13. **Optional:** register `alcha.kg` as a 301 to protect the name (availability UNVERIFIED).
14. **Wikidata:** not yet. It needs independent press; revisit after two or more articles [local-offpage].

---

## 7. Local SEO and off-page plan (in priority order)

| # | Action | Cost | Impact | Notes |
|---|---|---|---|---|
| 0 | **Eligibility check (owner, day 1):** do you meet clients in person (at their office or a meeting place) during stated hours? | — | gate | Google: a business "must make in-person contact with customers during its stated hours"; "online-only businesses" are ineligible (https://support.google.com/business/answer/13763036, https://support.google.com/business/answer/13762416, https://support.google.com/business/answer/3038163). **No → skip rows 1–2, and drop the map-block KPIs.** |
| 1 | **Google Business Profile** «Alcha Dev», **if eligible** | free | **Very high** if eligible | Service-area business with the address hidden; such a business "should hide" it [checked]. Service area: Бишкек + Чуйская обл. Categories: «Веб-дизайнер» + «Компания по разработке ПО» (exact RU category names UNVERIFIED). Add Services with prices, the logo, a cover and 5+ work photos. Google chooses the verification method (https://support.google.com/business/answer/7107242). Video: ≥30 s, unedited, showing the location, tools and proof of management, e.g. **business documents**, so it **depends on the ИП** (§11 Q4) and on «Alcha Dev» real-world proof. Kyrgyzstan is supported (https://support.google.com/business/answer/6270107). Whether postcards reach KG is UNVERIFIED. |
| 2 | **Reviews**: ask **every** past client (Chaban, Kit Store and the rest), not only happy ones | free | **Very high** (with GBP) | The governing rule is the Maps content policy. It bans incentives and bans that businesses "selectively solicit positive reviews" (https://support.google.com/contributionpolicy/answer/7400114). Local results rank "mainly based on relevance, distance, and popularity", and "More reviews and positive ratings can help" (https://support.google.com/business/answer/7091). Map leaders have 2–57 reviews [local-offpage]. |
| 3 | **2GIS** «Добавить организацию», without an address | free | High | Needs ИП or patent registration, and bans legal entities in residential flats (rules seen on the RU site; UNVERIFIED for KG) [local-offpage][critic]. Its pages rank in Google; its links pass no value. **After the ИП.** |
| 4 | Business social accounts with the identical bio | free | High (entity) | §6.5 |
| 5 | **Yandex Webmaster**: verify by DNS TXT, submit the sitemap, request region Бишкек with the `/contacts` URL | free | Low–Med | About 1 search referral in 7. DNS verification needs no deploy (https://yandex.ru/support/webmaster/ru/service/rights). **Risk:** region moderation uses the actual address shown on the site, with postal code (https://yandex.ru/support/webmaster/ru/site-geography/site-region.html). Try city + phone; if rejected, show a real address or accept no region. Яндекс Бизнес: KG availability UNVERIFIED. |
| 6 | **workspace.ru** profile | free | Med | Ranks for «веб студия бишкек» with only 16 studios listed [local-offpage][competitors] |
| 7 | **Lalafo**: one strong listing | free (VIP paid) | Med (leads) | Its category page is on page 1 for 3 queries. Test VIP for one month only if the listing brings leads. |
| 8 | Clutch, TechBehemoths, GoodFirms (the English entry point), DevKG, plus 3 local catalogs (AKIpress Yellow Pages, etc.) | free | Low–Med | Identical name, phone and email. No bulk submissions (spam policy). |
| 9 | **PR**: the Chaban agritech story to Kaktus, 24.kg, AKIpress, Economist.kg, weproject | free (paid Kaktus placement, 30k сом, optional, with `rel=sponsored`) | Med (entity) | Independent press is also the route to Wikidata later. |
| 10 | Client credit links: «Сделано в Alcha Dev» on public client sites | free | Med | Brand text, one link, a handful of sites, never site-wide templates. Needs the list of public client sites. |
| 11 | **On-site testimonials and client logos**, with the clients' permission | free | Med (trust) | Visible text only, no Review markup (§5.7) [feasibility] |
| 12 | Bing Webmaster Tools + IndexNow | free | Low | §6.12 |
| 13 | vc.ru / Habr article monthly («Своя CMS на Next.js 15», «SEO для бизнеса в Кыргызстане») + a DevKG meetup talk | free | Low–Med | Links are nofollow or redirected. The value is brand mentions that AI summaries read. |
| — | **Skip:** Hi-Tech Park (80% export-revenue rule, 1% fee; from secondary sources), ratingruneta (reportedly paid, UNVERIFIED), Wikidata (for now), Kazakhstan | | | [local-offpage][critic] |

---

## 8. Content plan

### 8.1 Service page outline (every `/services/*` page)

**Length.** RU: **600–900 specific words**, which beats 1,500 padded ones. EN: 300–600 words. Competitors' new pages are LLM-written, and Google treats mass-produced content as scaled content abuse (https://developers.google.com/search/docs/essentials/spam-policies).

**Unique proof.** Every page carries proof of its own: case screenshots, the real deliverables, real timelines, and a testimonial where one exists.

1. **H1 + lead:** «{Услуга} в Бишкеке», who it is for, «от $X (≈N сом)», and a CTA above the fold.
2. **«Кому подходит»:** 3–4 typical businesses and situations; the problem in the client's words.
3. **«Что входит»:** deliverables as a {title, text} list. Always include: own CMS («правите сами»), SEO setup, analytics, domain and server in the client's name.
4. **«Цена и сроки»:** the from-price, what changes the price, add-ons (English version, online store), and a link to `/pricing`.
5. **«Как работаем»:** 4–5 steps. Reuse the homepage process wording, but write it for this service.
6. **«Кейсы»:** 1–2 cases with descriptive anchors and screenshots.
7. **Local specifics where true:**
   - Kyrgyz payment providers for stores: MBank, O!Деньги and ЭлКарт are named in competitors' copy [competitors]. The owner confirms which integrations he can do.
   - The .kg domain.
8. **FAQ:** 5–7 real questions, as visible content only, with no FAQPage markup.
9. **Final CTA:** Telegram, WhatsApp, phone and the contact form.
10. **Image alt text:** descriptive. Today's screenshot alts are a generic «… — Скриншот проекта».

### 8.2 First batch of articles (RU only; each owns a query that no service page owns)

| # | Working title | Target query (signal) | Links to |
|---|---|---|---|
| 1 | «CRM для бизнеса в Бишкеке: amoCRM, Битрикс24 или своя система» | амо срм бишкек, внедрение срм бишкек, crm бишкек comparisons [kw-ky-en-niche][kw-ru] | `/services/crm` |
| 2 | «Tilda или сайт на заказ: что выгоднее бизнесу в Бишкеке» | заказать сайт на тильде цена (P=8), сайт на тильде цена (P=7) [kw-ru] | `/services/company-website`, `/pricing` |
| 3 | «Интернет-эквайринг в Кыргызстане: как принимать оплату на сайте» | интернет эквайринг в кыргызстане, эквайринг бишкек (Kyrgyzstan only) [kw-ru] | `/services/online-store` |
| 4 | «Сайт или Instagram: что нужно бизнесу в Бишкеке» | local «… инстаграм» suggestions [kw-ky-en-niche] | `/services/landing-page` |
| 5 | «Сайт с личным кабинетом: когда нужен и сколько стоит» | сколько стоит сайт с личным кабинетом (P=3) [kw-ru] | `/services/mobile-apps` |
| 6 | «Как выбрать веб-студию в Бишкеке: 10 вопросов до оплаты» | веб студии бишкек (P=11), айти компании в кыргызстане (P=10) [kw-ru][competitors] | `/`, `/works` |
| 7 | (only if a Kyrgyz version is offered) «Кыргызская версия сайта: нужна ли бизнесу и сколько стоит» | сайт на кыргызском, мультиязычный сайт [kw-ky-en-niche]. No legal advice: the law's scope is UNVERIFIED. | `/services/company-website` |
| 8 | «Лендинг, сайт-визитка или сайт компании: что выбрать» | a recurring competitor topic; our demand is UNVERIFIED [competitors] | `/services` |
| 9 | (only if offered) «Telegram-бот для бизнеса: запись, заказы, уведомления» | телеграм бот бишкек (P=9, noisy) [kw-ru] | — |
| 10 | (Phase 3) «Онлайн-запись для клиники и салона: сайт, бот или сервис» | crm / сайт для стоматологии, салона [kw-ky-en-niche] | `/solutions/clinics` |

**«Сколько стоит сайт в Бишкеке» is deliberately not an article.** That query belongs to `/pricing`.

---

## 9. Implementation roadmap

**Recommended page implementation: option B now, then C-lite** [codebase-audit][feasibility].

**Option B**
- Services and about copy live in a typed `apps/web/src/content/services.ts`, shaped like a future CMS item:
  - `slug` and `published`;
  - per locale (`ru`, `en`): `title`, `h1`, `lead`, `forWhom`, `deliverables[]`, `faq[]`, `termLine`, `seoTitle`, `seoDescription`;
  - `relatedProjectSlugs`;
  - a hand-maintained `updatedAt`.
- Contact facts live in `content/business.ts`.
- `/works`, `/pricing` and `/contacts` render data the CMS already publishes.
- Prices come from the CMS pricing plans via `serviceSlug`. Mobile apps and the online store, which have no pricing card, keep their price in `services.ts`.
- Effort: **design 2–4 days, code 4–6 days, copy 5–8 days.** Copy is the critical path, so it starts on day 1.
- Trade-off: service copy changes need a deploy, which is a full build on the box.

**C-lite (Phase 3): 6–8 days**
- A `services` content type in the CMS, created by a **data migration**, as in `20260922150000_process_section`. It also patches any stored `ContentDraft.tree`. You can't re-seed: `seed-once` refuses a non-empty database.
- Plus the `SeoPage` enum for static pages (Prisma, `dto/enums.ts`, CRM options, a public SEO read), a CRM `PageKind 'service'` and `cms-contract.spec`.
- `phone` / `openingHours` move into `SiteSettings`, with zod `.default('')` and the API deployed first.

**Skip C-full** (a generic block builder, 10–15 days).

**Owner editing workflow** (write it into `docs/visual-editor.md`):
- Homepage and case SEO: edit in the CRM.
- New pages: edit `services.ts` → commit → `ssh` → `./deploy.sh`. Check that `hasDraft` is false before any publish.
- **Price-change checklist:** change the price in the CRM pricing plans (service and pricing pages and the schema follow automatically) → update the homepage meta description and `heroNote` by hand.

Effort key: S = ½ day or less, M = 1–2 days, L = 3 days or more.

### Phase 0a: Day 1, no deploy

| # | Task | Who | Effort | Impact | Depends on |
|---|---|---|---|---|---|
| 0.1 | Answer the §11 decisions, especially Q3 (in-person / GBP), Q4 (ИП) and Q5 (H1 option) | Owner | S | prerequisite | — |
| 0.2 | Search Console **Domain** property and Yandex Webmaster, both verified by DNS TXT on Cloudflare; Bing Webmaster import from Search Console | Owner | S | High | — |
| 0.3 | CRM edits: homepage title / description (no price in the title), the 3 case `seoTitle`s with « \| alcha.dev», `footerTagline` = identity sentence (`heroTitle` only if H1 option a) | Content (CRM) | S | High | 0.1 |
| 0.4 | `hello@alcha.dev`: Email Routing (MX), SPF, DMARC, a test, then switch | Owner | S | Med | — |
| 0.5 | AI Overview feedback; README rewrite | Owner | S | Med | — |
| 0.6 | Favicon / monogram artwork, **time-boxed to 1 day** (legible at 16 px, works on white) | Owner / design | S | Very high | 0.1 |
| 0.7 | **Start the copy**: 4 service pages, hub, pricing, about, contacts (RU first, then the short EN) | Content | L (runs into Phase 1) | Very high | 0.1 |

### Phase 0b: Days 2–3, one code release

Each deploy is a full on-box build, and npm throttling has broken builds before, so bundle everything into one release.

| # | Task | Who | Effort | Impact | Depends on |
|---|---|---|---|---|---|
| 0.8 | Icon set (`favicon.ico`, `icon.png`, `icon1.svg`, `apple-icon.png`, `manifest.ts`) + `public/brand/logo-512.png` (§5.1) | Code | S | **Very high** | 0.6 |
| 0.9 | `content/business.ts` (phone, hours, identity sentence, som rate); footer contact block with the visible phone and the «Alcha Dev · alcha.dev» lockup | Code | S | High | 0.1 (Q2) |
| 0.10 | Schema rewrite: `WebSite` alternateName; `ProfessionalService` logo / description / telephone / email / contactPoint; `minPrice` offers **without** service URLs; personal `sameAs` moved to Person; Instagram dropped | Code | S | High | 0.8, 0.9 |
| 0.11 | H1 option b: eyebrow `<span>` inside the `<h1>`, annotation moved off the `<h1>`, CSS, sr-only separator, **editor QA** | Code | S + QA | High | 0.1 (Q5) |
| 0.12 | `data-nosnippet` on the `HeroStack` root | Code | S | Med | — |
| 0.13 | Title template ` \| alcha.dev` in layout + `buildMetadata` suffix (same day as 0.3); `seo.test.ts` updated | Code | S | Med | 0.3 |
| 0.14 | Sitemap part a: RU and EN as their own `<url>` entries, ru/en/x-default, no priority/changefreq (`lastmod` comes in 1.10) | Code | S | Med | — |
| 0.15 | Language switch and EN hint as `<a>` | Code | S | Med | — |
| 0.16 | Technical: delete `Host:`; `X-Robots-Tag: noindex` on api.alcha.dev; `/ru` 308 via `next.config.ts` `redirects()`; noindex in draft mode; JetBrains Mono `preload:false` | Code | S | Low | — |
| 0.17 | `/privacy` page; GA4 + Metrika (build-time IDs) with click events for TG / WA / phone / email **plus `generate_lead` and a Metrika goal on contact-form success**; send `pathname + search` to `Lead.sourcePath` so UTMs survive (max 300 characters); hide the dead GA/Metrika fields in CRM Settings | Code + Owner (IDs) | S–M | Med | — |
| 0.18 | `deploy.sh` verify list: icons, manifest, logo, `/privacy` | Code | S | Low | 0.8 |
| 0.19 | After deploy: URL Inspection live test → Request indexing on `/` and `/en`; Yandex Переобход; submit sitemaps | Owner | S | Very high (favicon timing) | 0.2, 0.8–0.10 |
| 0.20 | Business accounts with the identical bio (§6.5) | Owner | M | High | 0.1, 0.6 |
| 0.21 | Start GBP («Alcha Dev», service-area business), **only if Q3 = yes**, with ИП documents and branded invoices / cards ready | Owner | M | **Very high** if eligible | 0.1 (Q3, Q4), 0.6 |

### Phase 1: architecture (weeks 2–5, one release once the copy is done)

| # | Task | Who | Effort | Impact | Depends on |
|---|---|---|---|---|---|
| 1.1 | Design: service template, hub, pricing, works index, about, contacts, «Услуги» dropdown (desktop + mobile), footer columns, breadcrumbs; checked at 320 / 390 / 1240 | Design | 2–4 days | High | — |
| 1.2 | `content/services.ts` with `published`, per-entry `updatedAt` and `relatedProjectSlugs` | Code | S | — | — |
| 1.3 | `PricingPlan.serviceSlug` (migration, defaulted; zod `.default`; API deployed first; CRM tree + drawer field; `fallback.ts`) | Code | S–M | High (one price source) | — |
| 1.4 | Routes RU + EN: `/services`, `/services/[slug]` (`dynamicParams=false`, `published` only), `/pricing`, `/works`, `/about`, `/contacts`; a `[...rest]` page with `dynamic = 'force-dynamic'` for a localized 404 | Code | M | **Very high** | 1.2 |
| 1.5 | Header (Услуги ▾, Работы, Цены, О студии, Контакты) and footer columns, server-rendered; `hiddenSections` policy documented | Code | S–M | High (sitelinks) | 1.1, 1.4 |
| 1.6 | Homepage: «Подробнее об услуге →» on pricing cards, the «Также» line, compact pricing **only with** `/pricing` live, case anchors as `{viewCaseLabel} «{title}»` with the title in its own annotated `<span>`; keep `id="works"` / `id="pricing"` | Code + Content | S–M | High | 1.3, 1.4 |
| 1.7 | Per-page JSON-LD (§5.4); `hasOfferCatalog` gets service URLs for `published` services; case breadcrumb → `/works` + a 3-level `BreadcrumbList` | Code | S | Med | 1.4 |
| 1.8 | CRM `PageKind`s `pricing` and `works` (`pages.ts` `pagePath`, TopBar options, `PAGE_TITLES`). The `standalone` prop drops only `hideable`, never the `cms` attributes | Code | S (½ day) | Med (owner can preview) | 1.4 |
| 1.9 | `/api/og` allow-list, locale, localized tagline, real dimensions | Code | S | Low–Med | 1.2 |
| 1.10 | Sitemap part b, `lastmod`: `updatedAt: z.string().optional()` on `projectSchema` (API exposes `Project.updatedAt`), `services.ts` dates, never `new Date()` | Code | M | Med | 1.2 |
| 1.11 | **Copy** finished: 4 services + hub + pricing + about + contacts, RU (600–900 words per service) + short EN (§8.1) | Content | **5–8 days** (started at 0.7) | **Very high** | 0.7 |
| 1.12 | Case pages: related-service and next-project links; expand the Chaban and Kit Store copy (138 / 134 words today); testimonials with permission | Code S + Content M | M | Med | — |
| 1.13 | Founder photo and real workspace photos | Owner | S | Med | — |
| 1.14 | Tests and deploy checks: `seo.test.ts` (suffix, alternates, sitemap entries); every new page in both locales added to the `deploy.sh` verify list; lab Core Web Vitals check on each new template | Code | S | Med | 1.4 |
| 1.15 | After release: Request indexing for key URLs, resubmit the sitemap; Yandex region request (risk, §7 #5); 2GIS once the ИП exists | Owner | S | Med–High | 1.4 |
| 1.16 | Ask **every** past client for a Google review once GBP is verified (if GBP) | Owner | M | **Very high** (with GBP) | 0.21 |

### Phase 2: content and listings (weeks 6–11)

| # | Task | Who | Effort | Impact | Depends on |
|---|---|---|---|---|---|
| 2.1 | **RU-only plumbing:** `alternateLinks: false` in `i18n/routing.ts`; an alternates override in `buildMetadata`; a per-page map of available locales for `LocaleSwitch` (fallback `/en`); `notFound()` on `/en/blog/*`. Today next-intl sends an hreflang `Link` header even on 404s [feasibility]. | Code | M (~1 day) | prerequisite | — |
| 2.2 | Blog structure (RU only; `/blog`, `/blog/[slug]`, BlogPosting, sitemap) | Code | M | Med | 2.1 |
| 2.3 | Articles 1–4 | Content | L | Med | 2.2 |
| 2.4 | `/services/online-store` RU + EN | Content M + Code S | M | Med | store price decision |
| 2.5 | workspace.ru, Lalafo, Clutch, TechBehemoths, GoodFirms, DevKG, 3 local catalogs | Owner | M | Low–Med | 0.20 |
| 2.6 | Chaban PR pitch | Owner | M | Med (entity) | 1.12 |
| 2.7 | Credit component + client agreements | Code S + Owner | S | Med | list of client sites |
| 2.8 | IndexNow ping on deploy (Yandex and Bing) | Code | S | Low | — |
| 2.9 | Monthly check from Bishkek in a fresh profile: brand queries, tracked queries, AI answers | Owner / Code | S | — | — |
| 2.10 | Optional: `alcha.kg` → 301 | Owner | S | Low | — |

### Phase 3: ongoing (month 3 and later)

| # | Task | Who | Effort | Impact |
|---|---|---|---|---|
| 3.1 | C-lite (above): services in the CMS via a data migration, `SeoPage` for static pages, `PageKind 'service'`, `phone` / `openingHours` in `SiteSettings`, nav labels as CMS chrome fields | Code | L (6–8 days) | Med (the owner can edit everything) |
| 3.2 | `/solutions/clinics`, `/solutions/tourism` (only with a case or demo) | Content L + Code S | L | Low–Med |
| 3.3 | `/ky` page: a native writer; a route outside `[locale]` with its own root layout, middleware exclusion and `ky` hreflang | Content M + Code L | L | Low |
| 3.4 | Articles 5–8; monthly vc.ru / Habr; DevKG talk | Content / Owner | ongoing | Low–Med |
| 3.5 | Re-check Wikidata (after ≥2 press pieces), the Kazakhstan market and the ЖК page question | Owner | S | — |

---

## 10. Measurement

**Setup**
- **Search Console Domain property.**
  - **Page indexing:** confirm every new URL is indexed.
  - **Performance:**
    - Page-level impressions and clicks per new URL; this is the main progress signal.
    - A **regex query filter on `alcha`** for the brand. The built-in branded filter needs a top-level property *and* "a sufficient volume of queries and impressions". It "isn't available for sites with a low number of impressions", so expect it to be missing for months (https://developers.google.com/search/blog/2025/11/search-console-branded-filter, https://support.google.com/webmasters/answer/17011259).
    - Pages per query, to watch the `/` vs `/pricing` swap.
  - **The generative AI report**, live for all sites since 2026-08-31 (https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports).
  - **URL Inspection** after each release.
- **Rare queries won't appear as rows.** Search Console leaves out anonymized, very-low-volume queries (https://support.google.com/webmasters/answer/96568). So **manual rank checks from Bishkek** in a fresh profile, done monthly, are part of the method.
- **Yandex Webmaster:** Поисковые запросы, Диагностика (favicon), Быстрые ссылки (these need menu sections and a top-5 position, https://yandex.ru/support/webmaster/ru/search-results/quick-links.html), Заголовки и описания, Региональность.
- **GBP Performance** (if GBP): searches, calls, website clicks.
- **GA4 + Metrika:** `generate_lead` (form) plus TG / WA / phone / email clicks. **CRM leads by `sourcePath`**, with UTMs, are the ground truth.

**Tracked queries** (manual checks; Search Console rows when they appear)
- **Brand:** alcha dev, alcha.dev, alcha dev бишкек.
- **Head:** создание сайтов бишкек, разработка сайтов бишкек, создание сайтов в бишкеке, разработка сайта бишкек, веб студия бишкек, заказать сайт бишкек.
- **Price:** создание сайтов бишкек цена, сколько стоит создать сайт в бишкеке.
- **Services:** сайт визитка бишкек, лендинг бишкек, сайт под ключ бишкек, crm система бишкек, crm бишкек, автоматизация бизнеса бишкек, разработка мобильных приложений бишкек, разработка приложения бишкек.
- That is 3 brand + 16 non-brand queries. «разработка сайтов кыргызстан» and «разработка crm на заказ» were dropped from tracking (§3.1).

**KPIs.** These are targets based on my judgment, not forecasts. The domain is 8 days old. Today «alcha.dev» is already #1 and already shows the site name «alcha.dev», so those are not progress targets [local-offpage][critic].

| Day | Targets |
|---|---|
| **30** | Search Console, Yandex and Bing verified, and sitemaps processed. Phase 0b live. The favicon fetched (check URL Inspection and Yandex Диагностика), and showing for «alcha.dev» if Google has recrawled. The snippet no longer quotes the mock-up. Copy drafts done. The GBP go/no-go decided; if go, submitted. `generate_lead` firing. AI Overview feedback sent. |
| **60** | All Phase 1 URLs indexed, each with page-level impressions above zero. Brand regex impressions trending up. «alcha dev» in the top 3 from a fresh Bishkek profile (#7 today). Yandex favicon shown. Reviews requested from every past client (if GBP). ≥5 directory profiles live. 2GIS live if the ИП exists. AI answer for «alcha dev» re-checked. |
| **90** | Sitelinks under the «alcha.dev» result (not guaranteed; UNVERIFIED timing). #1 for «alcha dev». Top 10 for ≥2 P1 service queries in manual checks (e.g. «сайт визитка бишкек», «crm система бишкек»). If GBP: in the map block for at least one of «веб студия / создание сайтов бишкек» (distance to the searcher is a documented factor, https://support.google.com/business/answer/7091), with reviews from ≥50% of past clients. ≥1 independent press mention. ≥1 lead attributed to organic search, GBP or a directory. The «alcha dev» AI answer no longer describes ЖК «Алча» or alcha.net (UNVERIFIED). Stretch: alcha.dev named in a Google AI answer for one head query. |

---

## 11. Decisions needed from the owner (recommended answer for each)

1. **Brand string?** «alcha.dev» on the site and in schema, with alternateName «Alcha Dev». «Alcha Dev» is also used visibly (footer lockup, cards, invoices) and as the GBP / 2GIS name. Never «Alcha», «Алча», «Alchdev» or «alchadev».
2. **Public phone?** One number shown as text on the site, GBP, 2GIS and in schema, stored in `content/business.ts`. A new business SIM is cleanest; otherwise +996 706 304 803, which is already public through the WhatsApp link.
3. **Do you meet clients in person** (at their office or a meeting place) during stated hours? **This gates GBP.**
   - Yes → service-area GBP with the address hidden.
   - No → no GBP; 2GIS, directories and press instead.
   - Either way the schema stays locality-only. Only list an office clients really visit; virtual offices are not eligible.
4. **ИП or patent in place?** It is needed for 2GIS (rule seen on the RU site; UNVERIFIED for KG), for GBP video proof, and for реквизиты on `/contacts`. Recommended: register now if you haven't.
5. **H1 change?**
   - **(b) recommended:** the eyebrow «Создание сайтов в Бишкеке» moves inside the `<h1>` and the slogan stays. Small code change plus editor QA.
   - (a) Content-only: rewrite `heroTitle` in the CRM to include «Создание сайтов в Бишкеке».
6. **GBP verification:** if Q3 is yes, can you record the ≥30 s video (street, workspace, the CMS admin on screen, an ИП document, a branded invoice)? Recommended: yes.
7. **Business email?** Yes: `hello@alcha.dev`, after MX, SPF and DMARC are set up and tested.
8. **Social accounts?** Create Telegram @alchadev, a LinkedIn Company Page, an Instagram business account and the GitHub org `alcha-dev`. Personal accounts stay on the Person node only.
9. **One price source?** Yes: add `serviceSlug` to the pricing plans (one migration), so service pages, `/pricing` and the schema read the CRM prices. SEO titles written in the CRM carry no prices; the homepage meta and `heroNote` go on a manual checklist.
10. **Which services do we sell?**
    - Mobile apps: yes, with a from-price (both cases are React Native).
    - Online store: yes in Phase 2, with a from-price instead of «оцениваю отдельно».
    - Telegram bots and SEO as separate services: no pages for now.
11. **Kyrgyz?** No locale, and no «кыргызская версия» claim until you can deliver one. Can you, and how: a static version quoted separately, or a third CMS locale? One `/ky` page in Phase 3, only with a native writer.
12. **Bring back `/about`?** You removed the personal About page on 2026-09-22. Recommended: yes, as a **studio and entity page** (who is behind alcha.dev, where the name comes from, the profiles). It is the main page for brand disambiguation.
13. **Homepage services links?** Recommended: no new «Услуги» grid. Instead, «Подробнее об услуге →» on each pricing card, plus one «Также: мобильные приложения · интернет-магазины» line, plus the header dropdown. «Процесс и услуги» stays as it is.
14. **English?** Mirror services, pricing, works, about and contacts, **shorter** than RU, in the same release. No EN blog or industry pages.
15. **Keep pricing on the homepage?** Yes. It becomes a compact block linking to `/pricing` only in the release where `/pricing` ships. `/pricing` is the primary page for price queries; the homepage ranking for them is acceptable.
16. **Currency?** Show «$300 (≈26 000 сом)» in the copy and keep $ in titles. You set the som rate in one constant and review it quarterly.
17. **Implementation?** Option B now (code-defined pages + `serviceSlug` + CRM preview for `/pricing` and `/works`). C-lite in Phase 3 (6–8 days).
18. **Founder photo, founding year, opening hours?** Yes: a real photo, foundingDate «2026», and hours on `/contacts` (and GBP if used).
19. **Analytics and privacy:** OK to publish `/privacy` and switch on GA4 + Metrika with a lead event? Recommended: yes, both in the days 2–3 release.
20. **Clients:** which client sites are public (for credit links), which clients can we ask for reviews and testimonials, and may we show their logos?
21. **Industry pages and Kazakhstan?** Clinics and tourism only after a case or demo exists. The ЖК / developer page stays on hold (brand collision). Kazakhstan not before month 6 (my call).

---

## Appendix: full keyword list

Consolidated from [kw-ru] (`kw-ru/top_candidates_stats.tsv`), [kw-ky-en-niche] (`signal_counts.tsv`), [local-offpage] and the draft.
- **Signal:** P = Kyrgyzstan prefixes surfacing the query (comparable only within a cluster); #k = best position; "seed #1" = top completion of the bare seed; "KZ/RU same" = the identical list appears under gl=kz / gl=ru, so it is not Kyrgyz-specific; "—" = no suggestions or not measured.
- **Priority:** P1 = build and track now; P2 = cover as a secondary phrase or article; P3 = only if offered, or later; ✕ = never target.

| Query (signal) | Cluster | Intent | Priority | Target URL |
|---|---|---|---|---|
| alcha.dev (—; site #1 today) | Brand | navigational | P1 | `/` |
| alcha dev (—; site #7 from Bishkek) | Brand | navigational | P1 | `/`, `/about` |
| alcha dev бишкек (—) | Brand | navigational | P1 | `/about` |
| создание сайтов бишкек (seed #1, P=21) | Head: sites + city | commercial | P1 | `/` |
| разработка сайтов бишкек (seed #1, P=23) | Head: sites + city | commercial | P1 | `/` |
| создание сайтов в бишкеке (P=20) | Head: sites + city | commercial | P1 | `/` |
| создание сайта бишкек (seed #1, P=17) | Head: sites + city | commercial | P1 | `/` |
| разработка сайта бишкек (seed #1, P=11) | Head: sites + city | commercial | P1 | `/` |
| разработка сайтов в бишкеке (P=14) | Head: sites + city | commercial | P1 | `/` |
| разработка веб сайтов бишкек (P=15) | Head: sites + city | commercial | P1 (secondary) | `/` |
| веб студия бишкек (P=18) | Studio | commercial | P1 | `/` |
| веб разработка бишкек (P=8) | Head: sites + city | commercial | P2 | `/` |
| разработчики сайта бишкек (P=7) | Head: sites + city | commercial | P2 | `/` |
| разработка веб сайта бишкек (P=5) | Head: sites + city | commercial | P2 | `/` |
| веб разработчик бишкек (P=8; mixed with jobs) | Head: sites + city | mixed | P3 | `/` |
| разработка сайтов кыргызстан (P=27, fallback lists only) | Head: country | commercial | P2 (body/meta only) | `/` |
| разработка сайта кыргызстан (P=6, fallback) | Head: country | commercial | P3 | `/` |
| разработка сайтов и мобильных приложений (P=4) | Head | commercial | P3 | `/` |
| заказать сайт бишкек (P=14) | Order | transactional | P1 | `/` |
| сделать сайт бишкек (P=13) | Order | transactional | P1 | `/` |
| создать сайт бишкек (#2, P=12) | Order | transactional | P1 (secondary) | `/` |
| заказать сайт в бишкеке (P=8) | Order | transactional | P1 (secondary) | `/` |
| создать сайт в бишкеке (#2, P=3) | Order | transactional | P2 | `/` |
| создание сайтов бишкек цена (#1 completion of «создание сайтов бишкек»; raw P=55 / 24 adjusted; KZ/RU lists too) | Price | transactional | P1 | `/pricing` (`/` acceptable) |
| сколько стоит создать сайт в бишкеке (#2, P=10) | Price | comparing | P1 | `/pricing` |
| сколько стоит создание сайта (P=10, suggested as «…сайты») | Price | comparing | P1 | `/pricing` |
| купить сайт бишкек (#2, P=8) | Price | transactional | P1 | `/pricing` |
| разработка сайтов бишкек цена (P=5; KZ/RU too) | Price | transactional | P1 (secondary) | `/pricing` |
| сколько стоит сайт под ключ (P=6; KZ/RU too) | Price | comparing | P2 | `/pricing` |
| сделать сайт под ключ цена (P=6) | Price | comparing | P2 | `/pricing` |
| сайт под ключ цена (P=3; KZ/RU too) | Price | comparing | P2 | `/pricing` |
| сколько стоит разработка сайта (P=1) | Price | comparing | P3 | `/pricing` |
| сайт визитка бишкек (P=17) | Landing | commercial | P1 | `/services/landing-page` |
| лендинг бишкек (P=11) | Landing | commercial | P1 | `/services/landing-page` |
| сколько стоит сайт визитка (P=3; KZ/RU too) | Landing | comparing | P2 | `/services/landing-page` |
| заказать лендинг / одностраничный сайт (—) | Landing | transactional | P2 (secondary) | `/services/landing-page` |
| сайт под ключ бишкек (P=19) | Company site | transactional | P1 | `/services/company-website` |
| заказать сайт для бизнеса цена (P=5) | Company site | transactional | P2 | `/services/company-website` |
| заказать корпоративный сайт под ключ (P=5) | Company site | transactional | P2 | `/services/company-website` |
| корпоративный сайт / многостраничный сайт (—) | Company site | commercial | P2 (secondary) | `/services/company-website` |
| редизайн сайта цена (#2, P=2) | Redesign | comparing | P3 | `/services/company-website` (section) |
| редизайн сайта стоимость (#3, P=1) | Redesign | comparing | P3 | `/services/company-website` (section) |
| поддержка сайта бишкек (—, empty) | Support | commercial | P3 | `/services/company-website` (section) |
| crm система бишкек (seed #2, P=13) | CRM | commercial | P1 | `/services/crm` |
| crm бишкек (P=12) | CRM | commercial | P1 | `/services/crm` |
| автоматизация бизнеса бишкек (seed #1, P=7; KZ/RU too) | CRM | commercial | P1 | `/services/crm` |
| crm кыргызстан (P=12) | CRM | commercial | P2 | `/services/crm` |
| crm bishkek (#2, P=11) | CRM | commercial | P2 | `/services/crm` |
| crm kg (#3, P=8) | CRM | commercial | P3 | `/services/crm` |
| разработка crm на заказ (P=14; KZ/RU same) | CRM | commercial | P2 | `/services/crm` |
| crm разработка (P=13; KZ/RU same) | CRM | commercial | P2 | `/services/crm` |
| разработка crm-системы (#2, P=10) | CRM | commercial | P2 | `/services/crm` |
| разработка crm системы цена (P=5; KZ/RU too) | CRM | comparing | P2 | `/services/crm` |
| разработка crm под ключ (P=5; KZ/RU too) | CRM | commercial | P2 | `/services/crm` |
| сколько стоит разработка crm (#6, P=3) | CRM | comparing | P3 | `/services/crm` |
| автоматизация бишкек (P=6) | CRM | commercial | P2 | `/services/crm` |
| автоматизация магазина бишкек (#2, P=6) | CRM | commercial | P2 | `/services/crm` |
| автоматизация торговли бишкек (#3, P=6) | CRM | commercial | P2 | `/services/crm` |
| амо срм бишкек (P=3) | CRM comparison | comparing | P2 | Article 1 → `/services/crm` |
| внедрение срм бишкек (#4, P=2) | CRM comparison | commercial | P2 | Article 1 → `/services/crm` |
| срм система бишкек (#4, P=2) | CRM | commercial | P3 | `/services/crm` |
| разработка мобильных приложений бишкек (P=17) | Mobile apps | commercial | P1 | `/services/mobile-apps` |
| разработка приложения бишкек (P=16) | Mobile apps | commercial | P1 | `/services/mobile-apps` |
| создание приложений бишкек (P=6) | Mobile apps | commercial | P2 | `/services/mobile-apps` |
| мобильная разработка бишкек (#2, P=5) | Mobile apps | commercial | P2 | `/services/mobile-apps` |
| создать приложение бишкек (#2, P=5) | Mobile apps | commercial | P2 | `/services/mobile-apps` |
| разработка приложений бишкек (P=4) | Mobile apps | commercial | P2 | `/services/mobile-apps` |
| разработка мобильного приложения бишкек (#3, P=1) | Mobile apps | commercial | P3 | `/services/mobile-apps` |
| сколько стоит сделать мобильное приложение (#2, P=1) | Mobile apps | comparing | P3 | `/services/mobile-apps` |
| мобильное приложение для фермеров (P=1) | Mobile apps (case) | info / commercial | P3 | `/works/chaban` |
| сколько стоит сайт с личным кабинетом (#3, P=3) | Web apps | comparing | P2 | Article 5 → `/services/mobile-apps` |
| сайт с личным кабинетом (not surfaced) | Web apps | commercial | P3 | `/services/mobile-apps` (section) |
| создание интернет магазина бишкек (—, empty in suggest) | Online store | commercial | P2 | `/services/online-store` |
| заказать интернет магазин под ключ цена (P=3) | Online store | transactional | P2 | `/services/online-store` |
| сколько стоит интернет магазин под ключ (P=1) | Online store | comparing | P3 | `/services/online-store` |
| b2b бишкек (#2, P=2) | Online store / B2B | commercial | P2 | `/services/online-store` |
| оптовый интернет магазин (~10; KZ/RU same) | Online store / B2B | commercial | P3 | `/services/online-store` |
| b2b платформа (~10; KZ/RU same) | Online store / B2B | commercial | P3 | `/services/online-store` |
| интернет эквайринг в кыргызстане (#5, P=2; KG only) | Payments | info | P2 | Article 3 → `/services/online-store` |
| эквайринг кыргызстан / эквайринг бишкек (P=1 each) | Payments | info | P3 | Article 3 |
| заказать сайт на тильде цена (P=8; KZ/RU too) | Tilda | comparing | P2 | Article 2 |
| сайт на тильде цена (P=7; KZ/RU too) | Tilda | comparing | P2 | Article 2 |
| tilda kg (P=5; likely navigational) | Tilda | navigational | P3 | — |
| веб студии бишкек (P=11) | Studio list | comparing | P2 | Article 6 + directories |
| web студии в бишкеке (P=10) | Studio list | comparing | P2 | Article 6 + directories |
| айти компании в кыргызстане (P=10) | IT company list | comparing | P2 | Article 6 + directories |
| айти компании кыргызстана (#2, P=10) | IT company list | comparing | P2 | Article 6 + directories |
| it компании в кыргызстане (P=7) | IT company list | comparing | P2 | Article 6 + directories |
| айти компания бишкек (P=7) | IT company list | comparing | P2 | `/` + directories |
| it компания бишкек (P=4) | IT company list | comparing | P3 | `/` + directories |
| топ it компании в кыргызстане (P=1) | IT company list | comparing | P3 | Article 6 |
| диджитал агентство бишкек (#2, P=5) | Agency | commercial | P3 | `/` |
| digital агентство бишкек (P=4) | Agency | commercial | P3 | `/` |
| веб студия полного цикла (P=3) | Studio | commercial | P3 | `/` |
| телеграм бот бишкек (P=9, noisy) | Telegram bot | commercial | P3 (if offered) | Article 9 |
| чат бот бишкек (#2, P=8) | Telegram bot | commercial | P3 (if offered) | Article 9 |
| разработка телеграм бота цена (P=3) | Telegram bot | comparing | P3 (if offered) | Article 9 |
| seo продвижение бишкек (P=9) | SEO service | commercial | P3 | none («SEO-настройка включена» on service pages) |
| seo оптимизация бишкек (#2, P=8) | SEO service | commercial | P3 | none |
| seo бишкек (P=6) / сео продвижение бишкек (P=4) | SEO service | commercial | P3 | none |
| сайт или инстаграм (local «… инстаграм» suggestions; count UNVERIFIED) | Info | info | P2 | Article 4 → `/services/landing-page` |
| лендинг или сайт-визитка (demand UNVERIFIED) | Info | info | P3 | Article 8 → `/services` |
| сайт на кыргызском / мультиязычный сайт (—) | Info | info | P3 (if offered) | Article 7 |
| сайт для стоматологии / crm для стоматологии (~10; KZ/RU same) | Industries | commercial | P3 | `/solutions/clinics` |
| сайт для отеля / сайт для туроператора (~10; KZ/RU same) | Industries | commercial | P3 | `/solutions/tourism` |
| сайт жасоо (suggests only itself) | Kyrgyz | commercial | P3 | `/ky` (Phase 3) |
| сайт түзүү (suggests only itself) | Kyrgyz | commercial | P3 | `/ky` (Phase 3) |
| сайт керек (suggests only itself) [kw-ky-en-niche] | Kyrgyz | commercial | P3 | `/ky` (Phase 3) |
| сайт жасап берүү / сайт канча турат / сайт заказ кылуу (all empty) | Kyrgyz | — | ✕ (no demand) | — |
| website development bishkek (—; real EN competitor pages on Google) | English | commercial | P3 | `/en` |
| web development kyrgyzstan (—) | English | commercial | P3 | `/en` |
| crm development bishkek / mobile app development bishkek (—) | English | commercial | P3 | `/en/services/*` |
| вакансии / зарплата / стажировка / программист бишкек | Junk: jobs | — | ✕ | — |
| обучение / курсы / колледж | Junk: education | — | ✕ | — |
| создать сайт бесплатно / как создать сайт / wix / google sites / сайт ачуу жолдору | Junk: DIY | — | ✕ | — |
| лендинг это / crm это / … деген эмне | Junk: definitions | — | ✕ | — |
| шаблон / примеры / amocrm вход | Junk: templates, logins | — | ✕ | — |
| интернет магазин бишкек (одежда, телефоны) | Junk: shoppers | — | ✕ | — |
| вебкам студии / визитка кг / заказать визитки / корпоративные подарки / кракен бот | Junk: traps | — | ✕ | — |

---

Raw research data was gathered in a session scratchpad (`kw-ru/`, `kw-ky-en-niche/`, `competitors/`, `serp-appearance/`, `local-offpage/`, `tech-audit/`, `critic/`). The keyword TSVs and the Bishkek SERP evidence log are kept in `docs/seo-research/`. No repo code was changed.
