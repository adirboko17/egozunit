/* Foundation sub-menu under "עמותה" in main nav */
(function () {
  'use strict';

  var ITEMS = [
    { href: 'foundation.html', i18n: 'nav.foundationSub.about', page: 'foundation', hash: '' },
    { href: 'support.html', i18n: 'nav.support', page: 'support', hash: '' },
    { href: 'heritage.html', i18n: 'nav.heritage', page: 'heritage', hash: '' },
    { href: 'foundation.html#projects', i18n: 'nav.foundationSub.projects', page: 'foundation', hash: '#projects' },
    { href: 'foundation.html#benefits', i18n: 'nav.foundationSub.benefits', page: 'foundation', hash: '#benefits' },
    { href: 'foundation.html#events', i18n: 'nav.foundationSub.events', page: 'foundation', hash: '#events' }
  ];

  var LABELS_HE = {
    'nav.foundationSub.about': 'העמותה',
    'nav.foundationSub.projects': 'פרויקטים',
    'nav.foundationSub.benefits': 'הטבות',
    'nav.foundationSub.events': 'אירועים',
    'nav.support': 'תמיכה בנפגעים',
    'nav.heritage': 'אגוז לדורותיה',
    'nav.foundation': 'עמותה'
  };

  function pageId() {
    return document.body.getAttribute('data-i18n-page') || 'home';
  }

  function labelFor(key) {
    if (window.EgozI18n) {
      var val = EgozI18n.t(pageId(), key, EgozI18n.getLang());
      if (val != null) return val;
    }
    return LABELS_HE[key] || key;
  }

  function pageName() {
    var path = window.location.pathname || '';
    var file = path.split('/').pop() || 'index.html';
    return file.replace(/\.html$/, '') || 'index';
  }

  function currentHash() {
    return window.location.hash || '';
  }

  function isItemActive(item) {
    var page = pageName();
    if (item.page === 'foundation' && page === 'foundation') {
      if (!item.hash) return !currentHash() || currentHash() === '#about';
      return currentHash() === item.hash;
    }
    if (item.page === 'support' && page === 'support') return true;
    if (item.page === 'heritage' && page === 'heritage') return true;
    return false;
  }

  function isFoundationSectionActive() {
    var page = pageName();
    return page === 'foundation' || page === 'support' || page === 'heritage';
  }

  function buildDesktopDropdown(trigger) {
    if (trigger.closest('.nav-dropdown')) return;

    var wrap = document.createElement('div');
    wrap.className = 'nav-dropdown';
    wrap.setAttribute('data-nav-dropdown', '');

    var link = document.createElement('a');
    link.className = 'nav-dropdown__trigger';
    link.href = 'foundation.html';
    var label = trigger.textContent.trim() || 'עמותה';
    link.innerHTML = '<span data-i18n="nav.foundation">' + label + '</span><svg class="nav-dropdown__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

    var panel = document.createElement('div');
    panel.className = 'nav-dropdown__panel';
    panel.setAttribute('role', 'menu');
    panel.setAttribute('data-i18n-aria', 'nav.foundationMenu');

    ITEMS.forEach(function (item) {
      var a = document.createElement('a');
      a.href = item.href;
      a.setAttribute('role', 'menuitem');
      a.setAttribute('data-i18n', item.i18n);
      a.textContent = labelFor(item.i18n);
      if (isItemActive(item)) a.classList.add('is-active');
      panel.appendChild(a);
    });

    wrap.appendChild(link);
    wrap.appendChild(panel);
    trigger.replaceWith(wrap);

    if (isFoundationSectionActive()) wrap.classList.add('is-active');

    var closeTimer = null;
    var canHover = function () {
      return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    };

    link.addEventListener('click', function (e) {
      if (!canHover()) {
        e.preventDefault();
        var open = wrap.classList.toggle('is-open');
        link.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    });

    wrap.addEventListener('mouseenter', function () {
      if (!canHover()) return;
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      wrap.classList.add('is-open');
      link.setAttribute('aria-expanded', 'true');
    });
    wrap.addEventListener('mouseleave', function () {
      if (!canHover()) return;
      closeTimer = setTimeout(function () {
        wrap.classList.remove('is-open');
        link.setAttribute('aria-expanded', 'false');
        closeTimer = null;
      }, 120);
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('is-open');
        link.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') wrap.classList.remove('is-open');
    });
  }

  function buildMobileGroup(mLink) {
    if (mLink.closest('.m-nav-group')) return;

    var group = document.createElement('div');
    group.className = 'm-nav-group';

    var head = document.createElement('button');
    head.type = 'button';
    head.className = 'm-nav-group__head';
    head.innerHTML = '<span data-i18n="nav.foundation">' + (mLink.textContent.trim() || 'עמותה') + '</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

    var items = document.createElement('div');
    items.className = 'm-nav-group__items';

    ITEMS.forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'm-link m-link--sub';
      a.href = item.href;
      a.setAttribute('data-i18n', item.i18n);
      a.textContent = labelFor(item.i18n);
      if (isItemActive(item)) a.classList.add('is-active');
      items.appendChild(a);
    });

    head.addEventListener('click', function () {
      group.classList.toggle('is-open');
    });

    group.appendChild(head);
    group.appendChild(items);
    mLink.replaceWith(group);

    if (isFoundationSectionActive()) group.classList.add('is-open');
  }

  function applyI18nToNav() {
    var pageId = document.body.getAttribute('data-i18n-page');
    if (!pageId || !window.EgozI18n) return;
    EgozI18n.apply(pageId);
  }

  function init() {
    var desktop = document.querySelector('.nav-links a[href="foundation.html"], .nav-links a[href="./foundation.html"]');
    if (desktop) buildDesktopDropdown(desktop);

    var mobile = document.querySelector('#navDrawer a.m-link[href="foundation.html"], #navDrawer a.m-link[href="./foundation.html"]');
    if (mobile) buildMobileGroup(mobile);

    applyI18nToNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('DOMContentLoaded', applyI18nToNav);
  document.addEventListener('egoz:langchange', applyI18nToNav);
})();
