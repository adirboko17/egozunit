(function () {
  'use strict';

  var U = window.EgozAdminUtils;
  var editingId = null;
  var allItems = [];

  var CAT_LABELS = {
    travel: 'נופש ופנאי',
    health: 'בריאות',
    shop: 'צרכנות',
    finance: 'פיננסים',
    edu: 'השכלה'
  };

  function esc(value) {
    return EgozAdminShell.escapeHtml(value);
  }

  function syncRedeemUrl() {
    var slug = U.$('itemSlug').value.trim();
    U.$('redeemUrl').value = slug ? ('benefits.html#' + slug) : '';
  }

  function renderLogoPreview(item) {
    var el = U.$('logoPreview');
    if (!el) return;
    if (item && item.image_url) {
      el.innerHTML = '<img src="' + esc(item.image_url) + '" alt="" />';
    } else {
      el.innerHTML = '<div class="admin-project-images__empty">אין לוגו</div>';
    }
  }

  function renderItems(items) {
    var listEl = U.$('itemsList');
    var query = (U.$('itemSearch').value || '').trim().toLowerCase();
    var filtered = !query ? items : items.filter(function (item) {
      return [item.title, item.brand_name, item.description, item.category].join(' ').toLowerCase().indexOf(query) !== -1;
    });

    U.updateCount('itemsCount', filtered.length, items.length, {
      empty: 'אין הטבות',
      one: 'הטבה אחת',
      many: 'הטבות'
    });

    if (!items.length) {
      listEl.innerHTML = '<div class="admin-empty">אין עדיין הטבות. לחצו על <b>+</b> כדי להוסיף.</div>';
      return;
    }

    if (!filtered.length) {
      listEl.innerHTML = '<div class="admin-empty">לא נמצאו תוצאות.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(function (item) {
      var thumb = item.image_url
        ? '<img class="admin-product__thumb" src="' + esc(item.image_url) + '" alt="" />'
        : '<div class="admin-product__thumb admin-product__thumb--empty">' + esc(item.brand_name || 'הטבה') + '</div>';

      return (
        '<article class="admin-product" data-id="' + esc(item.id) + '">' +
          '<div class="admin-product__media">' + thumb + '</div>' +
          '<div class="admin-product__body">' +
            '<div class="admin-product__head">' +
              '<b class="admin-product__name">' + esc(item.title) + '</b>' +
              '<span class="admin-product__price">' + esc(item.offer_main) + '</span>' +
            '</div>' +
            '<p class="admin-product__desc">' + esc(CAT_LABELS[item.category] || item.category) + '</p>' +
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
    U.$('itemBody').value = '';
    U.$('itemSlug').value = '';
    U.$('redeemUrl').value = '';
    renderLogoPreview(null);
    U.$('formTitle').textContent = 'הטבה חדשה';
    U.$('saveBtn').textContent = 'הוספה';
    U.hideAlert('formAlert');
  }

  function openForm(item) {
    resetForm();
    U.hideAlert('pageAlert');

    if (item) {
      editingId = item.id;
      U.$('itemId').value = item.id;
      U.$('brandName').value = item.brand_name || '';
      U.$('category').value = item.category || 'shop';
      U.$('title').value = item.title || '';
      U.$('offerMain').value = item.offer_main || '';
      U.$('offerSub').value = item.offer_sub || '';
      U.$('description').value = item.description || '';
      U.$('itemBody').value = item.body || '';
      U.$('itemSlug').value = item.slug || '';
      syncRedeemUrl();
      U.$('itemSort').value = item.sort_order != null ? String(item.sort_order) : '0';
      U.$('itemPublished').checked = !!item.is_published;
      U.$('formTitle').textContent = 'עריכת הטבה';
      U.$('saveBtn').textContent = 'שמירת שינויים';
      renderLogoPreview(item);
    } else {
      syncRedeemUrl();
    }

    U.openModal('itemModal');
    U.$('title').focus();
  }

  async function loadItems() {
    U.$('itemsList').innerHTML = '<div class="admin-empty">טוען...</div>';
    var result = await EgozAdminAuth.getClient()
      .from('site_benefits')
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

    syncRedeemUrl();

    saveBtn.disabled = true;
    saveBtn.textContent = editingId ? 'שומר...' : 'מוסיף...';

    try {
      var slugValue = U.$('itemSlug').value.trim();
      var payload = {
        brand_name: U.$('brandName').value.trim(),
        category: U.$('category').value,
        title: title,
        offer_main: U.$('offerMain').value.trim(),
        offer_sub: U.$('offerSub').value.trim(),
        description: U.$('description').value.trim(),
        body: U.$('itemBody').value.trim() || null,
        slug: slugValue,
        redeem_url: 'benefits.html#' + slugValue,
        sort_order: Number(U.$('itemSort').value || 0),
        is_published: U.$('itemPublished').checked
      };

      var sb = EgozAdminAuth.getClient();
      var result = editingId
        ? await sb.from('site_benefits').update(payload).eq('id', editingId).select().single()
        : await sb.from('site_benefits').insert(payload).select().single();

      if (result.error) throw result.error;

      var wasEditing = !!editingId;
      U.closeModal('itemModal', resetForm);
      U.showAlert(wasEditing ? 'ההטבה עודכנה' : 'ההטבה נוספה', 'success');
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
      var result = await EgozAdminAuth.getClient().from('site_benefits').select('*').eq('id', id).single();
      if (result.error) return U.showAlert(result.error.message || 'שגיאה בטעינה');
      openForm(result.data);
      return;
    }

    if (action === 'delete') {
      if (!window.confirm('למחוק את ההטבה?')) return;
      var del = await EgozAdminAuth.getClient().from('site_benefits').delete().eq('id', id);
      if (del.error) return U.showAlert(del.error.message || 'שגיאה במחיקה');
      if (editingId === id) U.closeModal('itemModal', resetForm);
      U.showAlert('ההטבה נמחקה', 'success');
      await loadItems();
    }
  }

  EgozAdminShell.init({
    page: 'benefits',
    onReady: async function () {
      U.$('itemForm').addEventListener('submit', handleSubmit);
      U.$('addItemBtn').addEventListener('click', function () { openForm(); });
      U.$('itemsList').addEventListener('click', handleListClick);
      U.$('itemSearch').addEventListener('input', function () { renderItems(allItems); });
      U.$('itemSlug').addEventListener('input', syncRedeemUrl);
      U.bindModalClose({ onClose: resetForm });
      await loadItems();
    }
  }).catch(function (err) {
    U.showAlert(err.message || 'שגיאה בטעינה');
  });
})();
