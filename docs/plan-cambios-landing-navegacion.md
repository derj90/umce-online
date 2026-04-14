# Plan de cambios: landing de virtualizacion y navegacion para Calculadora SCT v3

**Fecha**: 13 de abril de 2026
**Objetivo**: Integrar los 3 modos de la Calculadora SCT v3 en la landing de virtualizacion y en la navegacion entre momentos.
**Documentos fuente**: `propuesta-calculadora-sct-v3-consolidada.md`, `virtualizacion.html`, `virtualizacion-sct.html`

---

## 1. Cambios en virtualizacion.html (landing)

### 1.1. Momento 1 en la grid de 5 momentos (lineas 241-248)

**Texto actual** (linea 243-244):
```html
<h3 class="font-heading font-bold text-base mb-2">Definir cr&eacute;ditos y horas</h3>
<p class="text-sm text-gray-500 mb-4">Se validan los cr&eacute;ditos SCT y la distribuci&oacute;n de horas con criterio t&eacute;cnico, antes de la resoluci&oacute;n exenta.</p>
```

**Texto propuesto**:
```html
<h3 class="font-heading font-bold text-base mb-2">Definir cr&eacute;ditos y horas</h3>
<p class="text-sm text-gray-500 mb-4">Se calculan, verifican o estiman los cr&eacute;ditos SCT y la distribuci&oacute;n de horas con criterio t&eacute;cnico, antes de la resoluci&oacute;n exenta.</p>
```

**Razonamiento**: El verbo "validan" sugiere verificacion pasiva (la v1). Con la v3, el Momento 1 ahora puede *calcular* (Modo A), *verificar a nivel de semestre* (Modo B) o *estimar desde competencias* (Modo C). El cambio es sutil: "calculan, verifican o estiman" refleja las tres posibilidades sin sobrecargar el card.

**Icono**: No cambia. El numero "1" y el color `var(--palette-primary)` se mantienen.

**Link**: El card del Momento 1 actualmente NO es un enlace clickeable (los demas momentos tampoco). No se agrega link aqui porque el card es informativo dentro del flujo visual. El enlace a la herramienta esta en la seccion "Herramientas" debajo.

**Badge "Mas critico"**: Se mantiene. Sigue siendo el momento mas critico.

**Tipo de cambio**: Contenido (solo texto del `<p>`).

---

### 1.2. Card de la Calculadora SCT en seccion "Herramientas" (lineas 322-344)

**Texto actual** (linea 333):
```html
<p class="text-sm text-gray-500 mb-3">Verifica que los cr&eacute;ditos y las horas de tu curso sean coherentes antes de presentar la resoluci&oacute;n exenta a la UGCI.</p>
```

**Texto propuesto**:
```html
<p class="text-sm text-gray-500 mb-3">Calcula, verifica o estima los cr&eacute;ditos SCT de un curso, un semestre completo o un programa nuevo. Tres modos seg&uacute;n tu necesidad.</p>
```

**Texto actual** (linea 337):
```html
<div><strong class="text-gray-600">Produce:</strong> Ficha de validaci&oacute;n SCT para adjuntar al PAC</div>
```

**Texto propuesto**:
```html
<div><strong class="text-gray-600">Produce:</strong> Informe SCT imprimible (resultado PAC + anexo metodol&oacute;gico)</div>
```

**Texto actual** (linea 341):
```html
<span class="text-xs text-gray-400">Wizard interactivo &mdash; 4 pasos</span>
```

**Texto propuesto**:
```html
<span class="text-xs text-gray-400">3 modos &mdash; Curso &middot; Semestre &middot; Programa</span>
```

**Tipo de cambio**: Contenido (tres lineas de texto dentro del mismo card). Estructura HTML no cambia.

---

### 1.3. Bloque "Herramientas que pueden confundirse" (lineas 469-481)

**Texto actual** (linea 474):
```html
<p class="text-sm text-gray-600">Se usa <strong>antes</strong> de diseñar el curso. Responde: &laquo;¿Las horas declaradas en la resolución son coherentes con los créditos?&raquo; Lo usa el coordinador de programa para sustentar la resolución exenta.</p>
```

**Texto propuesto**:
```html
<p class="text-sm text-gray-600">Se usa <strong>antes</strong> de dise&ntilde;ar el curso. Responde: &laquo;&iquest;Cu&aacute;ntos cr&eacute;ditos corresponden a estas horas?&raquo; (Modo A), &laquo;&iquest;La carga total del semestre es sostenible?&raquo; (Modo B) o &laquo;&iquest;Cu&aacute;ntas horas necesita este programa nuevo?&raquo; (Modo C). Lo usa el coordinador y la UGCI.</p>
```

