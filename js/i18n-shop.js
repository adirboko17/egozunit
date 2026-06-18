(function () {
  'use strict';

  EgozI18n.register('shop', {
    he: {
      'meta.title': 'חנות — עמותת אגוז · הסיירת הצפונית',
      'meta.description': 'חנות אגוז — מוצרי מורשת וקהילה. בקרוב.',
      'skip': 'דלג לתוכן הראשי',
      'util.registered': 'עמותה רשומה 580027720',
      'util.social': 'רשתות חברתיות',
      'util.facebook': 'פייסבוק',
      'util.instagram': 'אינסטגרם',
      'util.website': 'אתר העמותה',
      'brand.aria': 'עמותת אגוז — הסיירת הצפונית',
      'brand.alt': 'עמותת אגוז — הסיירת הצפונית',
      'nav.aria': 'ניווט ראשי',
      'nav.home': 'בית',
      'nav.unit': 'יחידת אגוז',
      'nav.foundation': 'עמותה',
      'nav.shop': 'חנות',
      'nav.yizkor': 'יזכור',
      'nav.contact': 'צרו קשר',
      'nav.donate': 'לתרומה',
      'nav.join': 'חבר עמותה',
      'nav.menu': 'תפריט',
      'nav.drawer': 'תפריט ניווט',
      'nav.close': 'סגירה',
      'lang.label': 'בחירת שפה',
      'lang.he': 'עב',
      'lang.en': 'EN',
      'hero.eyebrow': 'קהילת אגוז',
      'hero.title': 'חנות אגוז',
      'hero.lead': 'מוצרי מורשת, לבוש ופריטים לקהילה — בקרוב אונליין.',
      'hero.img.alt': 'לוחמי אגוז',
      'soon.title': 'החנות בדרך',
      'soon.lead': 'אנחנו מכינים חנות אונליין עם מוצרי מורשת, לבוש ופריטים לקהילת אגוז. הדף יעודכן בקרוב.',
      'soon.contact': 'עדכנו אותי',
      'soon.home': 'חזרה לדף הבית',
      'footer.brand': 'אגוז',
      'footer.tag': 'הסיירת הצפונית',
      'footer.about': 'הבית של בוגרי יחידת אגוז, המשפחות השכולות והפצועים — קהילה אחת שעומדת זה לצד זה הרבה אחרי השחרור.',
      'footer.donate': 'תרמו לעמותה',
      'footer.nav.title': 'ניווט',
      'footer.community.title': 'קהילה',
      'footer.hamalim': 'חמ״לי העמותה',
      'footer.delegations': 'משלחות לחו״ל',
      'footer.contact.title': 'צרו קשר',
      'footer.address': 'יפו 161, ירושלים',
      'footer.registered': 'עמותה רשומה 580027720',
      'footer.link1': 'ניהול תקין',
      'footer.link2': 'סעיף 46',
      'footer.link3': 'הצהרת נגישות'
    },
    en: {
      'meta.title': 'Shop — Egoz Association · Northern Command',
      'meta.description': 'Egoz shop — heritage and community products. Coming soon.',
      'skip': 'Skip to main content',
      'util.registered': 'Registered NGO 580027720',
      'util.social': 'Social media',
      'util.facebook': 'Facebook',
      'util.instagram': 'Instagram',
      'util.website': 'Association website',
      'brand.aria': 'Egoz Association — Northern Command',
      'brand.alt': 'Egoz Association — Northern Command',
      'nav.aria': 'Main navigation',
      'nav.home': 'Home',
      'nav.unit': 'Egoz Unit',
      'nav.foundation': 'Foundation',
      'nav.shop': 'Shop',
      'nav.yizkor': 'Yizkor',
      'nav.contact': 'Contact',
      'nav.donate': 'Donate',
      'nav.join': 'Join',
      'nav.menu': 'Menu',
      'nav.drawer': 'Navigation menu',
      'nav.close': 'Close',
      'lang.label': 'Language',
      'lang.he': 'HE',
      'lang.en': 'EN',
      'hero.eyebrow': 'Egoz community',
      'hero.title': 'Egoz Shop',
      'hero.lead': 'Heritage apparel and community items — online soon.',
      'hero.img.alt': 'Egoz fighters',
      'soon.title': 'Shop coming soon',
      'soon.lead': 'We are preparing an online shop with heritage products, apparel, and items for the Egoz community. This page will be updated soon.',
      'soon.contact': 'Keep me posted',
      'soon.home': 'Back to home',
      'footer.brand': 'Egoz',
      'footer.tag': 'Northern Command',
      'footer.about': 'The home of Egoz alumni, bereaved families, and wounded fighters — one community standing together long after discharge.',
      'footer.donate': 'Donate',
      'footer.nav.title': 'Navigation',
      'footer.community.title': 'Community',
      'footer.hamalim': 'Association war rooms',
      'footer.delegations': 'Delegations abroad',
      'footer.contact.title': 'Contact',
      'footer.address': '161 Jaffa St, Jerusalem',
      'footer.registered': 'Registered NGO 580027720',
      'footer.link1': 'Proper management',
      'footer.link2': 'Section 46',
      'footer.link3': 'Accessibility statement'
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.getAttribute('data-i18n-page') === 'shop') {
      var footerCopy = document.getElementById('footerCopy');
      var year = document.getElementById('year');
      if (footerCopy && year) {
        var updateCopyright = function () {
          var lang = EgozI18n.getLang();
          var tpl = '© {year} עמותת אגוז — הסיירת הצפונית · כל הזכויות שמורות';
          if (lang === 'en') tpl = '© {year} Egoz Association — Northern Command · All rights reserved';
          footerCopy.textContent = tpl.replace('{year}', year.textContent);
        };
        updateCopyright();
        document.addEventListener('egoz:langchange', updateCopyright);
      }
    }
  });
})();
