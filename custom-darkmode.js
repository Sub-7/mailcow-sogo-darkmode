/*
 * SOGo Dark Mode for mailcow-dockerized
 * Version 1.3.1 – colors, header/accent color, layout, draggable borders, text size, unread highlighting
 * -----------------------------------------------------------------------------------------------
 * File:   data/conf/sogo/custom-darkmode.js
 * Mounted as js/theme.js into the SOGo container via docker-compose.override.yml.
 * SOGo loads js/theme.js on every page (SOGoUIAdditionalJSFiles in sogo.conf).
 *
 * Usage:
 *   - Round button top right (left of Calendar/Address Book/Mail) opens the settings
 *   - Tab "Colors": dark mode, color sliders, header color, accent color, presets
 *   - Tab "Layout": folder pane / message list width, header / user area height
 *   - Tab "Text": text size for folder pane, message list, reading pane, header, user area,
 *     and how unread messages are highlighted in the message list
 *   - Borders between areas can be dragged with the mouse, double-click a border = default
 *   - Alt+Shift+D toggles dark mode on/off
 *   - Settings are stored per browser (localStorage), not per account
 *
 * Language: follows the language set in SOGo, then the browser language, then English.
 * More languages: just add a block to I18N.
 *
 * No network access of any kind. The only thing stored is the localStorage
 * key "sogoDarkModeSettings" in the user's browser.
 *
 * Server-wide defaults: DEFAULTS, SHOW_BUTTON, SHOW_HANDLES, BUTTON_POSITION and
 * FALLBACK_POSITION below.
 *
 * License: MIT
 * Project: https://github.com/Sub-7/mailcow-sogo-darkmode
 */
