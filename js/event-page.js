(function () {
  'use strict';

  var rootEl = document.getElementById('eventRoot');
  var heroTitleEl = document.getElementById('eventHeroTitle');
  var pageTitleEl = document.getElementById('pageTitle');
  var pageDescEl = document.getElementById('pageDesc');

  function esc(value) {
    return EgozSupabasePublic.escapeHtml(value);
  }

  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    return (params.get('slug') || '').trim();
  }

  function formatDisplayDate(isoDate) {
    if (!isoDate) return '';
    var parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return parts[2].padStart(2, '0') + '/' + parts[1].padStart(2, '0') + '/' + parts[0];
  }

  function bodyHtml(text) {
    var raw = String(text || '').trim();
    if (!raw) return '';
    return raw.split(/\n\s*\n/).map(function (para, index) {
      var cls = index === 0 ? 'lead' : '';
      return '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(para.trim().replace(/\n/g, ' ')) + '</p>';
    }).join('');
  }

  function youtubeEmbed(url) {
    if (!url) return null;
    var match = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]+)/);
    if (!match) return null;
    var id = match[1];
    var startMatch = String(url).match(/[?&]t=(\d+)/);
    var start = startMatch ? startMatch[1] : '';
    return 'https://www.youtube.com/embed/' + id + (start ? '?start=' + start : '');
  }

  function isYoutubeUrl(url) {
    return /youtube\.com|youtu\.be/.test(String(url || ''));
  }

  function render(event) {
    if (pageTitleEl) pageTitleEl.textContent = event.title + ' - עמותת אגוז';
    if (pageDescEl) pageDescEl.setAttribute('content', event.description ? event.description.split('\n')[0] : event.title);
    if (heroTitleEl) heroTitleEl.textContent = event.title;

    var embedSrc = youtubeEmbed(event.cta_url);
    var posterHtml = event.image_url
      ? '<figure class="event-poster event-layout__poster"><img src="' + esc(event.image_url) + '" alt="' + esc(event.title) + '" decoding="async" /></figure>'
      : '';

    var audienceHtml = event.audience
      ? '<div class="event-meta__item"><span class="event-meta__label">קהל יעד</span><span class="event-meta__value">' + esc(event.audience) + '</span></div>'
      : '';

    var locationHtml = '';
    if (event.location) {
      if (isYoutubeUrl(event.cta_url)) {
        locationHtml = '<div class="event-meta__item"><span class="event-meta__label">מיקום</span><span class="event-meta__value">' + esc(event.location) + '</span></div>';
      } else if (isYoutubeUrl(event.location)) {
        locationHtml = '<div class="event-meta__item"><span class="event-meta__label">מיקום</span><span class="event-meta__value"><a href="' + esc(event.location) + '" target="_blank" rel="noopener noreferrer">' + esc(event.location) + '</a></span></div>';
      } else {
        locationHtml = '<div class="event-meta__item"><span class="event-meta__label">מיקום</span><span class="event-meta__value">' + esc(event.location) + '</span></div>';
      }
    }

    var videoHtml = embedSrc
      ? '<section class="event-video">' +
          '<h2 class="event-video__title">' + esc(event.cta_label || 'צפייה באירוע') + '</h2>' +
          '<div class="event-video__frame">' +
            '<iframe src="' + esc(embedSrc) + '" title="' + esc(event.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>' +
          '</div>' +
        '</section>'
      : (event.cta_url
        ? '<div class="event-meta__item" style="margin-top:8px;"><a href="' + esc(event.cta_url) + '" class="btn btn--accent btn--block" target="_blank" rel="noopener noreferrer">' + esc(event.cta_label || 'לפרטים') + '</a></div>'
        : '');

    rootEl.innerHTML =
      '<nav class="event-crumb" aria-label="מיקום בעמוד">' +
        '<a href="/foundation">עמותה</a>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>' +
        '<a href="/events">אירועים</a>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>' +
        '<span>' + esc(event.title) + '</span>' +
      '</nav>' +
      '<div class="event-layout">' +
        '<div class="event-body">' + bodyHtml(event.description) + '</div>' +
        posterHtml +
        '<aside class="event-meta">' +
          '<div class="event-meta__item"><span class="event-meta__label">תאריך</span><span class="event-meta__value">' + esc(formatDisplayDate(event.event_date)) + '</span></div>' +
          (event.event_time ? '<div class="event-meta__item"><span class="event-meta__label">שעה</span><span class="event-meta__value">' + esc(event.event_time) + '</span></div>' : '') +
          locationHtml +
          audienceHtml +
          (event.cta_url && !embedSrc
            ? '<div class="event-meta__item"><span class="event-meta__label">קישור</span><span class="event-meta__value"><a href="' + esc(event.cta_url) + '" target="_blank" rel="noopener noreferrer">' + esc(event.cta_label || event.cta_url) + '</a></span></div>'
            : '') +
        '</aside>' +
      '</div>' +
      videoHtml;
  }

  function renderNotFound() {
    if (heroTitleEl) heroTitleEl.textContent = 'אירוע לא נמצא';
    rootEl.innerHTML =
      '<div class="event-empty">' +
        '<h2>האירוע לא נמצא</h2>' +
        '<p>ייתכן שהאירוע הוסר או שהקישור שגוי.</p>' +
        '<a href="/events" class="btn btn--accent" style="margin-top:20px;">חזרה לאירועים</a>' +
      '</div>';
  }

  async function loadEvent() {
    var slug = getSlug();
    if (!slug) return renderNotFound();

    var sb = EgozSupabasePublic.getClient();
    if (!sb) return renderNotFound();

    var result = await sb
      .from('site_events')
      .select('title, description, event_date, event_time, location, audience, category, image_url, cta_label, cta_url, slug')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (result.error || !result.data) return renderNotFound();
    render(result.data);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadEvent);
  } else {
    loadEvent();
  }
})();
