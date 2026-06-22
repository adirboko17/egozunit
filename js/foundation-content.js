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
      var detailUrl = item.slug ? ('benefits.html#' + item.slug) : (item.redeem_url || 'benefits.html');
      var logoHtml = item.image_url
        ? '<img src="' + esc(item.image_url) + '" alt="' + esc(item.brand_name || item.title) + '" loading="lazy" decoding="async" />'
        : esc(item.brand_name || '');

      return (
        '<article class="ben" data-c="' + esc(item.category) + '">' +
          '<div class="ben__logo">' + logoHtml + '</div>' +
          '<div class="ben__body">' +
            '<span class="ben__cat">' + esc(catLabel(item.category)) + '</span>' +
            '<span class="ben__title">' + esc(item.title) + '</span>' +
            '<span class="ben__off">' + esc(item.offer_main) + '<small>' + esc(item.offer_sub) + '</small></span>' +
            (item.description ? '<p class="card__excerpt">' + esc(benefitExcerpt(item.description, 80)) + '</p>' : '') +
            '<div class="ben__foot"><a href="' + esc(detailUrl) + '" class="link-arrow"><span>' +
              esc(t('benefits.redeem', 'קרא הכל')) +
              '</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6"/></svg></a></div>' +
          '</div>' +
        '</article>'
      );
    }).join('');

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

  async function loadContent() {
    var sb = EgozSupabasePublic.getClient();
    if (!sb) return;

    var results = await Promise.all([
      sb.from('site_projects').select('title, description, image_url, detail_url').eq('is_published', true).order('sort_order', { ascending: true }),
      sb.from('site_benefits').select('brand_name, category, title, offer_main, offer_sub, description, slug, image_url, redeem_url').eq('is_published', true).order('sort_order', { ascending: true }),
      sb.from('site_events').select('title, description, event_date, location, cta_url').eq('is_published', true).order('event_date', { ascending: true }).order('sort_order', { ascending: true })
    ]);

    if (results[0].data && results[0].data.length) renderProjects(results[0].data);
    if (results[1].data && results[1].data.length) renderBenefits(results[1].data);
    if (results[2].data && results[2].data.length) renderFoundationEvents(results[2].data);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContent);
  } else {
    loadContent();
  }
})();
