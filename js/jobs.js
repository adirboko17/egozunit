(function () {
  'use strict';

  var listEl = document.getElementById('jobList');
  if (!listEl) return;

  var jobs = [];
  var activeFilter = 'all';

  function esc(value) {
    return EgozSupabasePublic.escapeHtml(value);
  }

  function renderJob(job) {
    var tags = (job.tags || []).map(function (tag) {
      return '<span class="badge">' + esc(tag) + '</span>';
    }).join('');

    return (
      '<article class="job" data-c="' + esc(job.category) + '">' +
        '<div class="job__top">' +
          '<div class="job__logo">' + esc(job.logo_initials || job.title.charAt(0) || '?') + '</div>' +
          '<div style="flex:1;">' +
            '<div class="job__title">' + esc(job.title) + '</div>' +
            '<div class="job__co">' + esc(job.company) + '</div>' +
          '</div>' +
          (job.is_new ? '<span class="badge badge--brass">חדש</span>' : '') +
        '</div>' +
        (job.description ? '<p class="card__excerpt" style="margin-top:12px;">' + esc(job.description) + '</p>' : '') +
        (tags ? '<div class="job__tags">' + tags + '</div>' : '') +
        (job.apply_url && job.apply_url !== '#'
          ? '<a href="' + esc(job.apply_url) + '" class="btn btn--ghost btn--sm" style="margin-top:14px;"' +
            (job.apply_url.indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '') +
            '>הגשת מועמדות</a>'
          : '') +
      '</article>'
    );
  }

  function applyFilter() {
    listEl.querySelectorAll('.job').forEach(function (card) {
      var cat = card.getAttribute('data-c');
      card.style.display = (activeFilter === 'all' || cat === activeFilter) ? '' : 'none';
    });
  }

  function bindFilters() {
    document.querySelectorAll('.jfilter button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.jfilter button').forEach(function (x) { x.classList.remove('is-on'); });
        btn.classList.add('is-on');
        activeFilter = btn.getAttribute('data-f') || 'all';
        applyFilter();
      });
    });
  }

  async function loadJobs() {
    bindFilters();

    var sb = EgozSupabasePublic.getClient();
    if (!sb) return;

    var result = await sb
      .from('site_jobs')
      .select('id, title, company, location, employment_type, description, category, tags, logo_initials, apply_url, is_new')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (result.error || !result.data || !result.data.length) return;

    jobs = result.data;
    listEl.innerHTML = jobs.map(renderJob).join('');
    applyFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadJobs);
  } else {
    loadJobs();
  }
})();
