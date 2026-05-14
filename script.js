/**
 * EuroPlex – script.js
 * Handles:
 *  1. Sticky header visibility on scroll
 *  2. Main nav background on scroll
 *  3. Mobile hamburger menu
 *  4. FAQ accordion
 *  5. Image carousel with zoom preview
 *  6. Email form submission feedback
 */

'use strict';

/* ============================================================
   UTILITY
   ============================================================ */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   1. STICKY HEADER
   Appears when user scrolls past the hero section (first fold).
   Disappears when scrolling back to the top.
   ============================================================ */
(function initStickyHeader() {
  const stickyHeader  = qs('#sticky-header');
  const mainHeader    = qs('#main-header');
  const hero          = qs('#hero');

  if (!stickyHeader || !mainHeader) return;

  let lastScrollY  = window.scrollY;
  let ticking      = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  function update() {
    const scrollY      = window.scrollY;
    const heroHeight   = hero ? hero.offsetHeight : window.innerHeight;
    const scrollingUp  = scrollY < lastScrollY;

    /* Show sticky header once past the first fold and scrolling up (or just past fold) */
    const pastFold = scrollY > heroHeight * 0.5;

    if (pastFold && !scrollingUp) {
      /* User scrolled past fold going down – hide sticky, show nav background */
      stickyHeader.classList.remove('visible');
    } else if (pastFold && scrollingUp) {
      /* Scrolling back up but still past fold – show sticky */
      stickyHeader.classList.add('visible');
      stickyHeader.setAttribute('aria-hidden', 'false');
    } else {
      /* Back near the top – hide sticky */
      stickyHeader.classList.remove('visible');
      stickyHeader.setAttribute('aria-hidden', 'true');
    }

    /* Make main header background solid when any scrolling occurs */
    if (scrollY > 20) {
      mainHeader.classList.add('scrolled');
    } else {
      mainHeader.classList.remove('scrolled');
    }

    lastScrollY = scrollY;
    ticking     = false;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  update(); // run once on load
})();


/* ============================================================
   2. MOBILE HAMBURGER MENU
   ============================================================ */
(function initMobileMenu() {
  const hamburger = qs('#hamburger');
  const mobileNav = qs('#mobile-nav');

  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  /* Close menu when a link is clicked */
  qsa('a', mobileNav).forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
})();


/* ============================================================
   3. FAQ ACCORDION
   ============================================================ */
(function initAccordion() {
  const items = qsa('.accordion-item');

  items.forEach(item => {
    const trigger = qs('.accordion-trigger', item);
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      /* Close all items */
      items.forEach(i => i.classList.remove('open'));

      /* Toggle current */
      if (!isOpen) item.classList.add('open');
    });
  });
})();


/* ============================================================
   4. IMAGE CAROUSEL WITH ZOOM PREVIEW
   Features:
   - Drag / swipe support
   - Prev / Next arrow buttons
   - Keyboard arrow navigation
   - Dot indicators
   - Hover zoom preview panel (CSS-driven + JS positioning fix)
   ============================================================ */
