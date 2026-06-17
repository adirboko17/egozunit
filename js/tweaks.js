/* אגוז — Tweaks panel (vanilla, host-protocol aware) */
(function () {
  'use strict';

  var STORE = 'egoz-tweaks-v2';
  var UI_STORE = 'egoz-tweaks-ui';
  var PAD = 18;

  var ACCENTS = {
    royal: { label: 'כחול רויאל', a500: '#2E76E6', a400: '#7FA8F2', a600: '#2462D6', a300: '#B7D0FA', a200: '#DCE9FF', a700: '#1E50B5', a800: '#163C86' },
    azure: { label: 'תכלת',      a500: '#1D8FE0', a400: '#74BEEF', a600: '#1574C4', a300: '#AEDBF6', a200: '#DBF0FB', a700: '#136098', a800: '#0E4A78' },
    navy:  { label: 'כחול כהה',   a500: '#21449C', a400: '#6F8FD8', a600: '#1A3A88', a300: '#A9BDE6', a200: '#DBE5F7', a700: '#173171', a800: '#122657' }
  };

  var FONTS = {
    rubik: { label: 'רוביק',  stack: "'Rubik', system-ui, sans-serif" },
    heebo: { label: 'חיבו',   stack: "'Heebo', system-ui, sans-serif" },
    alef:  { label: 'אלף',    stack: "'Alef', system-ui, sans-serif" }
  };

  var DEFAULTS = {
    accent: 'royal',
    headingFont: 'heebo',
    heroTitle: 'אחים בקרב.\nמשפחה לכל החיים.',
    scrim: 78
  };

  function load() {
    var v = {};
    try { v = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { v = {}; }
    var out = {};
    for (var k in DEFAULTS) out[k] = (k in v) ? v[k] : DEFAULTS[k];
    return out;
  }
  function save(v) { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch (e) {} }

  var UI_DEFAULTS = { right: PAD, bottom: PAD, open: true };

  function loadUi() {
    var v = {};
    try { v = JSON.parse(sessionStorage.getItem(UI_STORE) || '{}'); } catch (e) { v = {}; }
    return {
      right: typeof v.right === 'number' ? v.right : UI_DEFAULTS.right,
      bottom: typeof v.bottom === 'number' ? v.bottom : UI_DEFAULTS.bottom,
      open: v.open !== false
    };
  }

  function saveUi(ui) {
    try { sessionStorage.setItem(UI_STORE, JSON.stringify(ui)); } catch (e) {}
  }

  var state = load();
  var ui = loadUi();

  function apply() {
    var root = document.documentElement;
    var ac = ACCENTS[state.accent] || ACCENTS.brass;
    root.style.setProperty('--brass-500', ac.a500);
    root.style.setProperty('--brass-400', ac.a400);
    root.style.setProperty('--brass-600', ac.a600);
    root.style.setProperty('--brass-300', ac.a300);
    root.style.setProperty('--brass-200', ac.a200);
    root.style.setProperty('--brass-700', ac.a700);
    root.style.setProperty('--brass-800', ac.a800);

    var f = FONTS[state.headingFont] || FONTS.heebo;
    root.style.setProperty('--font-display', f.stack);

    root.style.setProperty('--hero-scrim', (state.scrim / 100).toFixed(2));

    var title = document.getElementById('heroTitle');
    if (title && !document.body.getAttribute('data-i18n-page')) {
      title.innerHTML = '';
      var lines = String(state.heroTitle).split('\n');
      for (var i = 0; i < lines.length; i++) {
        title.appendChild(document.createTextNode(lines[i]));
        if (i < lines.length - 1) title.appendChild(document.createElement('br'));
      }
    }
  }

  function setTweak(key, val) {
    state[key] = val;
    save(state);
    apply();
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { ['tweak:' + key]: val } }, '*'); } catch (e) {}
  }

  /* ---------- panel UI ---------- */
  var STYLE = '\
  .twk{position:fixed;z-index:2147483646;width:286px;\
    max-height:calc(100vh - 36px);display:none;flex-direction:column;\
    background:rgba(24,29,17,.86);color:#F3F1E7;\
    -webkit-backdrop-filter:blur(22px) saturate(150%);backdrop-filter:blur(22px) saturate(150%);\
    border:1px solid rgba(214,187,133,.28);border-radius:16px;\
    box-shadow:0 24px 60px rgba(0,0,0,.5);overflow:hidden;\
    font-family:"Assistant",system-ui,sans-serif;direction:rtl}\
  .twk.is-open{display:flex}\
  .twk__hd{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;\
    border-bottom:1px solid rgba(214,187,133,.18);cursor:move;user-select:none}\
  .twk__hd b{font-family:"Rubik",sans-serif;font-weight:800;font-size:14px;letter-spacing:.02em}\
  .twk__hd small{display:block;font-size:10.5px;color:#BFC6AC;font-weight:600;letter-spacing:.14em;margin-top:2px}\
  .twk__x{appearance:none;border:0;background:transparent;color:#BFC6AC;width:26px;height:26px;\
    border-radius:7px;cursor:pointer;font-size:16px;line-height:1}\
  .twk__x:hover{background:rgba(243,241,231,.1);color:#fff}\
  .twk__body{padding:14px 16px 18px;display:flex;flex-direction:column;gap:16px;overflow-y:auto}\
  .twk__sec{font-family:"Rubik",sans-serif;font-weight:700;font-size:10.5px;letter-spacing:.16em;\
    color:#D6BB85;text-transform:uppercase}\
  .twk__row{display:flex;flex-direction:column;gap:7px}\
  .twk__lbl{font-size:12.5px;font-weight:600;color:#E7E4D6}\
  .twk__seg{display:flex;gap:6px}\
  .twk__seg button{flex:1;padding:9px 4px;border-radius:9px;border:1px solid rgba(243,241,231,.16);\
    background:rgba(243,241,231,.04);color:#BFC6AC;font:600 11.5px/1 "Assistant",sans-serif;cursor:pointer;\
    transition:all .15s ease;font-family:inherit}\
  .twk__seg button:hover{border-color:rgba(214,187,133,.5);color:#fff}\
  .twk__seg button.on{background:#D6BB85;border-color:#D6BB85;color:#181D11;font-weight:800}\
  .twk__sw{display:flex;gap:8px}\
  .twk__sw button{flex:1;height:34px;border-radius:9px;border:2px solid transparent;cursor:pointer;\
    position:relative;transition:transform .12s ease}\
  .twk__sw button:hover{transform:translateY(-2px)}\
  .twk__sw button.on{border-color:#F3F1E7}\
  .twk__ta{width:100%;resize:vertical;min-height:54px;border-radius:9px;padding:9px 11px;\
    border:1px solid rgba(243,241,231,.18);background:rgba(243,241,231,.05);color:#F3F1E7;\
    font:500 13px/1.45 "Assistant",sans-serif;font-family:inherit;direction:rtl}\
  .twk__ta:focus{outline:none;border-color:#D6BB85}\
  .twk__range{display:flex;align-items:center;gap:10px}\
  .twk__range input{flex:1;accent-color:#D6BB85}\
  .twk__range span{font-variant-numeric:tabular-nums;font-size:11.5px;color:#BFC6AC;min-width:34px;text-align:left}\
  ';

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function applyPanelPos(panel) {
    panel.style.right = ui.right + 'px';
    panel.style.bottom = ui.bottom + 'px';
  }

  function clampPanel(panel) {
    var w = panel.offsetWidth;
    var h = panel.offsetHeight;
    var maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    var maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    ui.right = Math.min(maxRight, Math.max(PAD, ui.right));
    ui.bottom = Math.min(maxBottom, Math.max(PAD, ui.bottom));
    applyPanelPos(panel);
    saveUi(ui);
  }

  function setPanelOpen(panel, open) {
    ui.open = !!open;
    if (ui.open) panel.classList.add('is-open');
    else panel.classList.remove('is-open');
    saveUi(ui);
  }

  function bindDrag(panel, handle) {
    handle.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      var r = panel.getBoundingClientRect();
      var sx = e.clientX;
      var sy = e.clientY;
      var startRight = window.innerWidth - r.right;
      var startBottom = window.innerHeight - r.bottom;
      var move = function (ev) {
        ui.right = startRight - (ev.clientX - sx);
        ui.bottom = startBottom - (ev.clientY - sy);
        clampPanel(panel);
      };
      var up = function () {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        saveUi(ui);
      };
      e.preventDefault();
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    });
  }

  function buildSegment(options, current, onPick) {
    var wrap = el('div', 'twk__seg');
    options.forEach(function (o) {
      var b = el('button', null, o.label);
      if (o.value === current) b.classList.add('on');
      b.addEventListener('click', function () {
        wrap.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); onPick(o.value);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function buildPanel() {
    var st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);

    var panel = el('div', 'twk'); panel.id = 'twkPanel';

    var hd = el('div', 'twk__hd');
    var ttl = el('div'); var b = el('b', null, 'התאמות'); var s = el('small', null, 'TWEAKS'); ttl.appendChild(b); ttl.appendChild(s);
    var x = el('button', 'twk__x', '✕'); x.setAttribute('aria-label', 'סגירה');
    x.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    x.addEventListener('click', function () {
      setPanelOpen(panel, false);
      try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
    });
    hd.appendChild(ttl); hd.appendChild(x); panel.appendChild(hd);
    bindDrag(panel, hd);

    var body = el('div', 'twk__body');

    // Accent swatches
    body.appendChild(el('div', 'twk__sec', 'צבע הדגשה'));
    var rowA = el('div', 'twk__row');
    var sw = el('div', 'twk__sw');
    Object.keys(ACCENTS).forEach(function (key) {
      var ac = ACCENTS[key];
      var btn = el('button'); btn.style.background = ac.a500; btn.title = ac.label;
      if (key === state.accent) btn.classList.add('on');
      btn.addEventListener('click', function () {
        sw.querySelectorAll('button').forEach(function (z) { z.classList.remove('on'); });
        btn.classList.add('on'); setTweak('accent', key);
      });
      sw.appendChild(btn);
    });
    rowA.appendChild(sw); body.appendChild(rowA);

    // Heading font
    body.appendChild(el('div', 'twk__sec', 'גופן כותרות'));
    var fontOpts = Object.keys(FONTS).map(function (k) { return { value: k, label: FONTS[k].label }; });
    body.appendChild(buildSegment(fontOpts, state.headingFont, function (v) { setTweak('headingFont', v); }));

    // Hero title
    body.appendChild(el('div', 'twk__sec', 'כותרת הפתיח'));
    var ta = el('textarea', 'twk__ta'); ta.value = state.heroTitle; ta.rows = 2;
    ta.addEventListener('input', function () { setTweak('heroTitle', ta.value); });
    body.appendChild(ta);

    // Scrim
    body.appendChild(el('div', 'twk__sec', 'הכהיית תמונת הפתיח'));
    var rowR = el('div', 'twk__range');
    var range = document.createElement('input'); range.type = 'range'; range.min = 30; range.max = 95; range.step = 1; range.value = state.scrim;
    var val = el('span', null, state.scrim + '%');
    range.addEventListener('input', function () { val.textContent = range.value + '%'; setTweak('scrim', parseInt(range.value, 10)); });
    rowR.appendChild(range); rowR.appendChild(val); body.appendChild(rowR);

    panel.appendChild(body);
    document.body.appendChild(panel);
    applyPanelPos(panel);
    if (ui.open) panel.classList.add('is-open');
    requestAnimationFrame(function () { clampPanel(panel); });
    return panel;
  }

  function init() {
    apply();
    var panel = buildPanel();

    window.addEventListener('message', function (e) {
      var t = e && e.data && e.data.type;
      if (t === '__activate_edit_mode') setPanelOpen(panel, true);
    });

    window.addEventListener('resize', function () { clampPanel(panel); });

    setPanelOpen(panel, true);

    function announce() {
      try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
    }
    announce();
    setTimeout(announce, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
