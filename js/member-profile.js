(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function t(key, fallback) {
    if (window.EgozI18n && typeof EgozI18n.t === 'function') {
      var val = EgozI18n.t('join', key, EgozI18n.getLang());
      if (val) return val;
    }
    return fallback || '';
  }

  function setRadioValue(name, value) {
    if (!value) return;
    var input = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (input) input.checked = true;
  }

  function getRadioValue(name) {
    var input = document.querySelector('input[name="' + name + '"]:checked');
    return input ? input.value : '';
  }

  function val(id) {
    var el = $(id);
    return el ? el.value.trim() : '';
  }

  function fillProfileForm(profile) {
    if (!profile) return;
    if (profile.full_name && $('pFullName')) $('pFullName').value = profile.full_name;
    if (profile.phone && $('pPhone')) $('pPhone').value = profile.phone;
    if (profile.email && $('pEmail')) $('pEmail').value = profile.email;
    if (profile.gender) setRadioValue('gender', profile.gender);
    if (profile.birth_date && $('pBirthDate')) $('pBirthDate').value = profile.birth_date;
    if (profile.unit_join_year && $('pUnitYear')) $('pUnitYear').value = profile.unit_join_year;
    if (profile.country && $('pCountry')) $('pCountry').value = profile.country;
    if (profile.address && $('pAddress')) $('pAddress').value = profile.address;
    if (profile.city && $('pCity')) $('pCity').value = profile.city;
    if (profile.zip && $('pZip')) $('pZip').value = profile.zip;
    if (profile.occupation && $('pOccupation')) $('pOccupation').value = profile.occupation;
    if (profile.workplace_he && $('pWorkplaceHe')) $('pWorkplaceHe').value = profile.workplace_he;
    if (profile.workplace_en && $('pWorkplaceEn')) $('pWorkplaceEn').value = profile.workplace_en;
    if (profile.academic_institution && $('pAcademic')) $('pAcademic').value = profile.academic_institution;
    if (profile.study_status && $('pStudyStatus')) $('pStudyStatus').value = profile.study_status;
    if (profile.role) setRadioValue('role', profile.role);
    if (profile.company && $('pCompany')) $('pCompany').value = profile.company;
    if (profile.volunteer_area && $('pVolunteerArea')) $('pVolunteerArea').value = profile.volunteer_area;
    if (profile.volunteer_area_details && $('pVolunteerDetails')) $('pVolunteerDetails').value = profile.volunteer_area_details;
    if (profile.has_vehicle_details && $('pVehicle')) $('pVehicle').value = profile.has_vehicle_details;
    if (profile.event_business_details && $('pEventBiz')) $('pEventBiz').value = profile.event_business_details;
    if (profile.artist_details && $('pArtist')) $('pArtist').value = profile.artist_details;
    if ($('pPrivacy')) $('pPrivacy').checked = !!profile.accepted_privacy_policy;
    if ($('pBylaws')) $('pBylaws').checked = !!profile.accepted_bylaws;
  }

  function collectProfilePayload(options) {
    options = options || {};
    return {
      full_name: val('pFullName'),
      phone: val('pPhone'),
      email: val('pEmail'),
      gender: getRadioValue('gender'),
      birth_date: $('pBirthDate') && $('pBirthDate').value ? $('pBirthDate').value : null,
      country: val('pCountry'),
      address: val('pAddress'),
      city: val('pCity'),
      zip: val('pZip'),
      occupation: val('pOccupation'),
      workplace_he: val('pWorkplaceHe'),
      workplace_en: val('pWorkplaceEn'),
      academic_institution: val('pAcademic'),
      study_status: $('pStudyStatus') ? $('pStudyStatus').value : '',
      unit_join_year: val('pUnitYear'),
      role: getRadioValue('role'),
      company: val('pCompany'),
      volunteer_area: $('pVolunteerArea') ? $('pVolunteerArea').value : '',
      volunteer_area_details: val('pVolunteerDetails'),
      has_vehicle_details: val('pVehicle'),
      event_business_details: val('pEventBiz'),
      artist_details: val('pArtist'),
      accepted_privacy_policy: $('pPrivacy') ? $('pPrivacy').checked : false,
      accepted_bylaws: $('pBylaws') ? $('pBylaws').checked : false,
      registration_completed: options.registrationCompleted !== false
    };
  }

  function collectVolunteerPayload() {
    return {
      volunteer_area: $('pVolunteerArea') ? $('pVolunteerArea').value : '',
      volunteer_area_details: val('pVolunteerDetails'),
      has_vehicle_details: val('pVehicle'),
      event_business_details: val('pEventBiz'),
      artist_details: val('pArtist')
    };
  }

  function validateProfilePayload(payload, requireAll) {
    if (!payload.full_name) return t('validate.fullName', 'יש למלא שם מלא');
    if (!payload.phone) return t('validate.phone', 'יש למלא טלפון');
    if (!payload.email) return t('validate.email', 'יש למלא מייל');
    if (!payload.gender) return t('validate.gender', 'יש לבחור מגדר');
    if (requireAll && !payload.birth_date) return t('validate.birthDate', 'יש למלא תאריך לידה');
    if (requireAll && !payload.unit_join_year) return t('validate.unitYear', 'יש למלא שנת הצטרפות ליחידה');
    if (requireAll && !payload.country) return t('validate.country', 'יש למלא מדינה/אזור');
    if (requireAll && !payload.address) return t('validate.address', 'יש למלא כתובת');
    if (requireAll && !payload.city) return t('validate.city', 'יש למלא עיר');
    if (requireAll && !payload.occupation) return t('validate.occupation', 'יש למלא עיסוק');
    if (requireAll && !payload.academic_institution) return t('validate.academic', 'יש למלא מוסד לימוד אקדמי');
    if (requireAll && !payload.role) return t('validate.role', 'יש לבחור תפקיד ביחידה');
    if (requireAll && (!$('pPrivacy') || !$('pPrivacy').checked) && (!$('pBylaws') || !$('pBylaws').checked)) {
      return t('alert.privacyBylawsRequired', 'יש לסמן את אישור מדיניות הפרטיות ואת אישור תקנון העמותה לפני שליחת הטופס');
    }
    if (requireAll && (!$('pPrivacy') || !$('pPrivacy').checked)) {
      return t('alert.privacyRequired', 'יש לסמן את אישור מדיניות הפרטיות לפני שליחת הטופס');
    }
    if (requireAll && (!$('pBylaws') || !$('pBylaws').checked)) {
      return t('alert.bylawsRequired', 'יש לסמן את אישור תקנון העמותה לפני שליחת הטופס');
    }
    return '';
  }

  function roleLabel(role) {
    if (role === 'fighter') return t('member.roleLabelFighter', 'לוחם');
    if (role === 'support') return t('member.roleLabelSupport', 'תומכ"ל');
    return role || '—';
  }

  function genderLabel(gender) {
    if (gender === 'male') return t('member.genderLabelMale', 'גבר');
    if (gender === 'female') return t('member.genderLabelFemale', 'אישה');
    if (gender === 'other') return t('member.genderLabelOther', 'אחר');
    return gender || '—';
  }

  window.EgozMemberProfile = {
    fillProfileForm: fillProfileForm,
    collectProfilePayload: collectProfilePayload,
    collectVolunteerPayload: collectVolunteerPayload,
    validateProfilePayload: validateProfilePayload,
    getRadioValue: getRadioValue,
    setRadioValue: setRadioValue,
    roleLabel: roleLabel,
    genderLabel: genderLabel
  };
})();
