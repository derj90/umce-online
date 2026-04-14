# Plan de Componentes: UI Shell, Modo A, Modo B -- Calculadora SCT-Chile v3

**Version**: 1.0  
**Fecha**: 13 de abril de 2026  
**Archivo fuente**: `src/public/virtualizacion-sct.html` (v1 actual, 1519 lineas)  
**Documento base**: `docs/propuesta-calculadora-sct-v3-consolidada.md` (v3.1)  
**Stack**: Express + vanilla JS + Tailwind CDN. Sin React, sin TypeScript, sin frameworks JS.  
**Ubicacion del archivo**: `src/public/virtualizacion-sct.html` (se extiende el archivo actual)  
**Componentes compartidos**: `src/public/shared/`

---

## COMPONENTE: UI Shell (contenedor de los 3 modos)

### Descripcion

El UI Shell es la capa de navegacion y estado compartido que envuelve los tres modos (A, B, C) de la calculadora. Su responsabilidad es triple: (1) permitir al usuario seleccionar un modo de entrada, (2) mantener el estado compartido entre modos (perfil de estudiante, formato, programa), y (3) proveer funciones de calculo y renderizado reutilizadas por los tres modos.

El Shell NO es un componente visual independiente del wizard actual: es la reestructuracion de la pagina `virtualizacion-sct.html` para que el wizard de 4 pasos de la v1 se convierta en uno de los tres caminos posibles (Modo A), y los Modos B y C sean caminos paralelos con sus propios pasos pero compartiendo el mismo motor de calculo y los mismos componentes de visualizacion.

### Uso

1. El usuario llega a `/virtualizacion/sct`.
2. Ve el hero actual (sin cambios) y la seccion de antecedentes (sin cambios).
3. Debajo de los antecedentes, en lugar de ir directamente al wizard paso 1, encuentra un **selector de modo** con tres opciones (radio cards, estilo identico al selector de perfil actual).
4. Al seleccionar un modo, el wizard correspondiente se activa y el selector queda visible pero colapsado (texto indicando "Modo A -- Calcular un curso" como breadcrumb).
5. En cualquier momento puede volver al selector de modo sin perder datos (los datos se preservan en `SCTState`).
6. Al final de cualquier modo, el informe de dos bloques se genera con `renderReport()` usando la misma estructura.

### Formato esperado

**HTML: Selector de modo** (se inserta entre la seccion de antecedentes y el wizard actual)

```html
<div id="modeSelector" class="max-w-3xl mx-auto px-6 mb-8">
  <h2 class="font-heading text-xl font-bold text-gray-900 mb-2">Selecciona que necesitas hacer</h2>
  <p class="text-sm text-gray-500 mb-4">Los tres modos usan la misma formula (SCT = ceil(HT / 27)). Lo que cambia es como se calculan las horas.</p>
  <div class="grid sm:grid-cols-3 gap-3" id="modeCards">
    <label class="radio-card selected" id="modeCardA">
      <input type="radio" name="calcMode" value="modoA" checked class="sr-only">
      <div class="text-sm font-bold text-umce-azul mb-1">Modo A</div>
      <div class="text-sm font-semibold">Calcular un curso</div>
      <div class="text-xs text-gray-400 mt-1">Verificacion rapida de una AC individual. 3-5 min.</div>
    </label>
    <label class="radio-card" id="modeCardB">
      <input type="radio" name="calcMode" value="modoB" class="sr-only">
      <div class="text-sm font-bold text-purple-600 mb-1">Modo B</div>
      <div class="text-sm font-semibold">Calcular un semestre</div>
      <div class="text-xs text-gray-400 mt-1">Vista agregada de multiples ACs con semaforos. 10-15 min.</div>
    </label>
    <label class="radio-card opacity-60 cursor-not-allowed" id="modeCardC">
      <input type="radio" name="calcMode" value="modoC" class="sr-only" disabled>
      <div class="text-sm font-bold text-emerald-600 mb-1">Modo C <span class="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 ml-1">Proximo</span></div>
      <div class="text-sm font-semibold">Estimar desde competencias</div>
      <div class="text-xs text-gray-400 mt-1">Estimacion fundamentada desde nivel cognitivo. En desarrollo.</div>
    </label>
  </div>
</div>
```

**HTML: Contenedores de modo** (envuelven los wizards de cada modo)

```html
<div id="modeA" class="mode-container active">
  <!-- Wizard actual de 4 pasos (step1..step4) vive aqui -->
</div>
<div id="modeB" class="mode-container" style="display:none;">
  <!-- Wizard del Modo B (stepB1..stepB4) -->
</div>
<div id="modeC" class="mode-container" style="display:none;">
  <!-- Futuro: Wizard del Modo C -->
</div>
```

**CSS: Clases nuevas**

```css
.mode-container { display: none; }
.mode-container.active { display: block; }
```

**JS: Estado global compartido (`SCTState`)**

```js
var SCTState = {
  mode: 'modoA',              // 'modoA' | 'modoB' | 'modoC'
  profile: 'pregrado',         // 'pregrado' | 'postgrado' | 'continua'
  formato: 'semestral',        // 'semestral' | 'modulo' | 'bloque_breve' | 'cuech'
  programName: '',
  semester: '',

  // Modo A: datos de la AC individual
  modoA: {
    courseName: '', courseCode: '',
    activityType: 'mixto',     // 'expositiva' | 'taller' | 'seminario' | 'proyecto' | 'mixto'
    hs: 1.5, has: 2, haut: 1,
    ns: 18, sctDeclarados: 3,
    actConcurrentes: 3
  },

  // Modo B: array de ACs del semestre
  modoB: {
    semesterLabel: '',
    acs: []  // Array de { id, name, code, activityType, hs, has, haut, ns, sctCalc, htTotal }
  },

  // Modo C: planificacion por programa completo (multiples semestres)
  modoC: {
    programName: '',
    programCode: '',
    profile: 'pregrado',
    modalidad: 'virtual',
    formato: 'semestral',
    discipline: 'educacion',
    numSemesters: 2,
    acs: []
  }
};
```

**JS: Funciones de routing entre modos**

```js
// switchMode(mode) -- cambia el modo activo
function switchMode(mode) {
  if (mode === 'modoC') return; // deshabilitado
  SCTState.mode = mode;

  // Toggle contenedores
  document.querySelectorAll('.mode-container').forEach(function(c) {
    c.classList.remove('active');
    c.style.display = 'none';
  });
  var target = document.getElementById(mode === 'modoA' ? 'modeA' : 'modeB');
  if (target) { target.classList.add('active'); target.style.display = 'block'; }

  // Toggle radio cards
  document.querySelectorAll('#modeCards .radio-card').forEach(function(c) {
    c.classList.remove('selected');
  });
  var cardId = mode === 'modoA' ? 'modeCardA' : 'modeCardB';
  document.getElementById(cardId).classList.add('selected');

  // Sincronizar perfil y formato al modo destino
  syncSharedState();
}

// syncSharedState() -- propaga perfil/formato al modo activo
function syncSharedState() {
  SCTState.profile = getCheckedRadio('profile') || 'pregrado';
  SCTState.formato = getCheckedRadio('formato') || 'semestral';
  SCTState.programName = getVal('programName');
  SCTState.semester = getVal('semester');
}

// getCheckedRadio(name) -- helper
function getCheckedRadio(name) {
  var el = document.querySelector('input[name="' + name + '"]:checked');
  return el ? el.value : null;
}

// getVal(id) -- helper
function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value : '';
}
```

**JS: Motor de calculo compartido**

```js
// calcSCT(hs, has, haut, ns) -- wrapper de delegacion (fuente unica: SCTEngine)
// La logica canonica vive en SCTEngine.calculateFromWeekly() (sct-engine.js).
// Este wrapper existe solo para compatibilidad con las llamadas existentes en Modo A y Modo B.
function calcSCT(hs, has, haut, ns) {
  return SCTEngine.calculateFromWeekly(hs, has, haut, ns);
}

// getSemaforoLevel(weekly) -- retorna 'verde' | 'amarillo' | 'rojo'
function getSemaforoLevel(weekly) {
  if (weekly <= 10) return 'verde';
  if (weekly <= 12) return 'amarillo';
  return 'rojo';
}

// checkAutonomia(haut, weekly) -- verifica 25-40%
function checkAutonomia(haut, weekly) {
  if (weekly === 0) return { ok: true, pct: 0 };
  var pct = haut / weekly;
  return { ok: pct >= 0.25 && pct <= 0.40, pct: pct };
}
```

