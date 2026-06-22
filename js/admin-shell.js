(function () {
  'use strict';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initShell(options) {
    options = options || {};
    var page = options.page || '';
    var emailEl = document.getElementById('adminEmail');
    var logoutBtn = document.getElementById('logoutBtn');

    document.querySelectorAll('[data-admin-nav]').forEach(function (link) {
      if (link.getAttribute('data-admin-nav') === page) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });

    return EgozAdminAuth.requireAdmin().then(function (session) {
      if (!session) return null;
      if (emailEl) emailEl.textContent = session.user.email || '';
      return session;
    }).then(function (session) {
      if (!session) return null;

      if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
          EgozAdminAuth.signOut().then(function () {
            window.location.replace('/admin/login.html');
          });
        });
      }

      if (typeof options.onReady === 'function') {
        return options.onReady(session);
      }

      return session;
    });
  }

  window.EgozAdminShell = {
    init: initShell,
    escapeHtml: escapeHtml
  };
})();
