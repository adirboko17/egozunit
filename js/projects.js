(function () {
  'use strict';

  var gridEl = document.getElementById('projectsGrid');
  if (!gridEl) return;

  var modalEl = document.getElementById('projectModal');
  var modalHeroEl = document.getElementById('projectModalHero');
  var modalTitleEl = document.getElementById('projectModalTitle');
  var modalLeadEl = document.getElementById('projectModalLead');
  var modalBodyEl = document.getElementById('projectModalBody');
  var modalGalleryEl = document.getElementById('projectModalGallery');
  var modalGallerySectionEl = document.getElementById('projectModalGallerySection');

  var projects = [];
  var lastFocusEl = null;

  function esc(v) {
    return String(v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function decodeEntities(text) {
    return String(text || '')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  function bodyHtml(text) {
    var raw = decodeEntities(text || '').trim();
    if (!raw) return '';
    return raw.split(/\n\s*\n/).map(function (para) {
      return '<p>' + esc(para.trim().replace(/\n/g, ' ')) + '</p>';
    }).join('');
  }

  function galleryHtml(urls) {
    if (!urls || !urls.length) return '';
    return urls.map(function (url) {
      return (
        '<figure class="project-modal__gallery-item">' +
        '<img src="' + esc(url) + '" alt="" loading="lazy" decoding="async" />' +
        '</figure>'
      );
    }).join('');
  }

  function renderCard(item, index) {
    var num = pad2(index + 1);
    var id = item.slug ? ' id="' + esc(item.slug) + '"' : '';
    var imageHtml = item.image_url
      ? '<figure class="project-card__media">' +
          '<img src="' + esc(item.image_url) + '" alt="' + esc(item.title) + '" loading="lazy" decoding="async" />' +
        '</figure>'
      : '';

    return (
      '<article class="project-card"' + id + '>' +
        imageHtml +
        '<div class="project-card__head">' +
          '<span class="project-card__num" aria-hidden="true">' + num + '</span>' +
        '</div>' +
        '<h2 class="project-card__title">' + esc(item.title) + '</h2>' +
        (item.description
          ? '<p class="project-card__lead">' + esc(item.description) + '</p>'
          : '') +
        '<div class="project-card__foot">' +
          '<button type="button" class="btn btn--outline btn--sm project-card__read" data-project-slug="' + esc(item.slug || '') + '">' +
            'קרא הכל על הפרויקט' +
            ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>' +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function findProject(slug) {
    return projects.find(function (item) { return item.slug === slug; }) || null;
  }

  function openModal(item) {
    if (!modalEl || !item) return;
    lastFocusEl = document.activeElement;

    if (item.image_url) {
      modalHeroEl.innerHTML = '<img src="' + esc(item.image_url) + '" alt="' + esc(item.title) + '" />';
      modalHeroEl.hidden = false;
    } else {
      modalHeroEl.innerHTML = '';
      modalHeroEl.hidden = true;
    }

    modalTitleEl.textContent = item.title || '';
    modalLeadEl.textContent = item.description || '';
    modalLeadEl.hidden = !item.description;
    modalBodyEl.innerHTML = bodyHtml(item.body);

    var gallery = Array.isArray(item.gallery_urls) ? item.gallery_urls : [];
    modalGalleryEl.innerHTML = galleryHtml(gallery);
    if (modalGallerySectionEl) modalGallerySectionEl.hidden = !gallery.length;

    var scrollEl = modalEl.querySelector('.project-modal__scroll');
    if (scrollEl) scrollEl.scrollTop = 0;

    modalEl.hidden = false;
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('projects-modal-open');

    var closeBtn = modalEl.querySelector('.project-modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.hidden = true;
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('projects-modal-open');
    if (lastFocusEl && typeof lastFocusEl.focus === 'function') lastFocusEl.focus();
  }

  function showSkeleton() {
    gridEl.innerHTML =
      '<div class="projects-skeleton">' +
        Array(6).fill('<div class="projects-skeleton__card"></div>').join('') +
      '</div>';
  }

  function bindModal() {
    if (!modalEl) return;

    modalEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-project-close]')) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modalEl.hidden) closeModal();
    });
  }

  function bindGrid() {
    gridEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-project-slug]');
      if (!btn) return;
      var slug = btn.getAttribute('data-project-slug');
      var item = findProject(slug);
      if (item) openModal(item);
    });
  }

  function openFromHash() {
    var hash = window.location.hash.replace('#', '');
    if (!hash) return;
    var item = findProject(hash);
    if (item) {
      setTimeout(function () { openModal(item); }, 120);
    }
  }

  async function load() {
    showSkeleton();

    var sb = window.EgozSupabasePublic && EgozSupabasePublic.getClient();
    if (!sb) {
      gridEl.innerHTML = '<p class="muted" style="text-align:center;padding:40px 0">אין חיבור.</p>';
      return;
    }

    var result = await sb
      .from('site_projects')
      .select('title, description, body, slug, image_url, gallery_urls')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (result.error || !result.data || !result.data.length) {
      gridEl.innerHTML = '<p class="muted" style="text-align:center;padding:40px 0">אין פרויקטים כרגע.</p>';
      return;
    }

    projects = result.data;
    gridEl.innerHTML = projects.map(renderCard).join('');
    openFromHash();
  }

  bindModal();
  bindGrid();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