**JS: Funciones de renderizado compartidas (migradas de v1)**

```js
// Las siguientes funciones se preservan de la v1 con ajustes minimos:
// - renderDonut(hSinc, hAsinc, hAut, targetSvgId)  -- agrega parametro targetSvgId
// - renderSemaforo(weekly, targetIconId, targetTitleId, targetDescId, targetBadgeId)
// - renderWeeklyBars(weekly, ns, targetContainerId)
//
// El cambio principal: cada funcion recibe el ID del contenedor destino
// en vez de usar IDs hardcoded. Esto permite reutilizarlas en Modo B
// (donde hay multiples donuts, uno por AC expandida).

// renderReport(calcResult, metadata, targetContainerId)
// -- genera el informe de 2 bloques (seccion 7 del doc consolidado)
// -- calcResult: objeto retornado por calcSCT()
// -- metadata: { mode, courseName, courseCode, programName, semester, profile, formato, activityType, ... }
// -- metadata.modoB_acs: array de ACs (solo para Modo B)
// -- targetContainerId: donde renderizar
```

### Inputs

- Del usuario: seleccion de modo (radio card click).
- Del localStorage: estado previo de `SCTState` si existe (persistencia entre visitas).

### Outputs

- Hacia Modo A / Modo B: activacion del contenedor correspondiente.
- Hacia `renderReport()`: objeto `calcResult` + `metadata` para generar informe.
- Hacia localStorage: serializacion de `SCTState` en `localStorage.setItem('sctCalcState', JSON.stringify(SCTState))`.

### Dependencias

- `src/public/shared/shared.js` (nav, footer, utilidades).
- `src/public/shared/shared.css` (variables CSS: `--palette-primary`).
- `src/public/shared/tailwind.min.css`.
- `src/public/shared/generative-header.js` + p5.js (hero).
- `src/public/shared/audio-narrator.js` (narrador).

### Implementacion

**Reutilizado de la v1:**
- Hero section completa (sin cambios).
- Seccion de antecedentes (sin cambios).
- CSS de wizard steps, progress dots, radio cards, stat cards, semaforo, donut, buttons, print styles.
- `FORMATOS` constant.

**Creado nuevo:**
- `#modeSelector` HTML + event listeners.
- `SCTState` objeto global.
- `switchMode()`, `syncSharedState()`, helpers.
- `calcSCT()` funcion pura (refactorizada desde el calculo inline en `updatePreview`/`runCalc`).
- Parametrizacion de `renderDonut`, `renderSemaforo`, `renderWeeklyBars` para aceptar IDs destino.

**Wireframe ASCII de la estructura general:**

```
+================================================================+
|                         HERO (sin cambios)                     |
+================================================================+
|                    ANTECEDENTES (sin cambios)                  |
+================================================================+
|                     SELECTOR DE MODO                           |
|  +------------------+  +------------------+  +----------------+|
|  | [x] Modo A       |  | [ ] Modo B       |  | Modo C         ||
|  | Calcular un curso |  | Calcular semestre|  | (Proximo)      ||
|  | 3-5 min           |  | 10-15 min        |  | Deshabilitado  ||
|  +------------------+  +------------------+  +----------------+|
+================================================================+
|                                                                |
|  +------ PROGRESS BAR (Modo A: 4 pasos / Modo B: 4 pasos) ---+|
|  |  (1)-----(2)-----(3)-----(4)                               ||
|  +------------------------------------------------------------+|
|                                                                |
|  +------------- CONTENEDOR ACTIVO (modeA o modeB) -----------+|
|  |                                                            ||
|  |  [Wizard del modo seleccionado]                            ||
|  |                                                            ||
|  +------------------------------------------------------------+|
|                                                                |
+================================================================+
|                 CONTEXTO EDUCATIVO (sin cambios)               |
+================================================================+
|                  REFERENCIAS (sin cambios)                     |
+================================================================+
|                   QUE SIGUE (sin cambios)                      |
+================================================================+
|                    FOOTER (sin cambios)                        |
+================================================================+
```

---

## COMPONENTE: Modo A -- Calcular un curso

### Descripcion

El Modo A es la v1 actual con tres mejoras incrementales: (1) selector de tipo de actividad que pre-llena horas sugeridas, (2) doble formato de output (UGCI bipartito + extendido tripartito), y (3) informe imprimible con estructura de dos bloques. Es la puerta de entrada rapida: 3-5 minutos, una sola AC.

### Uso

Flujo paso a paso:

1. **Paso A1 -- Tu curso**: El usuario llena los campos del formulario. Nuevo: elige un tipo de actividad (5 opciones) que pre-llena las horas como punto de partida editable. El preview en tiempo real se actualiza con cada cambio. La seccion de orientacion dinamica se mantiene.
2. **Paso A2 -- Calculo SCT**: Resultado del calculo con donut, semaforo y barras semanales. Nuevo: tabla de doble formato (UGCI bipartito + tripartito extendido) debajo del donut.
3. **Paso A3 -- Presentacion formal**: Informe Bloque 1 (resultado PAC) + Bloque 2 Modo A (inputs directos, tipo de actividad). Tabla de trazabilidad. Botones de imprimir/PDF.
4. **Paso A4 -- Verificacion de consistencia**: Semaforo global + verificaciones por nivel + recomendaciones. Boton "Nuevo calculo" y enlace al Planificador.

### Formato esperado

**Campos del formulario (Paso A1):**

| Campo | ID HTML | Tipo | Default | Rango valido | Notas |
|-------|---------|------|---------|--------------|-------|
| Nombre del curso | `courseName` | text | '' | texto libre | Ya existe en v1 |
| Codigo | `courseCode` | text | '' | texto libre, opcional | Ya existe en v1 |
| Programa | `programName` | text | '' | texto libre | Ya existe en v1 |
| Semestre | `semester` | text | '' | texto libre | Ya existe en v1 |
| Perfil de estudiantes | `profile` (radio) | radio | 'pregrado' | pregrado/postgrado/continua | Ya existe en v1 |
| Formato | `formato` (radio) | radio | 'semestral' | semestral/modulo/bloque_breve/cuech | Ya existe en v1 |
| Tipo de actividad | `activityType` (radio) | radio | 'mixto' | expositiva/taller/seminario/proyecto/mixto | NUEVO |
| HS sincronicas | `hs` | number | 1.5 | 0-40, step 0.5 | Ya existe en v1 |
| HAs asincronicas | `has` | number | 2 | 0-40, step 0.5 | Ya existe en v1 |
| HAut autonomo | `haut` | number | 1 | 0-40, step 0.5 | Ya existe en v1 |
| Semanas (NS) | `ns` | number | 18 | 1-52 | Ya existe en v1 |
| SCT declarados | `sctDeclarados` | number | 3 | 1-60 | Ya existe en v1 |
| Actividades concurrentes | `actConcurrentes` | number | 3 | 1-10 | Ya existe en v1 |

**Selector de tipo de actividad (NUEVO):**

```html
<div id="activityTypeSection">
  <label class="block text-sm font-semibold text-gray-700 mb-1.5">Tipo predominante de actividad</label>
  <p class="text-xs text-gray-400 mb-2">Pre-llena las horas como punto de partida. Puedes ajustarlas despues.</p>
  <div class="grid sm:grid-cols-5 gap-2" id="activityTypeSelector">
    <label class="radio-card text-center" id="actTypeExpositiva">
      <input type="radio" name="activityType" value="expositiva" class="sr-only">
      <div class="text-xs font-bold">Expositiva</div>
      <div class="text-xs text-gray-400 mt-0.5">Clase magistral, conferencia</div>
    </label>
    <label class="radio-card text-center" id="actTypeTaller">
      <input type="radio" name="activityType" value="taller" class="sr-only">
      <div class="text-xs font-bold">Taller</div>
      <div class="text-xs text-gray-400 mt-0.5">Practica guiada, laboratorio</div>
    </label>
    <label class="radio-card text-center" id="actTypeSeminario">
      <input type="radio" name="activityType" value="seminario" class="sr-only">
      <div class="text-xs font-bold">Seminario</div>
      <div class="text-xs text-gray-400 mt-0.5">Discusion, debate, analisis</div>
    </label>
    <label class="radio-card text-center" id="actTypeProyecto">
      <input type="radio" name="activityType" value="proyecto" class="sr-only">
      <div class="text-xs font-bold">Proyecto</div>
      <div class="text-xs text-gray-400 mt-0.5">Investigacion, produccion</div>
    </label>
    <label class="radio-card text-center selected" id="actTypeMixto">
      <input type="radio" name="activityType" value="mixto" class="sr-only" checked>
      <div class="text-xs font-bold">Mixto</div>
      <div class="text-xs text-gray-400 mt-0.5">Combinacion de tipos</div>
    </label>
  </div>
</div>
```

