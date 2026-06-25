/* Home page — media carousel (one card per step, seamless infinite loop) */
(function () {
  'use strict';

  var TRANSITION = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)';

  function bindHomeCarousel(root) {
    var viewport = root.querySelector('.unit-media-carousel__viewport');
    var track = root.querySelector('.unit-media-carousel__track');
    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    var dotsEl = root.querySelector('.unit-media-carousel__dots');
    if (!viewport || !track) return;

    var index = 0;
    var realCount = 0;
    var animating = false;

    function allSlides() {
      return Array.prototype.slice.call(track.querySelectorAll('.unit-media-carousel__slide'));
    }

    function originalSlides() {
      return allSlides().filter(function (slide) {
        return !slide.classList.contains('is-copy');
      });
    }

    function removeCopies() {
      track.querySelectorAll('.unit-media-carousel__slide.is-copy').forEach(function (el) {
        el.remove();
      });
    }

    function setTransform(animate) {
      var slides = allSlides();
      var slide = slides[index];
      if (!slide) return;

      track.style.transition = animate ? TRANSITION : 'none';
      var offset = slide.offsetLeft;
      track.style.transform = 'translate3d(' + (-offset) + 'px, 0, 0)';

      if (!animate) {
        void track.offsetHeight;
        track.style.transition = TRANSITION;
      }
    }

    function activeRealIndex() {
      if (realCount <= 1) return 0;
      var i = (index - realCount) % realCount;
      if (i < 0) i += realCount;
      return i;
    }

    function renderDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = '';
      if (realCount <= 1) return;

      var active = activeRealIndex();
      for (var i = 0; i < realCount; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'unit-media-carousel__dot' + (i === active ? ' is-active' : '');
        dot.setAttribute('aria-label', (i + 1) + ' / ' + realCount);
        dot.setAttribute('aria-current', i === active ? 'true' : 'false');
        (function (idx) {
          dot.addEventListener('click', function () {
            if (realCount <= 1 || animating) return;
            index = realCount + idx;
            move(true);
          });
        })(i);
        dotsEl.appendChild(dot);
      }
    }

    function normalizeIndex() {
      if (realCount <= 1) return;
      if (index >= realCount * 2) {
        index -= realCount;
        setTransform(false);
      } else if (index < realCount) {
        index += realCount;
        setTransform(false);
      }
    }

    function setupLoop() {
      removeCopies();
      var originals = originalSlides();
      realCount = originals.length;
      root.classList.toggle('is-static', realCount <= 1);

      if (realCount <= 1) {
        index = 0;
        setTransform(false);
        renderDots();
        return;
      }

      originals.forEach(function (slide, i) {
        var after = slide.cloneNode(true);
        after.classList.add('is-copy');
        after.setAttribute('aria-hidden', 'true');
        track.appendChild(after);
      });

      for (var i = originals.length - 1; i >= 0; i--) {
        var before = originals[i].cloneNode(true);
        before.classList.add('is-copy');
        before.setAttribute('aria-hidden', 'true');
        track.insertBefore(before, track.firstChild);
      }

      index = realCount;
      setTransform(false);
      renderDots();
    }

    function move(animate) {
      if (realCount <= 1) return;
      animating = animate;
      setTransform(animate);
      renderDots();
    }

    function go(delta) {
      if (realCount <= 1 || animating) return;
      index += delta;
      move(true);
    }

    track.addEventListener('transitionend', function (e) {
      if (e.target !== track || e.propertyName !== 'transform') return;
      animating = false;
      if (realCount <= 1) return;
      normalizeIndex();
      renderDots();
    });

    if (prevBtn) {
      prevBtn.disabled = false;
      prevBtn.addEventListener('click', function () { go(-1); });
    }
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.addEventListener('click', function () { go(1); });
    }

    var touchStartX = 0;
    viewport.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) go(1);
      else go(-1);
    }, { passive: true });

    window.addEventListener('resize', function () {
      normalizeIndex();
      setTransform(false);
    }, { passive: true });

    root.__homeCarouselRefresh = setupLoop;
    setupLoop();
  }

  window.EgozHomeMediaCarousel = {
    init: function (root) {
      if (!root) return;
      if (root.__homeCarouselRefresh) {
        root.__homeCarouselRefresh();
        return;
      }
      bindHomeCarousel(root);
    }
  };
})();
