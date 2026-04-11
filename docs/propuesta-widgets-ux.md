# Propuesta: Rediseño de Widgets Flotantes — UMCE.online

**Fecha:** 07 de abril de 2026  
**Contexto:** Diagnóstico y propuesta de rediseño de los 3 botones flotantes (accesibilidad, chat, audio narrator) del sitio UMCE.online.  
**Stack:** Vanilla JS + Tailwind CDN (sin dependencias externas nuevas)

---

## A. Diagnóstico actual

### Qué hay hoy

| Widget | Archivo | Posición fija | z-index |
|--------|---------|---------------|---------|
| Chat FAB (burbuja azul) | `shared/chatbot.html` | `bottom: 1.5rem; right: 1.5rem` | 9998 |
| Accesibilidad DUA (hombrecito) | `accesibilidad-dua.js` | `bottom: 92px; right: 24px` | 99997 |
| Audio Narrator (play azul) | `shared/audio-narrator.js` | `bottom: 9.5rem; right: 1.5rem` | 9996 |

En la práctica, la columna derecha inferior queda así (de abajo hacia arriba):
1. Chat FAB — `bottom: 24px` (el más bajo)
2. Audio Narrator — `bottom: ~152px`
3. Accesibilidad — `bottom: 92px` (entre ambos, encima del chat)

### Qué falla y por qué

**1. Tres FABs en el mismo rincón**  
La regla cardinal de UX para FABs es: máximo uno por pantalla. Google Material Design y las guías de Material 3 Expressive (I/O 2025) son explícitas: usar más de un FAB en la misma esquina fragmenta el foco del usuario, crea conflicto visual y produce lo que la literatura llama "FAB fatigue" — el usuario ignora todos porque no sabe cuál tocar. El audio narrator aparece además solo en páginas con `data-src`, lo que crea inconsistencia: en algunas páginas hay 2 botones, en otras 3.

**2. El ícono de accesibilidad no comunica**  
El símbolo universal de la silla de ruedas (ISA) es reconocido mayormente como "discapacidad física" y no como "ajustes de lectura / DUA". En el contexto de UMCE.online, donde los ajustes cubren tamaño de fuente, dislexia, contraste y regla de lectura, el ícono no representa la función. El proyecto Accessible Icon (accessibleicon.org) lleva años documentando que el símbolo tradicional no muestra un usuario activo. La tendencia 2025 es reemplazarlo por un ícono de "ajustes visuales" o un símbolo de persona en movimiento con etiqueta de texto visible.

**3. Overlays de accesibilidad: contexto critico importante**  
La investigación 2025 es contundente: los widgets overlay de accesibilidad de terceros (AccessiBe, UserWay) son objeto de más de 800 demandas legales, una multa FTC de $1 millón a AccessiBe (abril 2025), y una declaración conjunta de la European Disability Forum + IAAP que los califica de "no aceptables como sustituto de arreglar el código fuente". Más de 600 profesionales de accesibilidad firmaron esa postura. La clave: un overlay JS no puede modificar el HTML de base. La solución propia de UMCE.online (accesibilidad-dua.js) es correcta en su enfoque — es una capa de preferencias del usuario, no una promesa de compliance. Eso está bien. El problema es solo visual/UX, no legal ni técnico.

**4. El chat ya tiene página dedicada**  
`/virtualizacion/asistente` existe como página completa para el chat. El FAB flotante es redundante en todas las páginas menos en aquellas donde no hay otra forma de acceder. Se puede reducir su presencia sin eliminarlo.

**5. El audio narrator es contextual pero parece permanente**  
El widget solo aparece cuando una página tiene `data-src`. Pero su diseño (botón circular fijo, siempre visible durante 4 segundos) no lo diferencia visualmente de un FAB permanente. El usuario no entiende que es opcional ni que desaparecerá si pausa.

---

## B. Opciones de diseño

### Opción 1: FAB unificado tipo "Speed Dial / Menú radial"

Un solo botón flotante que al hacer clic despliega los 3 sub-acciones en abanico (arriba o en diagonal). Patrón formalizado por Material 3 Expressive en I/O 2025 como "FAB Menu".

