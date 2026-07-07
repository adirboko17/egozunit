(function () {
  'use strict';

  var products = [];
  var openProductId = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getLang() {
    if (window.EgozI18n && typeof EgozI18n.getLang === 'function') {
      return EgozI18n.getLang();
    }
    return document.documentElement.lang === 'en' ? 'en' : 'he';
  }

  function formatPrice(value) {
    var num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString(getLang() === 'en' ? 'en-IL' : 'he-IL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }) + ' ₪';
  }

  function t(key, fallback) {
    if (window.EgozI18n && typeof EgozI18n.t === 'function') {
      var value = EgozI18n.t('shop', key, getLang());
      if (value) return value;
    }
    return fallback;
  }

  function localizedProduct(product) {
    if (!product) return { name: '', description: '' };
    var lang = getLang();
    if (lang === 'en') {
      return {
        name: product.name_en || product.name || '',
        description: product.description_en || product.description || ''
      };
    }
    return {
      name: product.name || '',
      description: product.description || ''
    };
  }

  function animateCards(gridEl) {
    var cards = gridEl.querySelectorAll('.product');
    cards.forEach(function (card, index) {
      card.style.setProperty('--shop-delay', String((index % 4) * 80) + 'ms');
      requestAnimationFrame(function () {
        card.classList.add('is-visible');
      });
    });
  }

  function findProduct(id) {
    return products.find(function (product) {
      return product.id === id;
    });
  }

  function productImageMarkup(product, className) {
    var esc = escapeHtml;
    var localized = localizedProduct(product);
    if (product.image_url) {
      return '<img src="' + esc(product.image_url) + '" alt="' + esc(localized.name) + '" loading="lazy" decoding="async" />';
    }
    return '<div class="' + className + '">' + esc(localized.name.charAt(0) || '?') + '</div>';
  }

  function openProductModal(product) {
    var modal = document.getElementById('shopProductModal');
    var media = document.getElementById('shopModalMedia');
    var title = document.getElementById('shopModalTitle');
    var desc = document.getElementById('shopModalDesc');
    var price = document.getElementById('shopModalPrice');
    var buy = document.getElementById('shopModalBuy');

    if (!modal || !product) return;

    openProductId = product.id;
    var localized = localizedProduct(product);

    media.innerHTML = productImageMarkup(product, 'shop-modal__placeholder');
    title.textContent = localized.name;
    desc.textContent = localized.description || t('modal.noDescription', 'אין תיאור נוסף למוצר זה.');
    price.textContent = formatPrice(product.price);
    buy.href = product.purchase_url || '#';
    buy.textContent = t('products.buy', 'לרכישה');

    modal.hidden = false;
    document.body.classList.add('shop-modal-open');
    requestAnimationFrame(function () {
      modal.classList.add('is-open');
    });
  }

  function closeProductModal() {
    var modal = document.getElementById('shopProductModal');
    if (!modal || modal.hidden) return;

    openProductId = null;
    modal.classList.remove('is-open');
    document.body.classList.remove('shop-modal-open');
    window.setTimeout(function () {
      modal.hidden = true;
    }, 180);
  }

  function bindModalEvents(gridEl) {
    gridEl.addEventListener('click', function (event) {
      if (event.target.closest('.add-btn')) {
        event.stopPropagation();
      }
      var card = event.target.closest('.product');
      if (!card) return;

      openProductModal(findProduct(card.getAttribute('data-product-id')));
    });

    gridEl.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var card = event.target.closest('.product');
      if (!card) return;
      event.preventDefault();
      openProductModal(findProduct(card.getAttribute('data-product-id')));
    });

    document.querySelectorAll('[data-shop-modal-close]').forEach(function (closeBtn) {
      closeBtn.addEventListener('click', closeProductModal);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeProductModal();
    });
  }

  function renderProductCard(product) {
    var esc = escapeHtml;
    var localized = localizedProduct(product);
    var detailsButtonLabel = t('products.moreDetails', 'פרטים נוספים');
    var catLabel = t('products.category', 'מוצר אגוז');

    return (
      '<article class="product" data-product-id="' + esc(product.id) + '" role="button" tabindex="0" aria-label="' + esc(localized.name) + '">' +
        '<div class="product__media">' +
          '<span class="product__tag product__tag--hot">' + esc(catLabel) + '</span>' +
          productImageMarkup(product, 'product__placeholder') +
        '</div>' +
        '<div class="product__body">' +
          '<span class="product__cat">' + esc(catLabel) + '</span>' +
          '<h3 class="product__name">' + esc(localized.name) + '</h3>' +
          (localized.description
            ? '<p class="product__desc">' + esc(localized.description) + '</p>'
            : '') +
          '<div class="product__foot">' +
            '<span class="product__price">' + esc(formatPrice(product.price)) + '</span>' +
            '<button class="add-btn" type="button">' + esc(detailsButtonLabel) + '</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderCatalogMeta(count) {
    var heroLead = document.querySelector('[data-shop-hero-lead]');
    var catalogLead = document.getElementById('shopCatalogLead');

    if (heroLead) {
      heroLead.textContent = t('hero.leadLive', 'מוצרי מורשת, לבוש ופריטים לקהילת אגוז — נרכשים בקישור חיצוני.');
    }

    if (catalogLead) {
      catalogLead.textContent = count === 1
        ? t('catalog.countOne', 'מוצר אחד זמין לרכישה')
        : t('catalog.countMany', '{count} מוצרים זמינים לרכישה').replace('{count}', String(count));
    }
  }

  function renderProductsGrid() {
    var gridEl = document.getElementById('shopGrid');
    if (!gridEl || !products.length) return;

    gridEl.innerHTML = products.map(renderProductCard).join('');
    animateCards(gridEl);

    if (openProductId) {
      openProductModal(findProduct(openProductId));
    }
  }

  async function loadProducts() {
    var soonSection = document.getElementById('shopEmpty');
    var catalogSection = document.getElementById('shopCatalog');
    var gridEl = document.getElementById('shopGrid');

    if (!window.supabase || !window.EGOZ_SUPABASE) return;

    var sb = window.supabase.createClient(
      window.EGOZ_SUPABASE.url,
      window.EGOZ_SUPABASE.anonKey
    );

    var result = await sb
      .from('shop_products')
      .select('id, name, name_en, description, description_en, price, image_url, purchase_url')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (result.error || !result.data || !result.data.length) {
      if (soonSection) soonSection.hidden = false;
      if (catalogSection) catalogSection.hidden = true;
      return;
    }

    products = result.data;
    renderCatalogMeta(result.data.length);

    if (soonSection) soonSection.hidden = true;
    if (catalogSection) catalogSection.hidden = false;

    gridEl.innerHTML = result.data.map(renderProductCard).join('');

    bindModalEvents(gridEl);
    animateCards(gridEl);
  }

  document.addEventListener('egoz:langchange', function () {
    renderCatalogMeta(products.length);
    renderProductsGrid();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProducts);
  } else {
    loadProducts();
  }
})();
