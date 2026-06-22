(function () {
  'use strict';

  var gridEl = document.getElementById('yizkorGrid');
  if (!gridEl) return;

  var modalEl = document.getElementById('yizkorModal');
  var modalTitleEl = document.getElementById('yizkorModalTitle');
  var modalDateEl = document.getElementById('yizkorModalDate');
  var modalPhotoEl = document.getElementById('yizkorModalPhoto');
  var modalBodyEl = document.getElementById('yizkorModalBody');
  var localMemorials = {};
  var fallen = [];
  var searchQuery = '';
  var lastFocusEl = null;
  var searchEl = document.getElementById('yizkorSearch');
  var searchStatusEl = document.getElementById('yizkorSearchStatus');
  var countEl = document.getElementById('yizkorCount');

  function t(key) {
    return window.EgozI18n ? (EgozI18n.t('yizkor', key) || '') : '';
  }

  function esc(value) {
    return EgozSupabasePublic.escapeHtml(value);
  }

  function normalizeMemorialUrl(url) {
    return String(url || '').replace(/\/$/, '');
  }

  function getLocalMemorial(url) {
    return localMemorials[normalizeMemorialUrl(url)] || null;
  }

  function sanitizeMemorialHtml(html) {
    return String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '');
  }

  function candleHtml() {
    return (
      '<span class="yizkor-card__candle" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="none">' +
      '<path class="yizkor-card__flame" d="M12 2c1.8 2.6 2.8 4.1 2.8 5.6a2.8 2.8 0 11-5.6 0c0-1.5 1-3 2.8-5.6z" fill="currentColor"/>' +
      '<rect x="9.2" y="12" width="5.6" height="8.2" rx="1" stroke="currentColor" stroke-width="1.4"/>' +
      '<path d="M7 20.4h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
      '</svg></span>'
    );
  }

  function photoHtml(item) {
    if (item.image_url) {
      return '<img src="' + esc(item.image_url) + '" alt="' + esc(item.name) + '" loading="lazy" decoding="async" />';
    }
    return (
      '<span class="yizkor-card__photo--empty" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">' +
      '<path d="M12 2c1.8 2.6 2.8 4.1 2.8 5.6a2.8 2.8 0 11-5.6 0c0-1.5 1-3 2.8-5.6z" fill="currentColor" opacity=".35"/>' +
      '<rect x="9.2" y="12" width="5.6" height="8.2" rx="1"/>' +
      '<path d="M7 20.4h10" stroke-linecap="round"/>' +
      '</svg></span>'
    );
  }

  function formatFallDateHtml(fallDate) {
    var raw = String(fallDate || '').trim();
    if (!raw) return '';
    var parts = raw.split('|');
    if (parts.length < 2) {
      return '<p class="yizkor-card__date">' + esc(raw) + '</p>';
    }
    return (
      '<p class="yizkor-card__date">' + esc(parts[0].trim()) + '</p>' +
      '<p class="yizkor-card__place">' + esc(parts.slice(1).join('|').trim()) + '</p>'
    );
  }

  function cardBodyHtml(item, cta) {
    var name = item.name || '';
    return (
      '<div class="yizkor-card__body">' +
      '<h3 class="yizkor-card__name">' + esc(name) + '</h3>' +
      formatFallDateHtml(item.fall_date) +
      '<span class="yizkor-card__cta">' + esc(cta) +
      ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">' +
      '<path d="M15 6l-6 6 6 6"/></svg>' +
      '</span></div>'
    );
  }

  function renderCard(item) {
    var name = item.name || '';
    var date = item.fall_date || '';
    var url = item.memorial_url || '#';
    var local = getLocalMemorial(url);
    var cta = local ? t('grid.linkRead') : t('grid.link');
    var external = t('grid.external');
    var label = name + (date ? ' — ' + date : '') + '. ' + cta + (local ? '' : '. ' + external);
    var photoBlock =
      '<div class="yizkor-card__photo' + (item.image_url ? '' : ' yizkor-card__photo--empty') + '">' +
      photoHtml(item) +
      candleHtml() +
      '</div>';

    if (local) {
      return (
        '<button type="button" class="yizkor-card yizkor-card--local"' +
        ' data-memorial-url="' + esc(normalizeMemorialUrl(url)) + '"' +
        ' aria-label="' + esc(label) + '">' +
        photoBlock +
        cardBodyHtml(item, cta) +
        '</button>'
      );
    }

    return (
      '<a class="yizkor-card" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"' +
      ' aria-label="' + esc(label) + '">' +
      photoBlock +
      cardBodyHtml(item, cta) +
      '<span class="visually-hidden">' + esc(external) + '</span>' +
      '</a>'
    );
  }

  function filteredFallen() {
    var q = searchQuery.trim().toLowerCase();
    if (!q) return fallen;
    return fallen.filter(function (item) {
      return String(item.name || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  function updateSearchStatus(count) {
    if (countEl) {
      if (!fallen.length) {
        countEl.textContent = '';
      } else if (!searchQuery.trim()) {
        countEl.textContent = t('search.count').replace('{count}', String(fallen.length));
      } else {
        countEl.textContent = t('search.countFiltered')
          .replace('{shown}', String(count))
          .replace('{total}', String(fallen.length));
      }
    }

    if (!searchStatusEl) return;
    if (!searchQuery.trim()) {
      searchStatusEl.textContent = '';
      searchStatusEl.classList.add('visually-hidden');
      return;
    }
    var msg = count
      ? t('search.results').replace('{count}', String(count))
      : t('search.noResults');
    searchStatusEl.textContent = msg;
    searchStatusEl.classList.toggle('visually-hidden', false);
  }

  function render() {
    if (!fallen.length) {
      gridEl.innerHTML = '<p class="yizkor-empty">' + t('grid.empty') + '</p>';
      updateSearchStatus(0);
      return;
    }

    var items = filteredFallen();
    updateSearchStatus(items.length);

    if (!items.length) {
      gridEl.innerHTML = '<p class="yizkor-empty">' + t('search.noResults') + '</p>';
      return;
    }

    gridEl.innerHTML = items.map(renderCard).join('');
    gridEl.querySelectorAll('.yizkor-card--local').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(btn.getAttribute('data-memorial-url'));
      });
    });
  }

  function openModal(memorialUrl) {
    var local = localMemorials[normalizeMemorialUrl(memorialUrl)];
    if (!local || !modalEl) return;

    var item = fallen.find(function (row) {
      return normalizeMemorialUrl(row.memorial_url) === normalizeMemorialUrl(memorialUrl);
    }) || { name: local.name, fall_date: '', image_url: '' };

    lastFocusEl = document.activeElement;

    modalTitleEl.textContent = item.name || local.name || '';
    modalDateEl.textContent = item.fall_date || '';
    modalDateEl.hidden = !item.fall_date;

    if (item.image_url) {
      modalPhotoEl.innerHTML = '<img src="' + esc(item.image_url) + '" alt="" />';
      modalPhotoEl.hidden = false;
    } else {
      modalPhotoEl.innerHTML = '';
      modalPhotoEl.hidden = true;
    }

    modalBodyEl.innerHTML = sanitizeMemorialHtml(local.content);
    modalEl.hidden = false;
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('yizkor-modal-open');

    var closeBtn = modalEl.querySelector('.yizkor-modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modalEl || modalEl.hidden) return;
    modalEl.hidden = true;
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('yizkor-modal-open');
    modalBodyEl.innerHTML = '';
    if (lastFocusEl && typeof lastFocusEl.focus === 'function') {
      lastFocusEl.focus();
    }
  }

  function bindModal() {
    if (!modalEl) return;
    modalEl.querySelectorAll('[data-yizkor-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  async function loadLocalMemorials() {
    try {
      var res = await fetch('js/yizkor-local-memorials.json', { cache: 'no-cache' });
      if (!res.ok) return;
      localMemorials = await res.json();
    } catch (err) {
      localMemorials = {};
    }
  }

  async function loadFallen() {
    var sb = EgozSupabasePublic.getClient();
    if (!sb) {
      gridEl.innerHTML = '<p class="yizkor-empty">' + t('grid.error') + '</p>';
      return;
    }

    try {
      await loadLocalMemorials();
      var result = await sb
        .from('fallen_soldiers')
        .select('name, fall_date, image_url, memorial_url')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (result.error) throw result.error;
      fallen = result.data || [];
      render();
    } catch (err) {
      gridEl.innerHTML = '<p class="yizkor-empty">' + t('grid.error') + '</p>';
    }
  }

  bindModal();

  if (searchEl) {
    searchEl.setAttribute('aria-label', t('search.label'));
    searchEl.addEventListener('input', function () {
      searchQuery = searchEl.value;
      render();
    });
    document.addEventListener('egoz:langchange', function () {
      searchEl.setAttribute('aria-label', t('search.label'));
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFallen);
  } else {
    loadFallen();
  }
})();
