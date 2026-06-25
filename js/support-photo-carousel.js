/* Support page — auto-playing photo carousel (infinite fade loop) */
(function () {
  'use strict';

  var INTERVAL = 4500;
  var FADE_MS = 800;

  function bindCarousel(root) {
    var track = root.querySelector('.support-photo-carousel__track');
    var dotsEl = root.querySelector('.support-photo-carousel__dots');
    if (!track) return;

    var slides = Array.prototype.slice.call(
      track.querySelectorAll('.support-photo-carousel__slide')
    );
    if (!slides.length) return;

    root.classList.toggle('is-static', slides.length <= 1);
    if (slides.length <= 1) return;

    var index = slides.findIndex(function (slide) {
      return slide.classList.contains('is-active');
    });
    if (index < 0) index = 0;

    var timer = null;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function renderDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = '';
      for (var i = 0; i < slides.length; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'support-photo-carousel__dot' + (i === index ? ' is-active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', (i + 1) + ' / ' + slides.length);
        dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
        (function (idx) {
          dot.addEventListener('click', function () {
            if (idx === index) return;
            show(idx);
            stop();
            start();
          });
        })(i);
        dotsEl.appendChild(dot);
      }
    }

    function show(nextIndex) {
      slides[index].classList.remove('is-active');
      index = (nextIndex + slides.length) % slides.length;
      slides[index].classList.add('is-active');
      renderDots();
    }

    function next() {
      show(index + 1);
    }

    function start() {
      if (reducedMotion || timer) return;
      timer = setInterval(next, INTERVAL);
    }

    function stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });

    track.style.setProperty('--support-photo-fade', FADE_MS + 'ms');
    renderDots();
    start();
  }

  function init() {
    document.querySelectorAll('[data-support-photo-carousel]').forEach(bindCarousel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
