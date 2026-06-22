(function () {
  'use strict';

  var U = window.EgozAdminUtils;
  var IMAGE_BUCKET = 'shop-products';
  var IMAGE_FOLDER = 'yizkor';
  var editingId = null;
  var pendingImageFile = null;
  var allItems = [];

  function getImageFile() {
    return U.getSelectedImageFile('itemImage', pendingImageFile);
  }

  function renderItems(items) {
    var listEl = U.$('itemsList');
    var query = (U.$('itemSearch').value || '').trim().toLowerCase();
    var filtered = !query ? items : items.filter(function (item) {
      var haystack = [item.name, item.fall_date, item.memorial_url].join(' ').toLowerCase();
      return haystack.indexOf(query) !== -1;
    });

    U.updateCount('itemsCount', filtered.length, items.length, {
      empty: 'אין חללים ברשימה',
      one: 'חלל אחד',
      many: 'חללים'
    });

    if (!items.length) {
      listEl.innerHTML = '<div class="admin-empty">אין עדיין חללים. לחצו על <b>+</b> כדי להוסיף.</div>';
      return;
    }

    if (!filtered.length) {
      listEl.innerHTML = '<div class="admin-empty">לא נמצאו תוצאות לחיפוש.</div>';
      return;
    }

    var esc = EgozAdminShell.escapeHtml;
    listEl.innerHTML = filtered.map(function (item) {
      var thumb = item.image_url
        ? '<img class="admin-product__thumb" src="' + esc(item.image_url) + '" alt="" />'
        : '<div class="admin-product__thumb admin-product__thumb--empty">ללא תמונה</div>';

      return (
        '<article class="admin-product" data-id="' + esc(item.id) + '">' +
          '<div class="admin-product__media">' + thumb + '</div>' +
          '<div class="admin-product__body">' +
            '<div class="admin-product__head">' +
              '<b class="admin-product__name">' + esc(item.name) + '</b>' +
            '</div>' +
            '<p class="admin-product__desc">' + esc(item.fall_date || '—') + '</p>' +
            '<div class="admin-product__meta">' +
              '<span class="admin-product__badge' + (item.is_published ? ' is-live' : '') + '">' +
                (item.is_published ? 'מפורסם' : 'טיוטה') +
              '</span>' +
              '<span>סדר ' + esc(item.sort_order) + '</span>' +
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

  function clearImageInput() {
    pendingImageFile = null;
    var imageInput = U.$('itemImage');
    if (imageInput) imageInput.value = '';
    U.setPreview('imagePreview', '');
  }

  function resetForm() {
    editingId = null;
    U.$('itemForm').reset();
    U.$('itemId').value = '';
    clearImageInput();
    U.$('formTitle').textContent = 'חלל חדש';
    U.$('saveBtn').textContent = 'הוספה';
    U.hideAlert('formAlert');
  }

  function openForm(item) {
    U.hideAlert('pageAlert');
    U.hideAlert('formAlert');
    clearImageInput();

    if (item) {
      editingId = item.id;
      U.$('itemId').value = item.id;
      U.$('name').value = item.name || '';
      U.$('fallDate').value = item.fall_date || '';
      U.$('memorialUrl').value = item.memorial_url || '';
      U.$('itemSort').value = item.sort_order != null ? String(item.sort_order) : '0';
      U.$('itemPublished').checked = !!item.is_published;
      U.$('formTitle').textContent = 'עריכת חלל';
      U.$('saveBtn').textContent = 'שמירת שינויים';
      U.setPreview('imagePreview', item.image_url || '');
    } else {
      resetForm();
    }

    U.openModal('itemModal');
    U.$('name').focus();
  }

  async function loadItems() {
    U.$('itemsList').innerHTML = '<div class="admin-empty">טוען...</div>';
    var result = await EgozAdminAuth.getClient()
      .from('fallen_soldiers')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (result.error) throw result.error;
    allItems = result.data || [];
    renderItems(allItems);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    U.hideAlert('formAlert');

    var fileToUpload = getImageFile();
    pendingImageFile = fileToUpload;

    var name = U.$('name').value.trim();
    var memorialUrl = U.$('memorialUrl').value.trim();
    var saveBtn = U.$('saveBtn');

    if (!name) return U.showAlert('יש להזין שם', 'error', 'formAlert');
    if (!memorialUrl) return U.showAlert('יש להזין קישור לעמוד ההנצחה', 'error', 'formAlert');

    saveBtn.disabled = true;
    saveBtn.textContent = fileToUpload ? 'מעלה תמונה...' : (editingId ? 'שומר...' : 'מוסיף...');

    try {
      var imageUrl = null;
      if (fileToUpload) {
        imageUrl = await U.uploadImage(fileToUpload, IMAGE_BUCKET, IMAGE_FOLDER);
      }

      var payload = {
        name: name,
        fall_date: U.$('fallDate').value.trim(),
        memorial_url: memorialUrl,
        sort_order: Number(U.$('itemSort').value || 0),
        is_published: U.$('itemPublished').checked
      };

      if (imageUrl) payload.image_url = imageUrl;

      saveBtn.textContent = editingId ? 'שומר...' : 'מוסיף...';

      var sb = EgozAdminAuth.getClient();
      var result = editingId
        ? await sb.from('fallen_soldiers').update(payload).eq('id', editingId).select().single()
        : await sb.from('fallen_soldiers').insert(payload).select().single();

      if (result.error) throw result.error;

      var wasEditing = !!editingId;
      U.closeModal('itemModal', resetForm);
      U.showAlert(wasEditing ? 'הרשומה עודכנה' : 'הרשומה נוספה', 'success');
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
      var result = await EgozAdminAuth.getClient().from('fallen_soldiers').select('*').eq('id', id).single();
      if (result.error) return U.showAlert(result.error.message || 'שגיאה בטעינה');
      openForm(result.data);
      return;
    }

    if (action === 'delete') {
      if (!window.confirm('למחוק את הרשומה?')) return;
      var del = await EgozAdminAuth.getClient().from('fallen_soldiers').delete().eq('id', id);
      if (del.error) return U.showAlert(del.error.message || 'שגיאה במחיקה');
      if (editingId === id) U.closeModal('itemModal', resetForm);
      U.showAlert('הרשומה נמחקה', 'success');
      await loadItems();
    }
  }

  EgozAdminShell.init({
    page: 'yizkor',
    onReady: async function () {
      U.$('itemForm').addEventListener('submit', handleSubmit);
      U.$('addItemBtn').addEventListener('click', function () { openForm(); });
      U.$('itemsList').addEventListener('click', handleListClick);
      U.$('itemSearch').addEventListener('input', function () { renderItems(allItems); });
      U.bindModalClose({ onClose: resetForm });
      U.bindImageInput('itemImage', 'imagePreview', function (file) { pendingImageFile = file; });
      await loadItems();
    }
  }).catch(function (err) {
    U.showAlert(err.message || 'שגיאה בטעינה');
  });
})();
