(function () {
  'use strict';

  var catBtns = document.querySelectorAll('.benefits-cat-row button');
  var benCards = document.querySelectorAll('.ben');
  if (catBtns.length && benCards.length) {
    catBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        catBtns.forEach(function (b) { b.classList.remove('is-on'); });
        btn.classList.add('is-on');
        var filter = btn.getAttribute('data-cat');
        benCards.forEach(function (card) {
          var show = filter === 'all' || card.getAttribute('data-c') === filter;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }
})();
