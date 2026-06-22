(function () {
  'use strict';

  var client = null;

  function getClient() {
    if (client) return client;
    if (!window.supabase || !window.EGOZ_SUPABASE) return null;
    client = window.supabase.createClient(
      window.EGOZ_SUPABASE.url,
      window.EGOZ_SUPABASE.anonKey
    );
    return client;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var HEB_MONTHS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

  function formatEventDateParts(isoDate) {
    if (!isoDate) return { day: '', month: '', datetime: '' };
    var parts = isoDate.split('-');
    if (parts.length !== 3) return { day: '', month: '', datetime: isoDate };
    var monthIndex = Number(parts[1]) - 1;
    return {
      day: String(Number(parts[2])),
      month: HEB_MONTHS[monthIndex] || parts[1],
      datetime: isoDate
    };
  }

  function isPastEvent(isoDate) {
    if (!isoDate) return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var eventDate = new Date(isoDate + 'T00:00:00');
    return eventDate < today;
  }

  window.EgozSupabasePublic = {
    getClient: getClient,
    escapeHtml: escapeHtml,
    formatEventDateParts: formatEventDateParts,
    isPastEvent: isPastEvent,
    HEB_MONTHS: HEB_MONTHS
  };
})();
