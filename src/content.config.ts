import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { PROJECT_CATEGORIES } from './lib/categories';

/**
 * Content model. Every collection here is editable in Pages CMS (see `.pages.yml`).
 * Image fields are written by the CMS as `/src/assets/media/...` paths; Astro's
 * `image()` resolves them so every photo is optimised at build time.
 */

const seo = z.object({
  title: z.string().max(70),
  description: z.string().max(170),
});

/** An image plus its descriptive alt text. Alt text is required for accessibility and SEO. */
const picture = (image: () => z.ZodTypeAny) =>
  z.object({ image: image(), alt: z.string().min(3) });

const cta = z.object({
  label: z.string(),
  message: z.string().optional(),
});

/* ---------------------------------- Global settings --------------------------------- */
const settings = defineCollection({
  loader: glob({ pattern: 'site.yaml', base: './src/content/settings' }),
  schema: ({ image }) =>
    z.object({
      siteName: z.string(),
      tagline: z.string(),
      description: z.string(),
      logo: image().optional(),
      logoAlt: z.string().optional(),
      contact: z.object({
        /** Shown to visitors exactly as typed, e.g. "07872 340258". */
        whatsappNumber: z.string(),
        /** Pre-filled text for WhatsApp chats opened from the site. */
        whatsappMessage: z.string(),
        /** Leave blank until the owner supplies an address. */
        email: z.string().optional().default(''),
        /** Optional form-handling URL (Formspree, Web3Forms, etc). Blank = enquiries open in WhatsApp/email. */
        formEndpoint: z.string().optional().default(''),
      }),
      location: z.object({
        locality: z.string(),
        region: z.string(),
        country: z.string(),
      }),
      serviceAreas: z.array(z.string()).min(1),
      serviceAreaNote: z.string(),
      social: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    }),
});

/* ------------------------------------- Home page ------------------------------------ */
const home = defineCollection({
  loader: glob({ pattern: 'home.yaml', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      seo,
      hero: z.object({
        eyebrow: z.string(),
        headline: z.string(),
        subheading: z.string(),
        image: image(),
        imageAlt: z.string().min(3),
        primaryCta: cta,
        secondaryCtaLabel: z.string(),
      }),
      intro: z.object({
        eyebrow: z.string(),
        heading: z.string(),
        body: z.string(),
        image: image(),
        imageAlt: z.string().min(3),
        secondImage: image(),
        secondImageAlt: z.string().min(3),
        linkLabel: z.string(),
      }),
      services: z.object({
        eyebrow: z.string(),
        heading: z.string(),
        intro: z.string(),
        ctaHeading: z.string(),
        ctaText: z.string(),
        ctaMessage: z.string().optional(),
      }),
      featured: z.object({
        eyebrow: z.string(),
        heading: z.string(),
        intro: z.string(),
        linkLabel: z.string(),
      }),
      testimonials: z.object({
        eyebrow: z.string(),
        heading: z.string(),
      }),
      cta: z.object({
        eyebrow: z.string(),
        heading: z.string(),
        text: z.string(),
        image: image(),
        imageAlt: z.string().min(3),
        label: z.string(),
        message: z.string().optional(),
      }),
    }),
});

/* ------------------------------------- About page ----------------------------------- */
const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      seo,
      eyebrow: z.string(),
      heading: z.string(),
      lead: z.string(),
      image: image(),
      imageAlt: z.string().min(3),
      secondImage: image(),
      secondImageAlt: z.string().min(3),
      highlightsHeading: z.string(),
      highlights: z.array(z.object({ title: z.string(), text: z.string() })).min(1),
      ctaHeading: z.string(),
      ctaText: z.string(),
    }),
});

/* ------------------------------------ Contact page ---------------------------------- */
const contact = defineCollection({
  loader: glob({ pattern: 'contact.md', base: './src/content/pages' }),
  schema: z.object({
    seo,
    eyebrow: z.string(),
    heading: z.string(),
    lead: z.string(),
    whatsappHeading: z.string(),
    whatsappText: z.string(),
    areaHeading: z.string(),
    areaText: z.string(),
    formHeading: z.string(),
    formText: z.string(),
  }),
});

/* ------------------------- Simple pages: services, gallery, privacy ------------------ */
const pages = defineCollection({
  loader: glob({ pattern: '{services,gallery,privacy}.md', base: './src/content/pages' }),
  schema: z.object({
    seo,
    eyebrow: z.string().optional(),
    heading: z.string(),
    lead: z.string().optional(),
  }),
});

/* ------------------------------------- Services ------------------------------------- */
const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Lower numbers appear first. */
      order: z.number().int(),
      /** One-line summary used on cards and in meta descriptions. */
      summary: z.string().max(220),
      /** Larger intro paragraph on the service page. */
      lead: z.string(),
      image: image(),
      imageAlt: z.string().min(3),
      secondImage: image().optional(),
      secondImageAlt: z.string().optional(),
      keyPoints: z.array(z.string()).min(1),
      /** Shows projects from this gallery category on the service page. */
      relatedCategory: z.enum(PROJECT_CATEGORIES).optional(),
      /** Pre-filled WhatsApp message for this service. */
      whatsappMessage: z.string().optional(),
      seo,
    }),
});

/* -------------------------------- Portfolio / gallery -------------------------------- */
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.enum(PROJECT_CATEGORIES),
      summary: z.string().max(220),
      /** Optional venue/area, e.g. "Leicestershire". Only add what is true. */
      location: z.string().optional(),
      /** Used for ordering (newest first). */
      date: z.coerce.date(),
      /** Featured projects appear on the homepage. */
      featured: z.boolean().default(false),
      /** First image is the cover. */
      images: z.array(picture(image)).min(1),
      seoDescription: z.string().max(170).optional(),
    }),
});

/* ------------------------------------ Testimonials ----------------------------------- */
const testimonials = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/testimonials' }),
  schema: z.object({
    quote: z.string(),
    name: z.string(),
    /** e.g. "Wedding" or "Corporate event". */
    event: z.string().optional(),
    order: z.number().int().default(100),
    /** Only published testimonials are shown. The section hides itself if none are published. */
    published: z.boolean().default(false),
  }),
});

export const collections = { settings, home, about, contact, pages, services, projects, testimonials };
