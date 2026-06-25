(function () {
  'use strict';

  var TYPE_LABELS = {
    article: 'כתבה',
    video: 'סרטון'
  };

  function esc(value) {
    return EgozSupabasePublic.escapeHtml(value);
  }

  function externalAttrs(url) {
    if (!url || url.indexOf('http') !== 0) return '';
    return ' target="_blank" rel="noopener noreferrer"';
  }

  function imageMarkup(item, className) {
    if (item.image_url) {
      return '<img class="' + esc(className || '') + '" src="' + esc(item.image_url) + '" alt="" loading="lazy" decoding="async" />';
    }
    return '<div class="' + esc(className || '') + ' media-item__placeholder">' + esc(TYPE_LABELS[item.media_type] || '') + '</div>';
  }

  function renderHomeCard(item) {
    var url = item.link_url || '#';
    var isVideo = item.media_type === 'video';
    var typeLabel = TYPE_LABELS[item.media_type] || 'תקשורת';
    var desc = item.description
      ? '<p class="media-card__desc">' + esc(item.description) + '</p>'
      : '';
    var playBtn = isVideo
      ? '<span class="media-card__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>'
      : '';
    var actionLabel = isVideo ? 'לצפייה' : 'לכתבה';

    return (
      '<a href="' + esc(url) + '" class="media-card"' + externalAttrs(url) + '>' +
        '<div class="media-card__media">' +
          imageMarkup(item, 'media-card__img') +
          '<span class="media-card__badge media-card__badge--' + esc(item.media_type || 'article') + '">' + esc(typeLabel) + '</span>' +
          playBtn +
        '</div>' +
        '<div class="media-card__body">' +
          '<h3 class="media-card__title">' + esc(item.title) + '</h3>' +
          desc +
          '<span class="media-card__action">' + esc(actionLabel) +
            ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6"/></svg></span>' +
        '</div>' +
      '</a>'
    );
  }

  function renderUnitRow(item) {
    var url = item.link_url || '#';

    return (
      '<a href="' + esc(url) + '" class="unit-media-row"' + externalAttrs(url) + '>' +
        '<div class="unit-media-row__thumb">' + imageMarkup(item, 'unit-media-row__img') + '</div>' +
        '<div class="unit-media-row__body">' +
          '<span class="unit-media-row__src">' + esc(TYPE_LABELS[item.media_type] || 'תקשורת') + '</span>' +
          '<div class="unit-media-row__title">' + esc(item.title) + '</div>' +
          (item.description ? '<p class="unit-media-row__desc">' + esc(item.description) + '</p>' : '') +
        '</div>' +
        '<span class="unit-media-row__arrow" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg></span>' +
      '</a>'
    );
  }

  function chunk(items, size) {
    var groups = [];
    for (var i = 0; i < items.length; i += size) {
      groups.push(items.slice(i, i + size));
    }
    return groups;
  }

  var homeMediaItems = [];
  var homeResizeTimer = null;

  function rebuildHomeSlides() {
    var track = document.getElementById('homeMediaTrack');
    if (!track) return;

    if (!homeMediaItems.length) {
      track.innerHTML =
        '<div class="unit-media-carousel__slide">' +
          '<div class="media-empty">אין עדיין פריטי תקשורת.</div>' +
        '</div>';
      return;
    }

    track.innerHTML = homeMediaItems.map(function (item) {
      return '<div class="unit-media-carousel__slide">' + renderHomeCard(item) + '</div>';
    }).join('');
  }

  function renderHomeCarousel(items) {
    var carousel = document.querySelector('[data-home-media-carousel]');
    homeMediaItems = items || [];

    if (!carousel) return;

    rebuildHomeSlides();

    if (window.EgozHomeMediaCarousel && typeof window.EgozHomeMediaCarousel.init === 'function') {
      window.EgozHomeMediaCarousel.init(carousel);
    }
  }

  function onHomeCarouselResize() {
    if (!document.getElementById('homeMediaTrack') || !homeMediaItems.length) return;
    clearTimeout(homeResizeTimer);
    homeResizeTimer = window.setTimeout(function () {
      rebuildHomeSlides();
      var carousel = document.querySelector('[data-home-media-carousel]');
      if (carousel && window.EgozHomeMediaCarousel) {
        window.EgozHomeMediaCarousel.init(carousel);
      }
    }, 150);
  }

  window.addEventListener('resize', onHomeCarouselResize, { passive: true });

  function renderUnitCarousel(items) {
    var track = document.getElementById('unitMediaTrack');
    var carousel = document.querySelector('[data-unit-media-carousel]');
    if (!track || !carousel) return;

    if (!items.length) {
      track.innerHTML =
        '<div class="unit-media-carousel__slide">' +
          '<div class="media-empty media-empty--unit">אין עדיין פריטי תקשורת.</div>' +
        '</div>';
    } else {
      var slides = chunk(items, 3);
      track.innerHTML = slides.map(function (group) {
        return '<div class="unit-media-carousel__slide">' + group.map(renderUnitRow).join('') + '</div>';
      }).join('');
    }

    if (window.EgozUnitMediaCarousel && typeof window.EgozUnitMediaCarousel.init === 'function') {
      window.EgozUnitMediaCarousel.init(carousel);
    }
  }

  async function loadMedia() {
    var sb = EgozSupabasePublic.getClient();
    if (!sb) return;

    var result = await sb
      .from('site_media')
      .select('id, title, description, image_url, link_url, media_type, sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (result.error) return;
    var items = result.data || [];

    renderHomeCarousel(items);
    renderUnitCarousel(items);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMedia);
  } else {
    loadMedia();
  }
})();
