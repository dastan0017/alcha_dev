import type { HomeResponse, Locale, PricingPlan, Project, SiteSettings } from '@alcha/shared';
import { env, SITE_ALTERNATE_NAMES, SITE_NAME } from '@/lib/env';

function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

/** Root URL with its slash, the form Google lists for site names and the sitemap uses. */
const ROOT_URL = `${env.siteUrl}/`;
const BUSINESS_ID = `${env.siteUrl}/#business`;
const PERSON_ID = `${env.siteUrl}/#person`;
const WEBSITE_ID = `${env.siteUrl}/#website`;
/** A stable file (not `app/icon.png`, whose URL carries a content hash). */
const LOGO_URL = `${env.siteUrl}/brand/logo-512.png`;

/**
 * The founder's own profiles. They describe the person, not the studio — on the
 * business node they told search engines «alcha.dev» is a personal account, and a
 * personal Instagram is no evidence for either.
 */
function personSameAs(settings: SiteSettings): string[] {
  return [settings.github, settings.linkedin, settings.telegram].filter(Boolean);
}

/** «от $1 500» / «from $1,500» → 1500. */
function minPrice(label: string): number | undefined {
  const match = label.match(/\d[\d\s,.]*/);
  if (!match) return undefined;
  const value = Number(match[0].replace(/[\s,.]/g, ''));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function homeUrl(locale: Locale): string {
  return locale === 'ru' ? ROOT_URL : `${env.siteUrl}/en`;
}

function offerCatalog(plans: PricingPlan[], locale: Locale) {
  return {
    '@type': 'OfferCatalog',
    name: locale === 'ru' ? 'Услуги' : 'Services',
    itemListElement: plans.map((plan) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: plan.name, description: plan.description },
      // «от $300» is a floor, not a price: minPrice says exactly that.
      priceSpecification: {
        '@type': 'PriceSpecification',
        minPrice: minPrice(plan.priceLabel),
        priceCurrency: 'USD',
      },
    })),
  };
}

function businessNode(settings: SiteSettings, locale: Locale, description: string) {
  const phone = settings.phone || undefined;
  return {
    '@type': 'ProfessionalService',
    '@id': BUSINESS_ID,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAMES,
    url: ROOT_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
    image: LOGO_URL,
    description: description || undefined,
    telephone: phone,
    email: settings.email || undefined,
    priceRange: settings.priceRange || undefined,
    areaServed: [
      { '@type': 'City', name: locale === 'ru' ? 'Бишкек' : 'Bishkek' },
      { '@type': 'Country', name: locale === 'ru' ? 'Кыргызстан' : 'Kyrgyzstan' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: settings.addressLocality,
      addressRegion: settings.addressRegion || undefined,
      addressCountry: settings.addressCountry,
    },
    contactPoint: phone && {
      '@type': 'ContactPoint',
      telephone: phone,
      email: settings.email || undefined,
      contactType: 'sales',
      areaServed: 'KG',
      availableLanguage: ['ru', 'en'],
    },
    founder: { '@id': PERSON_ID },
  };
}

function personNode(settings: SiteSettings) {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Dastan Rakhmanzhanov',
    alternateName: 'Дастан Рахманжанов',
    jobTitle: 'Senior Frontend Engineer',
    worksFor: { '@id': BUSINESS_ID },
    knowsAbout: ['React', 'TypeScript', 'Next.js', 'Node.js', 'NestJS', 'GraphQL'],
    sameAs: personSameAs(settings),
  };
}

export function HomeJsonLd({
  home,
  description,
  locale,
}: {
  home: HomeResponse;
  /** One sentence on who the business is (the footer tagline, edited in the CMS). */
  description: string;
  locale: Locale;
}) {
  const { settings, pricingPlans, hiddenSections } = home;

  // The offers of a hidden «Цены» section are left out (undefined keys drop out of the JSON).
  const business = {
    ...businessNode(settings, locale, description),
    hasOfferCatalog:
      hiddenSections.includes('pricing') || pricingPlans.length === 0
        ? undefined
        : offerCatalog(pricingPlans, locale),
  };

  // Site name: Google reads `name`, then `alternateName`, from the home page only.
  const website = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: ROOT_URL,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAMES,
    inLanguage: locale,
    publisher: { '@id': BUSINESS_ID },
  };

  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@graph': [website, business, personNode(settings)],
      }}
    />
  );
}

export function WorkJsonLd({
  project,
  settings,
  locale,
}: {
  project: Project;
  settings: SiteSettings;
  locale: Locale;
}) {
  const url = `${env.siteUrl}${locale === 'ru' ? '' : '/en'}/works/${project.slug}`;
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: homeUrl(locale) },
      { '@type': 'ListItem', position: 2, name: project.title, item: url },
    ],
  };
  const creativeWork = {
    '@type': 'CreativeWork',
    name: project.title,
    headline: project.title,
    description: project.metaLine,
    url,
    image: project.coverImage || undefined,
    keywords: project.techChips.join(', '),
    creator: { '@id': BUSINESS_ID },
    author: { '@id': PERSON_ID },
    inLanguage: locale,
  };
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@graph': [breadcrumb, creativeWork, personNode(settings)],
      }}
    />
  );
}