**Implementación:** Un botón principal (ícono de "herramientas" o "ayuda" genérico) que al clic muestra 3 mini-botones etiquetados: Accesibilidad, Asistente, Escuchar.

**Ventajas:**
- Un solo FAB visible en todo momento (cumple la regla de 1 FAB por pantalla)
- Soluciona la inconsistencia: el audio narrator puede mostrarse como opción deshabilitada/grisada cuando no hay audio disponible en la página
- Patrón reconocido — usuarios de apps móviles lo conocen bien

**Desventajas:**
- Requiere una interacción extra para llegar a cualquier función (2 taps en lugar de 1)
- El chat puede perder visibilidad — es la función más usada y pasaría a estar "escondida"
- Contexto institucional universitario: los usuarios son docentes/estudiantes que no son necesariamente power users de apps móviles; el patrón speed dial puede no ser intuitivo para ellos
- Si el audio no existe en la página, la opción "Escuchar" genera confusión

**Viabilidad técnica:** Alta. Vanilla JS + CSS puro. ~80 líneas de código nuevo.

---

### Opción 2: Barra lateral discreta tipo "sidebar pills"

En lugar de FABs, una columna vertical delgada anclada al borde derecho de la pantalla, con 3 "pastillas" (pill buttons) apiladas verticalmente. Cada pastilla muestra solo un ícono en reposo y se expande horizontalmente al hacer hover/focus para mostrar la etiqueta.

**Implementación:** `position: fixed; right: 0; top: 50%`. Las pastillas tienen `border-radius` en el lado izquierdo únicamente, creando efecto de "pestaña" lateral. Al hover, se deslizan hacia la izquierda revelando la etiqueta.

**Ventajas:**
- No ocupa el rincón inferior (no choca con footer, CTAs, ni el nav app en mobile)
- Los 3 widgets siempre visibles pero discretos
- La etiqueta visible en hover hace muy claro para qué sirve cada una
- Patrón reconocido en sitios institucionales y de software (Notion, Linear usan variantes laterales)

**Desventajas:**
- En mobile con viewport estrecho, las pestañas laterales quedan muy pequeñas o tapan contenido
- Si se posiciona a `top: 50%`, puede estar en el medio del contenido cuando el usuario hace scroll
- Requiere lógica para ocultar la pastilla de audio cuando no hay narración disponible en la página

**Viabilidad técnica:** Alta. Vanilla JS + CSS. ~60 líneas.

---

### Opción 3: Integrar todo en nav y footer, eliminar flotantes

Mover los 3 widgets a lugares fijos no-flotantes:
- **Chat:** Solo mantener el enlace a `/virtualizacion/asistente` en el nav (ya existe). Eliminar el FAB excepto en mobile donde no hay nav visible.
- **Accesibilidad:** Añadir un botón de ajustes en el footer y en el menú mobile. El panel DUA se abre desde ahí.
- **Audio:** Eliminar el botón flotante y reemplazar por un inline player visible al inicio del contenido de páginas que lo tienen.

**Ventajas:**
- Cero FABs = cero "fatigue"
- Accesibilidad en el footer es un patrón emergente en 2025 (WCAG 2.2 recomienda que los mecanismos de ayuda sean consistentes y fáciles de encontrar, no necesariamente flotantes)
- El audio inline player da más contexto — el usuario sabe de qué trata antes de reproducir
- Menos JavaScript flotante = mejor rendimiento en mobile

**Desventajas:**
- El botón de accesibilidad en el footer tiene muy baja tasa de descubrimiento — los usuarios que más necesitan ajustes de fuente/contraste son los que menos van a scrollear hasta el footer
- El chat pierde mucho alcance — estudios de live chat muestran que la visibilidad persistente aumenta el uso en 30-50%
- El audio inline requiere modificar cada página HTML individualmente (rompe el sistema de partial loading actual)

**Viabilidad técnica:** Media. Requiere cambios en nav.html, footer.html y todas las páginas con audio.

---

### Opción 4: Un FAB + accesibilidad reposicionada (híbrida minimalista)

Esta opción emerge de combinar hallazgos de las investigaciones:

