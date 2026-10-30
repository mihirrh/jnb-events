import type { Settings } from './content';
import { toInternational } from './contact';

/**
 * JSON-LD builders. Only facts supplied by the owner are included - no ratings, review counts,
 * founding dates, awards or price ranges are invented.
 */

const AREA_TYPES: Record<string, string> = {
  'United Kingdom': 'Country',
  UK: 'Country',
  Leicestershire: 'AdministrativeArea',
  Leicester: 'City',
};

function areaServed(settings: Settings) {
  return settings.serviceAreas.map((name) => ({ '@type': AREA_TYPES[name] ?? 'Place', name }));
}

export function localBusiness(settings: Settings, siteUrl: string, imageUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}#business`,
    name: settings.siteName,
    description: settings.description,
    url: siteUrl,
    telephone: `+${toInternational(settings.contact.whatsappNumber)}`,
    ...(settings.contact.email ? { email: settings.contact.email } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: settings.location.locality,
      addressRegion: settings.location.region,
      addressCountry: settings.location.country,
    },
    areaServed: areaServed(settings),
    knowsAbout: ['Wedding décor', 'Mandaps', 'Civil ceremony décor', 'Wedding DJ', 'Event lighting', 'Special effects'],
    ...(settings.social.length ? { sameAs: settings.social.map((s) => s.url) } : {}),
  };
}

export function website(settings: Settings, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}#website`,
    url: siteUrl,
    name: settings.siteName,
    inLanguage: 'en-GB',
    publisher: { '@id': `${siteUrl}#business` },
  };
}

export function service(opts: {
  settings: Settings;
  siteUrl: string;
  name: string;
  description: string;
  url: string;
  image?: string;
}) {
  const { settings, siteUrl, name, description, url, image } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url,
    ...(image ? { image } : {}),
    serviceType: name,
    provider: { '@id': `${siteUrl}#business` },
    areaServed: areaServed(settings),
  };
}

export function breadcrumbs(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

export function imageGallery(opts: { name: string; description: string; url: string; images: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    image: opts.images,
  };
}

export function serviceList(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: it.url })),
  };
}