**Tipo de cambio**: Contenido (texto del `<p>`).

---

### 1.4. Momentos 2-5: no necesitan cambios

Los textos de M2, M3, M4 y M5 no mencionan el SCT ni la calculadora directamente. Su redaccion describe funciones autonomas que no se ven afectadas por la v3. Especificamente:

- **M2 "Disenar el PAC"** (lineas 253-260): No cambia. El PAC sigue siendo el documento que aprueba la UGCI.
- **M3 "Disenar el PIAC"** (lineas 265-272): No cambia. El planificador sigue siendo el Momento 3.
- **M4 "Implementar en LMS"** (lineas 277-284): No cambia.
- **M5 "Monitorear y retroalimentar"** (lineas 289-296): No cambia.

**Nota de coherencia**: El Modo B ("Calcular un semestre") y el Modo C ("Estimar desde competencias") producen un "sobre presupuestario" que alimenta M3. Pero esto es una conexion tecnica interna (via localStorage), no un cambio visible en el texto de la landing. El vinculo M1-M3 ya esta descrito en la seccion de aclaracion (lineas 469-481) y se refuerza con el texto propuesto arriba.

---

### 1.5. Stat block "5 momentos" (linea 188)

No cambia. Los 5 momentos siguen siendo 5 momentos. La v3 expande el Momento 1 internamente pero no agrega momentos nuevos.

---

## 2. Navegacion entre momentos

### 2.1. Estado actual

| Componente | Existe | Ubicacion |
|-----------|--------|-----------|
| Menu lateral / sidebar de momentos | NO | No existe en ninguna pagina |
| Breadcrumb | SI | Hero de cada pagina: `Inicio / Virtualizacion / [Herramienta]` |
| Link "vuelta a landing" | SI | Breadcrumb: `<a href="/virtualizacion">Virtualizacion</a>` |
| Link "siguiente momento" | PARCIAL | Solo en `virtualizacion-sct.html`: CTA "Ir al Planificador" (linea 757) y seccion "Que sigue" (linea 866) |
| Link "momento anterior" | NO | El planificador tiene link *hacia atras* a la calculadora (linea 96 de planificador) pero como texto informativo, no como boton de navegacion |

### 2.2. Navegacion actual en virtualizacion-sct.html

La calculadora tiene estos puntos de navegacion:

1. **Breadcrumb** (linea 129-134): `Inicio / Virtualizacion / Calculadora SCT`
2. **Nota en hero** (linea 151): "Si ya tienes los creditos aprobados... usa el Planificador Curricular" (link)
3. **CTA en step 4** (linea 757): Boton "Ir al Planificador" (btn-primary)
4. **Seccion "Siguiente paso: Planificador"** (linea 786): Texto + link al planificador
5. **Seccion "Que sigue"** (lineas 866-888): Grid de 3 cards (M2: Disenar PAC, M3: Planificador, Fundamentos SCT)

### 2.3. Navegacion de la calculadora al planificador con v3

**Sin cambios estructurales necesarios.** El flujo M1->M3 ya esta bien conectado. Lo que la v3 agrega es el *dato* que pasa:

- **Estado actual**: No pasa datos. El link es un `<a href>` simple.
- **Estado v3**: Los Modos B y C producen un "sobre presupuestario" que se almacena en `localStorage` (JSON serializado, segun seccion 8 de la propuesta). El planificador debe leerlo al cargar.

**Cambios necesarios en el CTA** (linea 757-760):

Texto actual:
```html
<a href="/virtualizacion/planificador" class="btn-primary">
  Ir al Planificador
  <svg ...></svg>
</a>
```

Texto propuesto para Modos B y C (cuando hay sobre presupuestario):
```html
<a href="/virtualizacion/planificador" class="btn-primary" id="ctaPlanificador" onclick="saveSobrePresupuestario()">
  Continuar al Planificador
  <svg ...></svg>
</a>
```

Para Modo A (sin sobre presupuestario), el texto se mantiene como "Ir al Planificador" sin `onclick`.

**Tipo de cambio**: Estructura + JS. Se necesita:
1. Una funcion `saveSobrePresupuestario()` en el JS de la calculadora que serialice el triple (H_sinc, H_asinc, H_aut) + metadatos del modo a `localStorage` con key `sct_sobre_presupuestario`.
2. El planificador necesita una funcion `loadSobrePresupuestario()` que lea esa key al inicializar.

