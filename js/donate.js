(function () {
  'use strict';

  var iframe = document.getElementById('jgive-iframe');
  var externalLink = document.getElementById('jgiveExternalLink');
  if (!iframe || !window.EGOZ_JGIVE) return;

  function applyLang(lang) {
    var l = lang || (window.EgozI18n && EgozI18n.getLang()) || 'he';
    var donationUrl = EGOZ_JGIVE.getDonationUrl(l);

    if (externalLink) externalLink.href = donationUrl;
    iframe.src = EGOZ_JGIVE.getEmbedUrl(l);
    iframe.title = EgozI18n ? (EgozI18n.t('donate', 'iframe.title', l) || iframe.title) : iframe.title;
  }

  applyLang();
  document.addEventListener('egoz:langchange', function (e) {
    applyLang(e.detail && e.detail.lang);
  });
})();
