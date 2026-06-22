(function () {
  'use strict';

  var gridEl = document.getElementById('eventsGrid');
  if (!gridEl) return;

  var events = [];
  var activeFilter = 'all';

  function esc(value) {
    return EgozSupabasePublic.escapeHtml(value);
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

    if (isPast && event.audience) metaParts.push('<span>' + esc(event.audience) + '</span>');
    else {
      if (event.location) {
        metaParts.push('<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + esc(event.location) + '</span>');
      }
      if (event.event_time) metaParts.push('<span>' + esc(event.event_time) + '</span>');
      if (event.audience) metaParts.push('<span>' + esc(event.audience) + '</span>');
    }

    var badge = event.badge_text && !isPast
      ? '<div class="badge badge--brass" style="margin-bottom:8px;">' + esc(event.badge_text) + '</div>'
      : '';

    var btnClass = isPast ? 'btn btn--ghost btn--sm' : (event.badge_text ? 'btn btn--accent' : 'btn btn--ghost');
    var url = event.cta_url || '#';
    var target = url.indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '';

    return (
      '<article class="ev-card' + (isPast ? ' ev-card--past' : '') + '" data-cat="' + esc(eventCategories(event)) + '">' +
        '<div class="ev-date"><div class="ev-date__d">' + esc(parts.day) + '</div><div class="ev-date__m">' + esc(parts.month) + '</div></div>' +
        '<div class="ev-main">' + badge + '<h3>' + esc(event.title) + '</h3>' +
          '<div class="ev-meta">' + metaParts.join('') + '</div>' +
          (event.description && !isPast ? '<p class="card__excerpt" style="margin-top:8px;">' + esc(event.description) + '</p>' : '') +
        '</div>' +
        '<div class="ev-cta"><a href="' + esc(url) + '"' + target + ' class="' + btnClass + '">' + esc(event.cta_label || 'פרטים') + '</a></div>' +
      '</article>'
    );
  }

  function applyFilter() {
    var cards = gridEl.querySelectorAll('.ev-card');
    cards.forEach(function (card) {
      var cats = card.getAttribute('data-cat') || '';
      card.style.display = (activeFilter === 'all' || cats.indexOf(activeFilter) > -1) ? '' : 'none';
    });
  }

  function bindFilters() {
    document.querySelectorAll('.filter-row button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-row button').forEach(function (x) { x.classList.remove('is-on'); });
        btn.classList.add('is-on');
        activeFilter = btn.getAttribute('data-filter') || 'all';
        applyFilter();
      });
    });
  }

  async function loadEvents() {
    bindFilters();

    var sb = EgozSupabasePublic.getClient();
    if (!sb) return;

    var result = await sb
      .from('site_events')
      .select('id, title, description, event_date, event_time, location, audience, category, badge_text, cta_label, cta_url')
      .eq('is_published', true)
      .order('event_date', { ascending: false })
      .order('sort_order', { ascending: true });

    if (result.error || !result.data || !result.data.length) return;

    events = result.data;
    gridEl.innerHTML = events.map(renderCard).join('');
    applyFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadEvents);
  } else {
    loadEvents();
  }
})();