**Nota**: Esto es un cambio de JS, no de la landing. Se documenta aqui porque afecta la navegacion.

### 2.4. Sidebar de momentos reutilizable

**No existe y no se recomienda crearlo ahora.** Razones:
- Solo hay 3 herramientas activas (SCT, Planificador, QA). Un sidebar de 5 momentos estaria 2/5 vacio.
- El breadcrumb + los CTAs de "siguiente paso" ya cubren la navegacion.
- Un sidebar complicaria las paginas que no son herramientas (Fundamentos, Rubrica).

**Recomendacion futura**: Cuando existan herramientas para los 5 momentos, considerar un mini-nav horizontal debajo del breadcrumb con los 5 numeros (similar al progress stepper de la calculadora).

---

## 3. Hero de la calculadora (virtualizacion-sct.html)

### 3.1. Estado actual del hero (lineas 126-159)

```
Breadcrumb: Inicio / Virtualizacion / Calculadora SCT
Label: "Momento 1 del flujo -- Antes de la resolucion exenta"
Titulo: "Calculadora SCT"
Descripcion: "Verifica que los creditos y las horas de tu curso sean coherentes,
  siguiendo la Guia de la UGCI. Necesitas una estimacion de las horas semanales
  de tu curso y los creditos declarados (o estimados)."
Tags: [Coordinador programa, UGCI] [Produce: Ficha de validacion SCT]
Nota pie: "Si ya tienes los creditos aprobados... usa el Planificador Curricular"
Box derecha: "27 horas por credito SCT"
```

### 3.2. Hero propuesto para v3

**Archivo**: `virtualizacion-sct.html`, lineas 136-158

**Cambio en label** (linea 138):

Texto actual:
```html
<p class="fade-up text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Momento 1 del flujo &mdash; Antes de la resoluci&oacute;n exenta</p>
```

Texto propuesto:
```html
<p class="fade-up text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Momento 1 del flujo &mdash; Definici&oacute;n de cr&eacute;ditos y horas</p>
```

**Razonamiento**: "Antes de la resolucion exenta" es una ubicacion temporal, no un proposito. Con 3 modos, "Definicion de creditos y horas" describe mejor lo que hace M1.

---

**Cambio en descripcion** (linea 140):

Texto actual:
```html
<p class="fade-up text-white/80 text-lg max-w-2xl">Verifica que los cr&eacute;ditos y las horas de tu curso sean coherentes, siguiendo la Gu&iacute;a de la UGCI. Necesitas una <strong class="text-white">estimaci&oacute;n de las horas semanales de tu curso</strong> y los cr&eacute;ditos declarados (o estimados).</p>
```

Texto propuesto:
```html
<p class="fade-up text-white/80 text-lg max-w-2xl">Calcula los cr&eacute;ditos SCT de un curso, verifica la carga de un semestre completo o estima la estructura crediticia de un programa nuevo. <strong class="text-white">Tres modos seg&uacute;n tu necesidad</strong>, una misma f&oacute;rmula: SCT = ceil(HT / 27).</p>
```

---

**Cambio en tags** (lineas 142-149):

Texto actual del tag "Produce":
```html
Produce: Ficha de validaci&oacute;n SCT para el PAC
```

Texto propuesto:
```html
Produce: Informe SCT imprimible (resultado PAC + anexo metodol&oacute;gico)
```

---

**Cambio en nota pie** (linea 151):

Texto actual:
```html
<p class="fade-up text-white/40 text-xs mt-4">Si ya tienes los cr&eacute;ditos aprobados y necesitas dise&ntilde;ar actividades semana a semana, usa el <a href="/virtualizacion/planificador" class="underline text-white/60 hover:text-white">Planificador Curricular</a>.</p>
```

Texto propuesto (sin cambios significativos, solo ajuste menor):
```html
<p class="fade-up text-white/40 text-xs mt-4">Si ya tienes los cr&eacute;ditos aprobados y necesitas distribuir las horas en actividades concretas, usa el <a href="/virtualizacion/planificador" class="underline text-white/60 hover:text-white">Planificador Curricular (Momento 3)</a>.</p>
```

---

### 3.3. Selector de modo: ubicacion

**Propuesta**: El selector de modo NO va en el hero. Va **debajo del progress bar**, reemplazando la seccion "Antecedentes" actual como primer elemento visible del wizard.

