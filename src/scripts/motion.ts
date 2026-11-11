/**
 * ==============================================================================
 * JNB Events - Luxury Motion.dev Creative Engine
 * ==============================================================================
 * Powered by Motion.dev (`motion` package)
 * High-performance, GPU-accelerated motion choreography tailored for luxury
 * Indian wedding decor, architectural mandaps, and bespoke event production.
 * ==============================================================================
 */

import { animate, inView, scroll, stagger } from 'motion';

// Check for reduced motion preferences
const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Initializes all Motion.dev interactions across the site.
 */
export function initLuxuryMotion(): void {
  if (typeof window === 'undefined') return;

  if (prefersReducedMotion()) {
    // If reduced motion is requested, immediately make all reveal elements visible
    document.querySelectorAll('.reveal, .reveal-img, .hero-in, [data-motion-reveal]').forEach((el) => {
      el.classList.add('is-visible');
      if (el instanceof HTMLElement) {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.clipPath = 'none';
      }
    });
    return;
  }

  initHeroMotion();
  initHeaderScrollMotion();
  initCurtainImageReveals();
  initStaggeredTextReveals();
  initMotifSvgDraw();
  initMagneticElements();
  initPerspectiveTiltCards();
  initParallaxLayers();
}

/**
 * 1. Hero Entrance & Scroll-Driven Parallax
 */
function initHeroMotion(): void {
  const heroSection = document.querySelector<HTMLElement>('section.on-dark');
  const heroBg = document.querySelector<HTMLElement>('.hero-zoom');
  const heroContent = document.querySelector<HTMLElement>('section.on-dark .wrap');

  if (heroBg && heroSection) {
    // Scroll-driven parallax on the hero image
    scroll(
      (progress) => {
        const yOffset = progress * 160;
        const opacity = Math.max(0, 1 - progress * 1.25);
        const scale = 1 + progress * 0.08;
        heroBg.style.transform = `translate3d(0, ${yOffset}px, 0) scale(${scale})`;
        if (heroContent) {
          heroContent.style.opacity = `${opacity}`;
          heroContent.style.transform = `translate3d(0, ${progress * 60}px, 0)`;
        }
      },
      {
        target: heroSection,
        offset: ['start start', 'end start'],
      }
    );
  }

  // Entrance choreography for hero elements
  const heroItems = document.querySelectorAll<HTMLElement>('.hero-in');
  if (heroItems.length > 0) {
    animate(
      heroItems,
      {
        opacity: [0, 1],
        y: [32, 0],
      },
      {
        delay: stagger(0.16, { startDelay: 0.1 }),
        duration: 1.1,
        ease: [0.22, 1, 0.36, 1],
      }
    );
  }
}

/**
 * 2. Scroll-Linked Header Glassmorphism Elevation
 */
function initHeaderScrollMotion(): void {
  const header = document.querySelector<HTMLElement>('header');
  if (!header) return;

  scroll(
    (progress) => {
      if (progress > 0.05) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    },
    { offset: ['0px', '120px'] }
  );
}

/**
 * 3. Editorial Draping & Curtain Image Reveals
 */
function initCurtainImageReveals(): void {
  const revealImages = document.querySelectorAll<HTMLElement>('.reveal-img, [data-curtain-reveal]');

  revealImages.forEach((el) => {
    inView(
      el,
      () => {
        const img = el.querySelector('img');
        // Animate the container clip-path drape from bottom to top
        animate(
          el,
          {
            opacity: [0, 1],
            clipPath: ['polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'],
          },
          {
            duration: 1.25,
            ease: [0.25, 1, 0.5, 1],
          }
        );

        if (img) {
          animate(
            img,
            {
              scale: [1.14, 1],
            },
            {
              duration: 1.6,
              ease: [0.22, 1, 0.36, 1],
            }
          );
        }
      },
      { margin: '0px 0px -10% 0px' }
    );
  });
}

/**
 * 4. Staggered Text & Typography Reveals
 */
