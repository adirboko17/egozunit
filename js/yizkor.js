(function () {
  'use strict';

  var gridEl = document.getElementById('yizkorGrid');
  if (!gridEl) return;

  var fallen = [];

  function lang() {
    return window.EgozI18n ? EgozI18n.getLang() : 'he';
  }

  function t(key) {
    return window.EgozI18n ? (EgozI18n.t('yizkor', key, lang()) || '') : '';
  }

  function pick(obj) {
    if (!obj || typeof obj !== 'object') return obj || '';
    return obj[lang()] || obj.he || obj.en || '';
  }

  function sortFallen(list) {
    return list.slice().sort(function (a, b) {
      var da = a.fallDateISO || '';
      var db = b.fallDateISO || '';
      return da.localeCompare(db);
    });
  }

  function photoHtml(item) {
    if (item.image) {
      var alt = pick(item.name);
      return '<img src="' + item.image + '" alt="' + alt.replace(/"/g, '&quot;') + '" loading="lazy" decoding="async" />';
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

  function render() {
    var list = sortFallen(fallen);
    if (!list.length) {
      gridEl.innerHTML = '<p class="yizkor-empty">' + t('grid.empty') + '</p>';
      return;
    }

    var datePrefix = t('grid.fellOn');
    var cta = t('grid.link');
    var external = t('grid.external');

    gridEl.innerHTML = list.map(function (item) {
      var name = pick(item.name);
      var date = pick(item.fallDate);
      var url = item.memorialUrl || '#';
      var label = name + ' — ' + datePrefix + ' ' + date + '. ' + cta;

      return (
        '<a class="yizkor-card" href="' + url + '" target="_blank" rel="noopener noreferrer"' +
        ' aria-label="' + label.replace(/"/g, '&quot;') + '">' +
        '<div class="yizkor-card__photo' + (item.image ? '' : ' yizkor-card__photo--empty') + '">' +
        photoHtml(item) +
        '</div>' +
        '<div class="yizkor-card__body">' +
        '<h3 class="yizkor-card__name">' + name + '</h3>' +
        '<p class="yizkor-card__date">' + datePrefix + ' ' + date + '</p>' +
        '<span class="yizkor-card__cta">' + cta +
        ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">' +
        '<path d="M15 6l-6 6 6 6"/></svg>' +
        '<span class="visually-hidden">' + external + '</span>' +
        '</span></div></a>'
      );
    }).join('');
  }

  fetch('data/fallen.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load fallen data');
      return res.json();
    })
    .then(function (data) {
      fallen = data.fallen || [];
      render();
    })
    .catch(function () {
      gridEl.innerHTML = '<p class="yizkor-empty">' + t('grid.error') + '</p>';
    });

  document.addEventListener('egoz:langchange', render);
})();
