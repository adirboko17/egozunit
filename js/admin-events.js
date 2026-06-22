(function () {
  'use strict';

  var U = window.EgozAdminUtils;
  var editingId = null;
  var allItems = [];

  function renderItems(items) {
    var listEl = U.$('itemsList');
    var query = (U.$('itemSearch').value || '').trim().toLowerCase();
    var filtered = !query ? items : items.filter(function (item) {
      return [item.title, item.location, item.description, item.category].join(' ').toLowerCase().indexOf(query) !== -1;
    });

    U.updateCount('itemsCount', filtered.length, items.length, {
      empty: 'אין אירועים',
      one: 'אירוע אחד',
      many: 'אירועים'
    });

    if (!items.length) {
      listEl.innerHTML = '<div class="admin-empty">אין עדיין אירועים. לחצו על <b>+</b> כדי להוסיף.</div>';
      return;
    }

    if (!filtered.length) {
      listEl.innerHTML = '<div class="admin-empty">לא נמצאו תוצאות.</div>';
      return;
    }

    var esc = EgozAdminShell.escapeHtml;
    listEl.innerHTML = filtered.map(function (item) {
      var dateParts = EgozSupabasePublic.formatEventDateParts(item.event_date);
      return (
        '<article class="admin-product" data-id="' + esc(item.id) + '">' +
          '<div class="admin-product__media"><div class="admin-product__thumb admin-product__thumb--empty">' +
            esc(dateParts.day + ' ' + dateParts.month) +
          '</div></div>' +
          '<div class="admin-product__body">' +
            '<div class="admin-product__head">' +
              '<b class="admin-product__name">' + esc(item.title) + '</b>' +
              '<span class="admin-product__price">' + esc(item.category === 'ceremony' ? 'טקס' : 'מפגש') + '</span>' +
            '</div>' +
            '<p class="admin-product__desc">' + esc(item.location + (item.event_time ? ' · ' + item.event_time : '')) + '</p>' +
            '<div class="admin-product__meta">' +
              '<span class="admin-product__badge' + (item.is_published ? ' is-live' : '') + '">' +
                (item.is_published ? 'מפורסם' : 'טיוטה') +
              '</span>' +
            '</div>' +
          '</div>' +
          '<div class="admin-product__actions">' +
            '<button type="button" class="admin-btn admin-btn--sm admin-btn--ghost" data-action="edit">עריכה</button>' +
            '<button type="button" class="admin-btn admin-btn--sm admin-btn--danger" data-action="delete">מחיקה</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function resetForm() {
    editingId = null;
    U.$('itemForm').reset();
    U.$('itemId').value = '';
    U.$('formTitle').textContent = 'אירוע חדש';
    U.$('saveBtn').textContent = 'הוספה';
    U.hideAlert('formAlert');
  }

  function openForm(item) {
    resetForm();
    U.hideAlert('pageAlert');

    if (item) {
      editingId = item.id;
      U.$('itemId').value = item.id;
      U.$('title').value = item.title || '';
      U.$('description').value = item.description || '';
      U.$('eventDate').value = item.event_date || '';
      U.$('eventTime').value = item.event_time || '';
      U.$('location').value = item.location || '';
      U.$('audience').value = item.audience || '';
      U.$('category').value = item.category || 'meetup';
      U.$('badgeText').value = item.badge_text || '';
      U.$('ctaLabel').value = item.cta_label || 'פרטים';
      U.$('ctaUrl').value = item.cta_url || '';
      U.$('itemSort').value = item.sort_order != null ? String(item.sort_order) : '0';
      U.$('itemPublished').checked = !!item.is_published;
      U.$('formTitle').textContent = 'עריכת אירוע';
      U.$('saveBtn').textContent = 'שמירת שינויים';
    }

    U.openModal('itemModal');
    U.$('title').focus();
  }

  async function loadItems() {
    U.$('itemsList').innerHTML = '<div class="admin-empty">טוען...</div>';
    var result = await EgozAdminAuth.getClient()
      .from('site_events')
      .select('*')
      .order('event_date', { ascending: false })
      .order('sort_order', { ascending: true });

    if (result.error) throw result.error;
    allItems = result.data || [];
    renderItems(allItems);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    U.hideAlert('formAlert');

    var title = U.$('title').value.trim();
    var eventDate = U.$('eventDate').value;
    var saveBtn = U.$('saveBtn');

    if (!title) return U.showAlert('יש להזין כותרת', 'error', 'formAlert');
    if (!eventDate) return U.showAlert('יש לבחור תאריך', 'error', 'formAlert');

    saveBtn.disabled = true;
    saveBtn.textContent = editingId ? 'שומר...' : 'מוסיף...';

    try {
      var payload = {
        title: title,
        description: U.$('description').value.trim(),
        event_date: eventDate,
        event_time: U.$('eventTime').value.trim(),
        location: U.$('location').value.trim(),
        audience: U.$('audience').value.trim(),
        category: U.$('category').value,
        badge_text: U.$('badgeText').value.trim() || null,
        cta_label: U.$('ctaLabel').value.trim() || 'פרטים',
        cta_url: U.$('ctaUrl').value.trim(),
        sort_order: Number(U.$('itemSort').value || 0),
        is_published: U.$('itemPublished').checked
      };

      var sb = EgozAdminAuth.getClient();
      var result = editingId
        ? await sb.from('site_events').update(payload).eq('id', editingId).select().single()
        : await sb.from('site_events').insert(payload).select().single();

      if (result.error) throw result.error;

      var wasEditing = !!editingId;
      U.closeModal('itemModal', resetForm);
      U.showAlert(wasEditing ? 'האירוע עודכן' : 'האירוע נוסף', 'success');
      await loadItems();
    } catch (err) {
      U.showAlert(err.message || 'שגיאה בשמירה', 'error', 'formAlert');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = editingId ? 'שמירת שינויים' : 'הוספה';
    }
  }

  async function handleListClick(event) {
    var btn = event.target.closest('[data-action]');
    if (!btn) return;
    var card = btn.closest('.admin-product');
    if (!card) return;

    var id = card.getAttribute('data-id');
    var action = btn.getAttribute('data-action');

    if (action === 'edit') {
      var result = await EgozAdminAuth.getClient().from('site_events').select('*').eq('id', id).single();
      if (result.error) return U.showAlert(result.error.message || 'שגיאה בטעינה');
      openForm(result.data);
      return;
    }

    if (action === 'delete') {
      if (!window.confirm('למחוק את האירוע?')) return;
      var del = await EgozAdminAuth.getClient().from('site_events').delete().eq('id', id);
      if (del.error) return U.showAlert(del.error.message || 'שגיאה במחיקה');
      if (editingId === id) U.closeModal('itemModal', resetForm);
      U.showAlert('האירוע נמחק', 'success');
      await loadItems();
    }
  }

  EgozAdminShell.init({
    page: 'events',
    onReady: async function () {
      U.$('itemForm').addEventListener('submit', handleSubmit);
      U.$('addItemBtn').addEventListener('click', function () { openForm(); });
      U.$('itemsList').addEventListener('click', handleListClick);
      U.$('itemSearch').addEventListener('input', function () { renderItems(allItems); });
      U.bindModalClose({ onClose: resetForm });
      await loadItems();
    }
  }).catch(function (err) {
    U.showAlert(err.message || 'שגיאה בטעינה');
  });
})();
