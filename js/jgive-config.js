(function () {
  'use strict';

  var EMBED_ID = '18f453e3-701e-4015-9041-a6d3d58acac5';
  var DONATION_TARGET = '5545';

  function langCode(lang) {
    return lang === 'en' ? 'en' : 'he';
  }

  window.EGOZ_JGIVE = {
    embedId: EMBED_ID,
    donationTarget: DONATION_TARGET,
    donatePage: '/donate',
    getEmbedUrl: function (lang) {
      return 'https://www.jgive.com/new/' + langCode(lang) + '/ils/embeds/' + EMBED_ID;
    },
    getDonationUrl: function (lang) {
      return 'https://www.jgive.com/new/' + langCode(lang) + '/ils/donation-targets/' + DONATION_TARGET;
    }
  };
})();
