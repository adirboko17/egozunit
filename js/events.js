(function () {
  'use strict';

  var gridEl = document.getElementById('eventsGrid');
  if (!gridEl) return;

  var activeFilter = 'all';

  var EVT_CAT_LABELS = {
    ceremony: 'eventsPage.filter.ceremony',
    meetup: 'eventsPage.filter.meetup'
  };

  var FILTER_KEYS = {
    all: 'eventsPage.filter.all',
    up: 'eventsPage.filter.up',
    ceremony: 'eventsPage.filter.ceremony',
    meetup: 'eventsPage.filter.meetup',
    past: 'eventsPage.filter.past'
  };

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

  function catLabel(category) {
    var key = EVT_CAT_LABELS[category];
    if (!key) return category || '';
    return t(key, category);
  }

  function excerpt(text, max) {
    if (!text) return '';
    var flat = text.split('\n\n')[0].replace(/\n/g, ' ');
    if (flat.length <= max) return flat;
    return flat.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }

  function filterLabel(filter) {
    return t(FILTER_KEYS[filter] || filter, filter);
  }

  function renderFilterEmpty() {
    var tag = filterLabel(activeFilter);
    var titleTpl = t('eventsPage.filterEmpty.title', 'כרגע אין אירועים בקטגוריה הזו');
    var title = titleTpl.indexOf('{tag}') > -1 ? titleTpl.replace('{tag}', tag) : titleTpl;
    var lead = t('eventsPage.filterEmpty.lead', 'אירועים חדשים מתפרסמים כאן מעת לעת — נסו קטגוריה אחרת או חזרו לכל האירועים.');
    var allLabel = t('eventsPage.filterEmpty.allBtn', 'הצג את כל האירועים');

    return (
      '<div class="events-filter-empty" aria-live="polite">' +
        '<div class="events-filter-empty__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>' +
        '</div>' +
        '<span class="events-filter-empty__tag">' + esc(tag) + '</span>' +
        '<h2>' + esc(title) + '</h2>' +
        '<p>' + esc(lead) + '</p>' +
        '<button type="button" class="btn btn--ghost" data-filter-reset="all">' + esc(allLabel) + '</button>' +
      '</div>'
    );
  }

  function bindFilterReset() {
    var btn = gridEl.querySelector('[data-filter-reset]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      activeFilter = 'all';
      document.querySelectorAll('.events-filters button, .filter-row button').forEach(function (x) {
        x.classList.toggle('is-on', (x.getAttribute('data-filter') || 'all') === 'all');
      });
      applyFilter();
    });
  }

  function eventCategories(event) {
    var cats = [event.category];
    if (EgozSupabasePublic.isPastEvent(event.event_date)) cats.push('past');
    else cats.push('up');
    return cats.join(' ');
  }

  function renderCard(event) {
    var parts = EgozSupabasePublic.formatEventDateParts(event.event_date);
    var isPast = EgozSupabasePublic.isPastEvent(event.event_date);
    var metaParts = [];

    if (event.location) {
      metaParts.push(
        '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ' +
        esc(event.location) + '</span>'
      );
    }
    if (event.event_time) {
      metaParts.push(
        '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> ' +
        esc(event.event_time) + '</span>'
      );
    }
    if (event.audience) metaParts.push('<span>' + esc(event.audience) + '</span>');

    var badge = event.badge_text && !isPast
      ? '<div class="event-card__badge"><span class="badge badge--brass">' + esc(event.badge_text) + '</span></div>'
      : '';

    var media = event.image_url
      ? '<div class="event-card__media"><img src="' + esc(event.image_url) + '" alt="" loading="lazy" decoding="async" /></div>'
      : '';

    var url = event.slug ? ('event.html?slug=' + encodeURIComponent(event.slug)) : (event.cta_url || '#');
    var desc = excerpt(event.description, 140);

    return (
      '<a class="event-card' + (isPast ? ' event-card--past' : '') + '" href="' + esc(url) + '" data-cat="' + esc(eventCategories(event)) + '">' +
        media +
        '<div class="event-card__date">' +
          '<span class="event-card__date-d">' + esc(parts.day) + '</span>' +
          '<span class="event-card__date-m">' + esc(parts.month) + '</span>' +
        '</div>' +
        '<div class="event-card__body">' +
          (event.category ? '<span class="event-card__cat">' + esc(catLabel(event.category)) + '</span>' : '') +
          badge +
          '<h2 class="event-card__title">' + esc(event.title) + '</h2>' +
          (desc ? '<p class="event-card__excerpt">' + esc(desc) + '</p>' : '') +
          (metaParts.length ? '<div class="event-card__meta">' + metaParts.join('') + '</div>' : '') +
        '</div>' +
        '<span class="event-card__go" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6"/></svg></span>' +
      '</a>'
    );
  }

  function applyFilter() {
    var cards = gridEl.querySelectorAll('.event-card');
    var visible = 0;
    cards.forEach(function (card) {
      var cats = card.getAttribute('data-cat') || '';
      var show = activeFilter === 'all' || cats.indexOf(activeFilter) > -1;
      card.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });

    var filterEmpty = gridEl.querySelector('.events-filter-empty');
    if (visible === 0 && cards.length > 0 && activeFilter !== 'all') {
      if (!filterEmpty) {
        gridEl.insertAdjacentHTML('beforeend', renderFilterEmpty());
        bindFilterReset();
      } else {
        filterEmpty.outerHTML = renderFilterEmpty();
        bindFilterReset();
      }
      filterEmpty = gridEl.querySelector('.events-filter-empty');
      if (filterEmpty) filterEmpty.style.display = '';
    } else if (filterEmpty) {
      filterEmpty.remove();
    }

    var emptyEl = gridEl.querySelector('.events-empty');
    if (emptyEl) emptyEl.style.display = visible ? 'none' : '';
  }

  function bindFilters() {
    document.querySelectorAll('.events-filters button, .filter-row button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.events-filters button, .filter-row button').forEach(function (x) {
          x.classList.remove('is-on');
        });
        btn.classList.add('is-on');
        activeFilter = btn.getAttribute('data-filter') || 'all';
        applyFilter();
      });
    });
  }

  function showEmpty() {
    gridEl.innerHTML =
      '<div class="events-empty">' +
        '<h2>' + esc(t('eventsPage.empty.title', 'אין אירועים כרגע')) + '</h2>' +
        '<p>' + esc(t('eventsPage.empty.lead', 'חזרו בקרוב — אירועים חדשים מתפרסמים כאן.')) + '</p>' +
      '</div>';
  }

  async function loadEvents() {
    bindFilters();

    var sb = EgozSupabasePublic.getClient();
    if (!sb) {
      showEmpty();
      return;
    }

    var result = await sb
      .from('site_events')
      .select('id, title, description, event_date, event_time, location, audience, category, badge_text, cta_label, cta_url, slug, image_url')
      .eq('is_published', true)
      .order('event_date', { ascending: false })
      .order('sort_order', { ascending: true });

    if (result.error || !result.data || !result.data.length) {
      showEmpty();
      return;
    }

    gridEl.innerHTML = result.data.map(renderCard).join('');
    applyFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadEvents);
  } else {
    loadEvents();
  }

  document.addEventListener('egoz:langchange', function () {
    if (gridEl.querySelectorAll('.event-card').length) applyFilter();
  });
})();
