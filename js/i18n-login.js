(function () {
  'use strict';

  EgozI18n.register('login', {
    he: {
      'meta.title': 'התחברות — עמותת אגוז · הסיירת הצפונית',
      'meta.description': 'התחברות לאזור האישי של עמותת אגוז — לחברי העמותה, בוגרי יחידת אגוז ומשפחות.',
      'hero.eyebrow': 'עמותת אגוז · הסיירת הצפונית',
      'hero.title': 'ברוכים הבאים הביתה',
      'hero.lead': 'התחברו לאזור האישי — לעדכון פרטים, הטבות, אירועים והתנדבות.',
      'aside.eyebrow': 'קהילת אגוז',
      'aside.title': 'הבית של בוגרי יחידת אגוז',
      'aside.lead': 'אזור אישי לחברי העמותה — לעדכון פרטים, גישה להטבות, אירועים וקהילה.',
      'aside.perk1': 'עדכון פרטים אישיים ויחידתיים',
      'aside.perk2': 'הטבות והנחות לבוגרים',
      'aside.perk3': 'אירועי העמותה והתנדבות',
      'form.title': 'כניסה לאזור האישי',
      'form.sub': 'התחברו לאזור האישי שלכם',
      'form.or': 'או',
      'form.registerPrompt': 'עדיין לא נרשמתם לעמותה?',
      'form.registerBtn': 'הרשמה כחבר עמותה',
      'login.password': 'סיסמה'
    },
    en: {
      'meta.title': 'Sign in — Egoz Association · Northern Command',
      'meta.description': 'Sign in to your Egoz Association account — for members, alumni, and families.',
      'hero.eyebrow': 'Egoz Association · Northern Command',
      'hero.title': 'Welcome home',
      'hero.lead': 'Sign in to your account — update details, benefits, events, and volunteering.',
      'aside.eyebrow': 'Egoz community',
      'aside.title': 'The home of Egoz Unit alumni',
      'aside.lead': 'Member account area — update details, access benefits, events, and community.',
      'aside.perk1': 'Update personal and unit details',
      'aside.perk2': 'Alumni benefits and discounts',
      'aside.perk3': 'Association events and volunteering',
      'form.title': 'Sign in to your account',
      'form.sub': 'Access your member area',
      'form.or': 'or',
      'form.registerPrompt': 'Not registered yet?',
      'form.registerBtn': 'Join the association',
      'login.password': 'Password'
    }
  });

  if (document.body && document.body.getAttribute('data-i18n-page') === 'login') {
    EgozI18n.init('login');
  }
})();