**Valores pre-llenados por tipo de actividad:**

```js
var ACTIVITY_PRESETS = {
  expositiva: {
    hs: 2.0, has: 1.0, haut: 1.5,
    laurillard: 'adquisicion',
    desc: 'Clase magistral con lectura complementaria. Mayor sincronismo.'
  },
  taller: {
    hs: 1.5, has: 2.0, haut: 1.0,
    laurillard: 'practica',
    desc: 'Practica guiada con ejercitacion independiente. Balance sync/async.'
  },
  seminario: {
    hs: 2.0, has: 2.0, haut: 0.5,
    laurillard: 'discusion',
    desc: 'Discusion intensiva con preparacion previa. Mayor sincronismo y asincronismo.'
  },
  proyecto: {
    hs: 1.0, has: 1.5, haut: 2.5,
    laurillard: 'produccion',
    desc: 'Produccion autonoma con tutoria puntual. Mayor autonomia.'
  },
  mixto: {
    hs: 1.5, has: 2.0, haut: 1.0,
    laurillard: null,
    desc: 'Combinacion libre. Ajuste las horas segun su actividad.'
  }
};
```

**Doble formato output (NUEVO, en Paso A2):**

```html
<div class="bg-white border border-gray-200 rounded-xl p-5" id="dualFormatSection">
  <h3 class="font-heading font-bold text-gray-800 mb-4">Formatos de horas</h3>
  <div class="grid sm:grid-cols-2 gap-4">
    <!-- Formato UGCI bipartito -->
    <div class="border border-blue-200 rounded-lg p-4 bg-blue-50/30">
      <div class="text-xs font-bold uppercase tracking-wide text-umce-azul mb-3">Formato UGCI (Resolucion Exenta)</div>
      <table class="w-full text-sm">
        <tbody>
          <tr class="border-b border-blue-100">
            <td class="py-2 text-gray-600">HP (horas presenciales)</td>
            <td class="py-2 text-right font-bold" id="fmtHP">27</td>
          </tr>
          <tr class="border-b border-blue-100">
            <td class="py-2 text-gray-600">HA (horas autonomas)</td>
            <td class="py-2 text-right font-bold" id="fmtHA">54</td>
          </tr>
          <tr>
            <td class="py-2 font-semibold">HT (total)</td>
            <td class="py-2 text-right font-bold text-umce-azul" id="fmtHT_ugci">81</td>
          </tr>
        </tbody>
      </table>
      <p class="text-xs text-gray-400 mt-2">HP = sincronicas. HA = asincronicas + autonomas.</p>
    </div>
    <!-- Formato extendido tripartito -->
    <div class="border border-purple-200 rounded-lg p-4 bg-purple-50/30">
      <div class="text-xs font-bold uppercase tracking-wide text-purple-700 mb-3">Formato extendido (Diseno instruccional)</div>
      <table class="w-full text-sm">
        <tbody>
          <tr class="border-b border-purple-100">
            <td class="py-2 text-gray-600">H. sincronicas</td>
            <td class="py-2 text-right font-bold" id="fmtHsinc">27</td>
          </tr>
          <tr class="border-b border-purple-100">
            <td class="py-2 text-gray-600">H. asincronicas</td>
            <td class="py-2 text-right font-bold" id="fmtHasinc">36</td>
          </tr>
          <tr class="border-b border-purple-100">
            <td class="py-2 text-gray-600">H. autonomas</td>
            <td class="py-2 text-right font-bold" id="fmtHaut_ext">18</td>
          </tr>
          <tr>
            <td class="py-2 font-semibold">HT (total)</td>
            <td class="py-2 text-right font-bold text-purple-700" id="fmtHT_ext">81</td>
          </tr>
        </tbody>
      </table>
      <p class="text-xs text-gray-400 mt-2">Desglose para diseno de actividades.</p>
    </div>
  </div>
</div>
```

**Funciones JS del doble formato:**

```js
// updateDualFormat(calcResult) -- actualiza las tablas de doble formato
function updateDualFormat(calcResult) {
  // UGCI bipartito
  document.getElementById('fmtHP').textContent = calcResult.hp.toFixed(0) + ' hrs';
  document.getElementById('fmtHA').textContent = calcResult.ha.toFixed(0) + ' hrs';
  document.getElementById('fmtHT_ugci').textContent = calcResult.htTotal.toFixed(0) + ' hrs';

  // Extendido tripartito
  document.getElementById('fmtHsinc').textContent = calcResult.hSinc.toFixed(0) + ' hrs';
  document.getElementById('fmtHasinc').textContent = calcResult.hAsinc.toFixed(0) + ' hrs';
  document.getElementById('fmtHaut_ext').textContent = calcResult.hAut.toFixed(0) + ' hrs';
  document.getElementById('fmtHT_ext').textContent = calcResult.htTotal.toFixed(0) + ' hrs';
}
```

### Inputs

| Dato | Tipo | Fuente |
|------|------|--------|
| courseName | string | input#courseName |
| courseCode | string | input#courseCode |
| programName | string | input#programName (compartido via SCTState) |
| semester | string | input#semester (compartido via SCTState) |
| profile | enum | radio[name=profile] (compartido via SCTState) |
| formato | enum | radio[name=formato] (compartido via SCTState) |
| activityType | enum | radio[name=activityType] (NUEVO) |
| hs, has, haut | float | inputs numericos |
| ns | int | input#ns |
| sctDeclarados | int | input#sctDeclarados |
| actConcurrentes | int | input#actConcurrentes |

### Outputs

**Datos calculados (retornados por `calcSCT()`):**
- `sct`: creditos SCT calculados (int).
- `htTotal`: horas totales cronologicas (float).
- `hSinc`, `hAsinc`, `hAut`: triple obligatorio (floats).
- `hp`, `ha`: formato UGCI bipartito (floats).
- `weekly`: carga semanal (float).
- `pctSync`, `pctAsync`, `pctAut`: porcentajes (ints).

**Datos para el informe (Bloque 1 + Bloque 2 Modo A):**

```js
// Objeto metadata para renderReport()
var metadataA = {
  mode: 'A',
  courseName: SCTState.modoA.courseName,
  courseCode: SCTState.modoA.courseCode,
  programName: SCTState.programName,
  semester: SCTState.semester,
  profile: SCTState.profile,
  formato: SCTState.formato,
  activityType: SCTState.modoA.activityType,
  // Bloque 2 Modo A: inputs directos
  bloque2: {
    tipo: 'inputs_directos',
    activityType: SCTState.modoA.activityType,
    hs: SCTState.modoA.hs,
    has: SCTState.modoA.has,
    haut: SCTState.modoA.haut,
    ns: SCTState.modoA.ns,
    formato: SCTState.formato,
    profile: SCTState.profile
  }
};
```

### Dependencias

- `calcSCT()` del motor compartido (UI Shell).
- `renderDonut()`, `renderSemaforo()`, `renderWeeklyBars()` del UI Shell.
- `renderReport()` del UI Shell.
- `FORMATOS` constante (ya existe en v1).
- `ACTIVITY_PRESETS` constante (NUEVO).

### Migracion desde v1

**Funciones JS reutilizadas (sin cambios o con cambios minimos):**

| Funcion v1 | Cambio | Notas |
|------------|--------|-------|
| `init()` | Se extiende: agrega bindeo del selector de tipo de actividad | Sigue siendo el entry point |
| `bindInputs()` | Se extiende: agrega listener para `activityType` radio cards | El patron de radio cards ya existe |
| `updatePreview()` | Se refactoriza: usa `calcSCT()` en vez de calculo inline | La logica de preview se preserva intacta |
| `updateOrientacionPanel()` | Sin cambios | Funciona identico |
| `updateLiveVerdict()` | Sin cambios | Funciona identico |
| `runCalc()` | Se refactoriza: usa `calcSCT()` + agrega `updateDualFormat()` | Agrega renderizado del doble formato |
| `renderDonut()` | Se parametriza: recibe `targetSvgId` | Default: 'donutChart' (backward compat) |
| `renderSemaforo()` | Se parametriza: recibe IDs destino | Default: IDs actuales |
| `renderWeeklyBars()` | Se parametriza: recibe `targetContainerId` | Default: 'weeklyBars' |
| `updatePresentation()` | Se extiende: agrega tipo de actividad al informe | Se renombra internamente a `renderReportModoA()` |
| `runVerification()` | Sin cambios significativos | Funciona identico |
| `goToStep()` | Sin cambios | Navega entre pasos del Modo A |
| `resetCalc()` | Se extiende: limpia tambien `activityType` | Agrega reset del selector |

