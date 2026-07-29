/* אגוז - ווידג'ט נגישות צף (עצמאי, ללא שירות חיצוני) */
(function () {
  'use strict';

  if (window.EgozA11y) return;

  var STORAGE_KEY = 'egoz-a11y';
  var CONTACT_MAIL = 'office@egoz.org.il';
  var STATEMENT_URL = '/accessibility';

  var FONT_STEPS = [1, 1.1, 1.25, 1.4, 1.6, 1.8];
  var LINE_STEPS = [null, 1.6, 1.9, 2.2];
  var SPACE_STEPS = [null, ['0.05em', '0.12em'], ['0.1em', '0.2em'], ['0.16em', '0.3em']];

  var DICT = {
    he: {
      fab: 'פתיחת תפריט נגישות',
      title: 'תפריט נגישות',
      close: 'סגירת תפריט הנגישות',
      groupText: 'טקסט',
      groupColor: 'צבע וניגודיות',
      groupTools: 'ניווט וקריאה',
      fontSize: 'גודל טקסט',
      lineHeight: 'ריווח שורות',
      spacing: 'ריווח אותיות',
      dec: 'הקטנה',
      inc: 'הגדלה',
      levelOff: 'רגיל',
      contrast: 'ניגודיות גבוהה',
      dark: 'מצב כהה',
      gray: 'גווני אפור',
      soft: 'צבעים רכים',
      links: 'הדגשת קישורים',
      titles: 'הדגשת כותרות',
      readable: 'פונט קריא',
      cursor: 'סמן גדול',
      motion: 'עצירת אנימציות',
      focus: 'הדגשת מיקוד',
      guide: 'סרגל קריאה',
      mask: 'מסכת קריאה',
      reset: 'איפוס כל ההתאמות',
      statement: 'הצהרת נגישות',
      report: 'דיווח על בעיית נגישות',
      side: 'העברה לצד השני',
      hint: 'קיצור מקלדת: Alt + A לפתיחה וסגירה של התפריט.',
      mailSubject: 'דיווח על בעיית נגישות באתר',
      mailBody: 'שלום,\nנתקלתי בבעיית נגישות באתר.\n\nכתובת העמוד: '
    },
    en: {
      fab: 'Open accessibility menu',
      title: 'Accessibility menu',
      close: 'Close accessibility menu',
      groupText: 'Text',
      groupColor: 'Colour & contrast',
      groupTools: 'Navigation & reading',
      fontSize: 'Text size',
      lineHeight: 'Line spacing',
      spacing: 'Letter spacing',
      dec: 'Decrease',
      inc: 'Increase',
      levelOff: 'Default',
      contrast: 'High contrast',
      dark: 'Dark mode',
      gray: 'Grayscale',
      soft: 'Soft colours',
      links: 'Highlight links',
      titles: 'Highlight headings',
      readable: 'Readable font',
      cursor: 'Big cursor',
      motion: 'Stop animations',
      focus: 'Strong focus ring',
      guide: 'Reading ruler',
      mask: 'Reading mask',
      reset: 'Reset all adjustments',
      statement: 'Accessibility statement',
      report: 'Report an accessibility issue',
      side: 'Move to other side',
      hint: 'Keyboard shortcut: Alt + A opens and closes this menu.',
      mailSubject: 'Website accessibility issue report',
      mailBody: 'Hello,\nI encountered an accessibility issue on the website.\n\nPage URL: '
    }
  };

  var ICONS = {
    fab: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="3.9" r="2.1"/><path d="M20.9 7.4a1.15 1.15 0 0 0-1.36-.9l-4.06.83a17.4 17.4 0 0 1-6.96 0L4.46 6.5a1.15 1.15 0 1 0-.46 2.26l4.15.85v3.44l-1.6 7.3a1.2 1.2 0 0 0 2.34.52L10.4 15.2h3.2l1.51 5.67a1.2 1.2 0 0 0 2.34-.52l-1.6-7.3V9.61l4.15-.85c.62-.13 1.02-.74.9-1.36z"/></svg>',
    close: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    contrast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
    gray: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/></svg>',
    soft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>',
    links: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M10 13.5a4 4 0 0 0 5.7.3l3-3a4 4 0 0 0-5.7-5.7L11.3 6.8"/><path d="M14 10.5a4 4 0 0 0-5.7-.3l-3 3a4 4 0 0 0 5.7 5.7l1.7-1.7"/></svg>',
    titles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5v14M13 5v14M5 12h8M17 9h3v10M17 19h5"/></svg>',
    readable: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H12v16H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M20 6.5A2.5 2.5 0 0 0 17.5 4H12v16h5.5a2.5 2.5 0 0 1 2.5 2z"/></svg>',
    cursor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M5 3l0 16 4.3-4.3 2.6 6 3.6-1.6-2.6-5.9 5.7-.2z"/></svg>',
    motion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9v6M14.5 9v6"/></svg>',
    focus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><circle cx="12" cy="12" r="3"/></svg>',
    guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M3 7h18M3 17h18"/><path d="M3 12h18" stroke-width="3"/></svg>',
    mask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 14h18" /></svg>'
  };

  var TOGGLES = [
    { id: 'links', icon: 'links' },
    { id: 'titles', icon: 'titles' },
    { id: 'readable', icon: 'readable' },
    { id: 'cursor', icon: 'cursor' },
    { id: 'motion', icon: 'motion' },
    { id: 'focus', icon: 'focus' },
    { id: 'guide', icon: 'guide' },
    { id: 'mask', icon: 'mask' }
  ];

  var FILTERS = [
    { id: 'contrast', icon: 'contrast' },
    { id: 'dark', icon: 'dark' },
    { id: 'gray', icon: 'gray' },
    { id: 'soft', icon: 'soft' }
  ];

  var defaults = {
    font: 0,
    line: 0,
    space: 0,
    filter: '',
    links: false,
    titles: false,
    readable: false,
    cursor: false,
    motion: false,
    focus: false,
    guide: false,
    mask: false,
    side: 'right'
  };

  var state = {};
  var root = document.documentElement;
  var els = {};
  var isOpen = false;
  var lastFocused = null;
  var pointerY = -100;

  /* ---------- state ---------- */

  function load() {
    var saved = {};
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw) || {};
    } catch (err) {}
    Object.keys(defaults).forEach(function (key) {
      state[key] = saved[key] != null ? saved[key] : defaults[key];
    });
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {}
  }

  function lang() {
    if (window.EgozI18n && typeof window.EgozI18n.getLang === 'function') return window.EgozI18n.getLang();
    try {
      var saved = localStorage.getItem('egoz-lang');
      if (saved === 'he' || saved === 'en') return saved;
    } catch (err) {}
    return root.lang === 'en' ? 'en' : 'he';
  }

  function t(key) {
    var l = lang();
    return (DICT[l] && DICT[l][key]) || DICT.he[key] || key;
  }

  /* ---------- apply ---------- */

  function toggleAttr(name, on) {
    if (on) root.setAttribute(name, '');
    else root.removeAttribute(name);
  }

  function apply() {
    var scale = FONT_STEPS[state.font] || 1;
    if (state.font > 0) {
      root.style.setProperty('--ea-font-scale', String(scale));
      root.setAttribute('data-ea-font', '');
    } else {
      root.style.removeProperty('--ea-font-scale');
      root.removeAttribute('data-ea-font');
    }

    var line = LINE_STEPS[state.line];
    if (line) {
      root.style.setProperty('--ea-line-height', String(line));
      root.setAttribute('data-ea-line', '');
    } else {
      root.style.removeProperty('--ea-line-height');
      root.removeAttribute('data-ea-line');
    }

    var space = SPACE_STEPS[state.space];
    if (space) {
      root.style.setProperty('--ea-letter-spacing', space[0]);
      root.style.setProperty('--ea-word-spacing', space[1]);
      root.setAttribute('data-ea-space', '');
    } else {
      root.style.removeProperty('--ea-letter-spacing');
      root.style.removeProperty('--ea-word-spacing');
      root.removeAttribute('data-ea-space');
    }

    if (state.filter) root.setAttribute('data-ea-filter', state.filter);
    else root.removeAttribute('data-ea-filter');

    toggleAttr('data-ea-links', state.links);
    toggleAttr('data-ea-titles', state.titles);
    toggleAttr('data-ea-readable', state.readable);
    toggleAttr('data-ea-cursor', state.cursor);
    toggleAttr('data-ea-motion', state.motion);
    toggleAttr('data-ea-focus', state.focus);
    toggleAttr('data-ea-guide', state.guide);
    toggleAttr('data-ea-mask', state.mask);

    if (els.root) els.root.setAttribute('data-ea-side', state.side === 'left' ? 'left' : 'right');

    if (state.motion) {
      document.querySelectorAll('video[autoplay]').forEach(function (video) {
        video.removeAttribute('autoplay');
        try { video.pause(); } catch (err) {}
      });
    }

    if (state.guide || state.mask) positionOverlays();
    syncControls();
  }

  /* ---------- reading guide / mask ---------- */

  function positionOverlays() {
    var vh = window.innerHeight || root.clientHeight;
    var y = pointerY < 0 ? vh / 2 : pointerY;

    if (state.guide && els.guide) {
      els.guide.style.top = Math.round(y - 3) + 'px';
    }
    if (state.mask && els.maskTop && els.maskBottom) {
      var half = 70;
      els.maskTop.style.height = Math.max(0, Math.round(y - half)) + 'px';
      els.maskBottom.style.height = Math.max(0, Math.round(vh - y - half)) + 'px';
    }
  }

  function onPointerMove(e) {
    if (!state.guide && !state.mask) return;
    pointerY = e.clientY;
    positionOverlays();
  }

  /* ---------- UI ---------- */

  function optionButton(item, action) {
    return '<button type="button" class="egoz-a11y__opt" data-ea-action="' + action +
      '" data-ea-value="' + item.id + '" aria-pressed="false">' +
      ICONS[item.icon] +
      '<span class="egoz-a11y__opt-tx" data-ea-label="' + item.id + '"></span>' +
      '</button>';
  }

  function stepperRow(id, labelKey) {
    return '<div class="egoz-a11y__stepper">' +
      '<span class="egoz-a11y__stepper-label" data-ea-label="' + labelKey + '"></span>' +
      '<span class="egoz-a11y__stepper-ctrl">' +
      '<button type="button" class="egoz-a11y__step" data-ea-action="step" data-ea-target="' + id + '" data-ea-dir="-1">&minus;</button>' +
      '<span class="egoz-a11y__value" data-ea-value-of="' + id + '" aria-live="polite"></span>' +
      '<button type="button" class="egoz-a11y__step" data-ea-action="step" data-ea-target="' + id + '" data-ea-dir="1">+</button>' +
      '</span>' +
      '</div>';
  }

  function build() {
    var wrap = document.createElement('div');
    wrap.id = 'egozA11y';
    wrap.setAttribute('data-ea-side', state.side === 'left' ? 'left' : 'right');

    var html = [
      '<div class="egoz-a11y__filter" aria-hidden="true"></div>',
      '<div class="egoz-a11y__mask egoz-a11y__mask--top" aria-hidden="true"></div>',
      '<div class="egoz-a11y__mask egoz-a11y__mask--bottom" aria-hidden="true"></div>',
      '<div class="egoz-a11y__guide" aria-hidden="true"></div>',
      '<button type="button" class="egoz-a11y__fab" aria-expanded="false" aria-controls="egozA11yPanel">' + ICONS.fab + '</button>',
      '<div class="egoz-a11y__scrim" aria-hidden="true" hidden></div>',
      '<div class="egoz-a11y__panel" id="egozA11yPanel" role="dialog" aria-modal="true" aria-labelledby="egozA11yTitle" hidden>',
      '  <div class="egoz-a11y__head">',
      '    <h2 class="egoz-a11y__title" id="egozA11yTitle"></h2>',
      '    <button type="button" class="egoz-a11y__close">' + ICONS.close + '</button>',
      '  </div>',
      '  <div class="egoz-a11y__body">',
      '    <div class="egoz-a11y__group">',
      '      <p class="egoz-a11y__legend" data-ea-label="groupText"></p>',
      stepperRow('font', 'fontSize'),
      stepperRow('line', 'lineHeight'),
      stepperRow('space', 'spacing'),
      '    </div>',
      '    <div class="egoz-a11y__group">',
      '      <p class="egoz-a11y__legend" data-ea-label="groupColor"></p>',
      '      <div class="egoz-a11y__grid">' + FILTERS.map(function (f) { return optionButton(f, 'filter'); }).join('') + '</div>',
      '    </div>',
      '    <div class="egoz-a11y__group">',
      '      <p class="egoz-a11y__legend" data-ea-label="groupTools"></p>',
      '      <div class="egoz-a11y__grid">' + TOGGLES.map(function (o) { return optionButton(o, 'toggle'); }).join('') + '</div>',
      '    </div>',
      '  </div>',
      '  <div class="egoz-a11y__foot">',
      '    <button type="button" class="egoz-a11y__reset" data-ea-action="reset">' + ICONS.reset + '<span data-ea-label="reset"></span></button>',
      '    <div class="egoz-a11y__links">',
      '      <a href="' + STATEMENT_URL + '" data-ea-label="statement"></a>',
      '      <a class="egoz-a11y__report" href="#" data-ea-label="report"></a>',
      '      <button type="button" data-ea-action="side" data-ea-label="side"></button>',
      '    </div>',
      '    <p class="egoz-a11y__hint" data-ea-label="hint"></p>',
      '  </div>',
      '</div>'
    ].join('');

    wrap.innerHTML = html;
    document.body.appendChild(wrap);

    els.root = wrap;
    els.fab = wrap.querySelector('.egoz-a11y__fab');
    els.panel = wrap.querySelector('.egoz-a11y__panel');
    els.scrim = wrap.querySelector('.egoz-a11y__scrim');
    els.close = wrap.querySelector('.egoz-a11y__close');
    els.guide = wrap.querySelector('.egoz-a11y__guide');
    els.maskTop = wrap.querySelector('.egoz-a11y__mask--top');
    els.maskBottom = wrap.querySelector('.egoz-a11y__mask--bottom');
    els.report = wrap.querySelector('.egoz-a11y__report');
  }

  function levelText(index, total) {
    return index === 0 ? t('levelOff') : index + '/' + (total - 1);
  }

  function syncControls() {
    if (!els.panel) return;

    els.panel.querySelectorAll('[data-ea-action="filter"]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', state.filter === btn.getAttribute('data-ea-value') ? 'true' : 'false');
    });

    els.panel.querySelectorAll('[data-ea-action="toggle"]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', state[btn.getAttribute('data-ea-value')] ? 'true' : 'false');
    });

    var fontValue = els.panel.querySelector('[data-ea-value-of="font"]');
    if (fontValue) fontValue.textContent = Math.round(FONT_STEPS[state.font] * 100) + '%';
    var lineValue = els.panel.querySelector('[data-ea-value-of="line"]');
    if (lineValue) lineValue.textContent = levelText(state.line, LINE_STEPS.length);
    var spaceValue = els.panel.querySelector('[data-ea-value-of="space"]');
    if (spaceValue) spaceValue.textContent = levelText(state.space, SPACE_STEPS.length);

    var limits = { font: FONT_STEPS.length, line: LINE_STEPS.length, space: SPACE_STEPS.length };
    els.panel.querySelectorAll('[data-ea-action="step"]').forEach(function (btn) {
      var target = btn.getAttribute('data-ea-target');
      var dir = parseInt(btn.getAttribute('data-ea-dir'), 10);
      var next = state[target] + dir;
      btn.disabled = next < 0 || next > limits[target] - 1;
    });
  }

  function localize() {
    if (!els.root) return;
    var l = lang();
    var dir = l === 'he' ? 'rtl' : 'ltr';
    els.panel.setAttribute('dir', dir);
    els.panel.setAttribute('lang', l);

    els.root.querySelectorAll('[data-ea-label]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-ea-label'));
    });

    els.fab.setAttribute('aria-label', t('fab'));
    els.fab.setAttribute('title', t('fab'));
    els.close.setAttribute('aria-label', t('close'));

    els.panel.querySelectorAll('[data-ea-action="step"]').forEach(function (btn) {
      var target = btn.getAttribute('data-ea-target');
      var isInc = btn.getAttribute('data-ea-dir') === '1';
      btn.setAttribute('aria-label', t(isInc ? 'inc' : 'dec') + ' - ' + t(target === 'font' ? 'fontSize' : target === 'line' ? 'lineHeight' : 'spacing'));
    });

    if (els.report) {
      els.report.setAttribute('href', 'mailto:' + CONTACT_MAIL +
        '?subject=' + encodeURIComponent(t('mailSubject')) +
        '&body=' + encodeURIComponent(t('mailBody') + location.href));
    }

    syncControls();
  }

  /* ---------- open / close ---------- */

  function focusables() {
    return Array.prototype.filter.call(
      els.panel.querySelectorAll('a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null || el === document.activeElement; }
    );
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocused = document.activeElement;
    els.panel.hidden = false;
    els.scrim.hidden = false;
    els.fab.setAttribute('aria-expanded', 'true');
    syncControls();
    var first = focusables()[0];
    if (first) first.focus();
  }

  function close(restoreFocus) {
    if (!isOpen) return;
    isOpen = false;
    els.panel.hidden = true;
    els.scrim.hidden = true;
    els.fab.setAttribute('aria-expanded', 'false');
    if (restoreFocus !== false) {
      var target = lastFocused && document.contains(lastFocused) ? lastFocused : els.fab;
      if (target === document.body) target = els.fab;
      target.focus();
    }
  }

  function trapTab(e) {
    var list = focusables();
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ---------- events ---------- */

  function onPanelClick(e) {
    var btn = e.target.closest('[data-ea-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-ea-action');

    if (action === 'step') {
      var target = btn.getAttribute('data-ea-target');
      var dir = parseInt(btn.getAttribute('data-ea-dir'), 10);
      var limits = { font: FONT_STEPS.length, line: LINE_STEPS.length, space: SPACE_STEPS.length };
      var next = state[target] + dir;
      if (next < 0 || next > limits[target] - 1) return;
      state[target] = next;
    } else if (action === 'filter') {
      var value = btn.getAttribute('data-ea-value');
      state.filter = state.filter === value ? '' : value;
    } else if (action === 'toggle') {
      var key = btn.getAttribute('data-ea-value');
      state[key] = !state[key];
      if ((key === 'guide' || key === 'mask') && state[key]) pointerY = -100;
    } else if (action === 'reset') {
      Object.keys(defaults).forEach(function (k) { state[k] = defaults[k]; });
    } else if (action === 'side') {
      state.side = state.side === 'left' ? 'right' : 'left';
    } else {
      return;
    }

    apply();
    save();
  }

  function bind() {
    els.fab.addEventListener('click', function () {
      if (isOpen) close();
      else open();
    });
    els.close.addEventListener('click', function () { close(); });
    els.scrim.addEventListener('click', function () { close(); });
    els.panel.addEventListener('click', onPanelClick);

    document.addEventListener('keydown', function (e) {
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.code === 'KeyA' || e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (isOpen) close();
        else open();
        return;
      }
      if (!isOpen) return;
      if (e.key === 'Escape') {
        close();
      } else if (e.key === 'Tab') {
        trapTab(e);
      }
    });

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', positionOverlays);
    window.addEventListener('scroll', positionOverlays, { passive: true });
    document.addEventListener('egoz:langchange', localize);
  }

  function init() {
    if (document.getElementById('egozA11y')) return;
    if (!window.CSS || !CSS.supports || !CSS.supports('backdrop-filter', 'grayscale(1)')) {
      if (!window.CSS || !CSS.supports || !CSS.supports('-webkit-backdrop-filter', 'grayscale(1)')) {
        root.setAttribute('data-ea-nobf', '');
      }
    }
    load();
    build();
    bind();
    localize();
    apply();

    window.EgozA11y = {
      open: open,
      close: close,
      reset: function () {
        Object.keys(defaults).forEach(function (k) { state[k] = defaults[k]; });
        apply();
        save();
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
