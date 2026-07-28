(function () {
  'use strict';

  if (!window.supabase || !window.EGOZ_SUPABASE) return;

  var client = null;

  function getClient() {
    if (!client) {
      client = window.supabase.createClient(
        window.EGOZ_SUPABASE.url,
        window.EGOZ_SUPABASE.anonKey
      );
    }
    return client;
  }

  function navLabel(key, fallbackHe, fallbackEn) {
    if (window.EgozI18n) {
      var pageId = document.body.getAttribute('data-i18n-page') || 'home';
      var lang = EgozI18n.getLang();
      var value = EgozI18n.t(pageId, key, lang);
      if (value) return value;
    }
    var lang = document.documentElement.lang || 'he';
    return lang === 'en' ? fallbackEn : fallbackHe;
  }

  function memberLinks() {
    return document.querySelectorAll(
      '.nav-cta a[href="/join"], .nav-cta a[href="/login"], .nav-cta a[href="/join"], .nav-cta a[href="/account"], ' +
      '.nav-drawer a.m-link[href="/join"], .nav-drawer a.m-link[href="/login"], .nav-drawer a.m-link[href="/account"]'
    );
  }

  function updateMemberNav(isLoggedIn) {
    memberLinks().forEach(function (link) {
      if (isLoggedIn) {
        link.href = '/account';
        link.setAttribute('data-i18n', 'nav.account');
        link.dataset.memberNav = 'account';
        link.textContent = navLabel('nav.account', 'אזור אישי', 'My account');
        return;
      }

      if (link.dataset.memberNav !== 'account') return;

      link.href = '/login';
      link.setAttribute('data-i18n', 'nav.join');
      delete link.dataset.memberNav;
      link.textContent = navLabel('nav.join', 'חבר עמותה', 'Join');
    });
  }

  function syncFromSession() {
    return getClient().auth.getSession().then(function (res) {
      updateMemberNav(!!(res.data && res.data.session));
    });
  }

  function boot() {
    syncFromSession().catch(function () {});

    getClient().auth.onAuthStateChange(function (_event, session) {
      updateMemberNav(!!session);
    });
  }

  document.addEventListener('egoz:langchange', function () {
    syncFromSession().catch(function () {});
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