**Funciones nuevas:**

| Funcion | Proposito |
|---------|-----------|
| `applyActivityPreset(type)` | Lee `ACTIVITY_PRESETS[type]` y setea los valores en hs/has/haut |
| `updateDualFormat(calcResult)` | Renderiza las tablas de doble formato |
| `bindActivityType()` | Agrega event listeners al selector de tipo de actividad |

**Que se elimina:**
- Nada se elimina. Todo el codigo v1 se preserva. Las nuevas funciones se agregan, y las existentes se extienden o refactorizan in-place.

### Wireframe ASCII detallado

```
PASO A1: Tu curso
+================================================================+
| [Explain box: Que vamos a hacer]                               |
+----------------------------------------------------------------+
| [Contexto metodologico: 1 SCT = 27 hrs...]                    |
+----------------------------------------------------------------+
| Nombre del curso:  [_________________________]                 |
+----------------------------------------------------------------+
| Codigo (opc.)   | Programa       | Semestre                    |
| [_________]     | [____________] | [___________]               |
+----------------------------------------------------------------+
| Perfil de estudiantes:                                         |
| [x] Pregrado    [ ] Postgrado    [ ] Ed. Continua              |
| [fundamentacion panel]                                         |
+----------------------------------------------------------------+
| Formato:                                                       |
| [x] Semestral   [ ] Modulo   [ ] Bloque breve   [ ] CUECH     |
+----------------------------------------------------------------+
| NUEVO: Tipo predominante de actividad:                         |
| [ ] Expositiva  [ ] Taller  [ ] Seminario  [ ] Proyecto  [x] Mixto |
| (pre-llena horas al seleccionar; ajustables)                   |
+----------------------------------------------------------------+
| Actividades concurrentes: [3] actividades en paralelo          |
+----------------------------------------------------------------+
| HS sincronicas  | HAs asincronicas | HAut autonomo | Semanas  |
| [1.5] hrs/sem   | [2.0] hrs/sem    | [1.0] hrs/sem | [18]     |
+----------------------------------------------------------------+
| [fundamentacion: como estimar estas horas]                     |
| [fundamentacion: cuantas hrs sincronicas son sostenibles]      |
+----------------------------------------------------------------+
| SCT declarados: [3] creditos SCT                               |
+----------------------------------------------------------------+
| [Panel orientacion dinamica -- postgrado/pregrado/continua]    |
+----------------------------------------------------------------+
| +-- Lo que esto significa para tu estudiante --+               |
| | [81]          | [4.5]       | [3]       | [ok]|              |
| | Horas totales | Hrs/semana  | SCT calc. | Adecuado           |
| +----------------------------------------------+               |
| [Live verdict: todo en orden / revisar / ajustar]              |
+----------------------------------------------------------------+
|                               [Ver analisis detallado ->]      |
+================================================================+

PASO A2: Calculo SCT
+================================================================+
| [Explain box: Etapa 2 -- Calculo SCT]                          |
+----------------------------------------------------------------+
| +------------ Resultado del calculo -------+                   |
| |              3 creditos SCT              |                   |
| | [27 HS] [36 HAs] [18 HAut] [18 NS]      |                   |
| +-----------------------------------------+                    |
+----------------------------------------------------------------+
| Paso a paso del calculo:                                       |
| HS + HAs + HAut = 4.5 hrs/sem                                 |
| x NS = 81 hrs                                                 |
| / 27 = 3.000                                                  |
| ceil = 3 SCT                                                  |
+----------------------------------------------------------------+
| Distribucion de horas:                                         |
| [DONUT]  Sincronico: 27 hrs (33%)                              |
|          Asincronico: 36 hrs (44%)                              |
|          Autonomo: 18 hrs (22%)                                |
|          Total: 81 hrs                                         |
|          [Semaforo: Carga adecuada]                            |
+----------------------------------------------------------------+
| NUEVO: Formatos de horas                                       |
| +--- UGCI (Res. Exenta) ---+  +--- Extendido (DI) ----------+|
| | HP: 27 hrs                |  | H. sincronicas: 27 hrs     ||
| | HA: 54 hrs                |  | H. asincronicas: 36 hrs    ||
| | HT: 81 hrs                |  | H. autonomas: 18 hrs       ||
| +---------------------------+  | HT: 81 hrs                 ||
|                                +-----------------------------+|
+----------------------------------------------------------------+
| Carga semanal estimada:                                        |
| S1  |============| 4.5h                                        |
| S2  |============| 4.5h                                        |
| ...                                                            |
+----------------------------------------------------------------+
| [<- Volver]                 [Ver presentacion formal ->]       |
+================================================================+

PASO A3: Presentacion formal (informe 2 bloques)
+================================================================+
| UMCE | Informe de Calculo SCT | UDFV                           |
| Fecha: ... | umce.online/virtualizacion/sct                    |
+----------------------------------------------------------------+
| BLOQUE 1: Resultado PAC                                        |
| Nombre:   Metodologia Cualitativa                              |
| Codigo:   EDU3210                                              |
| Programa: Ped. en Ed. Basica                                   |
| Periodo:  2do sem. 2026                                        |
| Perfil:   Postgrado                                            |
|                                                                |
| [3] creditos SCT                                               |
| ((1.5 + 2 + 1) x 18) / 27 = 3.000 -> 3                       |
|                                                                |
| +-- Formato UGCI --+  +-- Formato extendido --+               |
| | HP: 27  HA: 54   |  | Sinc: 27 Asinc: 36 Aut: 18           |
| | HT: 81           |  | HT: 81                |               |
| +------------------+  +-----------------------+               |
+----------------------------------------------------------------+
| BLOQUE 2: Anexo metodologico (Modo A)                          |
| Tipo de actividad: Mixto                                       |
| Horas semanales: HS=1.5, HAs=2.0, HAut=1.0                   |
| Formato: Semestral (18 semanas)                                |
| Perfil: Postgrado                                              |
+----------------------------------------------------------------+
| Tabla de trazabilidad:                                         |
| Dato entrada | Procedimiento | Resultado | Valor final        |
| HS/sem       | Dato declarado| Parametro | 1.5 hrs/sem         |
| ...          | ...           | ...       | ...                 |
+----------------------------------------------------------------+
| Marco normativo: SCT-Chile, Res. Exenta 002140, ceil...        |
| Modo de calculo: A (Calcular un curso)                         |
+----------------------------------------------------------------+
| [<- Volver]  [Imprimir/PDF]  [Verificar consistencia ->]       |
+================================================================+

PASO A4: Verificacion de consistencia
(Sin cambios respecto a v1, excepto que el Bloque 2 incluye tipo de actividad)
```

---

## COMPONENTE: Modo B -- Calcular un semestre

### Descripcion

El Modo B permite verificar la carga total del estudiante en un semestre completo, agregando multiples actividades curriculares. Cada AC se calcula con la formula del Modo A. El valor diferencial es la vista agregada: SCT totales del semestre, carga semanal acumulada, semaforos de sostenibilidad, y la identificacion de desbalances entre ACs.

El Modo B tiene su propio wizard de 4 pasos, paralelo al del Modo A, pero compartiendo el motor de calculo y los componentes de renderizado.

### Uso

Flujo paso a paso:

1. **Paso B1 -- Configuracion del semestre**: El usuario ingresa los datos comunes del semestre (programa, periodo, perfil de estudiantes, formato base). Estos datos aplican a todas las ACs del semestre. Boton "Siguiente" lleva a B2.

2. **Paso B2 -- Tabla de actividades curriculares**: El usuario agrega ACs como filas de una tabla editable. Cada fila tiene: nombre, tipo de actividad (5 opciones, pre-llena horas), HS/HAs/HAut editables, semanas, SCT calculados (readonly). Debajo de la tabla: panel de totales con semaforos. Boton "Agregar AC" agrega una fila. Boton para expandir una fila al formulario completo del Modo A (inline, no navega). Boton "Ver resultados" lleva a B3.

3. **Paso B3 -- Resultados del semestre**: Resumen con: tabla completa por AC con totales, donut de distribucion del semestre, carga semanal agregada con barras, semaforos de carga. Doble formato output (UGCI bipartito + tripartito) a nivel de semestre. Boton "Ver informe" lleva a B4.

