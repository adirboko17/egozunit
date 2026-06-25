(function () {
  'use strict';

  var projectsGrid = document.getElementById('projectsGrid');
  var benefitsGrid = document.getElementById('benGrid');
  var eventsList = document.getElementById('foundationEventsList');

  function esc(value) {
    return EgozSupabasePublic.escapeHtml(value);
  }

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

  function localizeBenefit(item) {
    if (getLang() === 'he' || !item || !item.slug) return item;
    var tr = window.EgozBenefitsI18n && EgozBenefitsI18n[item.slug];
    if (!tr) return item;
    return {
      slug: item.slug,
      category: item.category,
      image_url: item.image_url,
      redeem_url: item.redeem_url,
      brand_name: tr.brand_name || item.brand_name,
      title: tr.title || item.title,
      offer_main: tr.offer_main != null ? tr.offer_main : item.offer_main,
      offer_sub: tr.offer_sub != null ? tr.offer_sub : item.offer_sub,
      description: tr.description != null ? tr.description : item.description
    };
  }

  function renderProjects(items) {
    if (!projectsGrid || !items.length) return;
    projectsGrid.innerHTML = items.map(function (item) {
      var url = item.detail_url || '#';
      var external = url.indexOf('http') === 0 ? ' target="_blank" rel="noopener noreferrer"' : '';
      var media = item.image_url
        ? '<figure class="foundation-card__media"><img src="' + esc(item.image_url) + '" alt="' + esc(item.title) + '" loading="lazy" decoding="async" /></figure>'
        : '<div class="foundation-card__ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 6.9H22l-5.8 4.3 2.2 6.8L12 16l-6.4 4 2.2-6.8L2 8.9h7.6z"/></svg></div>';

      return (
        '<a class="foundation-card' + (item.image_url ? ' foundation-card--media' : '') + '" href="' + esc(url) + '"' + external + '>' +
          media +
          '<div class="foundation-card__body">' +
            '<h3 class="foundation-card__title">' + esc(item.title) + '</h3>' +
            (item.description ? '<p class="card__excerpt">' + esc(item.description) + '</p>' : '') +
            '<span class="foundation-card__link">' + esc(t('projects.link', 'לפרטים')) +
              ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></span>' +
          '</div>' +
        '</a>'
      );
    }).join('');
  }

  var BEN_CAT_LABELS = {
    travel: 'benefits.cat.travel',
    health: 'benefits.cat.health',
    shop: 'benefits.cat.shop',
    finance: 'benefits.cat.finance',
    edu: 'benefits.cat.edu'
  };

  function catLabel(category) {
    var key = BEN_CAT_LABELS[category];
    if (!key) return category;
    return t(key, category);
  }

  function benefitExcerpt(text, max) {
    var raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';
    if (raw.length <= max) return raw;
    return raw.slice(0, max).trim() + '…';
  }

  function renderBenefits(items) {
    if (!benefitsGrid || !items.length) return;
    benefitsGrid.innerHTML = items.map(function (item) {
      var localized = localizeBenefit(item);
      var detailUrl = localized.slug ? ('benefits.html#' + localized.slug) : (localized.redeem_url || 'benefits.html');
      var logoHtml = localized.image_url
        ? '<div class="ben__media-frame"><img src="' + esc(localized.image_url) + '" alt="' + esc(localized.brand_name || localized.title) + '" loading="lazy" decoding="async" /></div>'
        : esc(localized.brand_name || '');

      return (
        '<article class="ben" data-c="' + esc(localized.category) + '">' +
          '<div class="ben__logo">' + logoHtml + '</div>' +
          '<div class="ben__body">' +
            '<span class="ben__cat">' + esc(catLabel(localized.category)) + '</span>' +
            '<span class="ben__title">' + esc(localized.title) + '</span>' +
            '<span class="ben__off">' + esc(localized.offer_main) + '<small>' + esc(localized.offer_sub) + '</small></span>' +
            (localized.description ? '<p class="card__excerpt">' + esc(benefitExcerpt(localized.description, 80)) + '</p>' : '') +
            '<div class="ben__foot"><a href="' + esc(detailUrl) + '" class="link-arrow"><span>' +
              esc(t('benefits.redeem', 'קרא הכל')) +
              '</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6"/></svg></a></div>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    if (typeof window.tuneBenefitCardMedia === 'function') {
      window.tuneBenefitCardMedia(benefitsGrid);
    }

    if (typeof window.initBenefitsFilter === 'function') {
      window.initBenefitsFilter();
    }
  }

  function renderFoundationEvents(items) {
    if (!eventsList || !items.length) return;
    var preview = items.slice(0, 3);
    eventsList.innerHTML = preview.map(function (item) {
      var parts = EgozSupabasePublic.formatEventDateParts(item.event_date);
      var url = item.cta_url || 'events.html';
      var external = url.indexOf('http') === 0 ? ' target="_blank" rel="noopener noreferrer"' : '';

      return (
        '<a class="evt-row" href="' + esc(url) + '"' + external + '>' +
          '<time class="evt-row__date" datetime="' + esc(item.event_date) + '">' +
            '<span class="evt-row__day">' + esc(parts.day) + '</span>' +
            '<span class="evt-row__month">' + esc(parts.month) + '</span>' +
          '</time>' +
          '<div class="evt-row__body">' +
            '<h3 class="evt-row__title">' + esc(item.title) + '</h3>' +
            '<p class="evt-row__meta">' + esc(item.description || item.location || '') + '</p>' +
          '</div>' +
          '<span class="evt-row__go" aria-label="לפרטים"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6"/></svg></span>' +
        '</a>'
      );
    }).join('');
  }

  var cachedBenefits = [];

  async function loadContent() {
    var sb = EgozSupabasePublic.getClient();
    if (!sb) return;

    var results = await Promise.all([
      sb.from('site_projects').select('title, description, image_url, detail_url').eq('is_published', true).order('sort_order', { ascending: true }),
      sb.from('site_benefits').select('brand_name, category, title, offer_main, offer_sub, description, slug, image_url, redeem_url').eq('is_published', true).order('sort_order', { ascending: true }),
      sb.from('site_events').select('title, description, event_date, location, cta_url').eq('is_published', true).order('event_date', { ascending: true }).order('sort_order', { ascending: true })
    ]);

    if (results[0].data && results[0].data.length) renderProjects(results[0].data);
    if (results[1].data && results[1].data.length) {
      cachedBenefits = results[1].data;
      renderBenefits(cachedBenefits);
    }
    if (results[2].data && results[2].data.length) renderFoundationEvents(results[2].data);
  }

  document.addEventListener('egoz:langchange', function () {
    if (cachedBenefits.length) renderBenefits(cachedBenefits);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContent);
  } else {
    loadContent();
  }
})();
