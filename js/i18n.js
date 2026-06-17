(function () {
  'use strict';

  var STORAGE_KEY = 'egoz-lang';
  var DEFAULT_LANG = 'he';
  var dictionaries = {};

  function getLang() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'he' || saved === 'en') return saved;
    return DEFAULT_LANG;
  }

  function register(pageId, dict) {
    dictionaries[pageId] = dict;
  }

  function t(pageId, key, lang) {
    var page = dictionaries[pageId] || {};
    var bucket = page[lang || getLang()] || {};
    return bucket[key] != null ? bucket[key] : null;
  }

  function apply(pageId) {
    var lang = getLang();
    var html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'he' ? 'rtl' : 'ltr';

    var titleEl = document.querySelector('title[data-i18n-title]');
    if (titleEl) {
      var titleVal = t(pageId, titleEl.getAttribute('data-i18n-title'), lang);
      if (titleVal) document.title = titleVal;
    }

    var metaDesc = document.querySelector('meta[name="description"][data-i18n-desc]');
    if (metaDesc) {
      var descVal = t(pageId, metaDesc.getAttribute('data-i18n-desc'), lang);
      if (descVal) metaDesc.setAttribute('content', descVal);
    }

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = t(pageId, key, lang);
      if (val != null) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      var val = t(pageId, key, lang);
      if (val != null) el.innerHTML = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var val = t(pageId, key, lang);
      if (val != null) el.setAttribute('placeholder', val);
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt');
      var val = t(pageId, key, lang);
      if (val != null) el.setAttribute('alt', val);
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      var val = t(pageId, key, lang);
      if (val != null) el.setAttribute('aria-label', val);
    });

    document.querySelectorAll('.lang-switch__btn').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    document.dispatchEvent(new CustomEvent('egoz:langchange', { detail: { lang: lang } }));
  }

  function setLang(lang, pageId) {
    if (lang !== 'he' && lang !== 'en') return;
    localStorage.setItem(STORAGE_KEY, lang);
    apply(pageId);
  }

  function init(pageId) {
    document.querySelectorAll('.lang-switch__btn[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.getAttribute('data-lang'), pageId);
      });
    });
    apply(pageId);
  }

  window.EgozI18n = {
    register: register,
    getLang: getLang,
    setLang: setLang,
    apply: apply,
    init: init,
    t: t
  };
})();
