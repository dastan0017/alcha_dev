# Evidence log: local / off-page / brand entity (2026-10-01)

Raw SERP dumps: ./serp/*.html (rendered with headless Chrome from the owner's Mac, so a Bishkek IP; hl=ru, gl=kg; fresh profile with no history).
Text extractors: ./clean.py, ./summ.py. Autocomplete: ./sugg.py, brand_suggest*.json.

## SERP snapshots
| query | local pack (top 3) | alcha.dev on p1 | other notable |
|---|---|---|---|
| веб студия бишкек | IDEA KG 4.8 (57); «Разработка сайтов в Бишкеке» 5.0 (2), address hidden; Weltkind 4.2 (18) | no | workspace.ru/bishkek/web-studios, ratingruneta.ru, FB page of Sait.kg |
| создание сайтов бишкек | IDEA KG; «Разработка сайтов в Бишкеке» 5.0 (2); Daniyaroffs 4.4 (21) | no | |
| разработка сайтов бишкек | IDEA KG; «Разработка сайтов в Бишкеке»; Aunimeda 5.0 (7) | no | lalafo category page |
| создание сайта кыргызстан | same as создание сайтов бишкек | no | lalafo category page |
| разработка crm бишкек | CRM Technologies 4.6 (9); ОсОО CRM Technologies 5.0 (3); ITive 5.0 (1) | no | 2gis.kg firm page |
| заказать сайт бишкек | none | no | lalafo category page |
| website development bishkek (hl=en) | none | no | |
| alcha dev | none | #7 | AIO: "Alcha" = alcha.net (Azerbaijani "Alça Digital Services Agency", since 2012). Organic: elitka ЖК Алча, ingroup IG, 2GIS «Алча» grocery, osoo.kg «Алча…», statsnet «АЛЧА КОНСАЛТИНГ», alcha.net, alcha.dev, FB ЖК, Booking Alcha Hotel Karakol |
| alcha dev бишкек | none | #2 | AIO: ЖК «Алча» by IN GROUP DEVELOPMENT ("dev" read as Development) |
| alcha.dev | none | #1 | AIO correct (prices, process) but exposes the gmail address |
| alcha | Alcha restaurant (Almaty) 4.6 (37); Ала-арча; Алча hypermarket | no | AIO: ТЦ «Алча» (Орто-Сай), ЖК «Алча»; alcha.vercel.app = ALCHA clothing brand |
| site:alcha.dev | | 8 URLs indexed | all 4 RU + 4 EN pages |
| "alcha.dev" -site:alcha.dev | | | ~2 irrelevant results; zero third-party mentions |

## Autocomplete (Google gl=kg)
- "alcha" → alchabar, alcha hotel karakol, alcha меню, alcha алматы, alcha блогер, alchademy
- "alcha dev", "alcha.dev" → no suggestions (no demand signal for the brand yet)
- "alchdev" → "alchdev business"
- "алча бишкек" → тц алча бишкек, жк алча бишкек, алча жилой комплекс бишкек
- "алча" (Kyrgyz word for cherry; "алча орусча" and "алча на русском" are among the suggestions)

## Live site (curl https://alcha.dev/)
- JSON-LD: ["ProfessionalService","LocalBusiness"] name "alcha.dev". It has no logo, alternateName or telephone, and its email is the Gmail address. The business sameAs lists the personal GitHub, LinkedIn, Telegram and Instagram (dastich_fantastich_r), the same list the Person node uses. WebSite name is "alcha.dev" and has no alternateName.
- og:site_name "alcha.dev"; /favicon.ico 404; /about 404; the case pages link to no live client site.

## Handles
- t.me/alchadev looks free (generic "Contact" page with no title). t.me/alcha is taken.
- github.com/alcha-dev and github.com/alchadev return 404 (free). github.com/alcha is taken.

## Platforms
- 2GIS Bishkek, «веб-студия» search: 74 places, rubric «Разработка и продвижение сайтов». Outbound links go through redirect.2gis.com.
- DevKG org profile: the company website link carries rel="nofollow". t.me/devkg has 9,284 subscribers.
- Habr article links carry nofollow. vc.ru in-body links go through an api.vc.ru/v2.8/redirect.
- Clutch profile link is nofollow (help.clutch.co). 35 KG web developers are listed, mostly with $5k+ minimums.
- Kaktus price list: «Новости компаний» + IG + FB is 30,000 сом; the editorial-block piece is 70,000 сом. The site claims 1.318M visitors a month.
- htp.kg: no public resident directory in the sitemap, and resident logos are not linked. The regime is export-oriented (80% export within 1 year per tolt.kg), with a 1% deduction.
- Statcounter KG, Sep 2026: Google 83.41%, Yandex 14.68%.
