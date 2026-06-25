/* אגוז — shared site behaviour */
(function () {
  'use strict';

  /* ---- Sticky header (spacer + hysteresis — smooth floating pill) ---- */
  var header = document.querySelector('.site-header');
  var heroStack = header && header.closest('.hero-stack');
  if (header) {
    var stuck = false;
    var stickGap = 12;
    var stickScroll = 20;
    var unstickScroll = 6;
    try {
      var gapVar = getComputedStyle(document.documentElement).getPropertyValue('--surface-gap').trim();
      var gapNum = parseFloat(gapVar);
      if (!isNaN(gapNum)) stickGap = gapNum;
    } catch (e) {}

    var spacer = document.createElement('div');
    spacer.className = 'nav-stick-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    if (header.nextSibling) header.parentNode.insertBefore(spacer, header.nextSibling);
    else header.parentNode.appendChild(spacer);

    function scrollY() {
      return window.scrollY
        || document.documentElement.scrollTop
        || document.body.scrollTop
        || 0;
    }

    function headerFlowHeight() {
      return header.offsetHeight;
    }

    function setStuck(next) {
      if (next === stuck) return;
      if (next) {
        spacer.style.height = headerFlowHeight() + 'px';
        header.classList.add('is-stuck');
        if (heroStack) heroStack.classList.add('is-nav-stuck');
      } else {
        header.classList.remove('is-stuck');
        if (heroStack) heroStack.classList.remove('is-nav-stuck');
        spacer.style.height = '0px';
      }
      stuck = next;
    }

    function shouldStick() {
      var y = scrollY();
      if (stuck) return y > unstickScroll;
      if (y < stickScroll) return false;
      return header.getBoundingClientRect().top <= stickGap + 1;
    }

    function updateSticky() {
      setStuck(shouldStick());
    }

    var stickyTicking = false;
    function onStickyScroll() {
      if (stickyTicking) return;
      stickyTicking = true;
      requestAnimationFrame(function () {
        updateSticky();
        stickyTicking = false;
      });
    }

    updateSticky();
    window.addEventListener('scroll', onStickyScroll, { passive: true, capture: true });
    document.addEventListener('scroll', onStickyScroll, { passive: true, capture: true });
    window.addEventListener('resize', onStickyScroll);
    window.addEventListener('load', onStickyScroll);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('scroll', onStickyScroll, { passive: true });
      window.visualViewport.addEventListener('resize', onStickyScroll);
    }
  }

  /* ---- Mobile drawer ---- */
  var drawer = document.getElementById('navDrawer');

  function injectDrawerLangSwitch() {
    if (!drawer || drawer.querySelector('.nav-drawer__foot')) return;
    var headerLang = document.querySelector('.nav-cta .lang-switch');
    if (!headerLang) return;

    var panel = drawer.querySelector('.nav-drawer__panel');
    if (!panel) return;

    var foot = document.createElement('footer');
    foot.className = 'nav-drawer__foot';

    var langBlock = document.createElement('div');
    langBlock.className = 'nav-drawer__lang';

    var label = document.createElement('span');
    label.className = 'nav-drawer__lang-label';
    label.setAttribute('data-i18n', 'lang.label');
    label.textContent = 'בחירת שפה';

    langBlock.appendChild(label);
    var langSwitch = headerLang.cloneNode(true);
    langSwitch.querySelectorAll('.lang-switch__btn[data-lang]').forEach(function (btn) {
      var lang = btn.getAttribute('data-lang');
      if (lang === 'he') btn.setAttribute('data-i18n', 'lang.optionHe');
      if (lang === 'en') btn.setAttribute('data-i18n', 'lang.optionEn');
    });
    langBlock.appendChild(langSwitch);
    foot.appendChild(langBlock);
    panel.appendChild(foot);
  }

  function injectDrawerTitle() {
    if (!drawer) return;
    var head = drawer.querySelector('.nav-drawer__head');
    if (!head || head.querySelector('.nav-drawer__title')) return;

    var close = head.querySelector('.nav-drawer__close');
    Array.prototype.slice.call(head.children).forEach(function (el) {
      if (!el.classList.contains('nav-drawer__close')) el.remove();
    });

    var title = document.createElement('span');
    title.className = 'nav-drawer__title';
    title.setAttribute('data-i18n', 'nav.menu');
    title.textContent = 'תפריט';

    head.insertBefore(title, close || null);
  }

  injectDrawerLangSwitch();
  injectDrawerTitle();

  var openBtn = document.querySelector('.nav-toggle');
  var closeBtn = drawer && drawer.querySelector('.nav-drawer__close');
  var scrim = drawer && drawer.querySelector('.nav-drawer__scrim');
  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    document.body.classList.add('nav-drawer-open');
    document.body.style.overflow = 'hidden';
    openBtn && openBtn.setAttribute('aria-expanded', 'true');
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    document.body.classList.remove('nav-drawer-open');
    document.body.style.overflow = '';
    openBtn && openBtn.setAttribute('aria-expanded', 'false');
  }
  openBtn && openBtn.addEventListener('click', openDrawer);
  closeBtn && closeBtn.addEventListener('click', closeDrawer);
  scrim && scrim.addEventListener('click', closeDrawer);
  drawer && drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

  /* ---- In-view helper (rect based — robust in preview/iframe contexts) ---- */
  function inView(el, pad) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.height === 0 && r.width === 0) return false;
    return r.top < (vh - (pad || 0)) && r.bottom > 0;
  }

  /* ---- Scroll reveal (elements + stagger groups + panels) ---- */
  var revealSelector = '[data-reveal], [data-reveal-stagger], [data-scroll-panel]';
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(revealSelector));
  var firstRevealPass = true;
  var revealPad = function () { return Math.min(100, window.innerHeight * 0.12); };
  var reducedMotionReveal = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealObserver = null;

  function removeRevealEl(el) {
    var idx = revealEls.indexOf(el);
    if (idx > -1) revealEls.splice(idx, 1);
  }

  function markIn(el) {
    if (el.classList.contains('is-in')) return;
    if (firstRevealPass) el.style.transition = 'none';
    el.classList.add('is-in');
    if (firstRevealPass) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.style.transition = ''; });
      });
    }
  }

  function activateReveal(el) {
    markIn(el);
    removeRevealEl(el);
    if (revealObserver) revealObserver.unobserve(el);
  }

  function checkReveals() {
    for (var i = revealEls.length - 1; i >= 0; i--) {
      var el = revealEls[i];
      if (inView(el, revealPad())) activateReveal(el);
    }
    firstRevealPass = false;
  }

  if (reducedMotionReveal) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
    revealEls.length = 0;
  } else if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) activateReveal(entry.target);
      });
    }, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.06
    });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---- Count-up ---- */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dur = 1500, start = null;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = prefix + target.toLocaleString('he-IL') + suffix; return;
    }
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var val = Math.round(target * easeOutCubic(p));
      el.textContent = prefix + val.toLocaleString('he-IL') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function checkCounters() {
    for (var i = counters.length - 1; i >= 0; i--) {
      var el = counters[i];
      if (inView(el, 60)) { animateCount(el); counters.splice(i, 1); }
    }
  }

  /* ---- Drive reveal + counters on scroll/resize/load ---- */
  var ticking = false;
  function onView() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { checkReveals(); checkCounters(); ticking = false; });
  }
  window.addEventListener('scroll', onView, { passive: true });
  window.addEventListener('resize', onView);
  window.addEventListener('load', onView);
  checkReveals(); checkCounters();
  setTimeout(onView, 200);
  setTimeout(onView, 800);
  setTimeout(onView, 2000);

  /* ---- Year ---- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
