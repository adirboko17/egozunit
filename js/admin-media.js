(function () {
  'use strict';

  var U = window.EgozAdminUtils;
  var editingId = null;
  var pendingImageFile = null;
  var allItems = [];

  var TYPE_LABELS = {
    article: 'כתבה',
    video: 'סרטון'
  };

  function esc(value) {
    return EgozAdminShell.escapeHtml(value);
  }

  function renderImagePreview(item) {
    var mainEl = U.$('mainImagePreview');
    if (!mainEl) return;
    if (item && item.image_url) {
      mainEl.innerHTML = '<img src="' + esc(item.image_url) + '" alt="" />';
    } else {
      mainEl.innerHTML = '<div class="admin-project-images__empty">אין תמונה</div>';
    }
  }

  function renderItems(items) {
    var listEl = U.$('itemsList');
    var query = (U.$('itemSearch').value || '').trim().toLowerCase();
    var filtered = !query ? items : items.filter(function (item) {
      return [item.title, item.description, item.link_url, item.media_type].join(' ').toLowerCase().indexOf(query) !== -1;
    });

    U.updateCount('itemsCount', filtered.length, items.length, {
      empty: 'אין פריטי תקשורת',
      one: 'פריט אחד',
      many: 'פריטים'
    });

    if (!items.length) {
      listEl.innerHTML = '<div class="admin-empty">אין עדיין כתבות או סרטונים. לחצו על <b>+</b> כדי להוסיף.</div>';
      return;
    }

    if (!filtered.length) {
      listEl.innerHTML = '<div class="admin-empty">לא נמצאו תוצאות.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(function (item) {
      var thumb = item.image_url
        ? '<img class="admin-product__thumb" src="' + esc(item.image_url) + '" alt="" />'
        : '<div class="admin-product__thumb admin-product__thumb--empty">' + esc(TYPE_LABELS[item.media_type] || 'תקשורת') + '</div>';

      return (
        '<article class="admin-product" data-id="' + esc(item.id) + '">' +
          '<div class="admin-product__media">' + thumb + '</div>' +
          '<div class="admin-product__body">' +
            '<div class="admin-product__head">' +
              '<b class="admin-product__name">' + esc(item.title) + '</b>' +
              '<span class="admin-product__price">' + esc(TYPE_LABELS[item.media_type] || item.media_type) + '</span>' +
            '</div>' +
            '<p class="admin-product__desc">' + esc(item.description || item.link_url || '—') + '</p>' +
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
    pendingImageFile = null;
    U.$('itemForm').reset();
    U.$('itemId').value = '';
    renderImagePreview(null);
    U.setPreview('imagePreview', '');
    U.$('formTitle').textContent = 'פריט תקשורת חדש';
    U.$('saveBtn').textContent = 'הוספה';
    U.hideAlert('formAlert');
  }

  function openForm(item) {
    resetForm();
    U.hideAlert('pageAlert');

    if (item) {
      editingId = item.id;
      U.$('itemId').value = item.id;
      U.$('mediaType').value = item.media_type || 'article';
      U.$('title').value = item.title || '';
      U.$('description').value = item.description || '';
      U.$('linkUrl').value = item.link_url || '';
      U.$('itemSort').value = item.sort_order != null ? String(item.sort_order) : '0';
      U.$('itemPublished').checked = !!item.is_published;
      U.$('formTitle').textContent = 'עריכת פריט תקשורת';
      U.$('saveBtn').textContent = 'שמירת שינויים';
      renderImagePreview(item);
    }

    U.openModal('itemModal');
    U.$('title').focus();
  }

  async function loadItems() {
    U.$('itemsList').innerHTML = '<div class="admin-empty">טוען...</div>';
    var result = await EgozAdminAuth.getClient()
      .from('site_media')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (result.error) throw result.error;
    allItems = result.data || [];
    renderItems(allItems);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    U.hideAlert('formAlert');

    var title = U.$('title').value.trim();
    var saveBtn = U.$('saveBtn');

    if (!title) return U.showAlert('יש להזין שם / כותרת', 'error', 'formAlert');

    saveBtn.disabled = true;
    saveBtn.textContent = editingId ? 'שומר...' : 'מוסיף...';

    try {
      var imageUrl = null;
      if (pendingImageFile) {
        imageUrl = await U.uploadImage(pendingImageFile, U.BUCKET, 'media');
      }

      var payload = {
        title: title,
        description: U.$('description').value.trim(),
        link_url: U.$('linkUrl').value.trim(),
        media_type: U.$('mediaType').value || 'article',
        sort_order: Number(U.$('itemSort').value || 0),
        is_published: U.$('itemPublished').checked,
        updated_at: new Date().toISOString()
      };

      if (imageUrl) payload.image_url = imageUrl;

      var sb = EgozAdminAuth.getClient();
      var result = editingId
        ? await sb.from('site_media').update(payload).eq('id', editingId).select().single()
        : await sb.from('site_media').insert(payload).select().single();

      if (result.error) throw result.error;

      var wasEditing = !!editingId;
      U.closeModal('itemModal', resetForm);
      U.showAlert(wasEditing ? 'הפריט עודכן' : 'הפריט נוסף', 'success');
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
      var result = await EgozAdminAuth.getClient().from('site_media').select('*').eq('id', id).single();
      if (result.error) return U.showAlert(result.error.message || 'שגיאה בטעינה');
      openForm(result.data);
      return;
    }

    if (action === 'delete') {
      if (!window.confirm('למחוק את פריט התקשורת?')) return;
      var del = await EgozAdminAuth.getClient().from('site_media').delete().eq('id', id);
      if (del.error) return U.showAlert(del.error.message || 'שגיאה במחיקה');
      if (editingId === id) U.closeModal('itemModal', resetForm);
      U.showAlert('הפריט נמחק', 'success');
      await loadItems();
    }
  }

  EgozAdminShell.init({
    page: 'media',
    onReady: async function () {
      U.$('itemForm').addEventListener('submit', handleSubmit);
      U.$('addItemBtn').addEventListener('click', function () { openForm(); });
      U.$('itemsList').addEventListener('click', handleListClick);
      U.$('itemSearch').addEventListener('input', function () { renderItems(allItems); });
      U.bindModalClose({ onClose: resetForm });
      U.bindImageInput('itemImage', 'imagePreview', function (file) {
        pendingImageFile = file;
        if (file) {
          U.$('mainImagePreview').innerHTML = '<img src="' + URL.createObjectURL(file) + '" alt="" />';
        } else if (editingId) {
          var current = allItems.find(function (item) { return item.id === editingId; });
          renderImagePreview(current || null);
        } else {
          renderImagePreview(null);
        }
      });
      await loadItems();
    }
  }).catch(function (err) {
    U.showAlert(err.message || 'שגיאה בטעינה');
  });
})();
