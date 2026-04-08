/**
 * watercolor-canvas.js — Fondo acuarela animado con p5.js
 * Extraído del estándar visual curso-sustentabilidad-landing (React/Vite)
 * Convertido a vanilla JS standalone, sin React ni hooks.
 *
 * Paleta por defecto: Pantone Botanical (verdes profundos, teales, amarillos vegetales)
 *
 * Uso:
 *   <div id="mi-canvas" style="position:relative; width:100%; height:400px;"></div>
 *   <script src="/shared/watercolor-canvas.js"></script>
 *   <script>
 *     createCourseCanvas('mi-canvas');
 *     // o con paleta y opciones personalizadas:
 *     createCourseCanvas('mi-canvas', myPalette, { fadeBottom: true, bgColor: [234,242,228] });
 *   </script>
 *
 * Requiere p5.js en la página:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>
 *
 * NOTA: NO usa curveVertex ni bezierVertex (crashean silenciosamente en p5).
 * Solo ellipse, line, rect, vertex.
 */

/**
 * @param {string} containerId - ID del elemento DOM contenedor
 * @param {Array<number[]>|null} palette - Array de colores RGB [[r,g,b], ...]. Null = paleta Botanical.
 * @param {Object} options
 * @param {boolean} [options.fadeBottom=true] - Degradado hacia abajo que suaviza el canvas
 * @param {number[]} [options.bgColor=[234,242,228]] - Color de fondo RGB
 * @param {string} [options.fadeColor='#f7faf5'] - Color de destino del degradado
 */
