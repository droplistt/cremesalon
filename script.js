(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js-ready');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) root.classList.add('motion-reduce');

  // Remote image fallback: if a source fails, try a distinct salon image once.
  const imageFallbacks = [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1000&q=80'
  ];
  document.querySelectorAll('img').forEach((img, index) => {
    img.addEventListener('error', () => {
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = 'true';
      img.src = imageFallbacks[index % imageFallbacks.length];
    }, { once: true });
  });

  // Header / navigation
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('.header nav');
  const header = document.querySelector('.header');
  menu?.setAttribute('aria-expanded', 'false');
  menu?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open') || false;
    menu.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
  }));

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 12);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Treatment filters
  const filterButtons = document.querySelectorAll('.category-tabs button');
  const serviceCards = document.querySelectorAll('.service-menu article');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;
    serviceCards.forEach((card, index) => {
      const hidden = filter !== 'all' && card.dataset.category !== filter;
      card.classList.toggle('hidden', hidden);
      if (!hidden && !reduceMotion) {
        card.animate([
          { opacity: .15, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 520, delay: index * 45, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    });
  }));

  // Booking choices
  let selectedService = 'Hair';
  document.querySelectorAll('.choice').forEach(choice => choice.addEventListener('click', () => {
    document.querySelectorAll('.choice').forEach(c => c.classList.remove('active'));
    choice.classList.add('active');
    selectedService = choice.dataset.value;
  }));

  const dateInput = document.getElementById('date');
  if (dateInput) {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000).toISOString().split('T')[0];
    dateInput.min = local;
  }

  document.getElementById('booking-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const notes = document.getElementById('notes').value.trim();
    const message = `Hello Crème Salon by Zakir Khan, I'd like to request an appointment.\n\nName: ${name}\nPhone: ${phone}\nExperience: ${selectedService}\nPreferred date: ${date}\nPreferred time: ${time}\nNotes: ${notes || 'None'}`;
    window.open(`https://wa.me/919718112534?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  });

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // True scroll-reveal animation system
  // Content is animated ONLY when it enters the viewport while scrolling.
  // Nothing below the fold is auto-revealed by a timer.
  // ------------------------------------------------------------
  const targets = [...document.querySelectorAll(
    '.section-heading,.signature-card,.standard-list>div,.visit-steps>div,.about-image,.about-copy,' +
    '.result-card,.team-grid article,.review-grid blockquote,.membership-grid article,.gallery-grid>div,' +
    '.visit-copy,.map-card,.faq-list details,.policy-note,.gift>div,.booking-head,.booking-form'
  )];

  const canObserve = !reduceMotion && 'IntersectionObserver' in window;

  if (canObserve) {
    // Prepare only the elements that will be observed. Until this class is
    // added, everything remains naturally visible (fail-open).
    const prepareMotion = () => {
      root.classList.add('motion-ready');
      targets.forEach((el, i) => {
        el.classList.add('motion-target');
        el.style.setProperty('--reveal-index', i);
      });
    };

    const reveal = el => {
      if (!el || el.classList.contains('motion-visible')) return;
      el.classList.add('motion-visible');
      // Keep motion-target on the element during the transition so the
      // browser has a stable before/after state. It is removed after the
      // transition completes, not immediately.
      const cleanup = () => el.classList.remove('motion-target');
      el.addEventListener('transitionend', cleanup, { once: true });
      window.setTimeout(cleanup, 1400);
    };

    requestAnimationFrame(() => {
      prepareMotion();

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -12% 0px'
      });

      targets.forEach(el => observer.observe(el));

      // Elements already visible on the first screen should animate once on
      // first paint; everything else waits for actual scrolling.
      requestAnimationFrame(() => {
        const viewport = window.innerHeight;
        targets.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.top < viewport * 0.88 && rect.bottom > 0) reveal(el);
        });
      });
    });
  }

  // ------------------------------------------------------------
  // Subtle scroll progress line
  // ------------------------------------------------------------
  if (!reduceMotion) {
    const progress = document.createElement('div');
    progress.className = 'lux-scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
    let progressRaf = 0;
    const paintProgress = () => {
      progressRaf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.style.transform = `scaleX(${pct})`;
    };
    window.addEventListener('scroll', () => {
      if (!progressRaf) progressRaf = requestAnimationFrame(paintProgress);
    }, { passive: true });
    paintProgress();
  }

  // ------------------------------------------------------------
  // Editorial image depth: tiny pointer parallax on desktop.
  // ------------------------------------------------------------
  const canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (canHover && !reduceMotion) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, raf = 0;
    const moveGlow = e => {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        gx += (tx - gx) * .12;
        gy += (ty - gy) * .12;
        glow.style.transform = `translate3d(${gx - 110}px,${gy - 110}px,0)`;
        raf = 0;
      });
    };
    document.addEventListener('pointermove', moveGlow, { passive: true });

    const hero = document.querySelector('.hero-visual');
    hero?.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      hero.style.setProperty('--hero-x', `${x * 8}px`);
      hero.style.setProperty('--hero-y', `${y * 6}px`);
    });
    hero?.addEventListener('pointerleave', () => {
      hero.style.setProperty('--hero-x', '0px');
      hero.style.setProperty('--hero-y', '0px');
    });
  }

  // Small number-count reveal for the trust strip.
  if (!reduceMotion) {
    document.querySelectorAll('.rating-strip strong').forEach(el => {
      el.animate([
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 800, delay: 500, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
    });
  }

  // Re-check in-viewport content after bfcache restores. The observer remains
  // the source of truth; this only nudges the browser to repaint safely.
  window.addEventListener('pageshow', () => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.motion-target').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.9 && r.bottom > 0) el.classList.add('motion-visible');
      });
    });
  });
})();