(function initCarousel() {
  const track    = qs('#carousel-track');
  const prevBtn  = qs('#carousel-prev');
  const nextBtn  = qs('#carousel-next');
  const dotsWrap = qs('#carousel-dots');

  if (!track) return;

  const items      = qsa('.carousel-item', track);
  /* Only count the first half (we duplicated items for infinite feel) */
  const realCount  = Math.ceil(items.length / 2);
  const itemWidth  = () => {
    const item = items[0];
    return item.offsetWidth + parseInt(getComputedStyle(track).gap || '20', 10);
  };

  let currentIndex = 0;
  let isDragging   = false;
  let startX       = 0;
  let startTranslate = 0;
  let currentTranslate = 0;

  /* --- BUILD DOTS --- */
  const dots = [];
  for (let i = 0; i < realCount; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
    dots.push(dot);
  }

  /* --- NAVIGATION --- */
  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, realCount - 1));
    currentTranslate = -(currentIndex * itemWidth());
    applyTranslate(currentTranslate, true);
    updateDots();
  }

  function applyTranslate(x, animated = true) {
    track.style.transition = animated
      ? 'transform 0.5s cubic-bezier(0.4,0,0.2,1)'
      : 'none';
    track.style.transform = `translateX(${x}px)`;
    currentTranslate = x;
  }

  function updateDots() {
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
  }

  prevBtn && prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn && nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  /* Keyboard navigation */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  goTo(currentIndex - 1);
    if (e.key === 'ArrowRight') goTo(currentIndex + 1);
  });

  /* --- DRAG / SWIPE --- */
  function dragStart(e) {
    isDragging  = true;
    startX      = getClientX(e);
    startTranslate = currentTranslate;
    track.style.cursor = 'grabbing';
    track.style.transition = 'none';
  }

  function dragMove(e) {
    if (!isDragging) return;
    const delta = getClientX(e) - startX;
    applyTranslate(startTranslate + delta, false);
  }

  function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = 'grab';

    const delta     = getClientX(e) - startX;
    const threshold = itemWidth() * 0.2;

    if (delta < -threshold) {
      goTo(currentIndex + 1);
    } else if (delta > threshold) {
      goTo(currentIndex - 1);
    } else {
      goTo(currentIndex); /* snap back */
    }
  }

  function getClientX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  track.style.cursor = 'grab';
  track.addEventListener('mousedown',   dragStart);
  track.addEventListener('mousemove',   dragMove);
  track.addEventListener('mouseup',     dragEnd);
  track.addEventListener('mouseleave',  dragEnd);
  track.addEventListener('touchstart',  dragStart, { passive: true });
  track.addEventListener('touchmove',   dragMove,  { passive: true });
  track.addEventListener('touchend',    dragEnd);

  /* Prevent image drag interfering */
  track.addEventListener('dragstart', e => e.preventDefault());

  /* Recalculate on resize */
  window.addEventListener('resize', () => goTo(currentIndex));

  /* --- ZOOM PREVIEW POSITIONING ---
     Make sure the popup doesn't overflow viewport edges.
  ----------------------------------------------------------- */
  items.forEach(item => {
    const preview = qs('.carousel-zoom-preview', item);
    if (!preview) return;

    item.addEventListener('mouseenter', () => {
      const rect    = preview.getBoundingClientRect();
      const vw      = window.innerWidth;

      /* Correct if overflowing right */
      if (rect.right > vw - 16) {
        preview.style.left  = 'auto';
        preview.style.right = '0';
        preview.style.transform = 'translateX(0) scale(1)';
      }
      /* Correct if overflowing left */
      if (rect.left < 16) {
        preview.style.left  = '0';
        preview.style.transform = 'translateX(0) scale(1)';
      }
    });

    item.addEventListener('mouseleave', () => {
      preview.style.left  = '';
      preview.style.right = '';
      preview.style.transform = '';
    });
  });

})();


/* ============================================================
   5. EMAIL / CATALOGUE FORM
   ============================================================ */
(function initEmailForm() {
  const form = qs('#catalogue-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const input  = qs('input[type="email"]', form);
    const btn    = qs('button', form);
    const email  = input.value.trim();

    if (!email) return;

    /* Simulate sending */
    btn.textContent = 'Sending…';
    btn.disabled    = true;

    setTimeout(() => {
      btn.textContent   = '✓ Sent! Check your inbox';
      btn.style.background = '#16a34a';
      input.value       = '';
      input.disabled    = true;

      setTimeout(() => {
        btn.textContent  = 'Send Me the Catalogue';
        btn.style.background = '';
        btn.disabled     = false;
        input.disabled   = false;
      }, 4000);
    }, 1200);
  });
})();


/* ============================================================
   6. SCROLL-REVEAL ANIMATION
   Lightweight in-view animation using IntersectionObserver.
   ============================================================ */
(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const targets = qsa(
    '.feature-card, .testimonial-card, .product-card, .resource-card, ' +
    '.process-step, .accordion-item, .specs-table-wrap'
  );

  targets.forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ease ${(i % 6) * 0.07}s, transform 0.5s ease ${(i % 6) * 0.07}s`;
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => observer.observe(el));
})();