4. **Paso B4 -- Informe del semestre**: Bloque 1 (resultado PAC del semestre) + Bloque 2 Modo B (tabla de ACs con subtotales, semaforos). Botones de imprimir, exportar JSON (para persistencia/compartir), nuevo calculo.

**Transicion Modo A a Modo B:**
- Desde el Modo A, si el usuario ya tiene una AC calculada y cambia al Modo B, la AC calculada se agrega automaticamente como primera fila de la tabla del Modo B. Esto evita perder trabajo.

### Formato esperado

**Configuracion del semestre (Paso B1):**

```html
<div class="wizard-step active" id="stepB1">
  <div class="explain-box">
    <div class="explain-title">Paso 1 -- Configuracion del semestre</div>
    <p>Estos datos aplican a todas las actividades del semestre. Luego agregaras cada AC individualmente.</p>
  </div>

  <div class="space-y-6">
    <!-- Programa / Carrera (compartido) -->
    <div class="grid sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Programa / carrera</label>
        <input type="text" id="bProgramName" placeholder="Ej: Ped. en Ed. Basica" class="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm">
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Semestre / periodo</label>
        <input type="text" id="bSemester" placeholder="Ej: 2do sem. 2026" class="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm">
      </div>
    </div>

    <!-- Perfil de estudiantes (compartido, se ingresa una vez) -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1.5">Perfil de estudiantes (aplica a todas las ACs)</label>
      <div class="grid sm:grid-cols-3 gap-2" id="bProfileSelector">
        <label class="radio-card selected flex items-center gap-2">
          <input type="radio" name="bProfile" value="pregrado" checked>
          <div><div class="text-sm font-semibold">Pregrado</div><div class="text-xs text-gray-400">Dedicacion completa</div></div>
        </label>
        <label class="radio-card flex items-center gap-2">
          <input type="radio" name="bProfile" value="postgrado">
          <div><div class="text-sm font-semibold">Postgrado</div><div class="text-xs text-gray-400">Profesionales en ejercicio</div></div>
        </label>
        <label class="radio-card flex items-center gap-2">
          <input type="radio" name="bProfile" value="continua">
          <div><div class="text-sm font-semibold">Ed. Continua</div><div class="text-xs text-gray-400">Maxima flexibilidad</div></div>
        </label>
      </div>
    </div>

    <!-- Formato base del semestre -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1.5">Formato base del semestre</label>
      <p class="text-xs text-gray-400 mb-2">Se aplica como default a cada AC nueva. Puedes cambiarlo por AC individual.</p>
      <div class="grid sm:grid-cols-2 gap-2" id="bFormatSelector">
        <label class="radio-card selected flex items-center gap-2">
          <input type="radio" name="bFormato" value="semestral" checked>
          <div><div class="text-sm font-semibold">Semestral (18 sem)</div></div>
        </label>
        <label class="radio-card flex items-center gap-2">
          <input type="radio" name="bFormato" value="modulo">
          <div><div class="text-sm font-semibold">Modular (8 sem)</div></div>
        </label>
      </div>
    </div>

    <div class="flex justify-end pt-4">
      <button class="btn-primary" onclick="goToStepB(2)">
        Agregar actividades curriculares ->
      </button>
    </div>
  </div>
</div>
```

**Tabla editable de ACs (Paso B2):**

```html
<div class="wizard-step" id="stepB2">
  <div class="explain-box">
    <div class="explain-title">Paso 2 -- Actividades del semestre</div>
    <p>Agrega cada actividad curricular del semestre. El calculo se actualiza en tiempo real.</p>
  </div>

  <div class="space-y-6">
    <!-- Tabla de ACs -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm" id="acTable">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="text-left px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500 w-1/4">Actividad curricular</th>
              <th class="text-center px-2 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500 w-20">Tipo</th>
              <th class="text-center px-2 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500 w-16">HS</th>
              <th class="text-center px-2 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500 w-16">HAs</th>
              <th class="text-center px-2 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500 w-16">HAut</th>
              <th class="text-center px-2 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500 w-14">Sem</th>
              <th class="text-center px-2 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500 w-14">SCT</th>
              <th class="text-center px-2 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500 w-14">HT</th>
              <th class="text-center px-2 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500 w-10"></th>
            </tr>
          </thead>
          <tbody id="acTableBody">
            <!-- Filas dinamicas via addACRow() -->
          </tbody>
          <tfoot>
            <tr class="bg-gray-50 border-t-2 border-gray-300 font-bold">
              <td class="px-3 py-2.5 text-gray-700" colspan="2">Total semestre</td>
              <td class="text-center px-2 py-2.5 text-umce-azul" id="totalHS">--</td>
              <td class="text-center px-2 py-2.5 text-purple-600" id="totalHAs">--</td>
              <td class="text-center px-2 py-2.5 text-emerald-600" id="totalHAut">--</td>
              <td class="text-center px-2 py-2.5 text-gray-500" id="totalSem">--</td>
              <td class="text-center px-2 py-2.5 text-umce-azul text-lg" id="totalSCT">--</td>
              <td class="text-center px-2 py-2.5 text-gray-700" id="totalHT">--</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Boton agregar -->
      <div class="px-3 py-3 border-t border-gray-100">
        <button class="btn-secondary text-xs" onclick="addACRow()">
          + Agregar actividad curricular
        </button>
      </div>
    </div>

    <!-- Panel de carga agregada -->
    <div class="bg-blue-50 border border-blue-100 rounded-xl p-5" id="bAggregatePanel">
      <div class="text-sm font-semibold text-umce-azul mb-3">Carga agregada del semestre</div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div class="stat-card">
          <div class="stat-value text-umce-azul" id="bTotalSCT">--</div>
          <div class="stat-label">SCT semestre</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="bTotalHT" style="color:#374151">--</div>
          <div class="stat-label">Horas totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="bWeeklyLoad" style="color:#059669">--</div>
          <div class="stat-label">Hrs/sem agregada</div>
        </div>
        <div class="stat-card">
          <div class="semaforo verde text-lg w-10 h-10 mx-auto" id="bSemaforoIcon">?</div>
          <div class="stat-label mt-1" id="bSemaforoLabel">--</div>
        </div>
      </div>
    </div>

    <div class="flex justify-between pt-4">
      <button class="btn-secondary" onclick="goToStepB(1)">
        <- Volver
      </button>
      <button class="btn-primary" onclick="goToStepB(3)">
        Ver resultados del semestre ->
      </button>
    </div>
  </div>
</div>
```

**Columnas de la tabla, tipos de dato:**

| Columna | HTML element | Tipo | Default | Notas |
|---------|-------------|------|---------|-------|
| Actividad curricular | `<input type="text">` | string | '' | Nombre libre |
| Tipo | `<select>` | enum | 'mixto' | expositiva/taller/seminario/proyecto/mixto. Al cambiar, pre-llena HS/HAs/HAut |
| HS | `<input type="number">` | float | segun tipo | step=0.5, min=0, max=40 |
| HAs | `<input type="number">` | float | segun tipo | step=0.5, min=0, max=40 |
| HAut | `<input type="number">` | float | segun tipo | step=0.5, min=0, max=40 |
| Sem | `<input type="number">` | int | segun formato base | min=1, max=52 |
| SCT | `<span>` (readonly) | int | calculado | `Math.ceil(HT/27)`, se actualiza en real-time |
| HT | `<span>` (readonly) | float | calculado | `(HS+HAs+HAut)*Sem` |
| Acciones | `<button>` | -- | -- | Boton eliminar fila (icono trash) |

**Semaforos de carga agregada:**

Los umbrales se ajustan por perfil de estudiante:

```js
var SEMAFORO_THRESHOLDS = {
  pregrado:  { verde: 10, amarillo: 12 },  // hrs/semana por AC
  postgrado: { verde: 8,  amarillo: 10 },
  continua:  { verde: 6,  amarillo: 8  }
};

// El semaforo agregado evalua la carga SEMANAL TOTAL del semestre
// (suma de hrs/sem de todas las ACs simultaneas)
var AGGREGATE_THRESHOLDS = {
  pregrado:  { verde: 40, amarillo: 45 },  // hrs/semana totales
  postgrado: { verde: 12, amarillo: 15 },
  continua:  { verde: 8,  amarillo: 10 }
};
```

**JS: Funciones del Modo B**

