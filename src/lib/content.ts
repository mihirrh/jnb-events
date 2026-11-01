import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { PROJECT_CATEGORIES, type ProjectCategory } from './categories';

export type Settings = CollectionEntry<'settings'>['data'];

export async function getSettings(): Promise<Settings> {
  const entry = await getEntry('settings', 'site');
  if (!entry) throw new Error('Missing src/content/settings/site.yaml');
  return entry.data;
}

/** Turns "Mandaps & Stages" into "mandaps-and-stages". */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getServices() {
  const all = await getCollection('services');
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getProjects() {
  const all = await getCollection('projects');
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Categories that currently contain at least one project, in the canonical order. */
export function categoriesInUse(projects: CollectionEntry<'projects'>[]): ProjectCategory[] {
  return PROJECT_CATEGORIES.filter((c) => projects.some((p) => p.data.category === c));
}

export async function getPublishedTestimonials() {
  const all = await getCollection('testimonials');
  return all.filter((t) => t.data.published).sort((a, b) => a.data.order - b.data.order);
}

async function must<C extends 'home' | 'about' | 'contact' | 'pages' | 'quote'>(collection: C, id: string) {
  const entry = await getEntry(collection, id);
  if (!entry) throw new Error(`Missing content entry: src/content/pages/${id}`);
  return entry;
}

export const getHome = async () => (await must('home', 'home')).data;
export const getAbout = async () => (await must('about', 'about')).data;
export const getQuote = async () => (await must('quote', 'quote')).data;
export const getContact = async () => (await must('contact', 'contact')).data;
/** Simple pages: 'services' | 'gallery' | 'privacy'. */
export const getSimplePage = async (id: 'services' | 'gallery' | 'privacy') => must('pages', id);