- **Chat FAB:** Mantenerlo como el único FAB flotante en la esquina inferior derecha. Es la función más demandada y más justifica el patrón FAB según UX Planet. Agrega etiqueta de texto visible "Asistente" en desktop (no solo ícono).
- **Accesibilidad:** Moverla a la esquina inferior **izquierda** — separación física que elimina el conflicto visual. Cambia el ícono a algo más descriptivo. Sigue siendo flotante pero no compite con el chat.
- **Audio Narrator:** Mover de flotante a un **inline player minimalista** que aparece dentro del hero o al inicio del contenido cuando la página tiene audio. No flota — forma parte del layout.

---

## C. Recomendación

### Opción recomendada: Opción 4 — Híbrida minimalista

**Justificación:**

La investigación UX 2025 muestra que el patrón "un solo FAB" es la regla, no la sugerencia. Pero también muestra que en contextos educativos, el chat es el candidato más legítimo para ser ese único FAB (WCAG 2.2 "Consistent Help", alta frecuencia de uso). Matar el FAB del chat sería un error.

La accesibilidad DUA, por otro lado, es una función que el usuario activa **una vez** y la preferencia se guarda. No necesita estar en la esquina más visible. Reposicionarla a la izquierda la hace discreta pero presente, elimina el conflicto de 3 botones en la misma esquina, y mantiene la función disponible.

El audio narrator no merece ser un FAB. La evidencia muestra que audio inline con control explícito del usuario es mejor UX en educación (el usuario decide antes de reproducir). Un player inline pequeño en las páginas con narración es más contextual y menos invasivo.

Esta opción no requiere reescribir nada desde cero — son modificaciones quirúrgicas a los 3 archivos existentes.

---

### Ícono de accesibilidad: qué usar en lugar del hombrecito

El ISA (silla de ruedas / "hombrecito") no comunica "ajustes de lectura y visualización". Alternativas recomendadas en 2025:

| Opción | Descripción | Recomendación |
|--------|-------------|---------------|
| `Aa` / sliders icon | Ícono de texto con flechas de tamaño | **Mejor para el contexto de UMCE.online** — comunica directamente "ajustes de texto/lectura" |
| Eye + settings | Ojo combinado con engranaje | Buena opción — comunica "ajustes visuales" |
| Universal access (Apple style) | Persona con brazos extendidos en círculo | Más reconocible que ISA pero aún ambiguo |
| Accessible Icon Project | Persona en movimiento | Más inclusivo, pero sigue siendo "discapacidad" no "preferencias de lectura" |

**Recomendación concreta:** Usar el ícono de sliders/adjustment (líneas horizontales con círculos deslizantes) + etiqueta "Accesibilidad" visible. Este ícono es universalmente reconocido como "ajustes" y con la etiqueta no hay ambigüedad. El botón en la esquina inferior izquierda lo diferencia del chat visualmente.

---

### Cómo manejar el audio narrator sin que moleste

1. **Eliminar el botón flotante** — reemplazarlo por un player inline horizontal minimalista que aparece dentro del `<header>` o `<section>` de la página cuando el `data-src` está presente.
2. **El player no flota** — es parte del layout de la página, visible sin scroll, a la altura del título.
3. **Diseño discreto:** ancho completo del container, altura 48px, fondo translúcido, con ícono de play + título del audio + barra de progreso. No autoplay (WCAG 1.4.2).
4. **En páginas sin audio:** el player simplemente no se renderiza. No hay botón grisado ni ausencia que note el usuario.

---

### Cómo manejar el chat

El chat FAB flotante ya tiene la lógica correcta: inline en `/ayuda` y `/virtualizacion/asistente`, flotante en el resto. La única mejora recomendada:

1. **Agregar etiqueta de texto en desktop** — "Asistente" visible junto al ícono (desaparece en mobile). Esto elimina la duda de "¿para qué sirve este botón azul?".
2. **Reposicionar** a `bottom: 1.5rem; right: 1.5rem` sin cambios — es el único FAB que queda en esa esquina, el espacio le pertenece completamente.
3. **En mobile:** sin cambios. La lógica actual ya maneja el panel en full-screen en mobile.

---

## D. Especificación técnica — Opción recomendada

### D.1 Cambios al Chat FAB (`shared/chatbot.html`)

**Único cambio:** Agregar etiqueta de texto en modo desktop.

