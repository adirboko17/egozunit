(function () {
  'use strict';

  window.initBenefitsFilter = function () {
    var catRow = document.querySelector('.benefits-cat-row');
    if (!catRow || catRow.dataset.bound === '1') return;
    catRow.dataset.bound = '1';

    catRow.addEventListener('click', function (event) {
      var btn = event.target.closest('button[data-cat]');
      if (!btn) return;

      catRow.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-on'); });
      btn.classList.add('is-on');

      var filter = btn.getAttribute('data-cat');
      document.querySelectorAll('.ben').forEach(function (card) {
        var show = filter === 'all' || card.getAttribute('data-c') === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  };

  initBenefitsFilter();
})();