```js
// ================================
// Modo B: Estado y funciones
// ================================

var acCounter = 0; // Contador para IDs unicos de filas

// addACRow(prefill) -- agrega una fila a la tabla
// prefill: objeto opcional { name, type, hs, has, haut, ns } para importar desde Modo A
function addACRow(prefill) {
  acCounter++;
  var id = 'ac_' + acCounter;
  var fmt = FORMATOS[getCheckedRadio('bFormato') || 'semestral'];
  var defaultNS = fmt ? fmt.semanas : 18;
  var preset = ACTIVITY_PRESETS[prefill ? prefill.type : 'mixto'] || ACTIVITY_PRESETS.mixto;

  var name = prefill ? prefill.name : '';
  var type = prefill ? prefill.type : 'mixto';
  var hs = prefill ? prefill.hs : preset.hs;
  var has = prefill ? prefill.has : preset.has;
  var haut = prefill ? prefill.haut : preset.haut;
  var ns = prefill ? prefill.ns : defaultNS;

  var row = document.createElement('tr');
  row.id = id;
  row.className = 'act-row border-b border-gray-100 hover:bg-gray-50';
  row.innerHTML = ''
    + '<td class="px-2 py-2"><input type="text" value="' + escHtml(name) + '" placeholder="Nombre AC" class="w-full px-2 py-1.5 text-sm border border-gray-200 rounded" data-field="name" onchange="updateACTotals()"></td>'
    + '<td class="px-1 py-2"><select class="w-full px-1 py-1.5 text-xs border border-gray-200 rounded" data-field="type" onchange="onACTypeChange(this, \'' + id + '\')">'
    + '  <option value="expositiva"' + (type==='expositiva'?' selected':'') + '>Expos.</option>'
    + '  <option value="taller"' + (type==='taller'?' selected':'') + '>Taller</option>'
    + '  <option value="seminario"' + (type==='seminario'?' selected':'') + '>Semin.</option>'
    + '  <option value="proyecto"' + (type==='proyecto'?' selected':'') + '>Proy.</option>'
    + '  <option value="mixto"' + (type==='mixto'?' selected':'') + '>Mixto</option>'
    + '</select></td>'
    + '<td class="px-1 py-2"><input type="number" value="' + hs + '" min="0" max="40" step="0.5" class="w-14 px-1 py-1.5 text-sm text-center border border-gray-200 rounded" data-field="hs" oninput="updateACTotals()"></td>'
    + '<td class="px-1 py-2"><input type="number" value="' + has + '" min="0" max="40" step="0.5" class="w-14 px-1 py-1.5 text-sm text-center border border-gray-200 rounded" data-field="has" oninput="updateACTotals()"></td>'
    + '<td class="px-1 py-2"><input type="number" value="' + haut + '" min="0" max="40" step="0.5" class="w-14 px-1 py-1.5 text-sm text-center border border-gray-200 rounded" data-field="haut" oninput="updateACTotals()"></td>'
    + '<td class="px-1 py-2"><input type="number" value="' + ns + '" min="1" max="52" class="w-12 px-1 py-1.5 text-sm text-center border border-gray-200 rounded" data-field="ns" oninput="updateACTotals()"></td>'
    + '<td class="px-1 py-2 text-center font-bold text-umce-azul" data-field="sct">--</td>'
    + '<td class="px-1 py-2 text-center text-gray-600" data-field="ht">--</td>'
    + '<td class="px-1 py-2 text-center"><button onclick="removeACRow(\'' + id + '\')" class="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">'
    + '  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>'
    + '</button></td>';

  document.getElementById('acTableBody').appendChild(row);
  updateACTotals();
}

// removeACRow(id) -- elimina una fila
function removeACRow(id) {
  var row = document.getElementById(id);
  if (row) row.remove();
  updateACTotals();
}

// onACTypeChange(select, rowId) -- al cambiar tipo, pre-llena horas
function onACTypeChange(select, rowId) {
  var row = document.getElementById(rowId);
  if (!row) return;
  var preset = ACTIVITY_PRESETS[select.value] || ACTIVITY_PRESETS.mixto;
  row.querySelector('[data-field="hs"]').value = preset.hs;
  row.querySelector('[data-field="has"]').value = preset.has;
  row.querySelector('[data-field="haut"]').value = preset.haut;
  updateACTotals();
}

// updateACTotals() -- recalcula todos los totales del semestre
function updateACTotals() {
  var rows = document.querySelectorAll('#acTableBody tr');
  var totalHS = 0, totalHAs = 0, totalHAut = 0, totalSCT = 0, totalHT = 0;
  var weeklyAggregated = 0;
  var acCount = 0;

  // Almacenar datos de cada AC para el informe
  SCTState.modoB.acs = [];

  rows.forEach(function(row) {
    var hs = parseFloat(row.querySelector('[data-field="hs"]').value) || 0;
    var has = parseFloat(row.querySelector('[data-field="has"]').value) || 0;
    var haut = parseFloat(row.querySelector('[data-field="haut"]').value) || 0;
    var ns = parseInt(row.querySelector('[data-field="ns"]').value) || 1;
    var name = row.querySelector('[data-field="name"]').value || 'AC ' + (acCount + 1);
    var type = row.querySelector('[data-field="type"]').value || 'mixto';

    var result = calcSCT(hs, has, haut, ns);

    // Actualizar celdas readonly
    row.querySelector('[data-field="sct"]').textContent = result.sct;
    row.querySelector('[data-field="ht"]').textContent = result.htTotal.toFixed(0);

    // Colorear semaforo inline de la fila
    var semaforoColor = getSemaforoLevel(result.weekly);
    var sctCell = row.querySelector('[data-field="sct"]');
    sctCell.style.color = semaforoColor === 'verde' ? '#059669' : semaforoColor === 'amarillo' ? '#D97706' : '#DC2626';

    totalHS += hs;
    totalHAs += has;
    totalHAut += haut;
    totalSCT += result.sct;
    totalHT += result.htTotal;
    weeklyAggregated += result.weekly;
    acCount++;

    SCTState.modoB.acs.push({
      id: row.id,
      name: name,
      type: type,
      hs: hs, has: has, haut: haut,
      ns: ns,
      sct: result.sct,
      htTotal: result.htTotal,
      weekly: result.weekly,
      hSinc: result.hSinc,
      hAsinc: result.hAsinc,
      hAut: result.hAut
    });
  });

  // Actualizar totales en el footer de la tabla
  document.getElementById('totalHS').textContent = totalHS.toFixed(1);
  document.getElementById('totalHAs').textContent = totalHAs.toFixed(1);
  document.getElementById('totalHAut').textContent = totalHAut.toFixed(1);
  document.getElementById('totalSem').textContent = acCount > 0 ? '--' : '--';
  document.getElementById('totalSCT').textContent = totalSCT;
  document.getElementById('totalHT').textContent = totalHT.toFixed(0);

  // Actualizar panel de carga agregada
  var profile = getCheckedRadio('bProfile') || 'pregrado';
  var thresholds = AGGREGATE_THRESHOLDS[profile];

  document.getElementById('bTotalSCT').textContent = totalSCT;
  document.getElementById('bTotalHT').textContent = totalHT.toFixed(0);
  document.getElementById('bWeeklyLoad').textContent = weeklyAggregated.toFixed(1);

  // Semaforo agregado
  var aggLevel = weeklyAggregated <= thresholds.verde ? 'verde' :
                 weeklyAggregated <= thresholds.amarillo ? 'amarillo' : 'rojo';
  var sIcon = document.getElementById('bSemaforoIcon');
  var sLabel = document.getElementById('bSemaforoLabel');
  sIcon.className = 'semaforo text-lg w-10 h-10 mx-auto ' + aggLevel;
  if (aggLevel === 'verde') {
    sIcon.innerHTML = '&#10003;';
    sLabel.textContent = 'Sostenible';
    document.getElementById('bWeeklyLoad').style.color = '#059669';
  } else if (aggLevel === 'amarillo') {
    sIcon.innerHTML = '!';
    sLabel.textContent = 'Alerta';
    document.getElementById('bWeeklyLoad').style.color = '#D97706';
  } else {
    sIcon.innerHTML = '&#10007;';
    sLabel.textContent = 'Sobrecarga';
    document.getElementById('bWeeklyLoad').style.color = '#DC2626';
  }
}

// escHtml(str) -- escapa HTML para atributos
function escHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

**JS: Navegacion del wizard Modo B**

```js
var currentStepB = 1, maxStepBReached = 1;

