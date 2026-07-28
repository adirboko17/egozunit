(function () {
  'use strict';

  var STORAGE_KEY = 'egoz-lang';
  var DEFAULT_LANG = 'he';
  var dictionaries = {};
  var langSwitchBound = false;
  var applying = false;

  function getLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'he' || saved === 'en') return saved;
    } catch (err) {}
    return DEFAULT_LANG;
  }

  function register(pageId, dict) {
    dictionaries[pageId] = dict;
  }

  function registerShared(dict) {
    dictionaries._shared = dict;
  }

  function t(pageId, key, lang) {
    var l = lang || getLang();
    var page = dictionaries[pageId] || {};
    var bucket = page[l] || {};
    if (bucket[key] != null) return bucket[key];
    var shared = dictionaries._shared || {};
    var sb = shared[l] || {};
    return sb[key] != null ? sb[key] : null;
  }

  function resolvePageId(pageId) {
    if (pageId) return pageId;
    return document.body ? document.body.getAttribute('data-i18n-page') : null;
  }

  function apply(pageId) {
    var resolvedPageId = resolvePageId(pageId);
    if (!resolvedPageId || applying) return;
    applying = true;

    try {
      var lang = getLang();
      var html = document.documentElement;
      html.lang = lang;
      html.dir = lang === 'he' ? 'rtl' : 'ltr';

      var titleEl = document.querySelector('title[data-i18n-title]');
      if (titleEl) {
        var titleVal = t(resolvedPageId, titleEl.getAttribute('data-i18n-title'), lang);
        if (titleVal) document.title = titleVal;
      }

      var metaDesc = document.querySelector('meta[name="description"][data-i18n-desc]');
      if (metaDesc) {
        var descVal = t(resolvedPageId, metaDesc.getAttribute('data-i18n-desc'), lang);
        if (descVal) metaDesc.setAttribute('content', descVal);
      }

      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        var val = t(resolvedPageId, key, lang);
        if (val != null) el.textContent = val;
      });

      document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-html');
        var val = t(resolvedPageId, key, lang);
        if (val != null) el.innerHTML = val;
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-placeholder');
        var val = t(resolvedPageId, key, lang);
        if (val != null) el.setAttribute('placeholder', val);
      });

      document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-alt');
        var val = t(resolvedPageId, key, lang);
        if (val != null) el.setAttribute('alt', val);
      });

      document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-aria');
        var val = t(resolvedPageId, key, lang);
        if (val != null) el.setAttribute('aria-label', val);
      });

      document.querySelectorAll('.lang-switch__btn').forEach(function (btn) {
        var active = btn.getAttribute('data-lang') === lang;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      document.dispatchEvent(new CustomEvent('egoz:langchange', { detail: { lang: lang } }));
    } finally {
      applying = false;
    }
  }

  function setLang(lang, pageId) {
    if (lang !== 'he' && lang !== 'en') return;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {}
    apply(pageId);
  }

  function bindLangSwitch() {
    if (langSwitchBound) return;
    langSwitchBound = true;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-switch__btn[data-lang]');
      if (!btn) return;
      var lang = btn.getAttribute('data-lang');
      var pid = resolvePageId();
      if (!pid || (lang !== 'he' && lang !== 'en')) return;
      e.preventDefault();
      setLang(lang, pid);
    });
  }

  function init(pageId) {
    bindLangSwitch();
    apply(pageId);
  }

  function bootFromPage() {
    bindLangSwitch();
    var pageId = resolvePageId();
    if (pageId) apply(pageId);
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  bindLangSwitch();
  onReady(bootFromPage);

  window.EgozI18n = {
    register: register,
    registerShared: registerShared,
    getLang: getLang,
    setLang: setLang,
    apply: apply,
    init: init,
    t: t
  };
})();