function createCourseCanvas(containerId, palette, options) {
  // Paleta Pantone Botanical — verdes profundos, teales, amarillos vegetales
  var BOTANICAL_PALETTE = [
    [0,   95,  77 ],  // 2465 C — verde bosque oscuro
    [0,   122, 82 ],  // 7713 C — verde esmeralda
    [196, 214, 0  ],  // 397 C  — verde lima
    [85,  119, 47 ],  // 7496 C — verde hoja
    [157, 173, 0  ],  // 583 C  — verde oliva brillante
    [68,  105, 61 ],  // 7743 C — verde musgo
    [0,   130, 112],  // 339 C  — teal
    [0,   104, 87 ],  // 3539 C — teal oscuro
  ];

  var opts = Object.assign({
    fadeBottom: true,
    bgColor: [234, 242, 228],
    fadeColor: '#f7faf5'
  }, options || {});

  var PAL = (palette && palette.length > 0) ? palette : BOTANICAL_PALETTE;
  var BG  = opts.bgColor;

  var container = document.getElementById(containerId);
  if (!container) {
    console.warn('[watercolor-canvas] No se encontró el elemento #' + containerId);
    return null;
  }

  // Asegurar posicionamiento relativo para que el canvas quede dentro
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  // Wrapper interno donde monta p5 (ocupa todo el contenedor)
  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;overflow:hidden;';
  container.insertBefore(wrapper, container.firstChild);

  // Degradado inferior opcional
  if (opts.fadeBottom) {
    var fade = document.createElement('div');
    fade.style.cssText = [
      'position:absolute',
      'bottom:0',
      'left:0',
      'right:0',
      'height:33%',
      'pointer-events:none',
      'z-index:1',
      'background:linear-gradient(to bottom, transparent, ' + opts.fadeColor + ')'
    ].join(';');
    container.appendChild(fade);
  }

  // Instancia p5 en modo instancia (sin contaminar globals)
  var sketch = function(p) {
    var blobs  = [];
    var leaves = [];

    p.setup = function() {
      p.createCanvas(wrapper.offsetWidth || 800, wrapper.offsetHeight || 600);

      // 20 blobs acuarela de fondo
      for (var i = 0; i < 20; i++) {
        blobs.push({
          x:    p.random(p.width),
          y:    p.random(p.height),
          col:  PAL[Math.floor(p.random(PAL.length))],
          sz:   p.random(100, 350),
          seed: p.random(10000)
        });
      }

      // 30 hojas flotantes animadas
      for (var j = 0; j < 30; j++) {
        leaves.push({
          x:  p.random(p.width),
          y:  p.random(p.height),
          sz: p.random(8, 18),
          col: PAL[Math.floor(p.random(PAL.length))],
          a:  p.random(p.TWO_PI),
          sp: p.random(-0.015, 0.015),
          vx: p.random(0.2, 0.8),
          vy: p.random(-0.2, 0.2),
          sd: p.random(10000),
          al: p.random(140, 240)
        });
      }
    };

    p.draw = function() {
      var t = p.frameCount;
      p.background(BG[0], BG[1], BG[2]);
      p.noStroke();

      // --- BLOBS: manchas acuarela muy tenues ---
      for (var bi = 0; bi < blobs.length; bi++) {
        var bl = blobs[bi];

        // Halo exterior difuso
        p.fill(bl.col[0], bl.col[1], bl.col[2], 3);
        p.ellipse(bl.x, bl.y, bl.sz * 3, bl.sz * 3);

        // 8 capas superpuestas con movimiento orgánico
        for (var l = 0; l < 8; l++) {
          var al  = 2 + l * 0.8;
          var n   = p.noise(bl.seed + l * 0.2, t * 0.004);
          var ox  = (n - 0.5) * bl.sz * 0.3;
          var oy  = (p.noise(bl.seed + 100 + l * 0.2, t * 0.004) - 0.5) * bl.sz * 0.3;
          var r   = bl.sz * (0.6 + n * 0.5);
          p.fill(bl.col[0], bl.col[1], bl.col[2], al);
          p.ellipse(bl.x + ox, bl.y + oy, r, r * (0.8 + p.noise(bl.seed + l) * 0.4));
        }

        // Núcleo central sutil
        p.fill(bl.col[0], bl.col[1], bl.col[2], 10);
        p.ellipse(bl.x, bl.y, bl.sz * 0.3, bl.sz * 0.3);
      }

      // --- HOJAS: ellipses rotadas con brisa y reacción al mouse ---
      for (var li = 0; li < leaves.length; li++) {
        var lf = leaves[li];

        // Brisa en oleada que cruza de izquierda a derecha
        var breezePhase    = (lf.x / p.width) * 3 + t * 0.006;
        var breezeStrength = (p.sin(breezePhase) + 1) * 0.3; // 0 a 0.6
        var wobble = (p.noise(lf.sd, t * 0.004) - 0.5) * 0.8 + breezeStrength;
        var pushX = 0;
        var pushY = 0;

        // Repulsión del cursor — como una mano que las aparta
        var dx   = lf.x - p.mouseX;
        var dy   = lf.y - p.mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var radius = 120;
        if (dist < radius && dist > 0) {
          var force = (1 - dist / radius) * 4;
          pushX = (dx / dist) * force;
          pushY = (dy / dist) * force;
        }

        lf.x += lf.vx * 0.4 + wobble + pushX;
        lf.y += lf.vy * 0.4 + p.sin(t * 0.008 + lf.sd) * 0.3 + pushY;
        lf.a += lf.sp * 0.5 + wobble * 0.008 + pushX * 0.05;

        // Wrap-around de bordes
        if (lf.x > p.width  + 30) { lf.x = -30; lf.y = p.random(p.height); }
        if (lf.y > p.height + 30)   lf.y = -30;
        if (lf.y < -30)             lf.y = p.height + 30;

        p.push();
        p.translate(lf.x, lf.y);
        p.rotate(lf.a);

        // Cuerpo de la hoja (ellipse rotada — NO curveVertex)
        p.fill(lf.col[0], lf.col[1], lf.col[2], lf.al);
        p.noStroke();
        p.ellipse(0, 0, lf.sz * 0.5, lf.sz * 1.4);

        // Nervio central con line (NO bezierVertex)
        p.stroke(lf.col[0] * 0.6, lf.col[1] * 0.6, lf.col[2] * 0.6, lf.al * 0.4);
        p.strokeWeight(0.5);
        p.line(0, -lf.sz * 0.6, 0, lf.sz * 0.6);
        p.noStroke();

        p.pop();
      }

      // --- POLVILLO: partículas doradas flotando con Perlin noise ---
      for (var pi = 0; pi < 80; pi++) {
        var px      = (p.noise(pi * 7.7, t * 0.003) * p.width  * 1.3) - p.width  * 0.15;
        var py      = (p.noise(pi * 3.3 + 500, t * 0.003) * p.height * 1.3) - p.height * 0.15;
        var flicker = p.noise(pi * 11, t * 0.015);
        var pal     = flicker * 180 + 40;
        var psz     = 2 + flicker * 3;
        p.fill(255, 255, 220, pal);
        p.ellipse(px, py, psz, psz);
      }
    };

    p.windowResized = function() {
      p.resizeCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
    };
  };

  var p5Instance = new p5(sketch, wrapper); // eslint-disable-line no-undef

  // Devuelve instancia para que el caller pueda hacer .remove() si necesita destruir
  return p5Instance;
}