**Razonamiento**:
1. El hero es la presentacion institucional y debe ser limpio.
2. El selector de modo es una decision operativa que el usuario toma al empezar a trabajar, no al llegar a la pagina.
3. El progress stepper (4 pasos) actual del Modo A se preserva como base. Los Modos B y C tendran sus propios steppers (con diferente numero de pasos).

**Estructura propuesta**:

Despues del progress bar (linea 185) y antes de la seccion de antecedentes (linea 189), insertar:

```html
<!-- Selector de modo -->
<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
  <h2 class="font-heading text-xl font-bold text-gray-900 mb-2">&iquest;Qu&eacute; necesitas hacer?</h2>
  <p class="text-sm text-gray-500 mb-5">Elige el modo que corresponda a tu situaci&oacute;n. Puedes cambiar de modo en cualquier momento.</p>
  <div class="grid sm:grid-cols-3 gap-3" id="modeSelector">
    <label class="radio-card selected flex flex-col gap-1 p-4">
      <input type="radio" name="calcMode" value="A" checked class="sr-only">
      <div class="font-heading font-bold text-sm">Modo A &mdash; Un curso</div>
      <div class="text-xs text-gray-500">Verificaci&oacute;n r&aacute;pida de una actividad curricular. 3-5 min.</div>
      <div class="text-xs text-gray-400 mt-1">Ya tengo las horas estimadas</div>
    </label>
    <label class="radio-card flex flex-col gap-1 p-4">
      <input type="radio" name="calcMode" value="B" class="sr-only">
      <div class="font-heading font-bold text-sm">Modo B &mdash; Un semestre</div>
      <div class="text-xs text-gray-500">Carga agregada de varias ACs en un semestre. 10-15 min.</div>
      <div class="text-xs text-gray-400 mt-1">Quiero ver la carga total del estudiante</div>
    </label>
    <label class="radio-card flex flex-col gap-1 p-4">
      <input type="radio" name="calcMode" value="C" class="sr-only">
      <div class="font-heading font-bold text-sm">Modo C &mdash; Programa nuevo</div>
      <div class="text-xs text-gray-500">Estimaci&oacute;n fundamentada desde competencias. 15-25 min.</div>
      <div class="text-xs text-gray-400 mt-1">No tengo datos hist&oacute;ricos</div>
    </label>
  </div>
</div>
```

**Tipo de cambio**: Estructura (nuevo bloque HTML + JS para manejar la seleccion de modo y mostrar/ocultar los wizards correspondientes).

---

### 3.4. Progress stepper (lineas 167-185)

**Estado actual**: 4 pasos (Tu curso, Calculo SCT, Presentacion, Verificacion).

**Propuesta**: El stepper se adapta segun el modo seleccionado:

| Modo | Pasos |
|------|-------|
| A | 1. Tu curso / 2. Calculo SCT / 3. Presentacion / 4. Verificacion (4 pasos, identico a v1) |
| B | 1. Perfil / 2. ACs del semestre / 3. Carga agregada / 4. Informe (4 pasos) |
| C | 1. La AC / 2. Modalidades y nivel / 3. Estimacion / 4. Informe (4 pasos) |

**Tipo de cambio**: JS. Los dots y labels del stepper se actualizan dinamicamente segun el modo. El HTML del stepper no cambia (4 dots, 3 lines).

---

## 4. Componentes compartidos

### 4.1. Inventario de componentes compartidos

Todas las paginas de virtualizacion comparten:

| Componente | Archivo | Cargado por | Actualizar |
|-----------|---------|-------------|------------|
| Nav | `/shared/nav.html` | `shared.js` via `loadPartial()` | NO |
| Footer | `/shared/footer.html` | `shared.js` via `loadPartial()` | NO |
| Chatbot | `/shared/chatbot.html` + `chatbot.js` | `shared.js` auto-placeholder | NO |
| CSS | `/shared/shared.css` | `<link>` en `<head>` | NO |
| JS bootstrap | `/shared/shared.js` | `<script>` al final | NO |
| p5 header | `/shared/generative-header.js` | `<script defer>` | NO |
| Audio narrator | `/shared/audio-narrator.js` | `<script>` | NO |
| Accesibilidad | `/accesibilidad-dua.js` | `shared.js` | NO |

**Ninguno de estos componentes necesita actualizarse para la v3.** Los cambios son todos internos a `virtualizacion.html` y `virtualizacion-sct.html`.

### 4.2. No hay sidebar de momentos reutilizable

