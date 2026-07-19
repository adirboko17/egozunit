(function () {
  'use strict';

  var JGIVE_BASE_URL = 'https://www.jgive.com/new/he/ils/donation-targets/5545';

  function $(id) { return document.getElementById(id); }

  function t(key) {
    if (!window.EgozI18n) return '';
    return EgozI18n.t('ambassadors', key, EgozI18n.getLang()) || EgozI18n.t('ambassadors', key) || '';
  }

  function btnLabel() {
    return t('submitBtn') || 'שליחה והמשך לתרומה מאובטחת';
  }

  function buildJgiveUrl(payload) {
    var lang = window.EgozI18n ? EgozI18n.getLang() : 'he';
    var base = window.EGOZ_JGIVE
      ? EGOZ_JGIVE.getDonationUrl(lang)
      : JGIVE_BASE_URL;
    var params = new URLSearchParams();
    params.set('currency', 'ils');
    if (payload.donation_amount) params.set('amount', String(payload.donation_amount));
    params.set('recurring', payload.donation_frequency === 'monthly' ? 'TRUE' : 'FALSE');
    if (payload.email) params.set('email', payload.email);
    if (payload.phone) params.set('phoneNumber', payload.phone);
    var nameParts = (payload.full_name || '').trim().split(/\s+/);
    if (nameParts[0]) params.set('firstName', nameParts[0]);
    if (nameParts.length > 1) params.set('lastName', nameParts.slice(1).join(' '));
    return base + '?' + params.toString();
  }

  var client = null;
  function getClient() {
    if (client) return client;
    if (!window.supabase || !window.EGOZ_SUPABASE) return null;
    client = window.supabase.createClient(window.EGOZ_SUPABASE.url, window.EGOZ_SUPABASE.anonKey);
    return client;
  }

  var selectedAmount = null;
  var memberProfile = null;
  var useMemberProfile = false;

  function showAlert(message, type) {
    var el = $('ambAlert');
    el.hidden = false;
    el.className = 'auth-alert auth-alert--' + (type || 'error');
    el.textContent = message;
  }

  function hideAlert() {
    $('ambAlert').hidden = true;
  }

  function fillMemberInputs(profile) {
    if (profile.full_name) $('aName').value = profile.full_name;
    if (profile.phone) $('aPhone').value = profile.phone;
    if (profile.email) $('aEmail').value = profile.email;
    if (profile.address) $('aAddress').value = profile.address;
    if (profile.country) $('aCountry').value = profile.country;
    if (profile.city) $('aCity').value = profile.city;
    if (profile.zip) $('aZip').value = profile.zip;
  }

  function applyMemberProfile(profile) {
    if (!profile || !profile.full_name || !profile.email || !profile.phone) return;

    memberProfile = profile;
    useMemberProfile = true;
    fillMemberInputs(profile);

    var fields = $('ambMemberFields');
    var summary = $('ambMemberSummary');
    var summaryText = $('ambMemberSummaryText');
    var lead = $('ambFormLead');

    if (fields) fields.hidden = true;
    if (summary) summary.hidden = false;
    if (summaryText) {
      summaryText.textContent = profile.full_name + ' · ' + profile.email + ' · ' + profile.phone;
    }
    if (lead) lead.textContent = t('form.leadMember');

    ['aName', 'aPhone', 'aEmail'].forEach(function (id) {
      var el = $(id);
      if (el) el.required = false;
    });
  }

  function collectPayload() {
    if (useMemberProfile && memberProfile) {
      return {
        full_name: memberProfile.full_name || '',
        phone: memberProfile.phone || '',
        email: memberProfile.email || '',
        country: memberProfile.country || '',
        address: memberProfile.address || '',
        city: memberProfile.city || '',
        zip: memberProfile.zip || '',
        donation_frequency: getFrequency(),
        donation_amount: getAmount(),
        join_agudat_yedidim: $('aAgudat').checked,
        accepted_privacy_policy: $('aPrivacy').checked
      };
    }

    return {
      full_name: $('aName').value.trim(),
      phone: $('aPhone').value.trim(),
      email: $('aEmail').value.trim(),
      country: $('aCountry').value.trim(),
      address: $('aAddress').value.trim(),
      city: $('aCity').value.trim(),
      zip: $('aZip').value.trim(),
      donation_frequency: getFrequency(),
      donation_amount: getAmount(),
      join_agudat_yedidim: $('aAgudat').checked,
      accepted_privacy_policy: $('aPrivacy').checked
    };
  }

  function initFrequencyChoice() {
    var row = $('freqRow');
    row.querySelectorAll('.choice').forEach(function (choice) {
      var input = choice.querySelector('input');
      input.addEventListener('change', function () {
        row.querySelectorAll('.choice').forEach(function (c) { c.classList.remove('is-on'); });
        choice.classList.add('is-on');
      });
    });
  }

  function initAmountGrid() {
    var grid = $('amountGrid');
    var otherInput = $('amountOther');
    grid.querySelectorAll('.amount').forEach(function (btn) {
      btn.addEventListener('click', function () {
        grid.querySelectorAll('.amount').forEach(function (b) { b.classList.remove('is-on'); });
        btn.classList.add('is-on');
        selectedAmount = btn.getAttribute('data-amount');
        if (selectedAmount === 'other') {
          otherInput.classList.remove('is-hidden');
          otherInput.focus();
        } else {
          otherInput.classList.add('is-hidden');
        }
      });
    });
  }

  function getFrequency() {
    var input = document.querySelector('input[name="frequency"]:checked');
    return input ? input.value : 'one_time';
  }

  function getAmount() {
    if (selectedAmount === 'other') {
      var val = Number($('amountOther').value);
      return val > 0 ? val : null;
    }
    return selectedAmount ? Number(selectedAmount) : null;
  }

  function initForm() {
    var form = $('ambForm');
    var btn = $('ambBtn');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert();

      if (!useMemberProfile && !form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (!$('aPrivacy').checked) {
        return showAlert(t('alert.privacyRequired'), 'error');
      }
      if (!getAmount()) {
        return showAlert(t('alert.amountRequired'), 'error');
      }

      var payload = collectPayload();
      if (!payload.full_name || !payload.email || !payload.phone) {
        return showAlert(t('alert.missingProfile'), 'error');
      }

      btn.disabled = true;
      btn.textContent = t('btn.sending') || 'שולח...';

      var sb = getClient();
      var insertPromise = sb
        ? sb.from('ambassador_signups').insert(payload)
        : Promise.resolve({ error: null });

      insertPromise
        .then(function (result) {
          if (result && result.error) throw result.error;
          var jgiveUrl = buildJgiveUrl(payload);
          $('ambDonateLink').setAttribute('href', jgiveUrl);
          $('ambForm-card').classList.add('is-hidden');
          $('ambSuccess').classList.remove('is-hidden');
          $('ambSuccess').scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.open(jgiveUrl, '_blank', 'noopener');
        })
        .catch(function (err) {
          showAlert(err.message || t('alert.submitError'), 'error');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = btnLabel();
        });
    });
  }

  initFrequencyChoice();
  initAmountGrid();
  initForm();

  if (new URLSearchParams(window.location.search).get('welcome') === '1') {
    var welcome = $('welcomeBanner');
    if (welcome) welcome.hidden = false;
  }

  if (window.EgozAuth) {
    EgozAuth.getSession()
      .then(function (session) {
        if (!session) return null;
        return EgozAuth.getMemberProfile(session.user.id).then(function (profile) {
          if (profile && !profile.email && session.user.email) {
            profile.email = session.user.email;
          }
          return profile;
        });
      })
      .then(function (profile) {
        if (!profile) return;
        applyMemberProfile(profile);
      })
      .catch(function () {});
  }
})();
