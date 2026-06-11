/* Ocean View Eagles — site JS
   Hero slider, sticky hide-on-scroll nav, mobile burger, scroll reveals. */
(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initNav();
    initHeroSlider();
    initReveal();
    initBurger();
    markCurrentNav();
    initYear();
  }

  /* ---------- Year in footer ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(n => {
      n.textContent = new Date().getFullYear();
    });
  }

  /* ---------- Sticky nav · shadow boost on scroll ---------- */
  function initNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (window.pageYOffset > 80) nav.classList.add('nav--scrolled');
        else nav.classList.remove('nav--scrolled');
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Mark current nav link ---------- */
  function markCurrentNav() {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav__link').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href === path || (path === '' && href === 'index.html')) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- Burger + mobile drawer ---------- */
  function initBurger() {
    const btn = document.querySelector('.nav__burger');
    const menu = document.querySelector('.nav__menu');
    if (!btn || !menu) return;

    // Swap SVG for the animated 3-bar markup
    btn.innerHTML = '<span class="nav__burger-bars" aria-hidden="true"><span></span></span>';
    btn.setAttribute('aria-expanded', 'false');

    // Inject the drawer footer (CTA + contact) for mobile
    if (!menu.querySelector('.nav__menu-foot')) {
      const foot = document.createElement('div');
      foot.className = 'nav__menu-foot';
      foot.innerHTML = `
        <a class="nav__menu-foot__cta" href="contact.html">Join today</a>
        <div class="nav__menu-foot__contact">
          <small>Visit</small>
          <a href="https://maps.google.com/?q=35083+Atlantic+Ave+Ocean+View+DE" target="_blank" rel="noopener">35083 Atlantic Ave, Ocean View, DE</a>
          <small style="margin-top:10px;">Call</small>
          <a href="tel:+13026162937">(302) 616-2937</a>
          <small style="margin-top:10px;">Membership</small>
          <a href="mailto:foemembership@gmail.com">foemembership@gmail.com</a>
        </div>`;
      menu.appendChild(foot);
    }

    // Fix relative links inside nav__menu-foot when on pages in subfolders (design-system/)
    if (location.pathname.includes('/design-system/')) {
      menu.querySelectorAll('.nav__menu-foot__cta, .nav__menu-foot a[href="contact.html"]').forEach(a => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('../') && !/^https?:|^mailto:|^tel:/.test(href)) {
          a.setAttribute('href', '../' + href);
        }
      });
    }

    const open = () => {
      menu.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('nav-open');
    };
    const close = () => {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('nav-open');
    };
    const toggle = () => menu.classList.contains('is-open') ? close() : open();

    btn.addEventListener('click', toggle);

    menu.addEventListener('click', (e) => {
      if (e.target.closest('.nav__link')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) close();
    });

    // If the viewport grows past mobile while open, close the drawer
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && menu.classList.contains('is-open')) close();
    });
  }

  /* ---------- Hero slider ---------- */
  function initHeroSlider() {
    const hero = document.querySelector('.hero[data-slider]');
    if (!hero) return;
    const imgSlides = hero.querySelectorAll('.hero__slide');
    const textSlides = hero.querySelectorAll('.hero__text-slide');
    const dots = hero.querySelectorAll('.hero__dot');
    const progress = hero.querySelector('.hero__progress-fill');
    if (!imgSlides.length || !textSlides.length) return;

    const DURATION = 6500;
    let idx = 0;
    let timer = null;
    let startTs = performance.now();
    let rafId = null;
    let paused = false;

    function show(i) {
      idx = (i + imgSlides.length) % imgSlides.length;
      imgSlides.forEach((n, j) => n.classList.toggle('hero__slide--active', j === idx));
      textSlides.forEach((n, j) => n.classList.toggle('hero__text-slide--active', j === idx));
      dots.forEach((n, j) => n.classList.toggle('hero__dot--active', j === idx));
      resetProgress();
    }

    function resetProgress() {
      startTs = performance.now();
      if (progress) progress.style.width = '0%';
    }

    function tickProgress(ts) {
      if (!paused && progress) {
        const elapsed = ts - startTs;
        const p = Math.min(elapsed / DURATION, 1);
        progress.style.width = (p * 100).toFixed(2) + '%';
      }
      rafId = requestAnimationFrame(tickProgress);
    }

    function advance() { if (!paused) show(idx + 1); }

    function start() {
      stop();
      timer = setInterval(advance, DURATION);
      resetProgress();
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    hero.addEventListener('mouseenter', () => { paused = true; stop(); });
    hero.addEventListener('mouseleave', () => { paused = false; start(); });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        show(i);
        start();
      });
    });

    const prev = hero.querySelector('.hero__arrow--prev');
    const next = hero.querySelector('.hero__arrow--next');
    if (prev) prev.addEventListener('click', () => { show(idx - 1); start(); });
    if (next) next.addEventListener('click', () => { show(idx + 1); start(); });

    // keyboard nav when hero is focus-visible
    hero.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { show(idx - 1); start(); }
      else if (e.key === 'ArrowRight') { show(idx + 1); start(); }
    });

    show(0);
    start();
    rafId = requestAnimationFrame(tickProgress);
  }

  /* ---------- Scroll reveals ---------- */
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.fade-up, .scale-in, .rev-line').forEach(n => n.classList.add('in', 'rev-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          e.target.classList.add('rev-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-up, .scale-in, .rev-on-view').forEach(n => io.observe(n));
  }
})();
