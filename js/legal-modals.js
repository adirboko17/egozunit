(function () {
  'use strict';

  var cache = {};
  var modal = null;
  var titleEl = null;
  var bodyEl = null;
  var lastFocus = null;

  var docs = {
    privacy: {
      title: 'מדיניות הפרטיות',
      url: '/privacy',
      selector: '.privacy-doc'
    },
    bylaws: {
      title: 'תקנון העמותה',
      url: '/bylaws',
      selector: '.bylaws-doc'
    }
  };

  function loadDoc(key) {
    if (cache[key]) return Promise.resolve(cache[key]);
    var meta = docs[key];
    if (!meta) return Promise.reject(new Error('missing_doc'));
    return fetch(meta.url)
      .then(function (res) {
        if (!res.ok) throw new Error('load_failed');
        return res.text();
      })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, 'text/html');
        var node = parsed.querySelector(meta.selector);
        if (!node) throw new Error('content_missing');
        cache[key] = node.innerHTML;
        return cache[key];
      });
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('legal-modal-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function docTitle(key) {
    var meta = docs[key];
    if (!meta) return '';
    if (window.EgozI18n) {
      var pageId = document.body.getAttribute('data-i18n-page') || 'join';
      var val = EgozI18n.t(pageId, 'legal.' + key + 'Title', EgozI18n.getLang());
      if (val) return val;
    }
    return meta.title;
  }

  function openModal(key) {
    if (!modal || !titleEl || !bodyEl) return;
    var meta = docs[key];
    if (!meta) return;

    lastFocus = document.activeElement;
    titleEl.textContent = docTitle(key);
    bodyEl.innerHTML = '<p class="legal-modal__loading">טוען...</p>';
    modal.hidden = false;
    document.body.classList.add('legal-modal-open');
    modal.querySelector('.legal-modal__close').focus();

    loadDoc(key)
      .then(function (html) {
        bodyEl.innerHTML = html;
      })
      .catch(function () {
        bodyEl.innerHTML = '<p class="legal-modal__loading">לא הצלחנו לטעון את המסמך. נסו שוב או פנו ל-<a href="mailto:office@egoz.org.il">office@egoz.org.il</a>.</p>';
      });
  }

  function init() {
    modal = document.getElementById('legalModal');
    titleEl = document.getElementById('legalModalTitle');
    bodyEl = document.getElementById('legalModalBody');
    if (!modal) return;

    if (!document.documentElement.dataset.legalModalsBound) {
      document.documentElement.dataset.legalModalsBound = '1';
      document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-legal-modal]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        openModal(btn.getAttribute('data-legal-modal'));
      });
    }

    modal.querySelectorAll('[data-legal-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
    });
  }

  window.EgozLegalModals = { init: init, open: openModal, close: closeModal };
})();
