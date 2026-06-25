/* Unit page — scroll-driven history timeline */
(function () {
  'use strict';

  function initTimeline(root) {
    var items = Array.prototype.slice.call(root.querySelectorAll('.unit-timeline__item'));
    if (!items.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      root.style.setProperty('--timeline-progress', '1');
      items.forEach(function (item) { item.classList.add('is-visible'); });
      return;
    }

    function update() {
      var vh = window.innerHeight;
      var anchor = vh * 0.72;
      var timelineRect = root.getBoundingClientRect();
      var lineHeight = Math.max(timelineRect.height - 8, 1);
      var fillTo = 0;

      items.forEach(function (item, index) {
        var rect = item.getBoundingClientRect();
        var dotY = rect.top + rect.height * 0.5 - timelineRect.top;

        if (rect.top < anchor) {
          item.classList.add('is-visible');
          fillTo = Math.max(fillTo, dotY);
          return;
        }

        if (index > 0 && items[index - 1].classList.contains('is-visible')) {
          var blend = Math.max(0, Math.min(1, (anchor - rect.top) / Math.max(rect.height, 1)));
          var prevRect = items[index - 1].getBoundingClientRect();
          var prevY = prevRect.top + prevRect.height * 0.5 - timelineRect.top;
          fillTo = Math.max(fillTo, prevY + (dotY - prevY) * (1 - blend));
        }
      });

      var progress = Math.max(0, Math.min(1, fillTo / lineHeight));
      root.style.setProperty('--timeline-progress', String(progress));
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        update();
        ticking = false;
      });
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
        onScroll();
      }, { root: null, rootMargin: '0px 0px -16% 0px', threshold: 0.12 });
      items.forEach(function (item) { io.observe(item); });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', onScroll);
    onScroll();
  }

  function init() {
    document.querySelectorAll('[data-unit-timeline]').forEach(initTimeline);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
