(function () {
  'use strict';

  var U = window.EgozAdminUtils;
  var editingId = null;
  var pendingImageFile = null;
  var allItems = [];

  function esc(value) {
    return EgozAdminShell.escapeHtml(value);
  }

  function syncDetailUrl() {
    var slug = U.$('itemSlug').value.trim();
    U.$('detailUrl').value = slug ? ('projects.html#' + slug) : '';
  }

  function renderProjectImages(item) {
    var mainEl = U.$('mainImagePreview');
    var galleryEl = U.$('galleryPreview');
    var galleryGroup = U.$('galleryPreviewGroup');

    if (!mainEl) return;

    if (item && item.image_url) {
      mainEl.innerHTML = '<img src="' + esc(item.image_url) + '" alt="" />';
    } else {
      mainEl.innerHTML = '<div class="admin-project-images__empty">אין תמונה</div>';
    }

    var gallery = item && Array.isArray(item.gallery_urls) ? item.gallery_urls : [];
    if (!gallery.length) {
      if (galleryGroup) galleryGroup.hidden = true;
      if (galleryEl) galleryEl.innerHTML = '';
      return;
    }

    if (galleryGroup) galleryGroup.hidden = false;
    if (galleryEl) {
      galleryEl.innerHTML = gallery.map(function (url) {
        return '<img src="' + esc(url) + '" alt="" />';
      }).join('');
    }
  }

  function renderItems(items) {
    var listEl = U.$('itemsList');
    var query = (U.$('itemSearch').value || '').trim().toLowerCase();
    var filtered = !query ? items : items.filter(function (item) {
      return [item.title, item.description, item.detail_url].join(' ').toLowerCase().indexOf(query) !== -1;
    });

    U.updateCount('itemsCount', filtered.length, items.length, {
      empty: 'אין פרויקטים',
      one: 'פרויקט אחד',
      many: 'פרויקטים'
    });

    if (!items.length) {
      listEl.innerHTML = '<div class="admin-empty">אין עדיין פרויקטים. לחצו על <b>+</b> כדי להוסיף.</div>';
      return;
    }

    if (!filtered.length) {
      listEl.innerHTML = '<div class="admin-empty">לא נמצאו תוצאות.</div>';
      return;
    }

    var esc = EgozAdminShell.escapeHtml;
    listEl.innerHTML = filtered.map(function (item) {
      var thumb = item.image_url
        ? '<img class="admin-product__thumb" src="' + esc(item.image_url) + '" alt="" />'
        : '<div class="admin-product__thumb admin-product__thumb--empty">פרויקט</div>';

      return (
        '<article class="admin-product" data-id="' + esc(item.id) + '">' +
          '<div class="admin-product__media">' + thumb + '</div>' +
          '<div class="admin-product__body">' +
            '<div class="admin-product__head">' +
              '<b class="admin-product__name">' + esc(item.title) + '</b>' +
            '</div>' +
            '<p class="admin-product__desc">' + esc(item.description || '—') + '</p>' +
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
    U.$('itemBody').value = '';
    U.$('itemSlug').value = '';
    U.$('detailUrl').value = '';
    renderProjectImages(null);
    U.setPreview('imagePreview', '');
    U.$('formTitle').textContent = 'פרויקט חדש';
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
      U.$('itemBody').value = item.body || '';
      U.$('itemSlug').value = item.slug || '';
      syncDetailUrl();
      U.$('itemSort').value = item.sort_order != null ? String(item.sort_order) : '0';
      U.$('itemPublished').checked = !!item.is_published;
      U.$('formTitle').textContent = 'עריכת פרויקט';
      U.$('saveBtn').textContent = 'שמירת שינויים';
      renderProjectImages(item);
    } else {
      syncDetailUrl();
    }

    U.openModal('itemModal');
    U.$('title').focus();
  }

  async function loadItems() {
    U.$('itemsList').innerHTML = '<div class="admin-empty">טוען...</div>';
    var result = await EgozAdminAuth.getClient()
      .from('site_projects')
      .select('*')
      .order('sort_order', { ascending: true });

    if (result.error) throw result.error;
    allItems = result.data || [];
    renderItems(allItems);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    U.hideAlert('formAlert');

    var title = U.$('title').value.trim();
    var slug = U.$('itemSlug').value.trim();
    var saveBtn = U.$('saveBtn');

    if (!title) return U.showAlert('יש להזין כותרת', 'error', 'formAlert');
    if (!slug) return U.showAlert('יש להזין slug (עוגן)', 'error', 'formAlert');

    syncDetailUrl();

    saveBtn.disabled = true;
    saveBtn.textContent = editingId ? 'שומר...' : 'מוסיף...';

    try {
      var imageUrl = null;
      if (pendingImageFile) imageUrl = await U.uploadImage(pendingImageFile);

      var slugValue = U.$('itemSlug').value.trim();
      var payload = {
        title: title,
        description: U.$('description').value.trim(),
        body: U.$('itemBody').value.trim() || null,
        slug: slugValue,
        detail_url: 'projects.html#' + slugValue,
        sort_order: Number(U.$('itemSort').value || 0),
        is_published: U.$('itemPublished').checked
      };

      if (imageUrl) payload.image_url = imageUrl;

      var sb = EgozAdminAuth.getClient();
      var result = editingId
        ? await sb.from('site_projects').update(payload).eq('id', editingId).select().single()
        : await sb.from('site_projects').insert(payload).select().single();

      if (result.error) throw result.error;

      var wasEditing = !!editingId;
      U.closeModal('itemModal', resetForm);
      U.showAlert(wasEditing ? 'הפרויקט עודכן' : 'הפרויקט נוסף', 'success');
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
      var result = await EgozAdminAuth.getClient().from('site_projects').select('*').eq('id', id).single();
      if (result.error) return U.showAlert(result.error.message || 'שגיאה בטעינה');
      openForm(result.data);
      return;
    }

    if (action === 'delete') {
      if (!window.confirm('למחוק את הפרויקט?')) return;
      var del = await EgozAdminAuth.getClient().from('site_projects').delete().eq('id', id);
      if (del.error) return U.showAlert(del.error.message || 'שגיאה במחיקה');
      if (editingId === id) U.closeModal('itemModal', resetForm);
      U.showAlert('הפרויקט נמחק', 'success');
      await loadItems();
    }
  }

  EgozAdminShell.init({
    page: 'projects',
    onReady: async function () {
      U.$('itemForm').addEventListener('submit', handleSubmit);
      U.$('addItemBtn').addEventListener('click', function () { openForm(); });
      U.$('itemsList').addEventListener('click', handleListClick);
      U.$('itemSearch').addEventListener('input', function () { renderItems(allItems); });
      U.$('itemSlug').addEventListener('input', syncDetailUrl);
      U.bindModalClose({ onClose: resetForm });
      U.bindImageInput('itemImage', 'imagePreview', function (file) {
        pendingImageFile = file;
        if (file) {
          U.$('mainImagePreview').innerHTML = '<img src="' + URL.createObjectURL(file) + '" alt="" />';
        } else if (editingId) {
          var current = allItems.find(function (item) { return item.id === editingId; });
          renderProjectImages(current || null);
        } else {
          renderProjectImages(null);
        }
      });
      await loadItems();
    }
  }).catch(function (err) {
    U.showAlert(err.message || 'שגיאה בטעינה');
  });
})();
