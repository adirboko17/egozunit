(function () {
  'use strict';

  var client = null;

  function getClient() {
    if (client) return client;
    if (!window.supabase || !window.EGOZ_SUPABASE) {
      throw new Error('Supabase לא נטען');
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

  async function isAdminUser(userId) {
    var sb = getClient();
    var result = await sb
      .from('admin_profiles')
      .select('id, email, is_active')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (result.error) throw result.error;
    return !!result.data;
  }

  async function signIn(email, password) {
    var sb = getClient();
    var auth = await sb.auth.signInWithPassword({ email: email, password: password });
    if (auth.error) throw auth.error;

    var allowed = await isAdminUser(auth.data.user.id);
    if (!allowed) {
      await sb.auth.signOut();
      throw new Error('אין לך הרשאות ניהול באתר זה');
    }

    return auth.data;
  }

  async function signOut() {
    var sb = getClient();
    var result = await sb.auth.signOut();
    if (result.error) throw result.error;
  }

  async function requireAdmin() {
    var session = await getSession();
    if (!session) {
      window.location.replace('/admin/login.html');
      return null;
    }

    var allowed = await isAdminUser(session.user.id);
    if (!allowed) {
      await signOut();
      window.location.replace('/admin/login.html?error=unauthorized');
      return null;
    }

    return session;
  }

  async function redirectIfAuthed() {
    var session = await getSession();
    if (!session) return false;
    var allowed = await isAdminUser(session.user.id);
    if (!allowed) return false;
    window.location.replace('/admin/');
    return true;
  }

  window.EgozAdminAuth = {
    getClient: getClient,
    getSession: getSession,
    signIn: signIn,
    signOut: signOut,
    requireAdmin: requireAdmin,
    redirectIfAuthed: redirectIfAuthed,
    isAdminUser: isAdminUser
  };
})();
