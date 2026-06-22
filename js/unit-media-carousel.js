/* Unit page — media carousel (3 cards per slide) */
(function () {
  'use strict';

  function bindCarousel(root) {
    var viewport = root.querySelector('.unit-media-carousel__viewport');
    var track = root.querySelector('.unit-media-carousel__track');
    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    var dotsEl = root.querySelector('.unit-media-carousel__dots');
    if (!viewport || !track) return;

    var slides = [];
    var page = 0;

    function readSlides() {
      slides = Array.prototype.slice.call(track.querySelectorAll('.unit-media-carousel__slide'));
    }

    function pages() {
      return Math.max(1, slides.length);
    }

    function clampPage() {
      page = Math.max(0, Math.min(page, pages() - 1));
    }

    function renderDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = '';
      var count = pages();
      for (var i = 0; i < count; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'unit-media-carousel__dot' + (i === page ? ' is-active' : '');
        dot.setAttribute('aria-label', (i + 1) + ' / ' + count);
        dot.setAttribute('aria-current', i === page ? 'true' : 'false');
        (function (idx) {
          dot.addEventListener('click', function () {
            page = idx;
            update();
          });
        })(i);
        dotsEl.appendChild(dot);
      }
    }

    function update() {
      readSlides();
      clampPage();
      var maxPage = pages() - 1;
      var offset = page * viewport.clientWidth;
      var rtl = document.documentElement.dir === 'rtl';
      track.style.transform = 'translate3d(' + (rtl ? offset : -offset) + 'px, 0, 0)';

      if (prevBtn) prevBtn.disabled = page <= 0;
      if (nextBtn) nextBtn.disabled = page >= maxPage;

      root.classList.toggle('is-static', slides.length <= 1);
      renderDots();
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        page -= 1;
        update();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        page += 1;
        update();
      });
    }

    var touchStartX = 0;
    viewport.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 40) return;
      var rtl = document.documentElement.dir === 'rtl';
      if (dx < 0) page += rtl ? -1 : 1;
      else page += rtl ? 1 : -1;
      update();
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });

    root.__mediaCarouselRefresh = function () {
      page = 0;
      update();
    };

    update();
  }

  window.EgozUnitMediaCarousel = {
    init: function (root) {
      if (!root) return;
      if (root.__mediaCarouselRefresh) {
        root.__mediaCarouselRefresh();
        return;
      }
      bindCarousel(root);
    }
  };

  if (!document.getElementById('unitMediaTrack')) {
    document.querySelectorAll('[data-unit-media-carousel]').forEach(function (root) {
      window.EgozUnitMediaCarousel.init(root);
    });
  }
})();
