(function () {
  'use strict';

  var U = window.EgozAdminUtils;
  var editingId = null;
  var allItems = [];

  var CAT_LABELS = { tech: 'הייטק', sec: 'ביטחון', biz: 'ניהול', ops: 'תפעול' };

  function renderItems(items) {
    var listEl = U.$('itemsList');
    var query = (U.$('itemSearch').value || '').trim().toLowerCase();
    var filtered = !query ? items : items.filter(function (item) {
      return [item.title, item.company, item.description, item.category].join(' ').toLowerCase().indexOf(query) !== -1;
    });

    U.updateCount('itemsCount', filtered.length, items.length, {
      empty: 'אין משרות',
      one: 'משרה אחת',
      many: 'משרות'
    });

    if (!items.length) {
      listEl.innerHTML = '<div class="admin-empty">אין עדיין משרות. לחצו על <b>+</b> כדי להוסיף.</div>';
      return;
    }

    if (!filtered.length) {
      listEl.innerHTML = '<div class="admin-empty">לא נמצאו תוצאות.</div>';
      return;
    }

    var esc = EgozAdminShell.escapeHtml;
    listEl.innerHTML = filtered.map(function (item) {
      return (
        '<article class="admin-product" data-id="' + esc(item.id) + '">' +
          '<div class="admin-product__media"><div class="admin-product__thumb admin-product__thumb--empty">' +
            esc(item.logo_initials || '?') +
          '</div></div>' +
          '<div class="admin-product__body">' +
            '<div class="admin-product__head">' +
              '<b class="admin-product__name">' + esc(item.title) + '</b>' +
              (item.is_new ? '<span class="admin-product__badge is-live">חדש</span>' : '') +
            '</div>' +
            '<p class="admin-product__desc">' + esc(item.company) + '</p>' +
            '<div class="admin-product__meta">' +
              '<span class="admin-product__badge' + (item.is_published ? ' is-live' : '') + '">' +
                (item.is_published ? 'מפורסם' : 'טיוטה') +
              '</span>' +
              '<span>' + esc(CAT_LABELS[item.category] || item.category) + '</span>' +
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
    U.$('formTitle').textContent = 'משרה חדשה';
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
      U.$('company').value = item.company || '';
      U.$('location').value = item.location || '';
      U.$('employmentType').value = item.employment_type || '';
      U.$('description').value = item.description || '';
      U.$('category').value = item.category || 'tech';
      U.$('tags').value = (item.tags || []).join(', ');
      U.$('logoInitials').value = item.logo_initials || '';
      U.$('applyUrl').value = item.apply_url || '';
      U.$('isNew').checked = !!item.is_new;
      U.$('itemSort').value = item.sort_order != null ? String(item.sort_order) : '0';
      U.$('itemPublished').checked = !!item.is_published;
      U.$('formTitle').textContent = 'עריכת משרה';
      U.$('saveBtn').textContent = 'שמירת שינויים';
    }

    U.openModal('itemModal');
    U.$('title').focus();
  }

  async function loadItems() {
    U.$('itemsList').innerHTML = '<div class="admin-empty">טוען...</div>';
    var result = await EgozAdminAuth.getClient()
      .from('site_jobs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (result.error) throw result.error;
    allItems = result.data || [];
    renderItems(allItems);
  }

  function parseTags(value) {
    return value.split(',').map(function (tag) { return tag.trim(); }).filter(Boolean);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    U.hideAlert('formAlert');

    var title = U.$('title').value.trim();
    var saveBtn = U.$('saveBtn');
    if (!title) return U.showAlert('יש להזין כותרת משרה', 'error', 'formAlert');

    saveBtn.disabled = true;
    saveBtn.textContent = editingId ? 'שומר...' : 'מוסיף...';

    try {
      var payload = {
        title: title,
        company: U.$('company').value.trim(),
        location: U.$('location').value.trim(),
        employment_type: U.$('employmentType').value.trim(),
        description: U.$('description').value.trim(),
        category: U.$('category').value,
        tags: parseTags(U.$('tags').value),
        logo_initials: U.$('logoInitials').value.trim(),
        apply_url: U.$('applyUrl').value.trim(),
        is_new: U.$('isNew').checked,
        sort_order: Number(U.$('itemSort').value || 0),
        is_published: U.$('itemPublished').checked
      };

      var sb = EgozAdminAuth.getClient();
      var result = editingId
        ? await sb.from('site_jobs').update(payload).eq('id', editingId).select().single()
        : await sb.from('site_jobs').insert(payload).select().single();

      if (result.error) throw result.error;

      var wasEditing = !!editingId;
      U.closeModal('itemModal', resetForm);
      U.showAlert(wasEditing ? 'המשרה עודכנה' : 'המשרה נוספה', 'success');
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
      var result = await EgozAdminAuth.getClient().from('site_jobs').select('*').eq('id', id).single();
      if (result.error) return U.showAlert(result.error.message || 'שגיאה בטעינה');
      openForm(result.data);
      return;
    }

    if (action === 'delete') {
      if (!window.confirm('למחוק את המשרה?')) return;
      var del = await EgozAdminAuth.getClient().from('site_jobs').delete().eq('id', id);
      if (del.error) return U.showAlert(del.error.message || 'שגיאה במחיקה');
      if (editingId === id) U.closeModal('itemModal', resetForm);
      U.showAlert('המשרה נמחקה', 'success');
      await loadItems();
    }
  }

  EgozAdminShell.init({
    page: 'jobs',
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
