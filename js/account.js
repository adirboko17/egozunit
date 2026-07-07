(function () {
  'use strict';

  var state = {
    session: null,
    profile: null,
    activePanel: 'profile'
  };

  function $(id) { return document.getElementById(id); }

  function t(key, fallback) {
    if (window.EgozI18n) {
      var val = EgozI18n.t('account', key, EgozI18n.getLang());
      if (val) return val;
    }
    return fallback || '';
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showAlert(targetId, message, type) {
    var el = $(targetId);
    if (!el) return;
    el.hidden = false;
    el.className = 'auth-alert auth-alert--' + (type || 'error');
    el.textContent = message;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlert(targetId) {
    var el = $(targetId);
    if (!el) return;
    el.hidden = true;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function scrollActiveNavIntoView() {
    if (!window.matchMedia('(max-width: 900px)').matches) return;
    var nav = document.querySelector('.account-nav');
    if (!nav) return;
    var active = nav.querySelector('.account-nav__btn.is-active');
    if (!active) return;

    var navRect = nav.getBoundingClientRect();
    var activeRect = active.getBoundingClientRect();
    var delta = (activeRect.left + activeRect.width / 2) - (navRect.left + navRect.width / 2);
    nav.scrollLeft += delta;
  }

  function setPanel(panelId, pushHash) {
    state.activePanel = panelId;
    document.querySelectorAll('[data-account-panel]').forEach(function (panel) {
      panel.classList.toggle('is-hidden', panel.getAttribute('data-account-panel') !== panelId);
    });
    document.querySelectorAll('[data-account-nav]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-account-nav') === panelId);
    });
    scrollActiveNavIntoView();
    if (pushHash !== false) {
      history.replaceState(null, '', '#/' + panelId);
    }
  }

  function initNav() {
    document.querySelectorAll('[data-account-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = btn.getAttribute('data-account-nav');
        if (panel === 'logout') return;
        setPanel(panel);
      });
    });
    var hash = (window.location.hash || '').replace(/^#\/?/, '');
    if (hash && document.querySelector('[data-account-panel="' + hash + '"]')) {
      setPanel(hash, false);
    } else {
      setPanel('profile', false);
    }
  }

  function renderHero() {
    var profile = state.profile || {};
    var user = state.session.user;
    var name = profile.full_name || user.email || t('member.defaultName', 'חבר עמותה');
    $('accountHeroName').textContent = name;
    $('accountHeroMeta').textContent = profile.phone ? profile.phone + ' · ' + (profile.email || user.email) : (profile.email || user.email);
  }

  function renderProfileOverview() {
    var p = state.profile || {};
    var fields = [
      { label: t('member.fullName', 'שם מלא'), value: p.full_name },
      { label: t('member.email', 'מייל'), value: p.email || state.session.user.email },
      { label: t('member.phone', 'טלפון'), value: p.phone },
      { label: t('member.gender', 'מגדר'), value: EgozMemberProfile.genderLabel(p.gender) },
      { label: t('member.birthDate', 'תאריך לידה'), value: formatDate(p.birth_date) },
      { label: t('member.unitYearShort', 'שנת הצטרפות ליחידה'), value: p.unit_join_year },
      { label: t('member.role', 'תפקיד ביחידה'), value: EgozMemberProfile.roleLabel(p.role) },
      { label: t('stat.company', 'פלוגה'), value: p.company },
      { label: t('member.occupation', 'עיסוק'), value: p.occupation },
      { label: t('stat.academicShort', 'מוסד לימוד'), value: p.academic_institution },
      { label: t('member.studyStatus', 'סטטוס לימודים'), value: p.study_status },
      { label: t('stat.addressCombined', 'כתובת'), value: [p.address, p.city, p.country].filter(Boolean).join(', ') }
    ];

    $('profileStats').innerHTML = fields.map(function (field) {
      return (
        '<div class="account-stat">' +
          '<span class="account-stat__label">' + esc(field.label) + '</span>' +
          '<span class="account-stat__value">' + esc(field.value || '—') + '</span>' +
        '</div>'
      );
    }).join('');
  }

  function initEditForm() {
    var form = $('profileForm');
    var btn = $('profileBtn');
    if (!form) return;

    EgozMemberProfile.fillProfileForm(state.profile);
    if (state.session.user.email) $('pEmail').value = state.profile.email || state.session.user.email;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert('profileAlert');

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var payload = EgozMemberProfile.collectProfilePayload({ registrationCompleted: true });
      var validationError = EgozMemberProfile.validateProfilePayload(payload, true);
      if (validationError) return showAlert('profileAlert', validationError, 'error');

      btn.disabled = true;
      btn.textContent = t('btn.saving', 'שומר...');

      EgozAuth.saveMemberProfile(state.session.user.id, payload)
        .then(function (saved) {
          state.profile = saved;
          renderHero();
          renderProfileOverview();
          showAlert('profileAlert', t('alert.profileSaved', 'הפרטים נשמרו בהצלחה'), 'success');
        })
        .catch(function (err) {
          showAlert('profileAlert', err.message || t('alert.saveError', 'שגיאה בשמירה, נסו שוב'), 'error');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = t('btn.saveChanges', 'שמירת שינויים');
        });
    });
  }

  function initVolunteerForm() {
    var form = $('volunteerForm');
    var btn = $('volunteerBtn');
    if (!form) return;

    var p = state.profile || {};
    if ($('vVolunteerArea')) $('vVolunteerArea').value = p.volunteer_area || '';
    if ($('vVolunteerDetails')) $('vVolunteerDetails').value = p.volunteer_area_details || '';
    if ($('vVehicle')) $('vVehicle').value = p.has_vehicle_details || '';
    if ($('vEventBiz')) $('vEventBiz').value = p.event_business_details || '';
    if ($('vArtist')) $('vArtist').value = p.artist_details || '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert('volunteerAlert');

      var payload = {
        volunteer_area: $('vVolunteerArea') ? $('vVolunteerArea').value : '',
        volunteer_area_details: $('vVolunteerDetails') ? $('vVolunteerDetails').value.trim() : '',
        has_vehicle_details: $('vVehicle') ? $('vVehicle').value.trim() : '',
        event_business_details: $('vEventBiz') ? $('vEventBiz').value.trim() : '',
        artist_details: $('vArtist') ? $('vArtist').value.trim() : ''
      };

      btn.disabled = true;
      btn.textContent = t('btn.saving', 'שומר...');

      EgozAuth.saveMemberProfile(state.session.user.id, payload)
        .then(function (saved) {
          state.profile = Object.assign({}, state.profile, saved);
          EgozMemberProfile.fillProfileForm(state.profile);
          showAlert('volunteerAlert', t('alert.volunteerSaved', 'תחומי ההתנדבות נשמרו בהצלחה'), 'success');
        })
        .catch(function (err) {
          showAlert('volunteerAlert', err.message || t('alert.saveError', 'שגיאה בשמירה, נסו שוב'), 'error');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = t('btn.saveVolunteer', 'שמירת תחומי התנדבות');
        });
    });
  }

  function renderEvents(events) {
    var container = $('eventsList');
    var upcoming = events.filter(function (event) {
      return !EgozSupabasePublic.isPastEvent(event.event_date);
    });

    if (!upcoming.length) {
      container.innerHTML =
        '<div class="account-empty">' +
          '<div class="account-empty__icon" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>' +
          '<h3>' + esc(t('events.empty.title', 'אין אירועים קרובים כרגע')) + '</h3>' +
          '<p>' + esc(t('events.empty.lead', 'אירועים חדשים מתפרסמים מעת לעת — חזרו לבקר או עברו לעמוד האירועים.')) + '</p>' +
          '<a href="events.html" class="btn btn--ghost" style="margin-top:18px;">' + esc(t('events.empty.btn', 'לכל האירועים')) + '</a>' +
        '</div>';
      return;
    }

    container.innerHTML = upcoming.slice(0, 8).map(function (event) {
      var parts = EgozSupabasePublic.formatEventDateParts(event.event_date);
      var url = event.slug ? ('event.html?slug=' + encodeURIComponent(event.slug)) : (event.cta_url || 'events.html');
      var meta = [];
      if (event.location) meta.push(event.location);
      if (event.event_time) meta.push(event.event_time);
      return (
        '<a class="account-list__item" href="' + esc(url) + '">' +
          '<div class="account-list__date">' +
            '<span class="account-list__date-d">' + esc(parts.day) + '</span>' +
            '<span class="account-list__date-m">' + esc(parts.month) + '</span>' +
          '</div>' +
          '<div class="account-list__body">' +
            '<h3>' + esc(event.title) + '</h3>' +
            (meta.length ? '<div class="account-list__meta">' + meta.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') + '</div>' : '') +
          '</div>' +
          '<span aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6"/></svg></span>' +
        '</a>'
      );
    }).join('');
  }

  function renderPasswordRules(password) {
    var list = $('pwRulesAccount');
    if (!list) return;
    var check = EgozAuth.checkPassword(password);
    list.innerHTML = check.rules.map(function (rule) {
      return '<li class="' + (rule.valid ? 'is-ok' : '') + '">' + rule.label + '</li>';
    }).join('');
    return check.valid;
  }

  function initPasswordForm() {
    var form = $('passwordForm');
    var btn = $('passwordBtn');
    var pwInput = $('newPassword');
    if (!form) return;

    renderPasswordRules('');
    pwInput.addEventListener('input', function () { renderPasswordRules(pwInput.value); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert('passwordAlert');

      var password = pwInput.value;
      var password2 = $('newPassword2').value;
      var check = EgozAuth.checkPassword(password);

      if (!check.valid) {
        renderPasswordRules(password);
        return showAlert('passwordAlert', t('alert.passwordRulesShort', 'הסיסמה אינה עומדת בכל הכללים'), 'error');
      }
      if (password !== password2) {
        return showAlert('passwordAlert', t('alert.passwordMismatch', 'אימות הסיסמה אינו תואם'), 'error');
      }

      btn.disabled = true;
      btn.textContent = t('btn.updating', 'מעדכן...');

      EgozAuth.updatePassword(password)
        .then(function () {
          form.reset();
          renderPasswordRules('');
          showAlert('passwordAlert', t('alert.passwordUpdated', 'הסיסמה עודכנה בהצלחה'), 'success');
        })
        .catch(function (err) {
          showAlert('passwordAlert', err.message || t('alert.passwordUpdateError', 'שגיאה בעדכון הסיסמה'), 'error');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = t('btn.updatePassword', 'עדכון סיסמה');
        });
    });
  }

  function initLogout() {
    var btn = $('logoutBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      btn.disabled = true;
      EgozAuth.signOut()
        .then(function () { window.location.href = 'index.html'; })
        .catch(function () { window.location.href = 'index.html'; });
    });
  }

  function onLangChange() {
    renderHero();
    renderProfileOverview();
    var pwInput = $('newPassword');
    if (pwInput) renderPasswordRules(pwInput.value);
  }

  async function boot() {
    document.addEventListener('egoz:langchange', onLangChange);

    var session = await EgozAuth.requireAuth();
    if (!session) return;

    var profile = null;
    try {
      profile = await EgozAuth.getMemberProfile(session.user.id);
    } catch (e) {
      profile = null;
    }

    if (!profile || !profile.registration_completed) {
      window.location.replace('join.html?step=2');
      return;
    }

    state.session = session;
    state.profile = profile;

    renderHero();
    renderProfileOverview();
    initNav();
    initEditForm();
    initVolunteerForm();
    initPasswordForm();
    initLogout();

    try {
      var events = await EgozAuth.getPublishedEvents(12);
      renderEvents(events);
    } catch (e) {
      renderEvents([]);
    }
  }

  boot();
})();
