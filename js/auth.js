(function () {
  'use strict';

  var client = null;

  function t(key, fallback) {
    if (window.EgozI18n && typeof EgozI18n.t === 'function') {
      var val = EgozI18n.t('join', key, EgozI18n.getLang());
      if (val) return val;
    }
    return fallback || '';
  }

  function getClient() {
    if (client) return client;
    if (!window.supabase || !window.EGOZ_SUPABASE) {
      throw new Error(t('alert.authService', 'שירות ההתחברות לא נטען, רעננו את הדף ונסו שוב'));
    }
    client = window.supabase.createClient(
      window.EGOZ_SUPABASE.url,
      window.EGOZ_SUPABASE.anonKey
    );
    return client;
  }

  async function getSession() {
    var sb = getClient();
    var result = await sb.auth.getSession();
    if (result.error) throw result.error;
    return result.data.session;
  }

  async function getUser() {
    var session = await getSession();
    return session ? session.user : null;
  }

  var PASSWORD_RULES = [
    { key: 'length', label: 'לפחות 8 תווים', test: function (v) { return v.length >= 8; } },
    { key: 'latinOnly', label: 'אותיות לועזיות בלבד - ללא עברית', test: function (v) { return !/[\u0590-\u05FF]/.test(v) && v.length > 0; } },
    { key: 'upper', label: 'לפחות אות גדולה אחת: A–Z', test: function (v) { return /[A-Z]/.test(v); } },
    { key: 'lower', label: 'לפחות אות קטנה אחת: a–z', test: function (v) { return /[a-z]/.test(v); } },
    { key: 'digit', label: 'לפחות ספרה אחת: 0–9', test: function (v) { return /[0-9]/.test(v); } },
    { key: 'symbol', label: 'לפחות סימן מיוחד: @ # $ וכדומה', test: function (v) { return /[^A-Za-z0-9]/.test(v) && !/[\u0590-\u05FF]/.test(v); } }
  ];

  function passwordRuleLabel(rule) {
    return t('pw.' + rule.key, rule.label);
  }

  function checkPassword(password) {
    var value = password || '';
    var results = PASSWORD_RULES.map(function (rule) {
      return { key: rule.key, label: passwordRuleLabel(rule), valid: rule.test(value) };
    });
    return {
      valid: results.every(function (r) { return r.valid; }),
      rules: results
    };
  }

  function isDuplicateSignupResponse(data) {
    var user = data && data.user;
    if (!user) return false;
    if (Array.isArray(user.identities) && user.identities.length === 0) return true;
    return false;
  }

  function duplicateEmailError() {
    var err = new Error('email_already_registered');
    err.code = 'email_already_registered';
    return err;
  }

  function formatSignupError(err) {
    if (!err) return t('alert.signupFailed', 'ההרשמה נכשלה, נסו שוב');
    if (err.code === 'email_already_registered') {
      return t('alert.emailExists', 'כתובת המייל כבר רשומה במערכת - התחברו דרך עמוד ההתחברות');
    }
    var msg = err.message || '';
    if (/already registered|already exists|user already registered|email address is already registered/i.test(msg)) {
      return t('alert.emailExists', 'כתובת המייל כבר רשומה במערכת - התחברו דרך עמוד ההתחברות');
    }
    return msg || t('alert.signupFailed', 'ההרשמה נכשלה, נסו שוב');
  }

  async function signUp(email, password) {
    var sb = getClient();
    var result = await sb.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: window.location.origin + '/join?step=2'
      }
    });
    if (result.error) throw result.error;
    if (isDuplicateSignupResponse(result.data)) throw duplicateEmailError();
    return result.data;
  }

  async function verifySignupOtp(email, token) {
    var sb = getClient();
    var result = await sb.auth.verifyOtp({
      email: email,
      token: String(token).trim(),
      type: 'signup'
    });
    if (result.error) throw result.error;
    return result.data;
  }

  async function resendSignupOtp(email) {
    var sb = getClient();
    var result = await sb.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: window.location.origin + '/join?step=2'
      }
    });
    if (result.error) throw result.error;
    return result.data;
  }

  function formatOtpError(err) {
    if (!err) return t('otp.error', 'האימות נכשל, נסו שוב');
    var msg = err.message || '';
    if (/invalid|expired|otp/i.test(msg)) {
      return t('otp.errorExpired', 'הקוד שגוי או שפג תוקפו - בדקו והזינו שוב, או בקשו קוד חדש');
    }
    return msg || t('otp.error', 'האימות נכשל, נסו שוב');
  }

  async function signIn(email, password) {
    var sb = getClient();
    var result = await sb.auth.signInWithPassword({ email: email, password: password });
    if (result.error) throw result.error;
    return result.data;
  }

  async function signOut() {
    var sb = getClient();
    var result = await sb.auth.signOut();
    if (result.error) throw result.error;
  }

  async function getMemberProfile(userId) {
    var sb = getClient();
    var result = await sb
      .from('member_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  }

  async function saveMemberProfile(userId, payload) {
    var sb = getClient();
    var row = Object.assign({}, payload, { id: userId, updated_at: new Date().toISOString() });
    var result = await sb.from('member_profiles').upsert(row).select().single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function updatePassword(newPassword) {
    var sb = getClient();
    var result = await sb.auth.updateUser({ password: newPassword });
    if (result.error) throw result.error;
    return result.data;
  }

  async function getPublishedEvents(limit) {
    var sb = getClient();
    var query = sb
      .from('site_events')
      .select('title, description, event_date, event_time, location, cta_url, slug, category, badge_text')
      .eq('is_published', true)
      .order('event_date', { ascending: true })
      .order('sort_order', { ascending: true });
    if (limit) query = query.limit(limit);
    var result = await query;
    if (result.error) throw result.error;
    return result.data || [];
  }

  async function resolvePostLoginRedirect() {
    var session = await getSession();
    if (!session) return '/login';
    var profile = null;
    try {
      profile = await getMemberProfile(session.user.id);
    } catch (e) {
      profile = null;
    }
    if (profile && profile.registration_completed) return '/account';
    return '/join?step=2';
  }

  async function redirectIfAuthed(target) {
    var session = await getSession();
    if (!session) return false;
    var dest = target;
    if (!dest) {
      dest = await resolvePostLoginRedirect();
    }
    window.location.replace(dest);
    return true;
  }

  async function requireAuth() {
    var session = await getSession();
    if (!session) {
      window.location.replace('/login?redirect=account');
      return null;
    }
    return session;
  }

  window.EgozAuth = {
    getClient: getClient,
    getSession: getSession,
    getUser: getUser,
    signUp: signUp,
    verifySignupOtp: verifySignupOtp,
    resendSignupOtp: resendSignupOtp,
    formatSignupError: formatSignupError,
    formatOtpError: formatOtpError,
    signIn: signIn,
    signOut: signOut,
    getMemberProfile: getMemberProfile,
    saveMemberProfile: saveMemberProfile,
    updatePassword: updatePassword,
    getPublishedEvents: getPublishedEvents,
    resolvePostLoginRedirect: resolvePostLoginRedirect,
    checkPassword: checkPassword,
    PASSWORD_RULES: PASSWORD_RULES,
    redirectIfAuthed: redirectIfAuthed,
    requireAuth: requireAuth
  };
})();
