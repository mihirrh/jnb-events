/**
 * Headings in the CMS may wrap a word or phrase in *asterisks* to set it in italic.
 * `emphasis()` escapes everything first, so only <em> can ever be produced; `plain()` strips the markers
 * for places that need raw text (aria-labels, alt text, structured data).
 */
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const emphasis = (s: string): string => escapeHtml(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

export const plain = (s: string): string => s.replace(/\*/g, '');
