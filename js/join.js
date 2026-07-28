(function () {
  'use strict';

  var PENDING_EMAIL_KEY = 'egoz_pending_signup_email';
  var pendingSignupEmail = '';

  function $(id) { return document.getElementById(id); }

  function t(key, fallback) {
    if (window.EgozI18n) {
      var val = EgozI18n.t('join', key, EgozI18n.getLang());
      if (val) return val;
    }
    return fallback || '';
  }

  function showAlert(targetId, message, type) {
    var el = $(targetId);
    if (!el) return;
    el.hidden = false;
    el.className = 'auth-alert auth-alert--' + (type || 'error');
    el.textContent = message;
  }

  function hideAlert(targetId) {
    var el = $(targetId);
    if (!el) return;
    el.hidden = true;
  }

  function setStepIndicator(step) {
    document.querySelectorAll('[data-step-indicator]').forEach(function (el) {
      var n = Number(el.getAttribute('data-step-indicator'));
      el.classList.toggle('is-active', n === step);
      el.classList.toggle('is-done', n < step);
    });
  }

  function showOnly(id) {
    ['stepA', 'confirmNotice', 'stepB', 'joinSuccess'].forEach(function (cardId) {
      var el = $(cardId);
      if (el) el.classList.toggle('is-hidden', cardId !== id);
    });
  }

  function savePendingEmail(email) {
    pendingSignupEmail = email;
    try { sessionStorage.setItem(PENDING_EMAIL_KEY, email); } catch (e) {}
  }

  function loadPendingEmail() {
    if (pendingSignupEmail) return pendingSignupEmail;
    try {
      pendingSignupEmail = sessionStorage.getItem(PENDING_EMAIL_KEY) || '';
    } catch (e) {
      pendingSignupEmail = '';
    }
    return pendingSignupEmail;
  }

  function clearPendingEmail() {
    pendingSignupEmail = '';
    try { sessionStorage.removeItem(PENDING_EMAIL_KEY); } catch (e) {}
  }

  function showConfirmLink(email) {
    savePendingEmail(email);
    var display = $('confirmEmailDisplay');
    if (display) display.textContent = email;
    showOnly('confirmNotice');
  }

  function waitForAuthSession(timeoutMs) {
    return EgozAuth.getSession().then(function (session) {
      if (session) return session;
      return new Promise(function (resolve) {
        var client = EgozAuth.getClient();
        var done = false;
        var finish = function (value) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          if (subscription) subscription.unsubscribe();
          resolve(value);
        };
        var timer = setTimeout(function () { finish(null); }, timeoutMs || 4000);
        var subscription = null;
        var result = client.auth.onAuthStateChange(function (_event, nextSession) {
          if (nextSession) finish(nextSession);
        });
        subscription = result.data.subscription;
      });
    }).catch(function () { return null; });
  }

  function renderPasswordRules(password) {
    var list = $('pwRules');
    if (!list) return;
    var check = EgozAuth.checkPassword(password);
    list.innerHTML = check.rules.map(function (rule) {
      return '<li class="' + (rule.valid ? 'is-ok' : '') + '">' +
        '<span class="pw-rules__icon" aria-hidden="true">' + (rule.valid ? '✓' : '') + '</span>' +
        '<span>' + rule.label + '</span></li>';
    }).join('');
    return check.valid;
  }

  function updatePasswordToggleAria(btn, visible) {
    btn.setAttribute('aria-pressed', visible ? 'false' : 'true');
    btn.setAttribute('aria-label', visible ? t('pw.show', 'הצג סיסמה') : t('pw.hide', 'הסתר סיסמה'));
  }

  function initPasswordToggles(root) {
    (root || document).querySelectorAll('.input-password__toggle').forEach(function (btn) {
      if (btn.dataset.joinToggleBound) return;
      btn.dataset.joinToggleBound = '1';
      btn.addEventListener('click', function () {
        var input = $(btn.getAttribute('data-target'));
        if (!input) return;
        var visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        btn.classList.toggle('is-visible', !visible);
        updatePasswordToggleAria(btn, visible);
      });
    });
  }

  function proceedToStepB(user, profile) {
    clearPendingEmail();
    if (user && user.email) $('pEmail').value = user.email;
    setStepIndicator(2);
    showOnly('stepB');
    initStepB(user, profile || null);
  }

  function initConfirmLink() {
    var backBtn = $('confirmBackBtn');
    if (!backBtn) return;
    backBtn.addEventListener('click', function () {
      clearPendingEmail();
      showOnly('stepA');
      setStepIndicator(1);
    });
  }

  function initStepA() {
    var form = $('signupForm');
    var pwInput = $('suPassword');
    var pw2Input = $('suPassword2');
    var btn = $('signupBtn');
    if (!form) return;

    initPasswordToggles(form);
    renderPasswordRules('');
    pwInput.addEventListener('input', function () { renderPasswordRules(pwInput.value); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert('signupAlert');

      var email = $('suEmail').value.trim();
      var password = pwInput.value;
      var password2 = pw2Input.value;

      var check = EgozAuth.checkPassword(password);
      if (!check.valid) {
        renderPasswordRules(password);
        return showAlert('signupAlert', t('alert.passwordRules', 'הסיסמה אינה עומדת בכל הכללים המפורטים למטה'), 'error');
      }
      if (password !== password2) {
        return showAlert('signupAlert', t('alert.passwordMismatch', 'אימות הסיסמה אינו תואם'), 'error');
      }

      btn.disabled = true;
      btn.textContent = t('btn.signingUp', 'נרשם...');

      EgozAuth.signUp(email, password)
        .then(function (data) {
          if (data.session) {
            proceedToStepB(data.session.user);
            return;
          }
          showConfirmLink(email);
        })
        .catch(function (err) {
          showAlert('signupAlert', EgozAuth.formatSignupError(err), 'error');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = t('btn.signup', 'הרשמה');
        });
    });
  }

  function validateConsentBoxes() {
    var privacy = $('pPrivacy');
    var bylaws = $('pBylaws');
    var privacyChoice = $('pPrivacyChoice');
    var bylawsChoice = $('pBylawsChoice');

    if (privacyChoice) privacyChoice.classList.remove('is-invalid');
    if (bylawsChoice) bylawsChoice.classList.remove('is-invalid');

    var privacyOk = privacy && privacy.checked;
    var bylawsOk = bylaws && bylaws.checked;

    if (!privacyOk && privacyChoice) privacyChoice.classList.add('is-invalid');
    if (!bylawsOk && bylawsChoice) bylawsChoice.classList.add('is-invalid');

    if (!privacyOk && !bylawsOk) {
      return t('alert.privacyBylawsRequired', 'יש לסמן את אישור מדיניות הפרטיות ואת אישור תקנון העמותה לפני שליחת הטופס');
    }
    if (!privacyOk) return t('alert.privacyRequired', 'יש לסמן את אישור מדיניות הפרטיות לפני שליחת הטופס');
    if (!bylawsOk) return t('alert.bylawsRequired', 'יש לסמן את אישור תקנון העמותה לפני שליחת הטופס');
    return '';
  }

  function initConsentValidation(form) {
    ['pPrivacy', 'pBylaws'].forEach(function (id) {
      var input = $(id);
      if (!input) return;
      input.addEventListener('change', function () {
        var choice = input.closest('.choice');
        if (choice && input.checked) choice.classList.remove('is-invalid');
      });
    });
  }

  function initStepB(user, existingProfile) {
    var form = $('profileForm');
    var btn = $('profileBtn');
    if (!form) return;

    if (user && user.email) $('pEmail').value = user.email;
    EgozMemberProfile.fillProfileForm(existingProfile);
    initConsentValidation(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert('profileAlert');

      var consentError = validateConsentBoxes();
      if (consentError) {
        showAlert('profileAlert', consentError, 'error');
        var firstInvalid = form.querySelector('.choice.is-invalid');
        if (firstInvalid && firstInvalid.scrollIntoView) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var payload = EgozMemberProfile.collectProfilePayload({ registrationCompleted: true });
      var validationError = EgozMemberProfile.validateProfilePayload(payload, true);
      if (validationError) return showAlert('profileAlert', validationError, 'error');

      btn.disabled = true;
      btn.textContent = t('btn.sending', 'שולח...');

      EgozAuth.saveMemberProfile(user.id, payload)
        .then(function () {
          window.location.href = '/ambassadors?welcome=1';
        })
        .catch(function (err) {
          showAlert('profileAlert', err.message || t('alert.profileSaveError', 'שגיאה בשמירת הפרטים, נסו שוב'), 'error');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = t('btn.profileSubmit', 'סיימתי, אפשר לשלוח');
        });
    });
  }

  function onLangChange() {
    var pwInput = $('suPassword');
    if (pwInput) renderPasswordRules(pwInput.value);
    document.querySelectorAll('.input-password__toggle').forEach(function (btn) {
      var input = $(btn.getAttribute('data-target'));
      if (!input) return;
      updatePasswordToggleAria(btn, input.type === 'text');
    });
  }

  async function boot() {
    initStepA();
    initConfirmLink();
    if (window.EgozLegalModals) EgozLegalModals.init();
    document.addEventListener('egoz:langchange', onLangChange);

    var params = new URLSearchParams(window.location.search);
    var forceStep2 = params.get('step') === '2';

    var session = null;
    try {
      session = await EgozAuth.getSession();
    } catch (e) {
      session = null;
    }

    if (forceStep2 && !session) {
      session = await waitForAuthSession(4000);
    }

    if (!session && forceStep2) {
      window.location.replace('/login?next=join');
      return;
    }

    if (!session) {
      var pendingEmail = loadPendingEmail();
      if (pendingEmail) {
        showConfirmLink(pendingEmail);
        setStepIndicator(1);
        return;
      }
      showOnly('stepA');
      setStepIndicator(1);
      return;
    }

    var profile = null;
    try {
      profile = await EgozAuth.getMemberProfile(session.user.id);
    } catch (e) {
      profile = null;
    }

    if (profile && profile.registration_completed && !forceStep2) {
      window.location.replace('/account');
      return;
    }

    proceedToStepB(session.user, profile);
    if (profile && profile.registration_completed) {
      showAlert('profileAlert', t('alert.profileComplete', 'כבר השלמתם את ההרשמה - ניתן לעדכן פרטים כאן או לעבור לאזור האישי'), 'info');
    }
  }

  boot();
})();