```html
<!-- En el #chat-fab button, agregar span de etiqueta (visible en desktop, hidden en mobile) -->
<button id="chat-fab" aria-label="Abrir asistente virtual">
  <svg id="chat-fab-open" ...>...</svg>
  <svg id="chat-fab-close" ...>...</svg>
  <!-- NUEVO: etiqueta visible en desktop -->
  <span id="chat-fab-label" aria-hidden="true">Asistente</span>
</button>
```

```css
/* Estilo del label en el FAB — solo desktop */
#umce-chatbot[data-mode="floating"] #chat-fab-label {
  display: none;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: white;
  margin-left: 4px;
}
@media (min-width: 640px) {
  #umce-chatbot[data-mode="floating"] #chat-fab-label { display: inline; }
  /* El FAB se vuelve pill (no círculo) en desktop cuando tiene label */
  #umce-chatbot[data-mode="floating"] #chat-fab {
    width: auto !important;
    padding: 0 18px 0 14px !important;
    border-radius: 28px !important;
  }
}
```

---

### D.2 Rediseño del botón de accesibilidad (`accesibilidad-dua.js`)

**Cambios:**
1. Mover de esquina derecha a **esquina inferior izquierda**
2. Cambiar ícono: de "persona" a "sliders / adjustment"
3. Cambiar forma: de círculo a pill (como el chat FAB rediseñado)
4. Agregar etiqueta de texto visible siempre (no solo en hover)

```css
/* REEMPLAZAR en accesibilidad-dua.js — sección "Widget UI" */
#a11y-fab {
  position: fixed;
  bottom: 24px;
  left: 24px;           /* CAMBIO: de right a left */
  right: auto;          /* CAMBIO */
  z-index: 99997;
  height: 46px;
  width: auto;          /* CAMBIO: pill, no círculo */
  padding: 0 16px 0 12px;  /* CAMBIO */
  border-radius: 23px;  /* CAMBIO: pill */
  background: #0033A1;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(0,51,161,0.35);
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;
}

/* Etiqueta siempre visible */
#a11y-fab-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

/* Panel: ahora abre desde la izquierda */
#a11y-panel {
  position: fixed;
  bottom: 82px;
  left: 24px;    /* CAMBIO: de right a left */
  right: auto;
  /* resto igual */
}

/* En mobile (< 400px): colapsar label, mantener solo ícono */
@media (max-width: 400px) {
  #a11y-fab { padding: 0 12px; width: 46px; }
  #a11y-fab-label { display: none; }
  #a11y-panel { left: 8px; right: 8px; width: auto; }
}
```

**Nuevo SVG ícono (sliders/adjustments):**
```html
<!-- Reemplazar el SVG del hombrecito por este -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="4" y1="6" x2="20" y2="6"/>
  <line x1="4" y1="12" x2="20" y2="12"/>
  <line x1="4" y1="18" x2="20" y2="18"/>
  <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/>
  <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
  <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>
</svg>
<span id="a11y-fab-label">Accesibilidad</span>
```

---

### D.3 Rediseño del Audio Narrator (`shared/audio-narrator.js`)

**Cambio estructural:** De botón flotante fijo a player inline dentro del container que lo invoca.

```html
<!-- En cada página con audio, el div sigue siendo: -->
<div id="audio-narrator" data-src="/audio/pagina.mp3" data-title="Escuchar esta página"></div>
```

```javascript
// Nueva lógica de build en audio-narrator.js
// El container ya NO usa position:fixed — se convierte en inline player

container.style.cssText = [
  'display:flex',
  'align-items:center',
  'gap:12px',
  'background:rgba(0,51,161,0.06)',
  'border:1px solid rgba(0,51,161,0.12)',
  'border-radius:12px',
  'padding:10px 16px',
  'max-width:480px',
  'margin:0 0 24px 0',  // espacio debajo del player
].join(';');

// Estructura interna del player inline:
// [Play/Pause btn] [Barra de progreso + tiempo] [Label]
```