No existe un componente compartido que liste los momentos. Cada pagina maneja su propia navegacion de momentos via:
- Breadcrumb en el hero (inline, no componentizado)
- CTAs especificos al final de cada pagina

**Recomendacion**: No crear un sidebar ahora (ver razonamiento en seccion 2.4).

### 4.3. Archivo de datos compartido (nuevo)

La v3 necesita datos de referencia (verbos Bloom, matriz DOK, tablas Laurillard, defaults por area disciplinar). Segun la propuesta (seccion 10): "Datos de referencia como constantes JS o archivos JSON en `/shared/`."

**Archivo nuevo necesario**: `/shared/sct-v3-data.json` (o constantes JS en el script de la calculadora).

**Tipo de cambio**: Archivo nuevo en `/shared/`.

---

## 5. Flujo M1 a M3

### 5.1. El planificador ya existe

**Archivo**: `/src/public/virtualizacion-planificador.html` (existe, funcional).
**URL**: `/virtualizacion/planificador`
**Hero**: "Momento 3 del flujo -- Despues de aprobar el PAC en UGCI"
**Link inverso**: Linea 96: "Si aun no tienes los creditos validados, usa primero la Calculadora SCT" (link).

### 5.2. Enlaces existentes calculadora -> planificador

| Ubicacion en virtualizacion-sct.html | Tipo | Linea |
|--------------------------------------|------|-------|
| Hero nota pie | Texto informativo | 151 |
| Step 4: boton "Ir al Planificador" | CTA (btn-primary) | 757 |
| Contexto SCT: "Siguiente paso" | Texto + link | 786 |
| Seccion "Que sigue": card M3 | Card clickeable | 875 |

### 5.3. Mecanismo de paso de datos (sobre presupuestario)

**Estado actual**: No existe. Los links son `<a href>` simples sin datos.

**Propuesta v3** (seccion 8 de la propuesta consolidada):
- **Medio**: `localStorage` con key `sct_sobre_presupuestario`
- **Formato**: JSON serializado
- **Contenido del sobre**:
  ```json
  {
    "version": "3",
    "modo": "B",
    "timestamp": "2026-04-13T...",
    "acs": [
      {
        "nombre": "Metodologia Cualitativa",
        "sct": 3,
        "ht": 81,
        "h_sinc": 27,
        "h_asinc": 36,
        "h_aut": 18,
        "semanas": 18,
        "perfil_laurillard": "produccion",
        "nivel_cognitivo": 3,
        "tolerancia": 0.10
      }
    ]
  }
  ```
- **Modo A**: NO produce sobre (verificacion rapida, no alimenta M3 automaticamente)
- **Modos B y C**: SI producen sobre. El CTA cambia a "Continuar al Planificador" y ejecuta `saveSobrePresupuestario()` antes de navegar.

### 5.4. CTA en la calculadora para continuar a M3

**Cambio en step 4** (lineas 746-762):

Estado actual: Un solo boton "Ir al Planificador" siempre visible.

Propuesta v3: El CTA se adapta segun el modo:

- **Modo A**: Boton "Ir al Planificador" (como ahora, sin datos)
- **Modos B y C**: Boton "Continuar al Planificador con estos datos" que:
  1. Guarda el sobre presupuestario en `localStorage`
  2. Navega a `/virtualizacion/planificador`

Texto del boton para Modos B/C:
```html
<a href="/virtualizacion/planificador" class="btn-primary" id="ctaPlanificador" onclick="saveSobrePresupuestario()">
  Continuar al Planificador con estos datos
  <svg ...></svg>
</a>
```

**Tipo de cambio**: JS + contenido del boton (dinamico segun modo).

### 5.5. Planificador: carga del sobre presupuestario

**Cambio necesario en virtualizacion-planificador.html**:

Al inicializar, el planificador verifica si hay un sobre presupuestario en `localStorage`:

```javascript
const sobre = JSON.parse(localStorage.getItem('sct_sobre_presupuestario'));
if (sobre) {
  // Pre-llenar datos desde el sobre:
  // - Nombre del curso
  // - SCT / horas totales
  // - Distribucion sync/async/auto
  // - Semanas
  // Mostrar banner: "Datos cargados desde la Calculadora SCT (Modo X)"
  // Ofrecer boton "Descartar datos previos" para empezar desde cero
}
```

**Tipo de cambio**: JS en el planificador (nuevo bloque de inicializacion).

---

## 6. Resumen de cambios por archivo

### virtualizacion.html