// goToStepB(step) -- navega entre pasos del wizard B
function goToStepB(step) {
  if (step > maxStepBReached + 1) return;
  if (step >= 3) renderBResults();
  if (step >= 4) renderBReport();

  currentStepB = step;
  if (step > maxStepBReached) maxStepBReached = step;

  document.querySelectorAll('#modeB .wizard-step').forEach(function(s) { s.classList.remove('active'); });
  var stepEl = document.getElementById('stepB' + step);
  if (stepEl) stepEl.classList.add('active');

  // Update progress dots (usa dotB1..dotB4, lineB1..lineB3)
  for (var i = 1; i <= 4; i++) {
    var dot = document.getElementById('dotB' + i);
    if (!dot) continue;
    dot.classList.remove('active', 'completed');
    if (i < step) { dot.classList.add('completed'); dot.innerHTML = '&#10003;'; }
    else if (i === step) { dot.classList.add('active'); dot.textContent = i; }
    else { dot.textContent = i; }
    var line = document.getElementById('lineB' + i);
    if (line) line.classList.toggle('filled', i < step);
  }

  var el = document.getElementById('stepB' + step);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
```

**JS: Render de resultados del semestre (Paso B3)**

```js
// renderBResults() -- genera la vista de resultados del semestre
function renderBResults() {
  var acs = SCTState.modoB.acs;
  if (acs.length === 0) return;

  // Calcular agregados
  var totalHSinc = 0, totalHAsinc = 0, totalHAut = 0;
  acs.forEach(function(ac) {
    totalHSinc += ac.hSinc;
    totalHAsinc += ac.hAsinc;
    totalHAut += ac.hAut;
  });

  // Donut del semestre
  renderDonut(totalHSinc, totalHAsinc, totalHAut, 'donutChartB');

  // Barras semanales agregadas
  var weeklyAgg = acs.reduce(function(s, ac) { return s + ac.weekly; }, 0);
  var maxNS = Math.max.apply(null, acs.map(function(ac) { return ac.ns; }));
  renderWeeklyBars(weeklyAgg, maxNS, 'weeklyBarsB');

  // Doble formato semestre
  var totalHT = totalHSinc + totalHAsinc + totalHAut;
  document.getElementById('bFmtHP').textContent = totalHSinc.toFixed(0) + ' hrs';
  document.getElementById('bFmtHA').textContent = (totalHAsinc + totalHAut).toFixed(0) + ' hrs';
  document.getElementById('bFmtHT').textContent = totalHT.toFixed(0) + ' hrs';
  document.getElementById('bFmtHsinc').textContent = totalHSinc.toFixed(0) + ' hrs';
  document.getElementById('bFmtHasinc').textContent = totalHAsinc.toFixed(0) + ' hrs';
  document.getElementById('bFmtHaut').textContent = totalHAut.toFixed(0) + ' hrs';
  document.getElementById('bFmtHT_ext').textContent = totalHT.toFixed(0) + ' hrs';

  // Tabla resumen por AC
  var tbody = document.getElementById('bResultsTableBody');
  tbody.innerHTML = acs.map(function(ac) {
    var level = getSemaforoLevel(ac.weekly);
    var badge = '<span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold badge-' + level + '">' + ac.weekly.toFixed(1) + ' hrs/sem</span>';
    return '<tr class="border-b border-gray-100">'
      + '<td class="px-3 py-2 font-medium">' + escHtml(ac.name) + '</td>'
      + '<td class="px-2 py-2 text-center text-xs">' + ac.type + '</td>'
      + '<td class="px-2 py-2 text-center">' + ac.sct + '</td>'
      + '<td class="px-2 py-2 text-center">' + ac.htTotal.toFixed(0) + '</td>'
      + '<td class="px-2 py-2 text-center">' + badge + '</td>'
      + '</tr>';
  }).join('');
}
```

**JS: Transicion Modo A hacia Modo B**

```js
// importFromModoA() -- importa la AC del Modo A como primera fila del Modo B
function importFromModoA() {
  var a = SCTState.modoA;
  if (a.courseName || a.hs > 0 || a.has > 0 || a.haut > 0) {
    addACRow({
      name: a.courseName,
      type: a.activityType,
      hs: a.hs,
      has: a.has,
      haut: a.haut,
      ns: a.ns
    });
  }
}

// Se llama dentro de switchMode() cuando se cambia a modoB
// y hay datos en modoA que no se han importado aun
```

### Inputs

| Dato | Tipo | Fuente | Scope |
|------|------|--------|-------|
| bProgramName | string | input#bProgramName | Semestre (compartido) |
| bSemester | string | input#bSemester | Semestre (compartido) |
| bProfile | enum | radio[name=bProfile] | Semestre (compartido) |
| bFormato | enum | radio[name=bFormato] | Semestre (default por AC) |
| AC.name | string | input en fila | Por AC |
| AC.type | enum | select en fila | Por AC |
| AC.hs | float | input en fila | Por AC |
| AC.has | float | input en fila | Por AC |
| AC.haut | float | input en fila | Por AC |
| AC.ns | int | input en fila | Por AC |

### Outputs

**Datos calculados por AC:**
- `sct`, `htTotal`, `weekly`, `hSinc`, `hAsinc`, `hAut` (via `calcSCT()`).

**Datos agregados del semestre:**
- `totalSCT`: suma de SCT de todas las ACs.
- `totalHT`: suma de HT de todas las ACs.
- `weeklyAggregated`: suma de carga semanal de todas las ACs (proxy de la carga real del estudiante).
- `totalHSinc`, `totalHAsinc`, `totalHAut`: triple obligatorio agregado.
- `hp_semestre = totalHSinc`, `ha_semestre = totalHAsinc + totalHAut`.
- Semaforo agregado: nivel de carga segun perfil.

**Datos para el informe (Bloque 1 + Bloque 2 Modo B):**

```js
var metadataB = {
  mode: 'B',
  programName: SCTState.modoB.semesterLabel || getVal('bProgramName'),
  semester: getVal('bSemester'),
  profile: getCheckedRadio('bProfile'),
  bloque2: {
    tipo: 'tabla_acs',
    acs: SCTState.modoB.acs,  // Array con todos los datos por AC
    totalSCT: totalSCT,
    totalHT: totalHT,
    weeklyAggregated: weeklyAggregated,
    semaforoLevel: aggLevel
  }
};
```

**Sobre presupuestario (JSON para M3/Planificador):**

```js
// generateBudgetEnvelope() -- genera el sobre presupuestario para cada AC
function generateBudgetEnvelope() {
  return SCTState.modoB.acs.map(function(ac) {
    return {
      name: ac.name,
      sct: ac.sct,
      htTotal: ac.htTotal,
      hSinc: ac.hSinc,
      hAsinc: ac.hAsinc,
      hAut: ac.hAut,
      weekly: ac.weekly,
      tolerance: 0.10  // +-10%
    };
  });
}

// Se persiste en localStorage para consumo del Planificador (M3)
// localStorage.setItem('sctBudgetEnvelope', JSON.stringify(generateBudgetEnvelope()));
```

### Dependencias

- `calcSCT()` del motor compartido.
- `renderDonut(hSinc, hAsinc, hAut, targetSvgId)` -- con targetSvgId 'donutChartB'.
- `renderSemaforo()` -- para semaforo inline por fila.
- `renderWeeklyBars(weekly, ns, targetContainerId)` -- con targetContainerId 'weeklyBarsB'.
- `ACTIVITY_PRESETS` constante compartida con Modo A.
- `FORMATOS` constante (ya existe).
- `getSemaforoLevel()`, `checkAutonomia()` del motor compartido.
- `AGGREGATE_THRESHOLDS` constante (NUEVA).

### Wireframe ASCII detallado

```
PASO B1: Configuracion del semestre
+================================================================+
| [Explain box: Configuracion del semestre]                      |
+----------------------------------------------------------------+
| Programa / carrera    | Semestre / periodo                     |
| [__________________]  | [________________]                     |
+----------------------------------------------------------------+
| Perfil de estudiantes (aplica a todas las ACs):                |
| [x] Pregrado    [ ] Postgrado    [ ] Ed. Continua              |
+----------------------------------------------------------------+
| Formato base del semestre:                                     |
| [x] Semestral (18 sem)    [ ] Modular (8 sem)                 |
+----------------------------------------------------------------+
|                       [Agregar actividades curriculares ->]     |
+================================================================+

PASO B2: Tabla de actividades del semestre
+================================================================+
| [Explain box: Agrega cada AC del semestre]                     |
+----------------------------------------------------------------+
| +-- Tabla editable de ACs --------------------------------+    |
| | AC                  | Tipo   | HS  | HAs | HAut|Sem|SCT|HT| |
| |---------------------|--------|-----|-----|-----|---|---|--|  |
| | Metod. Cualitativa  | Semin. | 2.0 | 2.0 | 0.5 |18 | 3 |81| x|
| | Invest. Educativa   | Proy.  | 1.0 | 1.5 | 2.5 |18 | 4 |90| x|
| | Didactica General   | Expos. | 2.0 | 1.0 | 1.5 |18 | 3 |81| x|
| | Practica Inicial    | Taller | 1.5 | 2.0 | 1.0 |18 | 3 |81| x|
| |---------------------|--------|-----|-----|-----|---|---|--|  |
| | Total semestre      |        | 6.5 | 6.5 | 5.5 |   |13|333|  |
| +----------------------------------------------------------+    |
| [+ Agregar actividad curricular]                               |
+----------------------------------------------------------------+
| +-- Carga agregada del semestre ---+                           |
| | [13]         | [333]      | [18.5]      | [sem]  |          |
| | SCT semestre | Hrs totales| Hrs/sem agr.| Estado  |          |
| +---------------------------------+                            |
+----------------------------------------------------------------+
| [<- Volver]             [Ver resultados del semestre ->]        |
+================================================================+

PASO B3: Resultados del semestre
+================================================================+
| [Explain box: Resultados consolidados]                         |
+----------------------------------------------------------------+
| +-- Tabla resumen ---------+                                   |
| | AC          |Tipo|SCT|HT | Carga semanal                    |
| |-------------|----+---+----|----------------------------       |
| | Metod. Cual.| Sem|  3| 81| [========] 4.5 hrs/sem (verde)   |
| | Invest. Ed. | Pro|  4| 90| [==========] 5.0 hrs/sem (verde) |
| | Didact. Gen.| Exp|  3| 81| [========] 4.5 hrs/sem (verde)   |
| | Pract. Ini. | Tal|  3| 81| [========] 4.5 hrs/sem (verde)   |
| +-----------------------------+                                |
+----------------------------------------------------------------+
| Distribucion del semestre:                                     |
| [DONUT]  Sinc: 117 hrs (35%)                                  |
|          Asinc: 117 hrs (35%)                                  |
|          Aut: 99 hrs (30%)                                     |
+----------------------------------------------------------------+
| Formatos del semestre:                                         |
| +--- UGCI bipartito ---+  +--- Extendido tripartito ------+   |
| | HP: 117 hrs           |  | Sinc: 117 hrs               |   |
| | HA: 216 hrs           |  | Asinc: 117 hrs              |   |
| | HT: 333 hrs           |  | Aut: 99 hrs                 |   |
| +-----------------------+  | HT: 333 hrs                 |   |
|                            +-------------------------------+   |
+----------------------------------------------------------------+
| Carga semanal agregada:                                        |
| S1  |============================| 18.5h                       |
| S2  |============================| 18.5h                       |
| ...                                                            |
+----------------------------------------------------------------+
| [<- Volver]                         [Ver informe ->]           |
+================================================================+

PASO B4: Informe del semestre
+================================================================+
| UMCE | Informe de Calculo SCT - Semestre | UDFV                |
+----------------------------------------------------------------+
| BLOQUE 1: Resultado PAC semestral                              |
| Programa:  Ped. en Ed. Basica                                  |
| Periodo:   2do sem. 2026                                       |
| Perfil:    Postgrado                                           |
| Total SCT: 13                                                  |
| Total HT:  333 hrs                                             |
| +--- UGCI ---+  +--- Extendido ---+                           |
| | HP: 117    |  | Sinc: 117       |                            |
| | HA: 216    |  | Asinc: 117      |                            |
| | HT: 333   |  | Aut: 99         |                            |
+----------------------------------------------------------------+
| BLOQUE 2: Anexo metodologico (Modo B)                          |
| +-- Tabla de ACs con subtotales --+                            |
| | AC          |Tipo| HS |HAs|HAut|NS |SCT| HT |              |
| |-------------|----|----|---|----|----|---|-----|              |
| | Metod. Cual.|Sem.| 2.0|2.0| 0.5| 18 | 3 | 81 |              |
| | Invest. Ed. |Proy| 1.0|1.5| 2.5| 18 | 4 | 90 |              |
| | Didact. Gen.|Exp.| 2.0|1.0| 1.5| 18 | 3 | 81 |              |
| | Pract. Ini. |Tal.| 1.5|2.0| 1.0| 18 | 3 | 81 |              |
| |-------------|----|----|---|----|----|---|-----|              |
| | TOTALES     |    | 6.5|6.5| 5.5|    |13 |333 |              |
| +-------------------------------------------------+            |
| Semaforos: Carga semanal agr. 18.5 hrs -> [color]              |
+----------------------------------------------------------------+
| Formula: SCT = ceil(HT / 27). 1 SCT = 27 h.                  |
| Modo de calculo: B (Calcular un semestre)                      |
| Fecha: 13 de abril de 2026                                     |
+----------------------------------------------------------------+
| [<- Volver]  [Imprimir/PDF]  [Exportar JSON]  [Nuevo calculo] |
+================================================================+
```

---

## Resumen de archivos a crear/modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/public/virtualizacion-sct.html` | MODIFICAR | Se reestructura: agrega selector de modo, contenedores modeA/modeB, refactoriza JS en funciones compartidas, agrega todo el HTML/JS del Modo B |
| `src/public/shared/sct-engine.js` | CREAR (opcional) | Si el archivo crece demasiado, extraer el motor de calculo compartido a un archivo separado. Sino, mantener todo inline en el HTML |

**Nota sobre la decision inline vs. archivo separado:**
El v1 actual tiene todo el JS inline (en un bloque `<script>` al final del HTML). Esto es coherente con el stack irrompible (vanilla JS, sin bundler). Para v3, si el JS total supera ~800 lineas, conviene extraer el motor compartido a `src/public/shared/sct-engine.js` cargado con `<script src="/shared/sct-engine.js"></script>`. Las funciones de UI de cada modo permanecen inline en el HTML.

**Estimacion de tamano del codigo nuevo:**
- `ACTIVITY_PRESETS`, `AGGREGATE_THRESHOLDS`: ~40 lineas.
- `calcSCT()`, `getSemaforoLevel()`, `checkAutonomia()`: ~30 lineas.
- Selector de tipo de actividad + bindings: ~60 lineas.
- Doble formato output + `updateDualFormat()`: ~50 lineas HTML + 15 lineas JS.
- Selector de modo + `switchMode()`: ~40 lineas HTML + 30 lineas JS.
- Modo B completo (HTML 4 pasos + JS): ~400 lineas HTML + 250 lineas JS.
- Refactorizacion de funciones existentes: ~50 lineas de cambios.
- **Total estimado: ~600-700 lineas nuevas**, sumadas a las ~1500 existentes = ~2200 lineas.

---

## Orden de implementacion recomendado

1. **Refactorizar motor de calculo**: Extraer `calcSCT()`, `getSemaforoLevel()`, `checkAutonomia()` como funciones puras. Verificar que el Modo A funciona identico con estas funciones refactorizadas.

2. **Agregar selector de tipo de actividad al Modo A**: HTML + `ACTIVITY_PRESETS` + `applyActivityPreset()` + `bindActivityType()`. Verificar que pre-llena correctamente y que los valores son editables.

3. **Agregar doble formato output al Modo A**: HTML en Paso A2 + `updateDualFormat()` integrado en `runCalc()`. Verificar que UGCI bipartito y tripartito se calculan correctamente.

4. **Agregar selector de modo (UI Shell)**: HTML del selector + `switchMode()` + contenedores `modeA`/`modeB`. Verificar que el Modo A funciona identico envuelto en `#modeA`.

5. **Implementar Modo B pasos B1-B2**: HTML del formulario semestre + tabla editable + `addACRow()` + `updateACTotals()`. Verificar calculo en tiempo real, semaforos, agregar/eliminar filas.

6. **Implementar Modo B pasos B3-B4**: Resultados + informe. Verificar donut, barras, tabla resumen, doble formato, impresion.

7. **Implementar transicion A->B**: `importFromModoA()` + persistencia en `SCTState`.

8. **Persistencia localStorage**: Guardar/restaurar `SCTState` entre visitas.

---

*Plan de componentes v1.0. Cubre UI Shell, Modo A (v1 mejorada) y Modo B (semestre). El Modo C se planificara en un documento separado cuando A y B esten implementados.*
