import type { HomeResponse, Locale, Project, SiteSettings } from '@alcha/shared';
import { env, SITE_NAME } from '@/lib/env';

function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function sameAs(settings: SiteSettings): string[] {
  return [settings.github, settings.linkedin, settings.telegram, settings.instagram].filter(Boolean);
}

function extractPrice(label: string): string | undefined {
  const match = label.match(/([\d][\d\s,]*)/);
  return match ? match[1].replace(/[\s,]/g, '') : undefined;
}

function homeUrl(locale: Locale): string {
  return `${env.siteUrl}${locale === 'ru' ? '' : '/en'}`;
}

function businessNode(settings: SiteSettings) {
  return {
    '@type': ['ProfessionalService', 'LocalBusiness'],
    '@id': `${env.siteUrl}/#business`,
    name: SITE_NAME,
    url: env.siteUrl,
    priceRange: settings.priceRange,
    email: settings.email || undefined,
    areaServed: [
      { '@type': 'City', name: 'Bishkek' },
      { '@type': 'Country', name: 'Kyrgyzstan' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: settings.addressLocality,
      addressRegion: settings.addressRegion,
      addressCountry: settings.addressCountry,
    },
    sameAs: sameAs(settings),
    founder: { '@id': `${env.siteUrl}/#person` },
  };
}

function personNode(settings: SiteSettings, locale: Locale) {
  return {
    '@type': 'Person',
    '@id': `${env.siteUrl}/#person`,
    name: 'Dastan Rakhmanzhanov',
    jobTitle: 'Senior Frontend Engineer',
    url: homeUrl(locale),
    worksFor: { '@id': `${env.siteUrl}/#business` },
    knowsAbout: ['React', 'TypeScript', 'Next.js', 'Node.js', 'NestJS', 'GraphQL'],
    sameAs: sameAs(settings),
    address: {
      '@type': 'PostalAddress',
      addressLocality: settings.addressLocality,
      addressCountry: settings.addressCountry,
    },
  };
}

export function HomeJsonLd({ home, locale }: { home: HomeResponse; locale: Locale }) {
  const { settings, pricingPlans, hiddenSections } = home;

  // Offers of a hidden section are left out (undefined keys drop out of the JSON).
  const business = {
    ...businessNode(settings),
    makesOffer: hiddenSections.includes('pricing')
      ? undefined
      : pricingPlans.map((plan) => ({
          '@type': 'Offer',
          name: plan.name,
          description: plan.description,
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'PriceSpecification',
            priceCurrency: 'USD',
            price: extractPrice(plan.priceLabel),
          },
        })),
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${env.siteUrl}/#website`,
    url: env.siteUrl,
    name: SITE_NAME,
    inLanguage: ['ru', 'en'],
    publisher: { '@id': `${env.siteUrl}/#business` },
  };

  return (
    <JsonLdScript
      data={{ '@context': 'https://schema.org', '@graph': [business, personNode(settings, locale), website] }}
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
  const base = `${env.siteUrl}${locale === 'ru' ? '' : '/en'}`;
  const url = `${base}/works/${project.slug}`;
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: env.siteUrl },
      { '@type': 'ListItem', position: 2, name: project.title, item: url },
    ],
  };
  const creativeWork = {
    '@type': 'CreativeWork',
    name: project.title,
    headline: project.title,
    description: project.metaLine,
    url,
    keywords: project.techChips.join(', '),
    author: { '@id': `${env.siteUrl}/#person` },
    inLanguage: locale,
  };
  return (
    <JsonLdScript
      data={{ '@context': 'https://schema.org', '@graph': [breadcrumb, creativeWork, personNode(settings, locale)] }}
    />
  );
}
