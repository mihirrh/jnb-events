import type { Settings } from './content';

/** "07872 340258" -> "447872340258" (international format without "+", as wa.me expects). */
export function toInternational(number: string, defaultCountryCode = '44'): string {
  const digits = number.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return defaultCountryCode + digits.slice(1);
  return digits;
}

export function whatsappUrl(settings: Settings, message?: string): string {
  const text = message?.trim() || settings.contact.whatsappMessage;
  return `https://wa.me/${toInternational(settings.contact.whatsappNumber)}?text=${encodeURIComponent(text)}`;
}

export function telUrl(settings: Settings): string {
  return `tel:+${toInternational(settings.contact.whatsappNumber)}`;
}

/** Absolute URL helper that always ends with a slash for page paths. */
export function absoluteUrl(path: string, site: URL | string): string {
  return new URL(path, site).toString();
}
