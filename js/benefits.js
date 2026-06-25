(function () {
  'use strict';

  var gridEl = document.getElementById('benefitsGrid');
  if (!gridEl) return;

  var modalEl = document.getElementById('benefitModal');
  var modalHeroEl = document.getElementById('benefitModalHero');
  var modalTitleEl = document.getElementById('benefitModalTitle');
  var modalOfferEl = document.getElementById('benefitModalOffer');
  var modalLeadEl = document.getElementById('benefitModalLead');
  var modalBodyEl = document.getElementById('benefitModalBody');
  var catRowEl = document.getElementById('benefitsCatRow');

  var benefits = [];
  var lastFocusEl = null;
  var activeFilter = 'all';
  var openModalSlug = null;

  var BEN_CAT_KEYS = {
    travel: 'benefits.cat.travel',
    health: 'benefits.cat.health',
    shop: 'benefits.cat.shop',
    finance: 'benefits.cat.finance',
    edu: 'benefits.cat.edu'
  };

  function t(key, fallback) {
    if (window.EgozI18n && typeof EgozI18n.t === 'function') {
      var value = EgozI18n.t('foundation', key);
      if (value) return value;
    }
    return fallback;
  }

  function getLang() {
    return window.EgozI18n && typeof EgozI18n.getLang === 'function'
      ? EgozI18n.getLang()
      : 'he';
  }

  function esc(v) {
    return String(v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function decodeEntities(text) {
    return String(text || '')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  function bodyHtml(text) {
    var raw = decodeEntities(text || '').trim();
    if (!raw) return '';
    return raw.split(/\n\s*\n/).map(function (para) {
      return '<p>' + esc(para.trim().replace(/\n/g, ' ')) + '</p>';
    }).join('');
  }

  function excerpt(text, max) {
    var raw = decodeEntities(text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';
    if (raw.length <= max) return raw;
    return raw.slice(0, max).trim() + '…';
  }

  function catLabel(category) {
    var key = BEN_CAT_KEYS[category];
    if (!key) return category;
    return t(key, category);
  }

  function benefitLogoHtml(localized) {
    if (!localized.image_url) return esc(localized.brand_name || '');
    return (
      '<div class="ben__media-frame">' +
        '<img src="' + esc(localized.image_url) + '" alt="' + esc(localized.brand_name || localized.title) + '" loading="lazy" decoding="async" />' +
      '</div>'
    );
  }

  function tuneBenefitCardMedia(root) {
    var scope = root || document;
    scope.querySelectorAll('.ben__logo img').forEach(function (img) {
      function apply() {
        var wrap = img.closest('.ben__logo');
        if (!wrap) return;
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        if (!w || !h) return;
        var ratio = w / h;
        var isPhoto = (ratio >= 1.45 && w >= 280) || (ratio >= 1.2 && w >= 520) || (w * h >= 90000 && ratio >= 1.15);
        wrap.classList.toggle('is-photo', isPhoto);
      }
      if (img.complete) apply();
      else img.addEventListener('load', apply, { once: true });
    });
  }

  window.tuneBenefitCardMedia = tuneBenefitCardMedia;

  function localizeBenefit(item) {
    if (getLang() === 'he' || !item || !item.slug) return item;
    var tr = window.EgozBenefitsI18n && EgozBenefitsI18n[item.slug];
    if (!tr) return item;
    return {
      slug: item.slug,
      category: item.category,
      image_url: item.image_url,
      brand_name: tr.brand_name || item.brand_name,
      title: tr.title || item.title,
      offer_main: tr.offer_main != null ? tr.offer_main : item.offer_main,
      offer_sub: tr.offer_sub != null ? tr.offer_sub : item.offer_sub,
      description: tr.description != null ? tr.description : item.description,
      body: tr.body != null ? tr.body : item.body
    };
  }

  function renderCard(item) {
    var localized = localizeBenefit(item);
    var id = localized.slug ? ' id="' + esc(localized.slug) + '"' : '';
    var logoHtml = benefitLogoHtml(localized);

    return (
      '<article class="benefit-card ben"' + id + ' data-c="' + esc(localized.category) + '">' +
        '<div class="benefit-card__logo ben__logo">' + logoHtml + '</div>' +
        '<div class="benefit-card__body ben__body">' +
          '<span class="ben__cat">' + esc(catLabel(localized.category)) + '</span>' +
          '<h2 class="ben__title">' + esc(localized.title) + '</h2>' +
          '<span class="ben__off">' + esc(localized.offer_main) + '<small>' + esc(localized.offer_sub) + '</small></span>' +
          (localized.description
            ? '<p class="benefit-card__lead card__excerpt">' + esc(excerpt(localized.description, 120)) + '</p>'
            : '') +
          '<div class="benefit-card__foot ben__foot">' +
            '<button type="button" class="btn btn--outline btn--sm benefit-card__read" data-benefit-slug="' + esc(localized.slug || '') + '">' +
              esc(t('benefits.readAll', 'קרא הכל על ההטבה')) +
              ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function findBenefit(slug) {
    return benefits.find(function (item) { return item.slug === slug; }) || null;
  }

  function applyFilter() {
    gridEl.querySelectorAll('.benefit-card').forEach(function (card) {
      var show = activeFilter === 'all' || card.getAttribute('data-c') === activeFilter;
      card.style.display = show ? '' : 'none';
    });
  }

  function renderGrid() {
    if (!benefits.length) return;
    gridEl.innerHTML = benefits.map(renderCard).join('');
    tuneBenefitCardMedia(gridEl);
    applyFilter();
  }

  function bindFilter() {
    if (!catRowEl || catRowEl.dataset.bound === '1') return;
    catRowEl.dataset.bound = '1';

    catRowEl.addEventListener('click', function (event) {
      var btn = event.target.closest('button[data-cat]');
      if (!btn) return;

      catRowEl.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-on'); });
      btn.classList.add('is-on');
      activeFilter = btn.getAttribute('data-cat') || 'all';
      applyFilter();
    });
  }

  function openModal(item) {
    if (!modalEl || !item) return;
    var localized = localizeBenefit(item);
    lastFocusEl = document.activeElement;
    openModalSlug = item.slug || null;

    if (localized.image_url) {
      modalHeroEl.innerHTML = '<img src="' + esc(localized.image_url) + '" alt="' + esc(localized.brand_name || localized.title) + '" />';
      modalHeroEl.hidden = false;
    } else {
      modalHeroEl.innerHTML = '';
      modalHeroEl.hidden = true;
    }

    modalTitleEl.textContent = localized.title || '';
    modalOfferEl.innerHTML = esc(localized.offer_main) + '<small>' + esc(localized.offer_sub) + '</small>';
    modalOfferEl.hidden = !localized.offer_main;

    var lead = localized.description || '';
    modalLeadEl.textContent = lead;
    modalLeadEl.hidden = !lead;

    var bodyText = '';
    if (localized.body && (!localized.description || localized.body.trim() !== localized.description.trim())) {
      bodyText = localized.body;
    }
    modalBodyEl.innerHTML = bodyHtml(bodyText);

    var scrollEl = modalEl.querySelector('.benefit-modal__scroll');
    if (scrollEl) scrollEl.scrollTop = 0;

    modalEl.hidden = false;
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('benefits-modal-open');

    var closeBtn = modalEl.querySelector('.benefit-modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.hidden = true;
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('benefits-modal-open');
    openModalSlug = null;
    if (lastFocusEl && typeof lastFocusEl.focus === 'function') lastFocusEl.focus();
  }

  function showSkeleton() {
    gridEl.innerHTML =
      '<div class="benefits-skeleton">' +
        Array(6).fill('<div class="benefits-skeleton__card"></div>').join('') +
      '</div>';
  }

  function bindModal() {
    if (!modalEl) return;

    modalEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-benefit-close]')) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modalEl.hidden) closeModal();
    });
  }

  function bindGrid() {
    gridEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-benefit-slug]');
      if (!btn) return;
      var slug = btn.getAttribute('data-benefit-slug');
      var item = findBenefit(slug);
      if (item) openModal(item);
    });
  }

  function openFromHash() {
    var hash = window.location.hash.replace('#', '');
    if (!hash) return;
    var item = findBenefit(hash);
    if (item) {
      setTimeout(function () { openModal(item); }, 120);
    }
  }

  function onLangChange() {
    renderGrid();
    if (openModalSlug) {
      var item = findBenefit(openModalSlug);
      if (item) openModal(item);
    }
  }

  function initFooterCopy() {
    var footerCopy = document.getElementById('footerCopy');
    var year = document.getElementById('year');
    if (!footerCopy || !year) return;

    var updateCopyright = function () {
      var tpl = t('footer.copy', '© {year} עמותת אגוז — הסיירת הצפונית · כל הזכויות שמורות');
      footerCopy.textContent = tpl.replace('{year}', year.textContent);
    };

    updateCopyright();
    document.addEventListener('egoz:langchange', updateCopyright);
  }

  async function load() {
    showSkeleton();

    var sb = window.EgozSupabasePublic && EgozSupabasePublic.getClient();
    if (!sb) {
      gridEl.innerHTML = '<p class="muted" style="text-align:center;padding:40px 0">' + esc(t('benefits.noConnection', 'אין חיבור.')) + '</p>';
      return;
    }

    var result = await sb
      .from('site_benefits')
      .select('brand_name, category, title, offer_main, offer_sub, description, body, slug, image_url')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (result.error || !result.data || !result.data.length) {
      gridEl.innerHTML = '<p class="muted" style="text-align:center;padding:40px 0">' + esc(t('benefits.empty', 'אין הטבות כרגע.')) + '</p>';
      return;
    }

    benefits = result.data;
    renderGrid();
    bindFilter();
    openFromHash();
  }

  bindModal();
  bindGrid();
  document.addEventListener('egoz:langchange', onLangChange);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      load();
      initFooterCopy();
    });
  } else {
    load();
    initFooterCopy();
  }
})();