**HTML generado (referencia):**
```html
<div id="audio-narrator" style="display:flex;align-items:center;gap:12px;...">
  <!-- Botón play/pause pequeño -->
  <button aria-label="Escuchar narración" style="width:36px;height:36px;border-radius:50%;background:#0033A1;...">
    <!-- SVG play/pause -->
  </button>
  <!-- Barra de progreso -->
  <div style="flex:1;">
    <div style="font-size:12px;color:#374151;font-weight:600;margin-bottom:4px;">Escuchar esta página</div>
    <div style="height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden;">
      <div id="audio-progress-bar" style="height:100%;width:0%;background:#0033A1;transition:width 0.3s;"></div>
    </div>
  </div>
  <!-- Tiempo -->
  <span style="font-size:11px;color:#9ca3af;white-space:nowrap;" id="audio-time">0:00</span>
</div>
```

---

### D.4 Comportamiento en mobile vs desktop

| Elemento | Desktop (>= 640px) | Mobile (< 640px) |
|----------|-------------------|------------------|
| Chat FAB | Pill con ícono + texto "Asistente", esquina derecha | Círculo solo, esquina derecha |
| Accesibilidad | Pill con ícono + texto "Accesibilidad", esquina izquierda | Círculo solo, esquina izquierda |
| Audio Narrator | Player inline horizontal 480px max | Player inline 100% ancho |
| Panel de accesibilidad | Abre hacia arriba desde esquina izquierda | Full-width desde izquierda |
| Chat panel | 400×580px anclado al FAB | Full screen (comportamiento actual) |

---

### D.5 Lo que se reemplaza y lo que se elimina

| Componente | Estado actual | Estado propuesto |
|-----------|--------------|-----------------|
| `#chat-fab` circular | Permanece, se convierte en pill en desktop | Única FAB en esquina derecha |
| `#a11y-fab` circular, esquina derecha | Se convierte en pill, se mueve a esquina izquierda | Única FAB en esquina izquierda |
| Audio Narrator flotante | `position:fixed` en esquina derecha | `position:static` inline dentro del contenido |
| Ícono hombrecito (ISA) | Ícono universal de accesibilidad | Ícono de sliders con etiqueta "Accesibilidad" |
| 3 FABs apilados | Problema activo | Eliminado |

**Archivos modificados:**
- `/src/public/shared/chatbot.html` — agregar span label + CSS pill en desktop
- `/src/public/accesibilidad-dua.js` — cambiar posición, ícono, forma, panel
- `/src/public/shared/audio-narrator.js` — reescribir build del DOM (inline en lugar de fixed)
- `/src/public/shared/shared.css` — ningún cambio requerido (los estilos FAB están en sus respectivos archivos)

---

## Referencias de investigación

- [Why The Floating Action Button Is Not Always A Good UX Choice](https://aleseverojr.medium.com/why-the-floating-action-button-is-not-always-a-good-ux-choice-bb1abd9a0ac3) — Medium
- [Floating Action Button in UX Design — UX Planet](https://uxplanet.org/floating-action-button-in-ux-design-7dd06e49144e)
- [Discovering Material 3 Expressive — FAB Menu](https://medium.com/@renaud.mathieu/discovering-material-3-expressive-fab-menu-ecfae766a946) — Material 3 I/O 2025
- [A11y Widgets in 2025 — UserWay vs AccessiBe vs EqualWeb](https://accessibility-test.org/blog/compare/a11y-widgets-in-2025-userway-vs-accessibe-vs-equalweb/) — revisión comparativa
- [Your Accessibility Overlay Is a Scam](https://dev.to/cec1_c0d/your-accessibility-overlay-is-a-scam-and-heres-the-proof-5g76) — DEV Community
- [Accessibility Overlay Widgets Attract Lawsuits](https://www.accessibility.works/blog/avoid-accessibility-overlay-tools-toolbar-plugins/) — Accessibility.Works
- [The Accessible Icon Project](https://accessibleicon.org/) — alternativa al ISA
- [E-learning UX do's and don'ts 2025](https://moore-thinking.com/2025/12/15/e-learning-ux-dos-and-donts/) — audio en educación
- [Why is Live Chat Button Placement Important?](https://velaro.com/blog/live-chat-button-placement-why-is-it-important) — chat en educación
- [Accessibility options for FABs — WCAG 2.2](https://danny-payne.medium.com/accessibility-options-for-floating-action-buttons-99bdf8146988) — consistent help criteria