function initStaggeredTextReveals(): void {
  // Reveal individual elements with class .reveal
  const revealElements = document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)');

  revealElements.forEach((el) => {
    inView(
      el,
      () => {
        el.classList.add('is-visible');
        animate(
          el,
          {
            opacity: [0, 1],
            y: [28, 0],
          },
          {
            duration: 0.95,
            ease: [0.22, 1, 0.36, 1],
          }
        );
      },
      { margin: '0px 0px -8% 0px' }
    );
  });

  // Stagger groups (e.g. service lists, grids)
  const staggerContainers = document.querySelectorAll<HTMLElement>('[data-stagger-group]');
  staggerContainers.forEach((container) => {
    const items = container.querySelectorAll<HTMLElement>('[data-stagger-item]');
    if (items.length === 0) return;

    inView(
      container,
      () => {
        animate(
          items,
          {
            opacity: [0, 1],
            y: [30, 0],
          },
          {
            delay: stagger(0.12),
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }
        );
      },
      { margin: '0px 0px -10% 0px' }
    );
  });
}

/**
 * 5. Luxury Mandap SVG Ogee Arch Line Draw
 */
function initMotifSvgDraw(): void {
  const motifs = document.querySelectorAll<SVGElement>('svg.motif-draw, [data-motif-draw]');

  motifs.forEach((svg) => {
    const paths = svg.querySelectorAll<SVGPathElement>('path');
    if (paths.length === 0) return;

    paths.forEach((p) => {
      const length = p.getTotalLength?.() || 200;
      p.style.strokeDasharray = `${length}`;
      p.style.strokeDashoffset = `${length}`;
    });

    inView(
      svg,
      () => {
        paths.forEach((p, i) => {
          animate(
            p,
            {
              strokeDashoffset: [p.getTotalLength?.() || 200, 0],
              opacity: [0.2, 1],
            },
            {
              duration: 1.4,
              delay: i * 0.15,
              ease: [0.25, 1, 0.5, 1],
            }
          );
        });
      },
      { margin: '0px 0px -12% 0px' }
    );
  });
}

/**
 * 6. Magnetic Button Physics
 */
function initMagneticElements(): void {
  // Apply magnetic pull to primary CTA buttons and icon buttons
  const magneticEls = document.querySelectorAll<HTMLElement>('.btn-ink, .btn-line, [data-magnetic]');

  // Only enable on pointer-fine desktop devices
  if (!window.matchMedia('(pointer: fine)').matches) return;

  magneticEls.forEach((el) => {
    const bound = 28; // Maximum pixel pull distance

    el.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * 0.28;
      const deltaY = (e.clientY - centerY) * 0.28;

      const clampedX = Math.max(-bound, Math.min(bound, deltaX));
      const clampedY = Math.max(-bound, Math.min(bound, deltaY));

      animate(
        el,
        {
          x: clampedX,
          y: clampedY,
        },
        {
          duration: 0.25,
          ease: 'easeOut',
        }
      );
    });

    el.addEventListener('mouseleave', () => {
      animate(
        el,
        {
          x: 0,
          y: 0,
        },
        {
          duration: 0.5,
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }
      );
    });
  });
}

/**
 * 7. Interactive 3D Perspective Tilt for Luxury Cards
 */
function initPerspectiveTiltCards(): void {
  const cards = document.querySelectorAll<HTMLElement>('[data-tilt], .card-tilt');

  if (!window.matchMedia('(pointer: fine)').matches) return;

  cards.forEach((card) => {
    card.style.transformStyle = 'preserve-3d';
    card.style.perspective = '1000px';

    card.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5.5; // subtle tilt angle
      const rotateY = ((x - centerX) / centerX) * 5.5;

      animate(
        card,
        {
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`,
        },
        {
          duration: 0.25,
          ease: 'easeOut',
        }
      );
    });

    card.addEventListener('mouseleave', () => {
      animate(
        card,
        {
          transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        },
        {
          duration: 0.5,
          type: 'spring',
          stiffness: 260,
          damping: 22,
        }
      );
    });
  });
}

/**
 * 8. Multi-Layer Parallax for Asymmetric Storytelling
 */
function initParallaxLayers(): void {
  const parallaxItems = document.querySelectorAll<HTMLElement>('.parallax, [data-parallax]');

  if (!window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches) return;

  parallaxItems.forEach((item) => {
    const speed = parseFloat(item.getAttribute('data-parallax-speed') || '0.12');
    const img = item.querySelector('img') || item;

    scroll(
      (progress) => {
        // progress is 0 when entering viewport bottom, 1 when exiting top
        const offset = (progress - 0.5) * (speed * 250);
        img.style.transform = `translate3d(0, ${offset}px, 0) scale(1.05)`;
      },
      {
        target: item,
        offset: ['start end', 'end start'],
      }
    );
  });
}

// Auto-run when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLuxuryMotion);
  } else {
    initLuxuryMotion();
  }
}
