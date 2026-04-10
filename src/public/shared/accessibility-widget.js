/**
 * accessibility-widget.js — Botón de Accesibilidad DUA
 * Extraído del estándar visual curso-sustentabilidad-landing (React/Vite)
 * IIFE vanilla JS, sin React ni dependencias externas.
 *
 * 8 funciones DUA:
 *   I.  Representación    — tamaño de texto, contraste, fuente dislexia, espaciado
 *   II. Acción/Expresión  — resaltar enlaces, cursor grande, guía de lectura
 *   III.Compromiso        — pausar animaciones
 *
 * Uso: incluir el script en cualquier página HTML, preferentemente antes de </body>
 *   <script src="/shared/accessibility-widget.js" defer></script>
 *
 * La IIFE se auto-inicializa. Persistencia via localStorage ('umce_a11y').
 * Paleta de colores: verde institucional #15803D + naranja accesibilidad #FF9E18
 * Compatible con el resto del sistema UMCE.online (no colisiona con otros scripts).
 *
 * Idempotente: si el elemento #a11y-fab ya existe en el DOM no se inicializa de nuevo
 * (seguro para páginas con hot-reload o carga dinámica).
 */
(function () {
  'use strict';

  // Guardia de doble-inicialización
  if (document.getElementById('a11y-fab')) return;

  var STORAGE_KEY = 'umce_a11y';
  var defaults = {
    fontSize:   0,        // -2 a +4 pasos de 12.5%
    contrast:   'normal', // normal | high | dark
    dyslexia:   false,
    spacing:    false,
    links:      false,
    cursor:     false,
    ruler:      false,
    animations: false,    // true = pausadas
  };

  var state = Object.assign({}, defaults);
  try {
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) state = Object.assign({}, defaults, saved);
  } catch (e) {}

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ── Estilos ─────────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.id = 'a11y-dua-styles';
  style.textContent = [
    /* Tamaño de texto */
    'html.a11y-fs-1  { font-size: 112.5% !important; }',
    'html.a11y-fs-2  { font-size: 125%   !important; }',
    'html.a11y-fs-3  { font-size: 137.5% !important; }',
    'html.a11y-fs-4  { font-size: 150%   !important; }',
    'html.a11y-fs--1 { font-size: 87.5%  !important; }',
    'html.a11y-fs--2 { font-size: 75%    !important; }',

    /* Contraste alto */
    'html.a11y-contrast-high { filter: contrast(1.4) !important; }',
    'html.a11y-contrast-high img, html.a11y-contrast-high video, html.a11y-contrast-high svg { filter: contrast(0.75) !important; }',

    /* Modo oscuro invertido */
    'html.a11y-contrast-dark { filter: invert(1) hue-rotate(180deg) !important; }',
    'html.a11y-contrast-dark img, html.a11y-contrast-dark video, html.a11y-contrast-dark svg,',
    'html.a11y-contrast-dark [style*="background-image"] { filter: invert(1) hue-rotate(180deg) !important; }',

    /* Fuente OpenDyslexic */
    "@font-face { font-family: 'OpenDyslexic'; src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/woff/OpenDyslexic-Regular.woff') format('woff'); font-weight: normal; font-display: swap; }",
    "@font-face { font-family: 'OpenDyslexic'; src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/woff/OpenDyslexic-Bold.woff')    format('woff'); font-weight: bold;   font-display: swap; }",
    "html.a11y-dyslexia, html.a11y-dyslexia * { font-family: 'OpenDyslexic', sans-serif !important; }",

    /* Espaciado amplio */
    'html.a11y-spacing p, html.a11y-spacing li, html.a11y-spacing td, html.a11y-spacing th,',
    'html.a11y-spacing span, html.a11y-spacing div { line-height: 2 !important; letter-spacing: 0.05em !important; word-spacing: 0.15em !important; }',

    /* Resaltar enlaces */
    'html.a11y-links a { text-decoration: underline !important; text-decoration-thickness: 2px !important; text-underline-offset: 3px !important; color: #0033A1 !important; }',
    "html.a11y-links a:not([class*='bg-']):not([class*='btn']) { outline: 3px solid #0047CC !important; outline-offset: 3px !important; border-radius: 2px !important; box-shadow: 0 0 0 3px #0047CC !important; }",

    /* Cursor grande */
    "html.a11y-cursor, html.a11y-cursor * { cursor: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M5 2l20 14-10 2-4 10z' fill='%23000' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E\") 4 2, auto !important; }",

    /* Guía de lectura (ruler) */
    '#a11y-ruler { position: fixed !important; left: 0 !important; right: 0 !important; top: 0 !important; height: 100vh !important; pointer-events: none !important; z-index: 99998 !important; display: none !important; }',
    '#a11y-ruler.active { display: block !important; }',
    '#a11y-ruler .ruler-band { position: absolute !important; left: 0 !important; right: 0 !important; height: 3em !important; background: rgba(255,158,24,0.15) !important; border-top: 2px solid rgba(255,158,24,0.5) !important; border-bottom: 2px solid rgba(255,158,24,0.5) !important; transition: top 0.05s ease-out !important; }',
    '#a11y-ruler .ruler-shade-top, #a11y-ruler .ruler-shade-bottom { position: absolute !important; left: 0 !important; right: 0 !important; background: rgba(0,0,0,0.15) !important; }',
    '#a11y-ruler .ruler-shade-top { top: 0 !important; }',
    '#a11y-ruler .ruler-shade-bottom { bottom: 0 !important; }',

    /* Pausar animaciones */
    'html.a11y-no-animations, html.a11y-no-animations * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }',

    /* FAB */
    '#a11y-fab { position: fixed; bottom: 96px; right: 24px; z-index: 99997; width: 44px; height: 44px; border-radius: 12px; background: #0033A1; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 12px rgba(0,51,161,0.3); transition: transform 0.2s, box-shadow 0.2s; }',
    '#a11y-fab:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(21,128,61,0.45); }',
    '#a11y-fab:focus-visible { outline: 3px solid #0047CC; outline-offset: 3px; }',
    '#a11y-fab svg { width: 26px; height: 26px; pointer-events: none; }',

    /* Panel */
    "#a11y-panel { position: fixed; bottom: 150px; right: 24px; z-index: 99997; width: 320px; max-height: calc(100vh - 120px); overflow-y: auto; background: white; border-radius: 20px; box-shadow: 0 12px 48px rgba(0,0,0,0.18); border: 1px solid #e5e7eb; padding: 20px; display: none; font-family: 'Inter', system-ui, sans-serif; }",
    '#a11y-panel.open { display: block; }',
    '@media (max-width: 400px) { #a11y-panel { right: 8px; left: 8px; width: auto; bottom: 84px; } #a11y-fab { bottom: 16px; right: 16px; } }',

    /* Tipografía interna del panel */
    '#a11y-panel h3 { font-weight: 800; font-size: 16px; color: #111827; margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px; flex: 1; }',
    '#a11y-panel-header { display: flex; align-items: center; gap: 8px; }',
    '#a11y-close { background: #f3f4f6; border: none; cursor: pointer; padding: 6px; border-radius: 8px; color: #6b7280; transition: all 0.15s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }',
    '#a11y-close:hover { background: #e5e7eb; color: #111827; }',
    '#a11y-panel .a11y-subtitle { font-size: 11px; color: #9ca3af; margin-bottom: 16px; }',
    '#a11y-panel .a11y-section { margin-bottom: 14px; }',
    '#a11y-panel .a11y-section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }',
    '#a11y-panel .a11y-section-title svg { width: 14px; height: 14px; opacity: 0.5; }',

    /* Filas de opciones */
    '.a11y-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; }',
    '.a11y-row + .a11y-row { border-top: 1px solid #f3f4f6; }',
    '.a11y-row label { font-size: 13px; color: #374151; cursor: pointer; flex: 1; }',

    /* Toggle switch */
    '.a11y-toggle { all: initial !important; position: relative !important; width: 34px !important; height: 18px !important; min-width: 34px !important; max-width: 34px !important; flex-shrink: 0 !important; display: block !important; cursor: pointer !important; }',
    '.a11y-toggle input { opacity: 0 !important; width: 0 !important; height: 0 !important; position: absolute !important; }',
    '.a11y-toggle .slider { all: initial !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 34px !important; height: 18px !important; background: #d1d5db !important; border-radius: 18px !important; cursor: pointer !important; transition: background 0.2s !important; display: block !important; border: none !important; outline: none !important; }',
    ".a11y-toggle .slider::before { content: '' !important; position: absolute !important; width: 14px !important; height: 14px !important; left: 2px !important; top: 2px !important; background: white !important; border-radius: 50% !important; transition: transform 0.2s !important; box-shadow: 0 1px 2px rgba(0,0,0,0.15) !important; }",
    '.a11y-toggle input:checked + .slider { background: #0033A1 !important; }',
    '.a11y-toggle input:checked + .slider::before { transform: translateX(16px) !important; }',
    '.a11y-toggle input:focus-visible + .slider { outline: 2px solid #0047CC !important; outline-offset: 2px !important; }',

    /* Tamaño de texto buttons */
    '.a11y-fontsize { display: flex; align-items: center; gap: 8px; }',
    '.a11y-fontsize button { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; color: #374151; font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }',
    '.a11y-fontsize button:hover { background: #EFF6FF; border-color: #0033A1; color: #0033A1; }',
    '.a11y-fontsize button:disabled { opacity: 0.3; cursor: not-allowed; }',

    /* Contraste buttons */
    '.a11y-contrast-btns { display: flex; gap: 6px; }',
    '.a11y-contrast-btns button { flex: 1; padding: 6px; border-radius: 8px; border: 2px solid #e5e7eb; background: white; font-size: 11px; font-weight: 600; color: #6b7280; cursor: pointer; transition: all 0.15s; }',
    '.a11y-contrast-btns button:hover { border-color: #0033A1; }',
    '.a11y-contrast-btns button.active { border-color: #0033A1; background: #EFF6FF; color: #0033A1; }',

    /* Reset */
    '.a11y-reset { width: 100%; padding: 8px; border-radius: 10px; border: 1px solid #e5e7eb; background: white; font-size: 12px; font-weight: 600; color: #6b7280; cursor: pointer; transition: all 0.15s; margin-top: 4px; }',
    '.a11y-reset:hover { background: #fef2f2; color: #ef4444; border-color: #fca5a5; }',
  ].join('\n');
  document.head.appendChild(style);

  /* ── FAB ─────────────────────────────────────────────────────────────── */
  var fab = document.createElement('button');
  fab.id = 'a11y-fab';
  fab.setAttribute('aria-label', 'Abrir opciones de accesibilidad');
  fab.setAttribute('title', 'Accesibilidad');
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2"/><path d="M12 7.5v4m0 0l-4 7m4-7l4 7"/><path d="M7 11.5h10"/></svg>';
  document.body.appendChild(fab);

  /* ── Panel ───────────────────────────────────────────────────────────── */
  var panel = document.createElement('div');
  panel.id = 'a11y-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Opciones de accesibilidad DUA');
  panel.innerHTML = [
    '<div id="a11y-panel-header">',
      '<h3>',
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0033A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
          '<circle cx="12" cy="4.5" r="2"/>',
          '<path d="M12 7.5v4m0 0l-4 7m4-7l4 7"/>',
          '<path d="M7 11.5h10"/>',
        '</svg>',
        ' Accesibilidad',
      '</h3>',
      '<button id="a11y-close" aria-label="Cerrar panel de accesibilidad" title="Cerrar">',
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">',
          '<path d="M18 6L6 18M6 6l12 12"/>',
        '</svg>',
      '</button>',
    '</div>',
    '<div class="a11y-subtitle">Dise\u00f1o Universal para el Aprendizaje (DUA)</div>',

    /* I. Representación */
    '<div class="a11y-section">',
      '<div class="a11y-section-title">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
          '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>',
          '<circle cx="12" cy="12" r="3"/>',
        '</svg> I. Representaci\u00f3n',
      '</div>',
      '<div class="a11y-row">',
        '<label>Tama\u00f1o de texto</label>',
        '<div class="a11y-fontsize">',
          '<button id="a11y-fs-dec" aria-label="Reducir texto">A-</button>',
          '<span id="a11y-fs-val">100%</span>',
          '<button id="a11y-fs-inc" aria-label="Aumentar texto">A+</button>',
        '</div>',
      '</div>',
      '<div class="a11y-row">',
        '<label>Contraste</label>',
        '<div class="a11y-contrast-btns">',
          '<button data-contrast="normal" class="active">Normal</button>',
          '<button data-contrast="high">Alto</button>',
          '<button data-contrast="dark">Oscuro</button>',
        '</div>',
      '</div>',
      '<div class="a11y-row">',
        '<label for="a11y-dyslexia">Fuente para dislexia</label>',
        '<label class="a11y-toggle" for="a11y-dyslexia">',
          '<input type="checkbox" id="a11y-dyslexia"><span class="slider"></span>',
        '</label>',
      '</div>',
      '<div class="a11y-row">',
        '<label for="a11y-spacing">Espaciado amplio</label>',
        '<label class="a11y-toggle" for="a11y-spacing">',
          '<input type="checkbox" id="a11y-spacing"><span class="slider"></span>',
        '</label>',
      '</div>',
    '</div>',

    /* II. Acción y Expresión */
    '<div class="a11y-section">',
      '<div class="a11y-section-title">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
          '<path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>',
        '</svg> II. Acci\u00f3n y Expresi\u00f3n',
      '</div>',
      '<div class="a11y-row">',
        '<label for="a11y-links">Resaltar enlaces</label>',
        '<label class="a11y-toggle" for="a11y-links">',
          '<input type="checkbox" id="a11y-links"><span class="slider"></span>',
        '</label>',
      '</div>',
      '<div class="a11y-row">',
        '<label for="a11y-cursor">Cursor grande</label>',
        '<label class="a11y-toggle" for="a11y-cursor">',
          '<input type="checkbox" id="a11y-cursor"><span class="slider"></span>',
        '</label>',
      '</div>',
      '<div class="a11y-row">',
        '<label for="a11y-ruler-toggle">Gu\u00eda de lectura</label>',
        '<label class="a11y-toggle" for="a11y-ruler-toggle">',
          '<input type="checkbox" id="a11y-ruler-toggle"><span class="slider"></span>',
        '</label>',
      '</div>',
    '</div>',

    /* III. Compromiso */
    '<div class="a11y-section">',
      '<div class="a11y-section-title">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
          '<path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
        '</svg> III. Compromiso',
      '</div>',
      '<div class="a11y-row">',
        '<label for="a11y-animations">Pausar animaciones</label>',
        '<label class="a11y-toggle" for="a11y-animations">',
          '<input type="checkbox" id="a11y-animations"><span class="slider"></span>',
        '</label>',
      '</div>',
    '</div>',

    '<button class="a11y-reset" id="a11y-reset">Restablecer todo</button>',
  ].join('');
  document.body.appendChild(panel);

  /* ── Guía de lectura (ruler) ─────────────────────────────────────────── */
  var ruler = document.createElement('div');
  ruler.id = 'a11y-ruler';
  ruler.innerHTML = '<div class="ruler-shade-top"></div><div class="ruler-band"></div><div class="ruler-shade-bottom"></div>';
  document.body.appendChild(ruler);

  /* ── Lógica de panel ─────────────────────────────────────────────────── */
  var panelOpen = false;

  fab.addEventListener('click', function () {
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);
    fab.setAttribute('aria-expanded', String(panelOpen));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panelOpen) {
      panelOpen = false;
      panel.classList.remove('open');
      fab.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (panelOpen && !panel.contains(e.target) && e.target !== fab) {
      panelOpen = false;
      panel.classList.remove('open');
    }
  });

  document.getElementById('a11y-close').addEventListener('click', function () {
    panelOpen = false;
    panel.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
  });

  /* ── Aplicar estado ──────────────────────────────────────────────────── */
  var html = document.documentElement;

  function applyAll() {
    /* Tamaño de texto */
    for (var i = -2; i <= 4; i++) html.classList.remove('a11y-fs-' + i);
    if (state.fontSize !== 0) html.classList.add('a11y-fs-' + state.fontSize);
    var pct = 100 + state.fontSize * 12.5;
    document.getElementById('a11y-fs-val').textContent = pct + '%';
    document.getElementById('a11y-fs-dec').disabled = state.fontSize <= -2;
    document.getElementById('a11y-fs-inc').disabled = state.fontSize >= 4;

    /* Contraste */
    html.classList.remove('a11y-contrast-high', 'a11y-contrast-dark');
    if (state.contrast !== 'normal') html.classList.add('a11y-contrast-' + state.contrast);
    panel.querySelectorAll('[data-contrast]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-contrast') === state.contrast);
    });

    /* Toggles booleanos */
    html.classList.toggle('a11y-dyslexia',      state.dyslexia);
    html.classList.toggle('a11y-spacing',       state.spacing);
    html.classList.toggle('a11y-links',         state.links);
    html.classList.toggle('a11y-cursor',        state.cursor);
    html.classList.toggle('a11y-no-animations', state.animations);

    document.getElementById('a11y-dyslexia').checked      = state.dyslexia;
    document.getElementById('a11y-spacing').checked       = state.spacing;
    document.getElementById('a11y-links').checked         = state.links;
    document.getElementById('a11y-cursor').checked        = state.cursor;
    document.getElementById('a11y-ruler-toggle').checked  = state.ruler;
    document.getElementById('a11y-animations').checked    = state.animations;

    ruler.classList.toggle('active', state.ruler);
    save();
  }

  /* ── Event listeners de controles ───────────────────────────────────── */
  document.getElementById('a11y-fs-inc').addEventListener('click', function () {
    if (state.fontSize < 4) { state.fontSize++; applyAll(); }
  });
  document.getElementById('a11y-fs-dec').addEventListener('click', function () {
    if (state.fontSize > -2) { state.fontSize--; applyAll(); }
  });

  panel.querySelectorAll('[data-contrast]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.contrast = btn.getAttribute('data-contrast');
      applyAll();
    });
  });

  ['dyslexia', 'spacing', 'links', 'cursor', 'animations'].forEach(function (key) {
    document.getElementById('a11y-' + key).addEventListener('change', function (e) {
      state[key] = e.target.checked;
      applyAll();
    });
  });

  document.getElementById('a11y-ruler-toggle').addEventListener('change', function (e) {
    state.ruler = e.target.checked;
    applyAll();
  });

  /* Guía de lectura — seguimiento del mouse */
  document.addEventListener('mousemove', function (e) {
    if (!state.ruler) return;
    var band       = ruler.querySelector('.ruler-band');
    var shadeTop   = ruler.querySelector('.ruler-shade-top');
    var shadeBot   = ruler.querySelector('.ruler-shade-bottom');
    var bandH      = band.offsetHeight;
    var top        = Math.max(0, e.clientY - bandH / 2);
    band.style.top       = top + 'px';
    shadeTop.style.height = top + 'px';
    shadeBot.style.top    = (top + bandH) + 'px';
    shadeBot.style.height = Math.max(0, window.innerHeight - top - bandH) + 'px';
  });

  document.getElementById('a11y-reset').addEventListener('click', function () {
    state = Object.assign({}, defaults);
    applyAll();
  });

  /* Aplicar preferencias guardadas al cargar */
  applyAll();

})();
