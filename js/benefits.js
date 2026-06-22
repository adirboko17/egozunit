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

  var CAT_LABELS = {
    travel: 'נופש ופנאי',
    health: 'בריאות',
    shop: 'צרכנות',
    finance: 'פיננסים',
    edu: 'השכלה'
  };

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
    return CAT_LABELS[category] || category;
  }

  function renderCard(item) {
    var id = item.slug ? ' id="' + esc(item.slug) + '"' : '';
    var logoHtml = item.image_url
      ? '<img src="' + esc(item.image_url) + '" alt="' + esc(item.brand_name || item.title) + '" loading="lazy" decoding="async" />'
      : esc(item.brand_name || '');

    return (
      '<article class="benefit-card ben"' + id + ' data-c="' + esc(item.category) + '">' +
        '<div class="benefit-card__logo ben__logo">' + logoHtml + '</div>' +
        '<div class="benefit-card__body ben__body">' +
          '<span class="ben__cat">' + esc(catLabel(item.category)) + '</span>' +
          '<h2 class="ben__title">' + esc(item.title) + '</h2>' +
          '<span class="ben__off">' + esc(item.offer_main) + '<small>' + esc(item.offer_sub) + '</small></span>' +
          (item.description
            ? '<p class="benefit-card__lead card__excerpt">' + esc(excerpt(item.description, 120)) + '</p>'
            : '') +
          '<div class="benefit-card__foot ben__foot">' +
            '<button type="button" class="btn btn--outline btn--sm benefit-card__read" data-benefit-slug="' + esc(item.slug || '') + '">' +
              'קרא הכל על ההטבה' +
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
    lastFocusEl = document.activeElement;

    if (item.image_url) {
      modalHeroEl.innerHTML = '<img src="' + esc(item.image_url) + '" alt="' + esc(item.brand_name || item.title) + '" />';
      modalHeroEl.hidden = false;
    } else {
      modalHeroEl.innerHTML = '';
      modalHeroEl.hidden = true;
    }

    modalTitleEl.textContent = item.title || '';
    modalOfferEl.innerHTML = esc(item.offer_main) + '<small>' + esc(item.offer_sub) + '</small>';
    modalOfferEl.hidden = !item.offer_main;

    var lead = item.description || '';
    modalLeadEl.textContent = lead;
    modalLeadEl.hidden = !lead;

    var bodyText = '';
    if (item.body && (!item.description || item.body.trim() !== item.description.trim())) {
      bodyText = item.body;
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

  async function load() {
    showSkeleton();

    var sb = window.EgozSupabasePublic && EgozSupabasePublic.getClient();
    if (!sb) {
      gridEl.innerHTML = '<p class="muted" style="text-align:center;padding:40px 0">אין חיבור.</p>';
      return;
    }

    var result = await sb
      .from('site_benefits')
      .select('brand_name, category, title, offer_main, offer_sub, description, body, slug, image_url')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (result.error || !result.data || !result.data.length) {
      gridEl.innerHTML = '<p class="muted" style="text-align:center;padding:40px 0">אין הטבות כרגע.</p>';
      return;
    }

    benefits = result.data;
    gridEl.innerHTML = benefits.map(renderCard).join('');
    bindFilter();
    applyFilter();
    openFromHash();
  }

  bindModal();
  bindGrid();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
