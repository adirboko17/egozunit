(function () {
  'use strict';

  var U = window.EgozAdminUtils;
  var allItems = [];
  var openId = null;

  var FREQ_LABELS = { one_time: 'חד־פעמית', monthly: 'פעם בחודש' };

  function esc(value) {
    return EgozAdminShell.escapeHtml(value);
  }

  function fmtDate(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleDateString('he-IL'); } catch (e) { return value; }
  }

  function fmtAmount(item) {
    if (!item.donation_amount) return '—';
    return item.donation_amount + ' ₪ · ' + (FREQ_LABELS[item.donation_frequency] || item.donation_frequency);
  }

  function renderItems(items) {
    var listEl = U.$('itemsList');
    var query = (U.$('itemSearch').value || '').trim().toLowerCase();
    var filtered = !query ? items : items.filter(function (item) {
      return [item.full_name, item.email, item.phone, item.city].join(' ').toLowerCase().indexOf(query) !== -1;
    });

    U.updateCount('itemsCount', filtered.length, items.length, {
      empty: 'אין עדיין נרשמים',
      one: 'שגריר/ה אחד/ת',
      many: 'שגרירים'
    });

    if (!items.length) {
      listEl.innerHTML = '<div class="admin-empty">עדיין אין הרשמות לתוכנית שגרירי אגוז.</div>';
      return;
    }
    if (!filtered.length) {
      listEl.innerHTML = '<div class="admin-empty">לא נמצאו תוצאות.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(function (item) {
      return (
        '<article class="admin-product" data-id="' + esc(item.id) + '">' +
          '<div class="admin-product__media admin-product__thumb--empty" style="width:64px;">' + esc((item.full_name || item.email || '?')[0].toUpperCase()) + '</div>' +
          '<div class="admin-product__body">' +
            '<div class="admin-product__head">' +
              '<b class="admin-product__name">' + esc(item.full_name || 'ללא שם') + '</b>' +
              '<span class="admin-product__price">' + esc(fmtAmount(item)) + '</span>' +
            '</div>' +
            '<p class="admin-product__desc">' + esc(item.email || '') + (item.phone ? ' · ' + esc(item.phone) : '') + '</p>' +
            '<div class="admin-product__meta">' +
              (item.join_agudat_yedidim ? '<span class="admin-product__badge is-live">אגודת ידידים</span>' : '') +
              '<span class="admin-product__badge">נרשם ' + esc(fmtDate(item.created_at)) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="admin-product__actions">' +
            '<button type="button" class="admin-btn admin-btn--sm admin-btn--ghost" data-action="view">פרטים</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function detailRow(label, value) {
    return '<div class="admin-detail__row"><span class="admin-detail__label">' + esc(label) + '</span><span class="admin-detail__value">' + esc(value || '—') + '</span></div>';
  }

  function renderDetail(item) {
    var html = '';
    html += detailRow('שם מלא', item.full_name);
    html += detailRow('מייל', item.email);
    html += detailRow('טלפון', item.phone);
    html += detailRow('כתובת', [item.address, item.city, item.zip, item.country].filter(Boolean).join(', '));
    html += detailRow('סוג תרומה', FREQ_LABELS[item.donation_frequency] || item.donation_frequency);
    html += detailRow('סכום', item.donation_amount ? item.donation_amount + ' ₪' : '—');
    html += detailRow('הצטרפות לאגודת ידידים', item.join_agudat_yedidim ? 'כן' : 'לא');
    html += detailRow('אישר הודעת פרטיות', item.accepted_privacy_policy ? 'כן' : 'לא');
    html += detailRow('נרשם בתאריך', fmtDate(item.created_at));
    U.$('detailBody').innerHTML = html;
  }

  function openDetail(item) {
    openId = item.id;
    U.$('formTitle').textContent = item.full_name || 'פרטי שגריר/ה';
    renderDetail(item);
    U.openModal('itemModal');
  }

  async function loadItems() {
    U.$('itemsList').innerHTML = '<div class="admin-empty">טוען...</div>';
    var result = await EgozAdminAuth.getClient()
      .from('ambassador_signups')
      .select('*')
      .order('created_at', { ascending: false });

    if (result.error) throw result.error;
    allItems = result.data || [];
    renderItems(allItems);
  }

  async function handleListClick(event) {
    var btn = event.target.closest('[data-action]');
    if (!btn) return;
    var card = btn.closest('.admin-product');
    if (!card) return;
    var id = card.getAttribute('data-id');
    var item = allItems.find(function (i) { return i.id === id; });
    if (item) openDetail(item);
  }

  async function handleDelete() {
    if (!openId) return;
    if (!window.confirm('למחוק את ההרשמה?')) return;
    var del = await EgozAdminAuth.getClient().from('ambassador_signups').delete().eq('id', openId);
    if (del.error) return U.showAlert(del.error.message || 'שגיאה במחיקה');
    U.closeModal('itemModal');
    U.showAlert('ההרשמה נמחקה', 'success');
    await loadItems();
  }

  EgozAdminShell.init({
    page: 'ambassadors',
    onReady: async function () {
      U.$('itemsList').addEventListener('click', handleListClick);
      U.$('itemSearch').addEventListener('input', function () { renderItems(allItems); });
      U.$('deleteBtn').addEventListener('click', handleDelete);
      U.bindModalClose({});
      await loadItems();
    }
  }).catch(function (err) {
    U.showAlert(err.message || 'שגיאה בטעינה');
  });
})();
