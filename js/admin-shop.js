(function () {
  'use strict';

  var BUCKET = 'shop-products';
  var editingId = null;
  var pendingImageFile = null;
  var allProducts = [];

  function $(id) { return document.getElementById(id); }

  function showAlert(message, type, target) {
    var el = $(target || 'shopAlert');
    if (!el) return;
    el.hidden = false;
    el.textContent = message;
    el.className = 'admin-alert admin-alert--' + (type || 'error');
  }

  function hideAlert(target) {
    var el = $(target || 'shopAlert');
    if (!el) return;
    el.hidden = true;
    el.textContent = '';
  }

  function formatPrice(value) {
    var num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₪';
  }

  function updateCount(shown, total) {
    var el = $('productsCount');
    if (!el) return;

    if (total === 0) {
      el.textContent = 'אין מוצרים בחנות';
      return;
    }

    if (shown === total) {
      el.textContent = total === 1 ? 'מוצר אחד בחנות' : total + ' מוצרים בחנות';
      return;
    }

    el.textContent = 'מציג ' + shown + ' מתוך ' + total + ' מוצרים';
  }

  function getSearchQuery() {
    return ($('productSearch').value || '').trim().toLowerCase();
  }

  function filterProducts(products, query) {
    if (!query) return products;
    return products.filter(function (product) {
      var haystack = [
        product.name,
        product.description,
        String(product.price),
        product.purchase_url
      ].join(' ').toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
  }

  function renderProducts(products) {
    var listEl = $('productsList');
    var query = getSearchQuery();
    var filtered = filterProducts(products, query);

    updateCount(filtered.length, products.length);

    if (!products.length) {
      listEl.innerHTML = '<div class="admin-empty">אין עדיין מוצרים. לחצו על <b>+</b> כדי להוסיף את המוצר הראשון.</div>';
      return;
    }

    if (!filtered.length) {
      listEl.innerHTML = '<div class="admin-empty">לא נמצאו מוצרים התואמים לחיפוש.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(function (product) {
      var esc = EgozAdminShell.escapeHtml;
      var thumb = product.image_url
        ? '<img class="admin-product__thumb" src="' + esc(product.image_url) + '" alt="" />'
        : '<div class="admin-product__thumb admin-product__thumb--empty">ללא תמונה</div>';

      return (
        '<article class="admin-product" data-id="' + esc(product.id) + '">' +
          '<div class="admin-product__media">' + thumb + '</div>' +
          '<div class="admin-product__body">' +
            '<div class="admin-product__head">' +
              '<b class="admin-product__name">' + esc(product.name) + '</b>' +
              '<span class="admin-product__price">' + esc(formatPrice(product.price)) + '</span>' +
            '</div>' +
            '<p class="admin-product__desc">' + esc(product.description || '—') + '</p>' +
            '<div class="admin-product__meta">' +
              '<span class="admin-product__badge' + (product.is_published ? ' is-live' : '') + '">' +
                (product.is_published ? 'מפורסם' : 'טיוטה') +
              '</span>' +
              '<span>סדר ' + esc(product.sort_order) + '</span>' +
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
    $('productForm').reset();
    $('productId').value = '';
    $('imagePreview').hidden = true;
    $('imagePreview').removeAttribute('src');
    $('formTitle').textContent = 'מוצר חדש';
    $('saveBtn').textContent = 'הוספת מוצר';
    hideAlert('formAlert');
  }

  function openForm(product) {
    resetForm();
    hideAlert('shopAlert');

    if (product) {
      editingId = product.id;
      $('productId').value = product.id;
      $('productName').value = product.name || '';
      $('productDescription').value = product.description || '';
      $('productPrice').value = product.price != null ? String(product.price) : '';
      $('productLink').value = product.purchase_url || '';
      $('productSort').value = product.sort_order != null ? String(product.sort_order) : '0';
      $('productPublished').checked = !!product.is_published;
      $('formTitle').textContent = 'עריכת מוצר';
      $('saveBtn').textContent = 'שמירת שינויים';
      setPreview(product.image_url || '');
    }

    $('productModal').hidden = false;
    document.body.classList.add('admin-modal-open');
    $('productName').focus();
  }

  function closeForm() {
    $('productModal').hidden = true;
    document.body.classList.remove('admin-modal-open');
    resetForm();
  }

  function setPreview(url) {
    var preview = $('imagePreview');
    if (!url) {
      preview.hidden = true;
      preview.removeAttribute('src');
      return;
    }
    preview.src = url;
    preview.hidden = false;
  }

  async function uploadImage(file) {
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var path = crypto.randomUUID() + '.' + ext;
    var sb = EgozAdminAuth.getClient();
    var upload = await sb.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });
    if (upload.error) throw upload.error;
    var publicUrl = sb.storage.from(BUCKET).getPublicUrl(path);
    return publicUrl.data.publicUrl;
  }

  async function loadProducts() {
    var listEl = $('productsList');
    listEl.innerHTML = '<div class="admin-empty">טוען מוצרים...</div>';

    var result = await EgozAdminAuth.getClient()
      .from('shop_products')
      .select('id, name, description, price, image_url, purchase_url, sort_order, is_published, updated_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (result.error) throw result.error;

    allProducts = result.data || [];
    renderProducts(allProducts);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    hideAlert('formAlert');

    var name = $('productName').value.trim();
    var description = $('productDescription').value.trim();
    var price = Number($('productPrice').value);
    var purchaseUrl = $('productLink').value.trim();
    var sortOrder = Number($('productSort').value || 0);
    var isPublished = $('productPublished').checked;
    var saveBtn = $('saveBtn');

    if (!name) return showAlert('יש להזין שם מוצר', 'error', 'formAlert');
    if (Number.isNaN(price) || price < 0) return showAlert('יש להזין מחיר תקין', 'error', 'formAlert');
    if (!purchaseUrl) return showAlert('יש להזין קישור לרכישה', 'error', 'formAlert');
    if (!editingId && !pendingImageFile) return showAlert('יש להעלות תמונת מוצר', 'error', 'formAlert');

    saveBtn.disabled = true;
    saveBtn.textContent = editingId ? 'שומר...' : 'מוסיף...';

    try {
      var imageUrl = null;
      if (pendingImageFile) {
        imageUrl = await uploadImage(pendingImageFile);
      }

      var payload = {
        name: name,
        description: description,
        price: price,
        purchase_url: purchaseUrl,
        sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
        is_published: isPublished
      };

      if (imageUrl) payload.image_url = imageUrl;

      var sb = EgozAdminAuth.getClient();
      var result;

      if (editingId) {
        result = await sb.from('shop_products').update(payload).eq('id', editingId).select().single();
      } else {
        result = await sb.from('shop_products').insert(payload).select().single();
      }

      if (result.error) throw result.error;

      var wasEditing = !!editingId;
      closeForm();
      showAlert(wasEditing ? 'המוצר עודכן בהצלחה' : 'המוצר נוסף בהצלחה', 'success');
      await loadProducts();
    } catch (err) {
      showAlert(err.message || 'שגיאה בשמירת המוצר', 'error', 'formAlert');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = editingId ? 'שמירת שינויים' : 'הוספת מוצר';
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
      var result = await EgozAdminAuth.getClient()
        .from('shop_products')
        .select('*')
        .eq('id', id)
        .single();
      if (result.error) {
        showAlert(result.error.message || 'שגיאה בטעינת המוצר');
        return;
      }
      openForm(result.data);
      return;
    }

    if (action === 'delete') {
      if (!window.confirm('למחוק את המוצר?')) return;
      var del = await EgozAdminAuth.getClient().from('shop_products').delete().eq('id', id);
      if (del.error) {
        showAlert(del.error.message || 'שגיאה במחיקה');
        return;
      }
      if (editingId === id) closeForm();
      showAlert('המוצר נמחק', 'success');
      await loadProducts();
    }
  }

  function bindEvents() {
    $('productForm').addEventListener('submit', handleSubmit);
    $('addProductBtn').addEventListener('click', function () { openForm(); });
    $('cancelEditBtn').addEventListener('click', closeForm);
    $('closeModalBtn').addEventListener('click', closeForm);
    $('modalBackdrop').addEventListener('click', closeForm);
    $('productsList').addEventListener('click', handleListClick);

    $('productSearch').addEventListener('input', function () {
      renderProducts(allProducts);
    });

    $('productImage').addEventListener('change', function (event) {
      var file = event.target.files && event.target.files[0];
      pendingImageFile = file || null;
      if (!file) return;
      setPreview(URL.createObjectURL(file));
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !$('productModal').hidden) {
        closeForm();
      }
    });
  }

  EgozAdminShell.init({
    page: 'shop',
    onReady: async function () {
      bindEvents();
      await loadProducts();
    }
  }).catch(function (err) {
    showAlert(err.message || 'שגיאה בטעינת עמוד החנות');
  });
})();