| Seccion | Lineas | Tipo | Descripcion |
|---------|--------|------|-------------|
| Grid M1 texto | 244 | Contenido | "Se validan" -> "Se calculan, verifican o estiman" |
| Card Calculadora SCT: descripcion | 333 | Contenido | Nuevo texto reflejando 3 modos |
| Card Calculadora SCT: produce | 337 | Contenido | "Ficha de validacion" -> "Informe SCT imprimible" |
| Card Calculadora SCT: footer | 341 | Contenido | "Wizard interactivo - 4 pasos" -> "3 modos - Curso - Semestre - Programa" |
| Bloque aclaracion SCT vs Planificador | 474 | Contenido | Texto ampliado con los 3 modos |

**Total**: 5 cambios de contenido, 0 cambios de estructura.

### virtualizacion-sct.html

| Seccion | Lineas | Tipo | Descripcion |
|---------|--------|------|-------------|
| Hero label | 138 | Contenido | "Antes de la resolucion exenta" -> "Definicion de creditos y horas" |
| Hero descripcion | 140 | Contenido | Nuevo texto con 3 modos |
| Hero tag "Produce" | 148 | Contenido | "Ficha de validacion" -> "Informe SCT imprimible" |
| Hero nota pie | 151 | Contenido | Ajuste menor ("Momento 3") |
| Selector de modo (nuevo) | Despues de 185 | Estructura | Nuevo bloque HTML con 3 radio cards |
| Progress stepper | 167-185 | JS | Labels dinamicos segun modo |
| CTA step 4 | 757-760 | JS + contenido | Texto y comportamiento adaptativo segun modo |
| Seccion "Proximo: vista a nivel de programa" | 836 | Contenido | Actualizar: la vista semestral ya existe (Modo B) |

**Total**: 5 cambios de contenido, 1 nuevo bloque de estructura, 2 cambios de JS.

### virtualizacion-planificador.html

| Seccion | Lineas | Tipo | Descripcion |
|---------|--------|------|-------------|
| Inicializacion JS | Script | JS | Carga de sobre presupuestario desde localStorage |
| Banner informativo | Despues del hero | Estructura condicional | "Datos cargados desde Calculadora SCT" (solo si hay sobre) |

**Total**: 1 cambio de JS, 1 bloque condicional.

### Archivos nuevos

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `/shared/sct-v3-data.json` | Datos | Verbos Bloom, matriz DOK, tablas Laurillard, defaults por area |

---

## 7. Cambio puntual a corregir: "vista a nivel de programa"

En `virtualizacion-sct.html`, linea 836-837, el texto actual dice:

> "La UDFV esta desarrollando una vista a nivel de programa que permitira visualizar la curva de carga semanal..."

Con la v3, el **Modo B ya es esa vista semestral**. El texto debe actualizarse:

**Texto propuesto**:
```
Esta calculadora ahora incluye un <strong>Modo B (Calcular un semestre)</strong> que agrega multiples actividades curriculares y visualiza la carga semanal del estudiante con semaforos de sostenibilidad. Para una estimacion fundamentada de programas nuevos, el <strong>Modo C (Estimar desde competencias)</strong> construye la estructura crediticia completa.
```

---

## 8. Orden de implementacion recomendado

1. **Fase 1: Contenido** (sin riesgo, solo texto)
   - Actualizar textos de `virtualizacion.html` (5 cambios)
   - Actualizar textos del hero de `virtualizacion-sct.html` (4 cambios)
   - Actualizar texto de "vista a nivel de programa" en `virtualizacion-sct.html`

2. **Fase 2: Selector de modo** (estructura + JS)
   - Crear el bloque HTML del selector de modo
   - Implementar la logica de show/hide de wizards por modo
   - Adaptar el progress stepper

3. **Fase 3: Sobre presupuestario** (JS bidireccional)
   - Implementar `saveSobrePresupuestario()` en la calculadora
   - Implementar `loadSobrePresupuestario()` en el planificador
   - Adaptar el CTA segun modo

4. **Fase 4: Datos de referencia**
   - Crear `/shared/sct-v3-data.json`
   - Integrar con el Modo C

**Nota**: Las Fases 2-4 dependen de los planes de componentes ya existentes en `docs/plan-componentes-*.md`. Esta fase 1 (contenido) puede ejecutarse de inmediato.

---

*Este plan no incluye la implementacion de los modos B y C en si mismos (eso esta en los documentos `plan-componentes-*.md`). Se limita a los cambios de landing, navegacion, hero y flujo M1-M3.*