(function () {
  'use strict';

  var VERSION = '1.3.1';
  var PROJECT_URL = 'https://github.com/Sub-7/mailcow-sogo-darkmode';

  // ---------- Server-wide defaults ----------
  var DEFAULTS = {
    mode: 'auto',       // 'auto' (follow system) | 'dark' | 'light'
    strength: 92,       // darkness in % (100 = pure black)
    brightness: 100,    // brightness in %
    contrast: 100,      // contrast in %
    saturation: 100,    // saturation in %
    hue: 0,             // hue shift in degrees (-180 to 180)
    warmth: 0,          // warmth (sepia amount) in %
    headerColor: '',    // header color as '#rrggbb', empty = SOGo default
    selectColor: '',    // accent color (selected item, round "new" buttons) as '#rrggbb', empty = same as header color
    sidenavWidth: 0,    // folder pane width in px, 0 = SOGo default
    listWidth: 0,       // message list width in px, 0 = SOGo default
    toolbarHeight: 0,   // header height (top right) in px, 0 = SOGo default
    userHeight: 0,      // user area height (top left) in px, 0 = SOGo default
    fontSidenav: 100,   // text size folder pane in %
    fontList: 100,      // text size message list in %
    fontDetail: 100,    // text size reading pane in %
    fontHeader: 100,    // text size header (top right) in %
    fontUser: 100,      // text size user area (top left) in %
    unreadBold: true,   // unread messages: bold sender/subject/date
    unreadBar: true,    // unread messages: color bar on the left
    unreadBg: false,    // unread messages: tinted background
    unreadText: false,  // unread messages: colored subject
    unreadColor: '#2196f3' // color for bar/background/subject
  };
  var SHOW_BUTTON = true;   // false = no button, keyboard shortcut only
  var SHOW_HANDLES = true;  // false = no draggable borders

  // 'toolbar' = in SOGo's top right toolbar, left of Calendar/Address Book/Mail
  // or floating: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  var BUTTON_POSITION = 'toolbar';

  // Floating position used when a page has no SOGo toolbar
  var FALLBACK_POSITION = 'bottom-left';

  var STORAGE_KEY = 'sogoDarkModeSettings';

  // From this window width on, SOGo shows folder pane and message list side by side
  var DESKTOP_MIN_WIDTH = 1024;

  // Below this user area height the profile picture is hidden
  var USER_AVATAR_MIN_HEIGHT = 112;

  // ---------- Languages ----------
  var I18N = {
    de: {
      title: 'Darkmode',
      tabColors: 'Farben',
      tabLayout: 'Layout',
      modeDark: 'Dunkel',
      modeAuto: 'Auto',
      modeLight: 'Aus',
      strength: 'Dunkelstufe',
      brightness: 'Helligkeit',
      contrast: 'Kontrast',
      saturation: 'Sättigung',
      hue: 'Farbton',
      warmth: 'Wärme',
      headerColor: 'Kopfzeilen-Farbe',
      selectColor: 'Akzentfarbe',
      sameAsHeader: 'wie Kopfzeile',
      standard: 'Standard',
      presetStandard: 'Standard',
      presetBlack: 'Schwarz',
      presetSoft: 'Weich',
      presetWarm: 'Warm',
      sidenavWidth: 'Breite Ordnerleiste',
      listWidth: 'Breite Mailliste',
      toolbarHeight: 'Höhe Kopfzeile',
      userHeight: 'Höhe Benutzerbereich',
      auto: 'Auto',
      resetOne: 'Auf Standard zurücksetzen',
      reset: 'Zurücksetzen',
      close: 'Schließen',
      tabFont: 'Schrift',
      fontSidenav: 'Ordnerleiste',
      fontList: 'Mailliste',
      fontDetail: 'Lesebereich',
      fontHeader: 'Kopfzeile',
      fontUser: 'Benutzerbereich',
      dragTitle: 'Ziehen zum Ändern, Doppelklick: Standard',
      buttonTitle: 'Darkmode (Alt+Shift+D: ein/aus)',
      dialogLabel: 'Darkmode-Einstellungen',
      hintColors: 'Akzentfarbe: ausgewählter Eintrag und runde „Neu“-Knöpfe, standardmäßig wie die Kopfzeile. ' +
        'Gilt nur für diesen Browser. Alt+Shift+D schaltet ein/aus, „Auto“ folgt der Systemeinstellung.',
      hintLayout: 'Die Ränder lassen sich auch direkt mit der Maus ziehen, Doppelklick auf den Rand setzt zurück. ' +
        'Breiten gelten ab 1024 px Fensterbreite. Unter 112 px Höhe wird das Profilbild ausgeblendet.',
      hintFont: 'Vergrößert Schrift und Symbole im jeweiligen Bereich. Ordnerleiste und Mailliste lassen sich ' +
        'nur vergrößern, kleiner würde SOGos Listenanzeige beim Scrollen Lücken lassen.',
      unreadTitle: 'Ungelesene Mails hervorheben',
      unreadBold: 'Fett',
      unreadBar: 'Farbbalken links',
      unreadBg: 'Hintergrund einfärben',
      unreadText: 'Betreff einfärben',
      unreadColor: 'Farbe'
    },
    en: {
      title: 'Dark mode',
      tabColors: 'Colors',
      tabLayout: 'Layout',
      modeDark: 'Dark',
      modeAuto: 'Auto',
      modeLight: 'Off',
      strength: 'Darkness',
      brightness: 'Brightness',
      contrast: 'Contrast',
      saturation: 'Saturation',
      hue: 'Hue',
      warmth: 'Warmth',
      headerColor: 'Header color',
      selectColor: 'Accent color',
      sameAsHeader: 'same as header',
      standard: 'Default',
      presetStandard: 'Default',
      presetBlack: 'Black',
      presetSoft: 'Soft',
      presetWarm: 'Warm',
      sidenavWidth: 'Folder pane width',
      listWidth: 'Message list width',
      toolbarHeight: 'Header height',
      userHeight: 'User area height',
      auto: 'Auto',
      resetOne: 'Reset to default',
      reset: 'Reset',
      close: 'Close',
      tabFont: 'Text',
      fontSidenav: 'Folder pane',
      fontList: 'Message list',
      fontDetail: 'Reading pane',
      fontHeader: 'Header',
      fontUser: 'User area',
      dragTitle: 'Drag to resize, double-click: default',
      buttonTitle: 'Dark mode (Alt+Shift+D: on/off)',
      dialogLabel: 'Dark mode settings',
      hintColors: 'Accent color: selected item and round “new” buttons, same as the header by default. ' +
        'Applies to this browser only. Alt+Shift+D toggles on/off, “Auto” follows the system setting.',
      hintLayout: 'You can also drag the borders directly with the mouse, double-click a border to reset. ' +
        'Widths apply from a window width of 1024 px. Below 112 px height the profile picture is hidden.',
      hintFont: 'Scales text and icons in each area. Folder pane and message list can only be enlarged, ' +
        'smaller sizes would leave gaps in SOGo’s list while scrolling.',
      unreadTitle: 'Highlight unread messages',
      unreadBold: 'Bold',
      unreadBar: 'Color bar on the left',
      unreadBg: 'Tinted background',
      unreadText: 'Colored subject',
      unreadColor: 'Color'
    }
  };

  var LANG = (function () {
    var candidates = [document.documentElement.getAttribute('lang')];
    if (navigator.languages) {
      candidates = candidates.concat(navigator.languages);
    }
    candidates.push(navigator.language);
    for (var i = 0; i < candidates.length; i++) {
      var code = String(candidates[i] || '').toLowerCase().replace('_', '-').split('-')[0];
      if (I18N[code]) {
        return code;
      }
    }
    return 'en';
  })();

  function t(key) {
    return (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key;
  }

  // ---------- Sliders and presets ----------
  var PRESETS = [
    { name: 'presetStandard', values: { strength: 92,  brightness: 100, contrast: 100, saturation: 100, hue: 0, warmth: 0 } },
    { name: 'presetBlack',    values: { strength: 100, brightness: 100, contrast: 105, saturation: 100, hue: 0, warmth: 0 } },
    { name: 'presetSoft',     values: { strength: 85,  brightness: 95,  contrast: 90,  saturation: 90,  hue: 0, warmth: 0 } },
    { name: 'presetWarm',     values: { strength: 92,  brightness: 95,  contrast: 100, saturation: 90,  hue: 0, warmth: 25 } }
  ];

  var RANGES = [
    { key: 'strength',   min: 70,   max: 100, unit: '%' },
    { key: 'brightness', min: 60,   max: 140, unit: '%' },
    { key: 'contrast',   min: 60,   max: 140, unit: '%' },
    { key: 'saturation', min: 0,    max: 200, unit: '%' },
    { key: 'hue',        min: -180, max: 180, unit: '°' },
    { key: 'warmth',     min: 0,    max: 60,  unit: '%' }
  ];

  // Layout values: 0 = SOGo default ("Auto")
  var LAYOUT = [
    { key: 'sidenavWidth',  min: 160, max: 640,  fallback: 300 },
    { key: 'listWidth',     min: 240, max: 1200, fallback: 450 },
    { key: 'toolbarHeight', min: 40,  max: 112,  fallback: 64 },
    { key: 'userHeight',    min: 56,  max: 192,  fallback: 128 }
  ];

  // Text size per area in % (100 = SOGo default). Implemented with CSS zoom on the content,
  // because SOGo uses fixed px font sizes. Areas using SOGo's virtual list
  // (folder pane, message list) only from 100 %, smaller values leave gaps while scrolling.
  var FONTS = [
    { key: 'fontSidenav', min: 100, max: 160, selector: 'md-sidenav.md-sidenav-left > md-content' },
    { key: 'fontList',    min: 100, max: 160, selector: 'html[data-sgdm-app="mail"] .view-list > *' },
    { key: 'fontDetail',  min: 70,  max: 200, selector: 'html[data-sgdm-app="mail"] .view-detail > *' },
    { key: 'fontHeader',  min: 70,  max: 160, selector: 'md-toolbar.toolbar-main > .md-toolbar-tools > *' },
    { key: 'fontUser',    min: 70,  max: 160, selector: 'md-sidenav > md-toolbar.md-tall > *' }
  ];

  // How unread messages are highlighted in the message list (on/off switches)
  var UNREAD = ['unreadBold', 'unreadBar', 'unreadBg', 'unreadText'];

  var MODES = ['dark', 'auto', 'light'];
  var MODE_LABELS = { dark: 'modeDark', auto: 'modeAuto', light: 'modeLight' };

  // ---------- Load/save settings ----------
  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function toNumber(raw) {
    return (raw === undefined || raw === null || raw === '') ? NaN : Number(raw);
  }

  function sanitize(s) {
    s = s || {};
    var out = {};
    out.mode = MODES.indexOf(s.mode) !== -1 ? s.mode : DEFAULTS.mode;
    RANGES.forEach(function (r) {
      var v = toNumber(s[r.key]);
      out[r.key] = isFinite(v) ? clamp(Math.round(v), r.min, r.max) : DEFAULTS[r.key];
    });
    LAYOUT.forEach(function (r) {
      var v = toNumber(s[r.key]);
      if (!isFinite(v)) {
        out[r.key] = DEFAULTS[r.key];
      } else if (v <= 0) {
        out[r.key] = 0;
      } else {
        out[r.key] = clamp(Math.round(v), r.min, r.max);
      }
    });
    FONTS.forEach(function (r) {
      var v = toNumber(s[r.key]);
      out[r.key] = isFinite(v) ? clamp(Math.round(v), r.min, r.max) : DEFAULTS[r.key];
    });
    out.headerColor = /^#[0-9a-f]{6}$/i.test(String(s.headerColor || '')) ? String(s.headerColor).toLowerCase() : '';
    out.selectColor = /^#[0-9a-f]{6}$/i.test(String(s.selectColor || '')) ? String(s.selectColor).toLowerCase() : '';
    UNREAD.forEach(function (k) {
      out[k] = typeof s[k] === 'boolean' ? s[k] : DEFAULTS[k];
    });
    out.unreadColor = /^#[0-9a-f]{6}$/i.test(String(s.unreadColor || '')) ? String(s.unreadColor).toLowerCase() : DEFAULTS.unreadColor;
    if (s.lastDarkMode === 'dark' || s.lastDarkMode === 'auto') {
      out.lastDarkMode = s.lastDarkMode;
    } else {
      out.lastDarkMode = out.mode === 'light' ? 'dark' : out.mode;
    }
    return out;
  }

  function load() {
    var stored = null;
    try {
      stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (!stored) {
        // Migrate from the early version (mode stored as plain text)
        var old = window.localStorage.getItem('sogoDarkMode');
        if (old) {
          stored = { mode: old };
        }
      }
    } catch (e) {
      stored = null;
    }
    return sanitize(stored);
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      // localStorage not available
    }
  }

  var settings = load();

  // ---------- Is dark mode active? ----------
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function filterActive() {
    if (settings.mode === 'dark') {
      return true;
    }
    return settings.mode === 'auto' && !!darkQuery && darkQuery.matches;
  }

  // ---------- Color math ----------
  // The page filter is a chain of affine color transforms (CSS Filter Effects, sRGB).
  // So that a chosen header color looks exactly as chosen after the filter,
  // the color before the filter is computed backwards.
  function opInvert(a) {
    var s = 1 - 2 * a;
    return { M: [[s, 0, 0], [0, s, 0], [0, 0, s]], t: [a, a, a] };
  }

  function opHueRotate(deg) {
    var r = deg * Math.PI / 180;
    var c = Math.cos(r);
    var s = Math.sin(r);
    return {
      M: [
        [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928],
        [0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283],
        [0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072]
      ],
      t: [0, 0, 0]
    };
  }

  function opBrightness(b) {
    return { M: [[b, 0, 0], [0, b, 0], [0, 0, b]], t: [0, 0, 0] };
  }

  function opContrast(k) {
    var i = 0.5 - 0.5 * k;
    return { M: [[k, 0, 0], [0, k, 0], [0, 0, k]], t: [i, i, i] };
  }

  function opSaturate(s) {
    return {
      M: [
        [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
        [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s]
      ],
      t: [0, 0, 0]
    };
  }

  function opSepia(a) {
    var r = 1 - a;
    return {
      M: [
        [0.393 + 0.607 * r, 0.769 - 0.769 * r, 0.189 - 0.189 * r],
        [0.349 - 0.349 * r, 0.686 + 0.314 * r, 0.168 - 0.168 * r],
        [0.272 - 0.272 * r, 0.534 - 0.534 * r, 0.131 + 0.869 * r]
      ],
      t: [0, 0, 0]
    };
  }

  function filterOps() {
    return [
      opInvert(settings.strength / 100),
      opHueRotate(180 + settings.hue),
      opBrightness(settings.brightness / 100),
      opContrast(settings.contrast / 100),
      opSaturate(settings.saturation / 100),
      opSepia(settings.warmth / 100)
    ];
  }

  function mulVec(M, v) {
    return [
      M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
      M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
      M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
    ];
  }

  function mulMat(A, B) {
    var R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        R[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
      }
    }
    return R;
  }

  function det3(M) {
    return M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
      M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
      M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  }

  function inv3(M) {
    var d = det3(M);
    if (Math.abs(d) < 1e-6) {
      return null;
    }
    return [
      [(M[1][1] * M[2][2] - M[1][2] * M[2][1]) / d, (M[0][2] * M[2][1] - M[0][1] * M[2][2]) / d, (M[0][1] * M[1][2] - M[0][2] * M[1][1]) / d],
      [(M[1][2] * M[2][0] - M[1][0] * M[2][2]) / d, (M[0][0] * M[2][2] - M[0][2] * M[2][0]) / d, (M[0][2] * M[1][0] - M[0][0] * M[1][2]) / d],
      [(M[1][0] * M[2][1] - M[1][1] * M[2][0]) / d, (M[0][1] * M[2][0] - M[0][0] * M[2][1]) / d, (M[0][0] * M[1][1] - M[0][1] * M[1][0]) / d]
    ];
  }

  function clamp01(c) {
    return [clamp(c[0], 0, 1), clamp(c[1], 0, 1), clamp(c[2], 0, 1)];
  }

  // Run a color through the filter (what you see on screen)
  function forward(ops, c) {
    for (var i = 0; i < ops.length; i++) {
      var v = mulVec(ops[i].M, c);
      c = clamp01([v[0] + ops[i].t[0], v[1] + ops[i].t[1], v[2] + ops[i].t[2]]);
    }
    return c;
  }

  // Compute the color before the filter that results in "target" after the filter
  function preimage(ops, target) {
    var M = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    var tv = [0, 0, 0];
    ops.forEach(function (op) {
      if (Math.abs(det3(op.M)) < 1e-4) {
        return; // not invertible (e.g. saturation 0) -> skip
      }
      M = mulMat(op.M, M);
      var mt = mulVec(op.M, tv);
      tv = [mt[0] + op.t[0], mt[1] + op.t[1], mt[2] + op.t[2]];
    });
    var inv = inv3(M);
    if (!inv) {
      return target;
    }
    var x = clamp01(mulVec(inv, [target[0] - tv[0], target[1] - tv[1], target[2] - tv[2]]));
    // Refine in case values were clipped along the way
    for (var i = 0; i < 6; i++) {
      var y = forward(ops, x);
      var corr = mulVec(inv, [target[0] - y[0], target[1] - y[1], target[2] - y[2]]);
      x = clamp01([x[0] + corr[0], x[1] + corr[1], x[2] + corr[2]]);
    }
    return x;
  }

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function rgbToHex(c) {
    return '#' + c.map(function (v) {
      var h = Math.round(clamp(v, 0, 1) * 255).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  }

  function parseCssColor(str) {
    var m = String(str || '').match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/i);
    if (!m) {
      return null;
    }
    if (m[4] !== undefined && Number(m[4]) === 0) {
      return null; // transparent
    }
    return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
  }

  function luminance(c) {
    var lin = c.map(function (v) {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  }

  // CSS color needed so that "visibleHex" appears on screen
  function cssColorFor(visibleHex) {
    if (!filterActive()) {
      return visibleHex;
    }
    return rgbToHex(preimage(filterOps(), hexToRgb(visibleHex)));
  }

  // ---------- Build CSS ----------
  function pageFilter() {
    return 'invert(' + (settings.strength / 100) + ')' +
      ' hue-rotate(' + (180 + settings.hue) + 'deg)' +
      ' brightness(' + (settings.brightness / 100) + ')' +
      ' contrast(' + (settings.contrast / 100) + ')' +
      ' saturate(' + (settings.saturation / 100) + ')' +
      ' sepia(' + (settings.warmth / 100) + ')';
  }

  // Invert media back so photos, logos and avatars look normal
  function mediaFilter() {
    return 'invert(1) hue-rotate(' + (180 - settings.hue) + 'deg)';
  }

  // The editor frame (CKEditor) stays inverted so composing is dark too
  function darkCss() {
    if (!filterActive()) {
      return '';
    }
    return [
      'html {',
      '  background-color: #ffffff !important;',
      '  filter: ' + pageFilter() + ' !important;',
      '}',
      'img, picture, video, canvas, object, embed,',
      'iframe:not(.cke_wysiwyg_frame),',
      '[style*="background-image"] {',
      '  filter: ' + mediaFilter() + ' !important;',
      '}'
    ].join('\n');
  }

  // The headers: top left (name/email address), top right (toolbar) and the compose window
  var HEADER_SELECTORS = [
    'md-sidenav > md-toolbar.md-tall',
    'md-toolbar.toolbar-main',
    'md-toolbar[data-sgdm-header]',
    'md-dialog.sg-mail-editor md-toolbar'
  ];

  function headerCss() {
    if (!settings.headerColor) {
      return '';
    }
    var visibleBg = settings.headerColor;
    var visibleFg = luminance(hexToRgb(visibleBg)) > 0.4 ? '#202020' : '#f5f5f5';
    var bg = cssColorFor(visibleBg);
    var fg = cssColorFor(visibleFg);
    var inner = [];
    HEADER_SELECTORS.forEach(function (sel) {
      inner.push(sel + ' md-icon:not(.sg-icon--badge)', sel + ' p', sel + ' .md-caption', sel + ' .md-button');
    });
    return [
      HEADER_SELECTORS.join(',\n') + ' {',
      '  background-color: ' + bg + ' !important;',
      '  color: ' + fg + ' !important;',
      '}',
      inner.join(',\n') + ' {',
      '  color: ' + fg + ' !important;',
      '}',
      // The sender field in the compose header keeps its own light background, so keep its text dark
      'md-dialog.sg-mail-editor md-toolbar md-autocomplete,',
      'md-dialog.sg-mail-editor md-toolbar md-autocomplete input {',
      '  color: rgba(0, 0, 0, 0.87) !important;',
      '}'
    ].join('\n');
  }

  function sizeRule(selector, prop, px) {
    var v = px + 'px !important;';
    if (prop === 'width') {
      return selector + ' {\n  flex: 0 0 ' + v + '\n  width: ' + v + '\n  min-width: ' + v + '\n  max-width: ' + v + '\n}';
    }
    return selector + ' {\n  height: ' + v + '\n  min-height: ' + v + '\n  max-height: ' + v + '\n}';
  }

  function layoutCss() {
    var out = [];
    var desktop = [];
    if (settings.sidenavWidth) {
      desktop.push(sizeRule('md-sidenav.md-sidenav-left.md-locked-open', 'width', settings.sidenavWidth));
      desktop.push('md-sidenav.md-sidenav-left.md-locked-open.sg-close {\n  margin-right: -' + settings.sidenavWidth + 'px !important;\n}');
    }
    if (settings.listWidth) {
      desktop.push(sizeRule('html[data-sgdm-app="mail"] .view-list', 'width', settings.listWidth));
      desktop.push('html[data-sgdm-app="mail"] .view-list--close {\n  margin-right: -' + settings.listWidth + 'px !important;\n}');
    }
    if (desktop.length) {
      out.push('@media (min-width: ' + DESKTOP_MIN_WIDTH + 'px) {\n' + desktop.join('\n') + '\n}');
    }
    if (settings.toolbarHeight) {
      out.push(sizeRule('md-toolbar.toolbar-main,\nmd-toolbar.toolbar-main > .md-toolbar-tools', 'height', settings.toolbarHeight));
    }
    if (settings.userHeight) {
      out.push(sizeRule('md-sidenav > md-toolbar.md-tall', 'height', settings.userHeight));
      out.push('md-sidenav > md-toolbar.md-tall {\n  overflow: hidden !important;\n}');
      if (settings.userHeight < USER_AVATAR_MIN_HEIGHT) {
        out.push('md-sidenav > md-toolbar.md-tall > sg-avatar-image {\n  display: none !important;\n}');
      }
    }
    return out.join('\n');
  }

  function fontCss() {
    var out = [];
    FONTS.forEach(function (r) {
      if (settings[r.key] !== 100) {
        out.push(r.selector + ' {\n  zoom: ' + (settings[r.key] / 100) + ' !important;\n}');
      }
    });
    return out.join('\n');
  }

  // Unread messages: SOGo sets the class "unread" on the list item and only uses a
  // slightly heavier font, which is hard to spot. These rules make it stand out.
  function unreadCss() {
    var item = 'md-list-item.sg-message-list-item.unread';
    var color = cssColorFor(settings.unreadColor);
    var out = [];
    if (settings.unreadBold) {
      out.push([item + ' .sg-md-subhead', item + ' .sg-md-body', item + ' .sg-tile-date'].join(',\n') +
        ' {\n  font-weight: 700 !important;\n}');
    }
    if (settings.unreadBar) {
      out.push(item + ' {\n  box-shadow: inset 4px 0 0 ' + color + ' !important;\n}');
    }
    if (settings.unreadBg) {
      var c = hexToRgb(color).map(function (v) {
        return Math.round(v * 255);
      });
      // not on the selected message, SOGo marks that one with md-bg
      out.push(item + ':not(.md-bg) {\n  background-color: rgba(' + c.join(', ') + ', 0.16) !important;\n}');
    }
    if (settings.unreadText) {
      out.push(item + ' .sg-tile-subject {\n  color: ' + color + ' !important;\n}');
    }
    return out.join('\n');
  }

  // Accent color: selected message (mail list) or contact (address book) and the round
  // "new" buttons (write message, new contact, new event). Own color, otherwise the header
  // color. Without either, SOGo's own colors stay.
  var SELECTED_ITEM = '.view-list md-list-item.md-accent.md-bg';
  var ACCENT_FAB = '.md-button.md-fab.md-accent';

  function selectionColor() {
    return settings.selectColor || settings.headerColor || '';
  }

  function selectionCss() {
    var visibleBg = selectionColor();
    if (!visibleBg) {
      return '';
    }
    var visibleFg = luminance(hexToRgb(visibleBg)) > 0.4 ? '#202020' : '#f5f5f5';
    var bg = cssColorFor(visibleBg);
    var fg = cssColorFor(visibleFg);
    return [
      SELECTED_ITEM + ' {\n  background-color: ' + bg + ' !important;\n  color: ' + fg + ' !important;\n}',
      [SELECTED_ITEM + ' .sg-tile-content', SELECTED_ITEM + ' .sg-tile-content *:not(md-icon):not(.sg-category-dot)'].join(',\n') +
        ' {\n  color: ' + fg + ' !important;\n}',
      ACCENT_FAB + ' {\n  background-color: ' + bg + ' !important;\n  color: ' + fg + ' !important;\n}',
      ACCENT_FAB + ' md-icon {\n  color: ' + fg + ' !important;\n}'
    ].join('\n');
  }

  function pageCss() {
    return [darkCss(), headerCss(), layoutCss(), fontCss(), unreadCss(), selectionCss()].filter(Boolean).join('\n');
  }

  // Inside the editor (own document in an iframe) invert images back
  function editorCss() {
    if (!filterActive()) {
      return '';
    }
    return 'img { filter: ' + mediaFilter() + ' !important; }';
  }

  // ---------- Apply ----------
  var styleEl = null;

  function markApp() {
    var path = window.location.pathname;
    var app = /\/Mail\//.test(path) ? 'mail'
      : /\/Contacts\//.test(path) ? 'contacts'
      : /\/Calendar\//.test(path) ? 'calendar'
      : /\/Preferences/.test(path) ? 'preferences'
      : 'other';
    document.documentElement.setAttribute('data-sgdm-app', app);
  }

  function applyPage() {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'sogo-darkmode';
      (document.head || document.documentElement).appendChild(styleEl);
    }
    styleEl.textContent = pageCss();
  }

  function applyEditor(editor) {
    try {
      if (!editor || !editor.document) {
        return;
      }
      var doc = editor.document.$;
      if (!doc || !doc.head) {
        return;
      }
      var el = doc.getElementById('sogo-darkmode-editor');
      if (!el) {
        el = doc.createElement('style');
        el.id = 'sogo-darkmode-editor';
        doc.head.appendChild(el);
      }
      el.textContent = editorCss();
    } catch (e) {
      // editor not ready yet
    }
  }

  function applyAllEditors() {
    if (!window.CKEDITOR || !window.CKEDITOR.instances) {
      return;
    }
    Object.keys(window.CKEDITOR.instances).forEach(function (name) {
      applyEditor(window.CKEDITOR.instances[name]);
    });
  }

  var editorHooked = false;

  function hookEditor() {
    if (editorHooked || !window.CKEDITOR || typeof window.CKEDITOR.on !== 'function') {
      return;
    }
    editorHooked = true;
    window.CKEDITOR.on('instanceCreated', function (evt) {
      evt.editor.on('contentDom', function () {
        applyEditor(evt.editor);
      });
    });
    applyAllEditors();
  }

  function update() {
    applyPage();
    applyAllEditors();
    syncUi();
    positionHandles();
    save();
  }

  function setMode(m) {
    if (m !== 'light') {
      settings.lastDarkMode = m;
    }
    settings.mode = m;
    update();
  }

  // ---------- User interface ----------
  // Button and settings panel live in two separate shadow DOMs so SOGo's own styles
  // don't leak in. The button sits in the toolbar, the panel floats above the page
  // (otherwise the toolbar would clip it).
  var btnHost = null;
  var btn = null;
  var panelHost = null;
  var panelRoot = null;
  var panel = null;
  var modeButtons = {};
  var sliders = {};
  var layoutSliders = {};
  var fontSliders = {};
  var colorUi = null;
  var unreadUi = null;
  var selectUi = null;
  var tabButtons = {};
  var pages = {};
  var currentTab = 'colors';
  var hostMode = '';
  var fallbackAllowed = false;

  var BTN_CSS = [
    ':host { all: initial; color: inherit; }',
    '.btn { box-sizing: border-box; padding: 0; margin: 0; cursor: pointer;',
    '  display: flex; align-items: center; justify-content: center; border-radius: 50%; }',
    '.btn svg { display: block; }',
    '.btn.tb { width: 40px; height: 40px; border: none; background: transparent; color: inherit; }',
    '.btn.tb:hover, .btn.tb.open { background: rgba(158,158,158,.2); }',
    '.btn.tb svg { width: 24px; height: 24px; }',
    '.btn.fl { width: 36px; height: 36px; border: 1px solid #bdbdbd; background: #ffffff; color: #424242;',
    '  opacity: .55; box-shadow: 0 1px 4px rgba(0,0,0,.25); transition: opacity .15s; }',
    '.btn.fl:hover, .btn.fl.open { opacity: 1; }',
    '.btn.fl svg { width: 20px; height: 20px; }',
    '.btn:focus-visible { outline: 2px solid currentColor; outline-offset: 1px; }'
  ].join('\n');

  var PANEL_CSS = [
    ':host { all: initial; }',
    '* { box-sizing: border-box; font-family: Roboto, "Segoe UI", Arial, sans-serif; }',
    '.panel { width: 300px; max-height: calc(100vh - 16px); overflow-y: auto; padding: 12px 14px;',
    '  background: #ffffff; color: #212121; border: 1px solid #d0d0d0; border-radius: 8px;',
    '  box-shadow: 0 4px 16px rgba(0,0,0,.25); font-size: 13px; }',
    'h3 { margin: 0 0 10px; font-size: 14px; font-weight: 600; }',
    '.tabs { display: flex; margin-bottom: 12px; border-bottom: 1px solid #d0d0d0; }',
    '.tab { flex: 1; padding: 6px 0; font-size: 13px; cursor: pointer; background: none; border: none;',
    '  border-bottom: 2px solid transparent; color: #616161; margin-bottom: -1px; }',
    '.tab.active { color: #1976d2; border-bottom-color: #1976d2; font-weight: 600; }',
    '.page { display: none; }',
    '.page.active { display: block; }',
    '.seg, .presets, .actions { display: flex; gap: 4px; }',
    '.seg { margin-bottom: 12px; }',
    '.presets { margin: 10px 0; }',
    '.actions { margin-top: 10px; }',
    'button.b { flex: 1; padding: 5px 0; font-size: 12px; cursor: pointer; border-radius: 4px;',
    '  border: 1px solid #bdbdbd; background: #f5f5f5; color: #212121; }',
    'button.b:hover { background: #e8e8e8; }',
    'button.b.active { background: #1976d2; border-color: #1976d2; color: #ffffff; }',
    '.row { margin-bottom: 8px; }',
    '.row label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; gap: 6px; }',
    '.row label .name { flex: 1; }',
    '.row input[type=range] { width: 100%; margin: 0; accent-color: #1976d2; }',
    '.row input:disabled { opacity: .4; }',
    '.one { width: 22px; height: 20px; padding: 0; font-size: 13px; line-height: 1; cursor: pointer;',
    '  border: 1px solid #bdbdbd; border-radius: 4px; background: #f5f5f5; color: #212121; }',
    '.one:hover { background: #e8e8e8; }',
    '.one[hidden] { display: none; }',
    '.color { margin-top: 12px; }',
    '.swatch { position: relative; display: block; width: 100%; height: 26px; border: 1px solid #9e9e9e;',
    '  border-radius: 4px; overflow: hidden; cursor: pointer; }',
    '.swatch .fill { position: absolute; inset: 0; }',
    '.swatch input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;',
    '  border: 0; padding: 0; }',
    '.sect { margin: 14px 0 6px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-weight: 600; }',
    '.chk { display: flex; align-items: center; gap: 8px; margin: 5px 0; cursor: pointer; }',
    '.chk input { margin: 0; accent-color: #1976d2; cursor: pointer; }',
    '.hint { margin-top: 8px; color: #757575; font-size: 11px; line-height: 1.4; }',
    '.foot { margin-top: 10px; text-align: center; color: #9e9e9e; font-size: 11px; }',
    '.foot a { color: #1976d2; text-decoration: none; }',
    '.foot a:hover { text-decoration: underline; }'
  ].join('\n');

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>';

  function isPanelOpen() {
    return !!panelHost && panelHost.style.display !== 'none';
  }

  function positionPanel() {
    if (!isPanelOpen()) {
      return;
    }
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var pw = panel.offsetWidth || 300;
    var ph = panel.offsetHeight || 0;
    var left;
    var top;
    var r = (btnHost && btnHost.isConnected) ? btn.getBoundingClientRect() : null;
    if (r && (r.width || r.height)) {
      // right-aligned below the button, above it if there is no room
      left = r.right - pw;
      top = r.bottom + 6;
      if (top + ph > vh - 8) {
        top = r.top - 6 - ph;
      }
    } else {
      left = vw - pw - 12;
      top = 64;
    }
    left = Math.max(8, Math.min(left, vw - pw - 8));
    top = Math.max(8, Math.min(top, vh - ph - 8));
    panelHost.style.left = left + 'px';
    panelHost.style.top = top + 'px';
  }

  function togglePanel(open) {
    if (!panelHost) {
      return;
    }
    panelHost.style.display = open ? 'block' : 'none';
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      syncUi();
      positionPanel();
    }
  }

  function showTab(tab) {
    currentTab = tab;
    Object.keys(pages).forEach(function (k) {
      pages[k].classList.toggle('active', k === tab);
      tabButtons[k].classList.toggle('active', k === tab);
    });
    positionPanel();
  }

  // Measure the current size of an area (for "Auto" sliders)
  function measure(key) {
    var el = null;
    var horizontal = true;
    if (key === 'sidenavWidth') {
      el = document.querySelector('md-sidenav.md-sidenav-left.md-locked-open');
    } else if (key === 'listWidth') {
      el = document.querySelector('.view-list');
    } else if (key === 'toolbarHeight') {
      el = document.querySelector('md-toolbar.toolbar-main');
      horizontal = false;
    } else if (key === 'userHeight') {
      el = document.querySelector('md-sidenav > md-toolbar.md-tall');
      horizontal = false;
    }
    if (!el) {
      return 0;
    }
    return Math.round(horizontal ? el.offsetWidth : el.offsetHeight);
  }

  // Visible header color (for the color picker while "Default" is active)
  function currentHeaderHex() {
    var el = document.querySelector('md-toolbar.toolbar-main') || document.querySelector('md-sidenav > md-toolbar.md-tall');
    var c = el ? parseCssColor(window.getComputedStyle(el).backgroundColor) : null;
    if (!c) {
      return '#546e7a';
    }
    return rgbToHex(filterActive() ? forward(filterOps(), c) : c);
  }

  // Visible color of SOGo's own selection highlight (for the color picker while nothing is set)
  function currentSelectionHex() {
    var el = document.querySelector(SELECTED_ITEM);
    var c = el ? parseCssColor(window.getComputedStyle(el).backgroundColor) : null;
    if (!c) {
      return currentHeaderHex();
    }
    return rgbToHex(filterActive() ? forward(filterOps(), c) : c);
  }

  function syncUi() {
    if (!panelRoot) {
      return;
    }
    MODES.forEach(function (m) {
      modeButtons[m].classList.toggle('active', settings.mode === m);
    });
    RANGES.forEach(function (r) {
      var s = sliders[r.key];
      s.input.value = String(settings[r.key]);
      s.val.textContent = (r.key === 'hue' && settings.hue > 0 ? '+' : '') + settings[r.key] + r.unit;
      s.input.disabled = settings.mode === 'light';
    });
    LAYOUT.forEach(function (r) {
      var s = layoutSliders[r.key];
      var v = settings[r.key];
      if (v) {
        s.input.value = String(v);
        s.val.textContent = v + ' px';
        s.reset.hidden = false;
      } else {
        var m = measure(r.key);
        s.input.value = String(clamp(m || r.fallback, r.min, r.max));
        s.val.textContent = t('auto') + (m ? ' (' + m + ' px)' : '');
        s.reset.hidden = true;
      }
    });
    FONTS.forEach(function (r) {
      var s = fontSliders[r.key];
      s.input.value = String(settings[r.key]);
      s.val.textContent = settings[r.key] + ' %';
      s.reset.hidden = settings[r.key] === 100;
    });
    var shown = settings.headerColor || currentHeaderHex();
    colorUi.input.value = shown;
    // The swatch itself is under the filter -> compute backwards first
    colorUi.fill.style.background = cssColorFor(shown);
    colorUi.val.textContent = settings.headerColor ? settings.headerColor : t('standard');
    colorUi.reset.hidden = !settings.headerColor;
    var selShown = selectionColor() || currentSelectionHex();
    selectUi.input.value = selShown;
    selectUi.fill.style.background = cssColorFor(selShown);
    selectUi.val.textContent = settings.selectColor ? settings.selectColor
      : (settings.headerColor ? t('sameAsHeader') : t('standard'));
    selectUi.reset.hidden = !settings.selectColor;
    UNREAD.forEach(function (k) {
      unreadUi.checks[k].checked = !!settings[k];
    });
    unreadUi.input.value = settings.unreadColor;
    unreadUi.fill.style.background = cssColorFor(settings.unreadColor);
    unreadUi.val.textContent = settings.unreadColor;
    unreadUi.reset.hidden = settings.unreadColor === DEFAULTS.unreadColor;
  }

  function setHostMode(mode, corner) {
    if (mode === 'toolbar') {
      btnHost.style.cssText = 'display:inline-flex;align-items:center;flex:none;margin:0 6px;';
      btn.className = 'btn tb';
    } else {
      var pos = String(corner).split('-');
      var vert = pos[0] === 'top' ? 'top' : 'bottom';
      var horiz = pos[1] === 'right' ? 'right' : 'left';
      btnHost.style.cssText = 'position:fixed;z-index:2147483000;' + vert + ':12px;' + horiz + ':12px;';
      btn.className = 'btn fl';
    }
    if (isPanelOpen()) {
      btn.classList.add('open');
    }
    hostMode = mode + ':' + corner;
  }

  // The top right toolbar (Calendar, Address Book, Mail, Logout)
  function findToolbarGroup() {
    var groups = document.querySelectorAll('.sg-toolbar-group-last');
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].isConnected) {
        return groups[i];
      }
    }
    return null;
  }

  // Mark headers that have no class of their own (e.g. in Preferences)
  function markHeaders() {
    var groups = document.querySelectorAll('.sg-toolbar-group-last');
    for (var i = 0; i < groups.length; i++) {
      var tb = groups[i].closest ? groups[i].closest('md-toolbar') : null;
      if (tb && !tb.hasAttribute('data-sgdm-header')) {
        tb.setAttribute('data-sgdm-header', '');
      }
    }
  }

  // Puts the button in place. SOGo rebuilds the toolbar when switching
  // folders/views, so this is checked on every DOM change.
  function placeButton() {
    markHeaders();
    if (!btnHost || !document.body) {
      return;
    }
    if (BUTTON_POSITION === 'toolbar') {
      var group = findToolbarGroup();
      if (group) {
        if (btnHost.parentNode !== group) {
          group.insertBefore(btnHost, group.firstChild);
        }
        if (hostMode !== 'toolbar:') {
          setHostMode('toolbar', '');
        }
        return;
      }
      if (!fallbackAllowed) {
        return;
      }
      if (btnHost.parentNode !== document.body) {
        document.body.appendChild(btnHost);
      }
      if (hostMode !== 'fixed:' + FALLBACK_POSITION) {
        setHostMode('fixed', FALLBACK_POSITION);
      }
      return;
    }
    if (btnHost.parentNode !== document.body) {
      document.body.appendChild(btnHost);
    }
    if (hostMode !== 'fixed:' + BUTTON_POSITION) {
      setHostMode('fixed', BUTTON_POSITION);
    }
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildUi() {
    if (!SHOW_BUTTON || btnHost || !document.body) {
      return;
    }
    var probe = document.createElement('span');
    if (!probe.attachShadow) {
      return;
    }

    // Button
    btnHost = document.createElement('span');
    btnHost.id = 'sogo-darkmode-button';
    var btnRoot = btnHost.attachShadow({ mode: 'open' });
    btnRoot.innerHTML =
      '<style>' + BTN_CSS + '</style>' +
      '<button type="button" class="btn tb" title="' + esc(t('buttonTitle')) + '"' +
      ' aria-label="' + esc(t('dialogLabel')) + '" aria-haspopup="dialog" aria-expanded="false">' + ICON + '</button>';
    btn = btnRoot.querySelector('.btn');
    btn.addEventListener('click', function () {
      togglePanel(!isPanelOpen());
    });

    // Settings panel
    panelHost = document.createElement('div');
    panelHost.id = 'sogo-darkmode-panel';
    panelHost.style.cssText = 'position:fixed;z-index:2147483001;display:none;left:0;top:0;';
    panelRoot = panelHost.attachShadow({ mode: 'open' });

    var modes = MODES.map(function (m) {
      return '<button type="button" class="b" data-mode="' + m + '">' + esc(t(MODE_LABELS[m])) + '</button>';
    }).join('');
    var rows = RANGES.map(function (r) {
      return '<div class="row"><label><span class="name">' + esc(t(r.key)) + '</span><span data-val="' + r.key + '"></span></label>' +
        '<input type="range" step="1" min="' + r.min + '" max="' + r.max + '" data-key="' + r.key + '"></div>';
    }).join('');
    var presets = PRESETS.map(function (p, i) {
      return '<button type="button" class="b" data-preset="' + i + '">' + esc(t(p.name)) + '</button>';
    }).join('');
    var layoutRows = LAYOUT.map(function (r) {
      return '<div class="row"><label><span class="name">' + esc(t(r.key)) + '</span>' +
        '<span data-lval="' + r.key + '"></span>' +
        '<button type="button" class="one" data-lreset="' + r.key + '" title="' + esc(t('resetOne')) + '">↺</button></label>' +
        '<input type="range" step="1" min="' + r.min + '" max="' + r.max + '" data-lkey="' + r.key + '"></div>';
    }).join('');
    var fontRows = FONTS.map(function (r) {
      return '<div class="row"><label><span class="name">' + esc(t(r.key)) + '</span>' +
        '<span data-fval="' + r.key + '"></span>' +
        '<button type="button" class="one" data-freset="' + r.key + '" title="' + esc(t('resetOne')) + '">↺</button></label>' +
        '<input type="range" step="5" min="' + r.min + '" max="' + r.max + '" data-fkey="' + r.key + '"></div>';
    }).join('');

    panelRoot.innerHTML =
      '<style>' + PANEL_CSS + '</style>' +
      '<div class="panel" role="dialog" aria-label="' + esc(t('dialogLabel')) + '">' +
      '<h3>' + esc(t('title')) + '</h3>' +
      '<div class="tabs" role="tablist">' +
      '<button type="button" class="tab" role="tab" data-tab="colors">' + esc(t('tabColors')) + '</button>' +
      '<button type="button" class="tab" role="tab" data-tab="layout">' + esc(t('tabLayout')) + '</button>' +
      '<button type="button" class="tab" role="tab" data-tab="font">' + esc(t('tabFont')) + '</button>' +
      '</div>' +
      '<div class="page" data-page="colors">' +
      '<div class="seg">' + modes + '</div>' +
      rows +
      '<div class="row color"><label><span class="name">' + esc(t('headerColor')) + '</span>' +
      '<span data-cval></span>' +
      '<button type="button" class="one" data-act="header-default" title="' + esc(t('resetOne')) + '">↺</button></label>' +
      '<span class="swatch" data-swatch="header"><span class="fill"></span><input type="color" aria-label="' + esc(t('headerColor')) + '"></span>' +
      '</div>' +
      '<div class="row color"><label><span class="name">' + esc(t('selectColor')) + '</span>' +
      '<span data-sval></span>' +
      '<button type="button" class="one" data-act="select-default" title="' + esc(t('resetOne')) + '">↺</button></label>' +
      '<span class="swatch" data-swatch="select"><span class="fill"></span><input type="color" aria-label="' + esc(t('selectColor')) + '"></span>' +
      '</div>' +
      '<div class="presets">' + presets + '</div>' +
      '<div class="actions"><button type="button" class="b" data-act="reset-colors">' + esc(t('reset')) + '</button></div>' +
      '<div class="hint">' + esc(t('hintColors')) + '</div>' +
      '</div>' +
      '<div class="page" data-page="layout">' +
      layoutRows +
      '<div class="actions"><button type="button" class="b" data-act="reset-layout">' + esc(t('reset')) + '</button></div>' +
      '<div class="hint">' + esc(t('hintLayout')) + '</div>' +
      '</div>' +
      '<div class="page" data-page="font">' +
      fontRows +
      '<div class="sect">' + esc(t('unreadTitle')) + '</div>' +
      UNREAD.map(function (k) {
        return '<label class="chk"><input type="checkbox" data-ukey="' + k + '">' + esc(t(k)) + '</label>';
      }).join('') +
      '<div class="row color"><label><span class="name">' + esc(t('unreadColor')) + '</span>' +
      '<span data-ucval></span>' +
      '<button type="button" class="one" data-act="unread-color-default" title="' + esc(t('resetOne')) + '">↺</button></label>' +
      '<span class="swatch" data-swatch="unread"><span class="fill"></span><input type="color" aria-label="' + esc(t('unreadColor')) + '"></span>' +
      '</div>' +
      '<div class="actions"><button type="button" class="b" data-act="reset-font">' + esc(t('reset')) + '</button></div>' +
      '<div class="hint">' + esc(t('hintFont')) + '</div>' +
      '</div>' +
      '<div class="actions"><button type="button" class="b" data-act="close">' + esc(t('close')) + '</button></div>' +
      '<div class="foot">v' + esc(VERSION) + ' · <a href="' + esc(PROJECT_URL) + '" target="_blank" rel="noopener noreferrer">GitHub</a></div>' +
      '</div>';

    panel = panelRoot.querySelector('.panel');

    ['colors', 'layout', 'font'].forEach(function (k) {
      tabButtons[k] = panelRoot.querySelector('[data-tab="' + k + '"]');
      pages[k] = panelRoot.querySelector('[data-page="' + k + '"]');
      tabButtons[k].addEventListener('click', function () {
        showTab(k);
      });
    });
    showTab(currentTab);

    MODES.forEach(function (m) {
      modeButtons[m] = panelRoot.querySelector('[data-mode="' + m + '"]');
      modeButtons[m].addEventListener('click', function () {
        setMode(m);
      });
    });

    RANGES.forEach(function (r) {
      var input = panelRoot.querySelector('input[data-key="' + r.key + '"]');
      var val = panelRoot.querySelector('[data-val="' + r.key + '"]');
      sliders[r.key] = { input: input, val: val };
      input.addEventListener('input', function () {
        settings[r.key] = clamp(Math.round(Number(input.value)), r.min, r.max);
        update();
      });
    });

    LAYOUT.forEach(function (r) {
      var input = panelRoot.querySelector('input[data-lkey="' + r.key + '"]');
      var val = panelRoot.querySelector('[data-lval="' + r.key + '"]');
      var reset = panelRoot.querySelector('[data-lreset="' + r.key + '"]');
      layoutSliders[r.key] = { input: input, val: val, reset: reset };
      input.addEventListener('input', function () {
        settings[r.key] = clamp(Math.round(Number(input.value)), r.min, r.max);
        update();
      });
      reset.addEventListener('click', function () {
        settings[r.key] = 0;
        update();
      });
    });

    FONTS.forEach(function (r) {
      var input = panelRoot.querySelector('input[data-fkey="' + r.key + '"]');
      var val = panelRoot.querySelector('[data-fval="' + r.key + '"]');
      var reset = panelRoot.querySelector('[data-freset="' + r.key + '"]');
      fontSliders[r.key] = { input: input, val: val, reset: reset };
      input.addEventListener('input', function () {
        settings[r.key] = clamp(Math.round(Number(input.value)), r.min, r.max);
        update();
      });
      reset.addEventListener('click', function () {
        settings[r.key] = 100;
        update();
      });
    });

    colorUi = {
      input: panelRoot.querySelector('[data-swatch="header"] input'),
      fill: panelRoot.querySelector('[data-swatch="header"] .fill'),
      val: panelRoot.querySelector('[data-cval]'),
      reset: panelRoot.querySelector('[data-act="header-default"]')
    };
    colorUi.input.addEventListener('input', function () {
      if (/^#[0-9a-f]{6}$/i.test(colorUi.input.value)) {
        settings.headerColor = colorUi.input.value.toLowerCase();
        update();
      }
    });
    colorUi.reset.addEventListener('click', function () {
      settings.headerColor = '';
      update();
    });

    selectUi = {
      input: panelRoot.querySelector('[data-swatch="select"] input'),
      fill: panelRoot.querySelector('[data-swatch="select"] .fill'),
      val: panelRoot.querySelector('[data-sval]'),
      reset: panelRoot.querySelector('[data-act="select-default"]')
    };
    selectUi.input.addEventListener('input', function () {
      if (/^#[0-9a-f]{6}$/i.test(selectUi.input.value)) {
        settings.selectColor = selectUi.input.value.toLowerCase();
        update();
      }
    });
    selectUi.reset.addEventListener('click', function () {
      settings.selectColor = '';
      update();
    });

    unreadUi = {
      checks: {},
      input: panelRoot.querySelector('[data-swatch="unread"] input'),
      fill: panelRoot.querySelector('[data-swatch="unread"] .fill'),
      val: panelRoot.querySelector('[data-ucval]'),
      reset: panelRoot.querySelector('[data-act="unread-color-default"]')
    };
    UNREAD.forEach(function (k) {
      var box = panelRoot.querySelector('input[data-ukey="' + k + '"]');
      unreadUi.checks[k] = box;
      box.addEventListener('change', function () {
        settings[k] = box.checked;
        update();
      });
    });
    unreadUi.input.addEventListener('input', function () {
      if (/^#[0-9a-f]{6}$/i.test(unreadUi.input.value)) {
        settings.unreadColor = unreadUi.input.value.toLowerCase();
        update();
      }
    });
    unreadUi.reset.addEventListener('click', function () {
      settings.unreadColor = DEFAULTS.unreadColor;
      update();
    });

    PRESETS.forEach(function (p, i) {
      panelRoot.querySelector('[data-preset="' + i + '"]').addEventListener('click', function () {
        Object.keys(p.values).forEach(function (k) {
          settings[k] = p.values[k];
        });
        if (settings.mode === 'light') {
          settings.mode = settings.lastDarkMode;
        }
        update();
      });
    });

    panelRoot.querySelector('[data-act="reset-colors"]').addEventListener('click', function () {
      settings.mode = DEFAULTS.mode;
      settings.lastDarkMode = DEFAULTS.mode === 'light' ? 'dark' : DEFAULTS.mode;
      RANGES.forEach(function (r) {
        settings[r.key] = DEFAULTS[r.key];
      });
      settings.headerColor = DEFAULTS.headerColor;
      settings.selectColor = DEFAULTS.selectColor;
      update();
    });
    panelRoot.querySelector('[data-act="reset-layout"]').addEventListener('click', function () {
      LAYOUT.forEach(function (r) {
        settings[r.key] = DEFAULTS[r.key];
      });
      update();
    });
    panelRoot.querySelector('[data-act="reset-font"]').addEventListener('click', function () {
      FONTS.forEach(function (r) {
        settings[r.key] = DEFAULTS[r.key];
      });
      UNREAD.forEach(function (k) {
        settings[k] = DEFAULTS[k];
      });
      settings.unreadColor = DEFAULTS.unreadColor;
      update();
    });
    panelRoot.querySelector('[data-act="close"]').addEventListener('click', function () {
      togglePanel(false);
    });

    // A click outside closes the panel
    document.addEventListener('click', function (e) {
      if (!isPanelOpen() || !e.composedPath) {
        return;
      }
      var path = e.composedPath();
      if (path.indexOf(panelHost) === -1 && path.indexOf(btnHost) === -1) {
        togglePanel(false);
      }
    }, true);

    window.addEventListener('resize', function () {
      positionPanel();
      if (isPanelOpen()) {
        syncUi();
      }
    });

    document.body.appendChild(panelHost);
    placeButton();

    // SOGo rebuilds the toolbar -> put the button back
    if (window.MutationObserver) {
      var queued = false;
      new MutationObserver(function () {
        if (queued) {
          return;
        }
        queued = true;
        window.requestAnimationFrame(function () {
          queued = false;
          placeButton();
          positionHandles();
        });
      }).observe(document.body, { childList: true, subtree: true });
    }

    // Without a toolbar, show a floating button after a short delay
    window.setTimeout(function () {
      fallbackAllowed = true;
      placeButton();
    }, 3000);
  }

  // ---------- Draggable borders ----------
  // Invisible strips over the area borders (own layer, SOGo's DOM stays untouched).
  // On hover a line appears, dragging changes width/height, double-click = default.
  var handleHost = null;
  var dragging = null;
  var dragStyle = null;

  var HANDLES = [
    {
      key: 'sidenavWidth', axis: 'x', desktopOnly: true,
      find: function () {
        var el = document.querySelector('md-sidenav.md-sidenav-left.md-locked-open');
        return el && !el.classList.contains('sg-close') ? el : null;
      }
    },
    {
      key: 'listWidth', axis: 'x', desktopOnly: true,
      find: function () {
        if (document.documentElement.getAttribute('data-sgdm-app') !== 'mail') {
          return null;
        }
        var el = document.querySelector('.view-list');
        return el && !el.classList.contains('view-list--close') ? el : null;
      }
    },
    {
      key: 'toolbarHeight', axis: 'y', desktopOnly: false,
      find: function () {
        return document.querySelector('md-toolbar.toolbar-main');
      }
    },
    {
      key: 'userHeight', axis: 'y', desktopOnly: false,
      find: function () {
        return document.querySelector('md-sidenav > md-toolbar.md-tall');
      }
    }
  ];

  var HANDLE_CSS = [
    ':host { all: initial; }',
    '.h { position: fixed; display: none; pointer-events: auto; touch-action: none; }',
    '.h.x { width: 8px; cursor: col-resize; }',
    '.h.y { height: 8px; cursor: row-resize; }',
    '.h::after { content: ""; position: absolute; background: #1976d2; opacity: 0; transition: opacity .15s; }',
    '.h.x::after { top: 0; bottom: 0; left: 3px; width: 2px; }',
    '.h.y::after { left: 0; right: 0; top: 3px; height: 2px; }',
    '.h:hover::after, .h.active::after { opacity: .9; }'
  ].join('\n');

  function layoutRange(key) {
    for (var i = 0; i < LAYOUT.length; i++) {
      if (LAYOUT[i].key === key) {
        return LAYOUT[i];
      }
    }
    return null;
  }

  function positionHandles() {
    if (!handleHost) {
      return;
    }
    // Hide handles while dialogs/menus are open (SOGo then adds an md-backdrop)
    var blocked = !dragging && !!document.querySelector('md-backdrop');
    HANDLES.forEach(function (h) {
      var el = blocked ? null : h.find();
      var r = el ? el.getBoundingClientRect() : null;
      var ok = !!r && r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 &&
        (!h.desktopOnly || window.innerWidth >= DESKTOP_MIN_WIDTH);
      if (!ok) {
        if (dragging !== h) {
          h.node.style.display = 'none';
        }
        return;
      }
      var s = h.node.style;
      s.display = 'block';
      if (h.axis === 'x') {
        s.left = Math.round(r.right - 3) + 'px';
        s.top = Math.round(Math.max(0, r.top)) + 'px';
        s.height = Math.round(Math.min(window.innerHeight, r.bottom) - Math.max(0, r.top)) + 'px';
      } else {
        s.top = Math.round(r.bottom - 3) + 'px';
        s.left = Math.round(Math.max(0, r.left)) + 'px';
        s.width = Math.round(Math.min(window.innerWidth, r.right) - Math.max(0, r.left)) + 'px';
      }
    });
  }

  function endDrag(e) {
    if (!dragging) {
      return;
    }
    var h = dragging;
    dragging = null;
    h.node.classList.remove('active');
    try {
      h.node.releasePointerCapture(e.pointerId);
    } catch (err) {
      // already released
    }
    if (dragStyle && dragStyle.parentNode) {
      dragStyle.parentNode.removeChild(dragStyle);
    }
    update();
  }

  function startDrag(h, e) {
    if (e.button !== 0) {
      return;
    }
    var el = h.find();
    var range = layoutRange(h.key);
    if (!el || !range) {
      return;
    }
    e.preventDefault();
    var rect = el.getBoundingClientRect();
    var startSize = settings[h.key] || Math.round(h.axis === 'x' ? rect.width : rect.height);
    var startPos = h.axis === 'x' ? e.clientX : e.clientY;
    dragging = h;
    h.node.classList.add('active');
    try {
      h.node.setPointerCapture(e.pointerId);
    } catch (err) {
      // works without pointer capture too
    }
    // While dragging: matching cursor everywhere, no text selection
    if (!dragStyle) {
      dragStyle = document.createElement('style');
    }
    dragStyle.textContent = '* { cursor: ' + (h.axis === 'x' ? 'col-resize' : 'row-resize') +
      ' !important; user-select: none !important; }';
    (document.head || document.documentElement).appendChild(dragStyle);

    h.onMove = function (ev) {
      if (dragging !== h) {
        return;
      }
      var pos = h.axis === 'x' ? ev.clientX : ev.clientY;
      settings[h.key] = clamp(Math.round(startSize + pos - startPos), range.min, range.max);
      applyPage();
      positionHandles();
      syncUi();
    };
  }

  function buildHandles() {
    if (!SHOW_HANDLES || handleHost || !document.body) {
      return;
    }
    var probe = document.createElement('div');
    if (!probe.attachShadow) {
      return;
    }
    handleHost = document.createElement('div');
    handleHost.id = 'sogo-darkmode-handles';
    handleHost.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147482999;pointer-events:none;';
    var root = handleHost.attachShadow({ mode: 'open' });
    root.innerHTML = '<style>' + HANDLE_CSS + '</style>';
    HANDLES.forEach(function (h) {
      var node = document.createElement('div');
      node.className = 'h ' + h.axis;
      node.title = t('dragTitle');
      node.addEventListener('pointerdown', function (e) {
        startDrag(h, e);
      });
      node.addEventListener('pointermove', function (e) {
        if (h.onMove) {
          h.onMove(e);
        }
      });
      node.addEventListener('pointerup', endDrag);
      node.addEventListener('pointercancel', endDrag);
      node.addEventListener('lostpointercapture', endDrag);
      node.addEventListener('dblclick', function () {
        settings[h.key] = 0;
        update();
      });
      h.node = node;
      root.appendChild(node);
    });
    document.body.appendChild(handleHost);
    positionHandles();

    window.addEventListener('resize', positionHandles);
    document.addEventListener('transitionend', positionHandles, true);
    // Safety net for animations/re-renders that fire no event
    window.setInterval(function () {
      if (!dragging) {
        positionHandles();
      }
    }, 700);
  }

  function onKey(e) {
    if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyD') {
      e.preventDefault();
      e.stopPropagation();
      setMode(settings.mode === 'light' ? settings.lastDarkMode : 'light');
    } else if (e.key === 'Escape' && isPanelOpen()) {
      togglePanel(false);
    }
  }

  // ---------- Start ----------
  markApp();
  applyPage();
  document.addEventListener('keydown', onKey, true);

  // "Auto": follow changes of the system setting immediately
  if (darkQuery) {
    var onScheme = function () {
      applyPage();
      applyAllEditors();
      syncUi();
    };
    if (darkQuery.addEventListener) {
      darkQuery.addEventListener('change', onScheme);
    } else if (darkQuery.addListener) {
      darkQuery.addListener(onScheme);
    }
  }

  // Pick up changes made in other tabs
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) {
      settings = load();
      applyPage();
      applyAllEditors();
      syncUi();
    }
  });

  function init() {
    hookEditor();
    buildUi();
    buildHandles();
    syncUi();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', hookEditor);
})();
