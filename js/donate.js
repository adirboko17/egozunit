(function () {
  'use strict';

  var iframe = document.getElementById('jgive-iframe');
  var iframeWrap = document.getElementById('jgiveIframeWrap');
  var fallback = document.getElementById('jgiveFallback');
  var fallbackBtn = document.getElementById('jgiveFallbackBtn');
  var externalLink = document.getElementById('jgiveExternalLink');
  if (!iframe || !window.EGOZ_JGIVE) return;

  function isEmbedAllowedHost() {
    var host = window.location.hostname;
    if (host === 'egoz.org.il') return true;
    if (host.slice(-12) === '.egoz.org.il') return true;
    return false;
  }

  function applyLang(lang) {
    var l = lang || (window.EgozI18n && EgozI18n.getLang()) || 'he';
    var donationUrl = EGOZ_JGIVE.getDonationUrl(l);

    if (externalLink) externalLink.href = donationUrl;
    if (fallbackBtn) fallbackBtn.href = donationUrl;

    if (!isEmbedAllowedHost()) {
      if (iframeWrap) iframeWrap.hidden = true;
      if (fallback) fallback.hidden = false;
      iframe.removeAttribute('src');
      return;
    }

    if (iframeWrap) iframeWrap.hidden = false;
    if (fallback) fallback.hidden = true;
    iframe.src = EGOZ_JGIVE.getEmbedUrl(l);
    iframe.title = EgozI18n ? (EgozI18n.t('donate', 'iframe.title', l) || iframe.title) : iframe.title;
  }

  applyLang();
  document.addEventListener('egoz:langchange', function (e) {
    applyLang(e.detail && e.detail.lang);
  });
})();
