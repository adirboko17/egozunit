(function () {
  'use strict';

  var form = document.getElementById('contactForm');
  var success = document.getElementById('contactSuccess');
  var resetBtn = document.getElementById('contactReset');
  var submitBtn = document.getElementById('contactSubmit');
  var errorBox = document.getElementById('contactError');
  if (!form || !success) return;

  function t(key, fallback) {
    if (!window.EgozI18n) return fallback;
    return EgozI18n.t('contact', key, EgozI18n.getLang()) || fallback;
  }

  function showError() {
    if (!errorBox) return;
    errorBox.hidden = false;
    errorBox.textContent = t('form.sendError', 'לא הצלחנו לשלוח את ההודעה. נסו שוב בעוד כמה רגעים.');
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideError() {
    if (errorBox) errorBox.hidden = true;
  }

  function setSubmitting(submitting) {
    if (!submitBtn) return;
    submitBtn.disabled = submitting;
    submitBtn.textContent = submitting
      ? t('form.sending', 'שולח...')
      : t('form.submit', 'שליחה');
  }

  function showSuccess() {
    form.classList.add('is-hidden');
    success.classList.add('is-active');
    success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function resetForm() {
    form.reset();
    form.classList.remove('is-hidden');
    success.classList.remove('is-active');
    hideError();
    setSubmitting(false);
    form.querySelectorAll('.input, .textarea').forEach(function (el) {
      el.style.borderColor = '';
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var data = new FormData(form);
    var payload = {};
    data.forEach(function (value, key) {
      payload[key] = String(value);
    });

    setSubmitting(true);

    try {
      var response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('send_failed');
      showSuccess();
    } catch (error) {
      showError();
    } finally {
      setSubmitting(false);
    }
  });

  if (resetBtn) resetBtn.addEventListener('click', resetForm);

  document.addEventListener('egoz:langchange', function () {
    if (submitBtn && !submitBtn.disabled) setSubmitting(false);
    if (errorBox && !errorBox.hidden) showError();
  });
})();
