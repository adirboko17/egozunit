(function () {
  'use strict';

  var U = window.EgozAdminUtils;
  var allItems = [];
  var openId = null;

  var GENDER_LABELS = { male: 'גבר', female: 'אישה', other: 'אחר' };
  var ROLE_LABELS = { fighter: 'לוחם', support: 'תומכ"ל' };

  function esc(value) {
    return EgozAdminShell.escapeHtml(value);
  }

  function fmtDate(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleDateString('he-IL'); } catch (e) { return value; }
  }

  function renderItems(items) {
    var listEl = U.$('itemsList');
    var query = (U.$('itemSearch').value || '').trim().toLowerCase();
    var filtered = !query ? items : items.filter(function (item) {
      return [item.full_name, item.email, item.phone, item.city, item.occupation, item.company].join(' ').toLowerCase().indexOf(query) !== -1;
    });

    U.updateCount('itemsCount', filtered.length, items.length, {
      empty: 'אין עדיין נרשמים',
      one: 'נרשם אחד',
      many: 'נרשמים'
    });

    if (!items.length) {
      listEl.innerHTML = '<div class="admin-empty">עדיין אין הרשמות חברים באתר.</div>';
      return;
    }
    if (!filtered.length) {
      listEl.innerHTML = '<div class="admin-empty">לא נמצאו תוצאות.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(function (item) {
      var statusBadge = item.registration_completed
        ? '<span class="admin-product__badge is-live">הרשמה הושלמה</span>'
        : '<span class="admin-product__badge">שלב א׳ בלבד</span>';

      var subtitle = [item.email, item.role ? ROLE_LABELS[item.role] || item.role : '', item.company, item.city].filter(Boolean).join(' · ') || 'ללא פרטים נוספים';

      return (
        '<article class="admin-product" data-id="' + esc(item.id) + '">' +
          '<div class="admin-product__media admin-product__thumb--empty" style="width:64px;">' + esc((item.full_name || item.email || '?')[0].toUpperCase()) + '</div>' +
          '<div class="admin-product__body">' +
            '<div class="admin-product__head">' +
              '<b class="admin-product__name">' + esc(item.full_name || item.email || 'ללא שם') + '</b>' +
              '<span class="admin-product__price">' + esc(item.phone || '') + '</span>' +
            '</div>' +
            '<p class="admin-product__desc">' + esc(subtitle) + '</p>' +
            '<div class="admin-product__meta">' + statusBadge + '<span class="admin-product__badge">נרשם ' + esc(fmtDate(item.created_at)) + '</span></div>' +
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
    html += detailRow('מגדר', GENDER_LABELS[item.gender] || item.gender);
    html += detailRow('תאריך לידה', fmtDate(item.birth_date));
    html += detailRow('כתובת', [item.address, item.city, item.zip, item.country].filter(Boolean).join(', '));
    html += detailRow('עיסוק', item.occupation);
    html += detailRow('מקום עבודה (עברית)', item.workplace_he);
    html += detailRow('מקום עבודה (אנגלית)', item.workplace_en);
    html += detailRow('מוסד לימוד אקדמי', item.academic_institution);
    html += detailRow('סטטוס לימודים', item.study_status);
    html += detailRow('שנת הצטרפות ליחידה', item.unit_join_year);
    html += detailRow('תפקיד', ROLE_LABELS[item.role] || item.role);
    html += detailRow('פלוגה', item.company);
    html += detailRow('תחום התנדבות', item.volunteer_area);
    html += detailRow('פירוט התנדבות', item.volunteer_area_details);
    html += detailRow('כלי רכב להתנדבות', item.has_vehicle_details);
    html += detailRow('עסק באירועים', item.event_business_details);
    html += detailRow('תחום אמנות', item.artist_details);
    html += detailRow('אישר מדיניות פרטיות', item.accepted_privacy_policy ? 'כן' : 'לא');
    html += detailRow('אישר תקנון', item.accepted_bylaws ? 'כן' : 'לא');
    html += detailRow('הרשמה הושלמה', item.registration_completed ? 'כן' : 'לא');
    html += detailRow('נרשם בתאריך', fmtDate(item.created_at));
    U.$('detailBody').innerHTML = html;
  }

  function openDetail(item) {
    openId = item.id;
    U.$('formTitle').textContent = item.full_name || item.email || 'פרטי נרשם/ת';
    renderDetail(item);
    U.openModal('itemModal');
  }

  async function loadItems() {
    U.$('itemsList').innerHTML = '<div class="admin-empty">טוען...</div>';
    var result = await EgozAdminAuth.getClient()
      .from('member_profiles')
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
    if (!window.confirm('למחוק את פרופיל ההרשמה? (חשבון ההתחברות של המשתמש יישאר קיים במערכת)')) return;
    var del = await EgozAdminAuth.getClient().from('member_profiles').delete().eq('id', openId);
    if (del.error) return U.showAlert(del.error.message || 'שגיאה במחיקה');
    U.closeModal('itemModal');
    U.showAlert('הפרופיל נמחק', 'success');
    await loadItems();
  }

  EgozAdminShell.init({
    page: 'members',
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
