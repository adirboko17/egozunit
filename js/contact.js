(function () {
  'use strict';

  var form = document.getElementById('contactForm');
  var success = document.getElementById('contactSuccess');
  var resetBtn = document.getElementById('contactReset');
  if (!form || !success) return;

  function showSuccess() {
    form.classList.add('is-hidden');
    success.classList.add('is-active');
    success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function resetForm() {
    form.reset();
    form.classList.remove('is-hidden');
    success.classList.remove('is-active');
    form.querySelectorAll('.input, .textarea').forEach(function (el) {
      el.style.borderColor = '';
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var reqs = form.querySelectorAll('[required]');
    var ok = true;
    reqs.forEach(function (el) {
      var valid = !!el.value.trim();
      el.style.borderColor = valid ? '' : 'var(--maroon-600)';
      if (!valid && ok) el.focus();
      if (!valid) ok = false;
    });
    if (!ok) return;

    var data = new FormData(form);
    var subject = data.get('subject') || 'פנייה מאתר אגוז';
    var body = [
      'שם: ' + data.get('firstName') + ' ' + data.get('lastName'),
      'אימייל: ' + data.get('email'),
      'טלפון: ' + (data.get('phone') || '—'),
      '',
      data.get('message')
    ].join('\n');

    var mailto = 'mailto:office@egoz.org.il'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
    window.location.href = mailto;
    showSuccess();
  });

  if (resetBtn) resetBtn.addEventListener('click', resetForm);
})();
