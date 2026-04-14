# Plan de componentes compartidos: Motor de Calculo, Generador de Informe y Capa de Datos

**Version**: 1.0
**Fecha**: 13 de abril de 2026
**Documento base**: propuesta-calculadora-sct-v3-consolidada.md (v3.1)
**Patron**: Vanilla JS, objetos namespace, sin modulos ES6, sin npm/build tools
**Consumidor**: virtualizacion-sct.html (inline script al final del archivo)

---

## 1. SCTEngine -- Motor de Calculo

### 1.1. Constantes y tablas de datos

```javascript
// ============================================================
// SCTEngine — Constantes
// ============================================================

var SCT_HOURS = 27;

// --- Formatos institucionales ---
var FORMATOS = {
  semestral:    { semanas: 18, sctFijo: null, label: 'Semestral (18 sem)' },
  modulo:       { semanas: 8,  sctFijo: null, label: 'Modulo (8 sem)' },
  bloque_breve: { semanas: 5,  sctFijo: null, label: 'Bloque breve (5 sem)' },
  cuech:        { semanas: 16, sctFijo: 2,    label: 'CUECH Subete (16 sem, 2 SCT)' }
};

// --- Tabla de horas base por nivel cognitivo (corazon del Modo C) ---
// Cada nivel mapea a un rango de horas por SCT y un multiplicador.
// Fuente: triangulacion Wake Forest Workload Estimator + CTAWC + DOK (Webb).
// horasMin/horasMax = rango de horas por SCT para ese nivel.
// multMin/multMax = multiplicador sobre la base de 27 h/SCT.
// horasBase = punto medio del rango, usado como default en calculos.
var HOURS_BY_LEVEL = {
  1: { label: 'Recordar / Comprender', dok: 1, horasMin: 27, horasMax: 27,  multMin: 1.00, multMax: 1.00, horasBase: 27 },
  2: { label: 'Aplicar',              dok: 2, horasMin: 27, horasMax: 30,  multMin: 1.00, multMax: 1.11, horasBase: 28.5 },
  3: { label: 'Analizar / Evaluar',   dok: 3, horasMin: 30, horasMax: 35,  multMin: 1.11, multMax: 1.30, horasBase: 32.5 },
  4: { label: 'Crear',                dok: 4, horasMin: 33, horasMax: 40,  multMin: 1.22, multMax: 1.48, horasBase: 36.5 }
};

// --- Ratios Laurillard: sync / async / auto por tipo ---
// Fuente: propuesta consolidada v3.1, seccion 4.3.2, Paso 3.
// Cada valor es un objeto { sync, async, auto } que suma 1.0.
var LAURILLARD_RATIOS = {
  adquisicion:   { sync: 0.50, async: 0.20, auto: 0.30 },
  investigacion: { sync: 0.20, async: 0.35, auto: 0.45 },
  practica:      { sync: 0.40, async: 0.30, auto: 0.30 },
  produccion:    { sync: 0.15, async: 0.30, auto: 0.55 },
  discusion:     { sync: 0.35, async: 0.45, auto: 0.20 },
  colaboracion:  { sync: 0.30, async: 0.50, auto: 0.20 }
};

// --- Mapeo: modalidad de trabajo → tipo Laurillard dominante ---
// "trabajo_colaborativo" y "produccion_integrada" son promedios de 2 tipos.
// El motor calcula el promedio de los ratios correspondientes.
var MODALITY_TO_LAURILLARD = {
  estudio_individual:   ['adquisicion'],
  produccion_escrita:   ['produccion'],
  practica_aplicada:    ['practica'],
  trabajo_colaborativo: ['discusion', 'colaboracion'],
  produccion_integrada: ['produccion', 'investigacion']
};

// --- Nivel cognitivo default por modalidad de trabajo ---
// Fuente: consolidada v3.1, seccion 4.3.1 (pre-sugeridos).
// Cada modalidad tiene un rango default [min, max].
var MODALITY_DEFAULTS = {
  estudio_individual:   { nivelMin: 1, nivelMax: 2, nivelDefault: 1 },
  produccion_escrita:   { nivelMin: 2, nivelMax: 3, nivelDefault: 2 },
  practica_aplicada:    { nivelMin: 2, nivelMax: 3, nivelDefault: 2 },
  trabajo_colaborativo: { nivelMin: 2, nivelMax: 3, nivelDefault: 2 },
  produccion_integrada: { nivelMin: 3, nivelMax: 4, nivelDefault: 3 }
};

// --- Labels de modalidades para la interfaz ---
var MODALITY_LABELS = {
  estudio_individual:   'Estudio individual',
  produccion_escrita:   'Produccion escrita',
  practica_aplicada:    'Practica aplicada',
  trabajo_colaborativo: 'Trabajo colaborativo',
  produccion_integrada: 'Produccion integrada'
};

// --- Distribucion default por area disciplinar (fallback) ---
// Fuente: consolidada v3.1, seccion 4.3.2, tabla de fallback.
// Proporciones suman 1.0. Se usan cuando NO se marcan modalidades.
var DISCIPLINE_DEFAULTS = {
  ciencias:    { estudio_individual: 0.20, produccion_escrita: 0.10, practica_aplicada: 0.40, trabajo_colaborativo: 0.10, produccion_integrada: 0.20 },
  humanidades: { estudio_individual: 0.40, produccion_escrita: 0.30, practica_aplicada: 0.05, trabajo_colaborativo: 0.15, produccion_integrada: 0.10 },
  educacion:   { estudio_individual: 0.25, produccion_escrita: 0.20, practica_aplicada: 0.15, trabajo_colaborativo: 0.20, produccion_integrada: 0.20 },
  artes:       { estudio_individual: 0.15, produccion_escrita: 0.10, practica_aplicada: 0.30, trabajo_colaborativo: 0.15, produccion_integrada: 0.30 },
  tecnologia:  { estudio_individual: 0.15, produccion_escrita: 0.10, practica_aplicada: 0.35, trabajo_colaborativo: 0.10, produccion_integrada: 0.30 }
};

// --- Parametros por perfil de estudiante ---
// maxHrsSemana: carga maxima por AC por semana (Paso 4).
// maxHrsSemanaTotal: carga total maxima del estudiante en todas sus ACs.
// concurrentesDefault: ACs concurrentes tipicas.
// autRangoMin/Max: rango de autonomo permitido (Doc. N. 004-2020 = 25-40%).
// Umbrales semaforo para carga semanal.
var PROFILE_PARAMS = {
  pregrado: {
    label: 'Pregrado',
    maxHrsSemanaAC: 12,
    maxHrsSemanaTotal: 45,
    concurrentesDefault: 5,
    concurrentesRango: [5, 7],
    autRangoMin: 0.25,
    autRangoMax: 0.40,
    semaforoVerde: 10,
    semaforoAmarillo: 12,
    syncAdjust: 1.0  // sin ajuste
  },
  postgrado: {
    label: 'Postgrado',
    maxHrsSemanaAC: 10,
    maxHrsSemanaTotal: 15,
    concurrentesDefault: 3,
    concurrentesRango: [2, 4],
    autRangoMin: 0.25,
    autRangoMax: 0.40,
    semaforoVerde: 8,
    semaforoAmarillo: 10,
    syncAdjust: 0.85  // incrementa async/auto, reduce sync
  },
  continua: {
    label: 'Ed. Continua',
    maxHrsSemanaAC: 8,
    maxHrsSemanaTotal: 8,
    concurrentesDefault: 1,
    concurrentesRango: [1, 2],
    autRangoMin: 0.25,
    autRangoMax: 0.40,
    semaforoVerde: 6,
    semaforoAmarillo: 8,
    syncAdjust: 0.70  // mayor flexibilidad, menos sync
  }
};

// --- Bloom → DOK mapping (slider value → DOK level) ---
// Identidad directa por diseno (4 niveles Bloom agrupados = 4 DOK).
var BLOOM_TO_DOK = {
  1: 1,  // Recordar/Comprender → Recuperacion
  2: 2,  // Aplicar → Habilidades y conceptos
  3: 3,  // Analizar/Evaluar → Pensamiento estrategico
  4: 4   // Crear → Pensamiento extendido
};

// --- Verbos ejemplo por nivel (para tooltips y UI) ---
var VERB_EXAMPLES = {
  1: {
    label: 'Recordar / Comprender',
    verbos: ['listar', 'definir', 'identificar', 'explicar', 'clasificar', 'resumir'],
    tooltip: 'El estudiante reproduce o reformula informacion.'
  },
  2: {
    label: 'Aplicar',
    verbos: ['resolver', 'demostrar', 'implementar', 'utilizar', 'calcular'],
    tooltip: 'El estudiante usa conocimiento en situaciones tipicas.'
  },
  3: {
    label: 'Analizar / Evaluar',
    verbos: ['comparar', 'diferenciar', 'argumentar', 'justificar', 'criticar'],
    tooltip: 'El estudiante descompone, relaciona o emite juicio fundamentado.'
  },
  4: {
    label: 'Crear',
    verbos: ['disenar', 'producir', 'formular', 'investigar', 'componer'],
    tooltip: 'El estudiante genera un producto original.'
  }
};

// --- Tipos de actividad para Modo A (selector pre-fill) ---
// Cada tipo tiene horas sugeridas como punto de partida editable.
// Basados en Wake Forest Workload Estimator + catalogo 37 e-actividades UMCE.
var ACTIVITY_TYPES = {
  expositiva: {
    label: 'Expositiva',
    hs: 2.0, has: 1.0, haut: 1.5,
    laurillard: 'adquisicion',
    desc: 'Clase magistral, conferencia, presentacion expositiva'
  },
  taller: {
    label: 'Taller',
    hs: 1.5, has: 2.0, haut: 1.0,
    laurillard: 'practica',
    desc: 'Ejercicios guiados, practica supervisada, laboratorio'
  },
  seminario: {
    label: 'Seminario',
    hs: 2.0, has: 1.5, haut: 1.5,
    laurillard: 'discusion',
    desc: 'Debate, discusion grupal, analisis de casos'
  },
  proyecto: {
    label: 'Proyecto',
    hs: 1.0, has: 1.5, haut: 2.5,
    laurillard: 'produccion',
    desc: 'Proyecto integrador, investigacion, portafolio'
  },
  mixto: {
    label: 'Mixto',
    hs: 1.5, has: 1.5, haut: 1.5,
    laurillard: null,
    desc: 'Combinacion de multiples modalidades'
  }
};

// --- Alertas de coherencia nivel-modalidad (Modo C) ---
var COHERENCE_ALERTS = [
  {
    condition: function(modalidades, niveles) {
      var soloEstudio = modalidades.length === 1 && modalidades[0] === 'estudio_individual';
      var nivelAlto = niveles.estudio_individual === 4;
      return soloEstudio && nivelAlto;
    },
    message: 'El nivel Crear tipicamente requiere produccion integrada o produccion escrita. Desea agregar una modalidad de produccion?',
    severity: 'warning'
  },
  {
    condition: function(modalidades, niveles) {
      var soloProduccion = modalidades.length === 1 && modalidades[0] === 'produccion_integrada';
      var nivelBajo = niveles.produccion_integrada === 1;
      return soloProduccion && nivelBajo;
    },
    message: 'Un proyecto o investigacion tipicamente implica niveles de Analizar o Crear. Desea ajustar el nivel cognitivo?',
    severity: 'warning'
  },
  {
    condition: function(modalidades, niveles) {
      if (modalidades.length !== 1) return false;
      var nivel = niveles[modalidades[0]];
      return nivel >= 3;
    },
    message: 'Las actividades curriculares de nivel avanzado suelen combinar mas de una modalidad de trabajo.',
    severity: 'info'
  }
];
```

### 1.2. API publica — Funciones

```javascript
// ============================================================
// SCTEngine — Funciones publicas
// ============================================================

var SCTEngine = {};

// ----------------------------------------------------------
// 1. calculateSCT(horasTotal)
//    Formula canonica. Funcion base que usan todos los modos.
//
//    @param {number} horasTotal - Horas totales cronologicas (HT)
//    @returns {object} { sct: number, horasTotal: number, exact: number, formula: string }
// ----------------------------------------------------------
SCTEngine.calculateSCT = function(horasTotal) {
  var ht = Math.max(0, horasTotal);
  var exact = ht / SCT_HOURS;
  var sct = Math.ceil(exact);
  return {
    sct: sct,
    horasTotal: ht,
    exact: exact,
    formula: 'ceil(' + ht.toFixed(1) + ' / ' + SCT_HOURS + ') = ' + sct
  };
};

// ----------------------------------------------------------
// 2. calculateFromWeekly(hs, has, haut, semanas)
//    Modo A: calcula desde horas semanales.
//    Preserva la logica exacta de la v1 actual.
//
//    @param {number} hs     - Horas sincronicas por semana
//    @param {number} has    - Horas asincronicas por semana
//    @param {number} haut   - Horas autonomas por semana
//    @param {number} semanas - Numero de semanas (NS)
//    @returns {object} {
//      ht: number,           // horas totales
//      sct: number,          // creditos SCT
//      exact: number,        // valor exacto antes de ceil
//      weekly: number,       // carga semanal total
//      triple: { hSinc: number, hAsinc: number, hAut: number },
//      ugci: { hp: number, ha: number },
//      formula: string
//    }
// ----------------------------------------------------------
SCTEngine.calculateFromWeekly = function(hs, has, haut, semanas) {
  hs = Math.max(0, parseFloat(hs) || 0);
  has = Math.max(0, parseFloat(has) || 0);
  haut = Math.max(0, parseFloat(haut) || 0);
  semanas = Math.max(1, parseInt(semanas) || 1);

  var weekly = hs + has + haut;
  var ht = weekly * semanas;
  var result = SCTEngine.calculateSCT(ht);

  var hSinc = hs * semanas;
  var hAsinc = has * semanas;
  var hAutTotal = haut * semanas;

  return {
    ht: ht,
    sct: result.sct,
    exact: result.exact,
    weekly: weekly,
    semanas: semanas,
    triple: {
      hSinc: hSinc,
      hAsinc: hAsinc,
      hAut: hAutTotal
    },
    ugci: {
      hp: hSinc,               // HP = horas sincronicas
      ha: hAsinc + hAutTotal   // HA = asincronicas + autonomas
    },
    weeklyTriple: {
      hs: hs,
      has: has,
      haut: haut
    },
    formula: '((' + hs + ' + ' + has + ' + ' + haut + ') x ' + semanas + ') / 27 = '
             + result.exact.toFixed(3) + ' -> ' + result.sct
  };
};

// ----------------------------------------------------------
// 3. calculateSemester(arrayACs)
//    Modo B: agrega multiples ACs de un semestre.
//
//    @param {Array<object>} arrayACs - Array de objetos, cada uno con:
//      { nombre: string, hs: number, has: number, haut: number,
//        semanas: number, tipo?: string }
//    @returns {object} {
//      acs: Array<object>,      // cada AC con su calculo individual
//      htTotal: number,         // HT del semestre
//      sctTotal: number,        // suma de SCT individuales
//      tripleTotal: { hSinc, hAsinc, hAut },
//      ugciTotal: { hp, ha },
//      cargaSemanal: number,    // carga semanal promedio ponderada
//      cargaSemanalMax: number, // carga maxima en una semana
//      semaforo: string         // 'verde' | 'amarillo' | 'rojo'
//    }
// ----------------------------------------------------------
SCTEngine.calculateSemester = function(arrayACs) {
  var acs = [];
  var htTotal = 0;
  var sctTotal = 0;
  var hSincTotal = 0;
  var hAsincTotal = 0;
  var hAutTotal = 0;

  for (var i = 0; i < arrayACs.length; i++) {
    var ac = arrayACs[i];
    var calc = SCTEngine.calculateFromWeekly(ac.hs, ac.has, ac.haut, ac.semanas);
    calc.nombre = ac.nombre || ('AC ' + (i + 1));
    calc.tipo = ac.tipo || 'mixto';

    acs.push(calc);
    htTotal += calc.ht;
    sctTotal += calc.sct;
    hSincTotal += calc.triple.hSinc;
    hAsincTotal += calc.triple.hAsinc;
    hAutTotal += calc.triple.hAut;
  }

  // Carga semanal: sumar las cargas semanales de todas las ACs activas
  // en la misma semana. Simplificacion: todas las ACs corren en paralelo.
  var cargaSemanal = 0;
  for (var j = 0; j < acs.length; j++) {
    cargaSemanal += acs[j].weekly;
  }

  // Semaforo basado en carga semanal agregada
  var semaforo = 'verde';
  if (cargaSemanal > 12) semaforo = 'rojo';
  else if (cargaSemanal > 10) semaforo = 'amarillo';

  return {
    acs: acs,
    htTotal: htTotal,
    sctTotal: sctTotal,
    tripleTotal: {
      hSinc: hSincTotal,
      hAsinc: hAsincTotal,
      hAut: hAutTotal
    },
    ugciTotal: {
      hp: hSincTotal,
      ha: hAsincTotal + hAutTotal
    },
    cargaSemanal: cargaSemanal,
    cargaSemanalMax: cargaSemanal, // mismo valor en modelo simplificado
    semaforo: semaforo
  };
};

// ----------------------------------------------------------
// 4. calculateFromCognitive(nivelPredominante, perfil, modalidad, semanas, sctPropuesto)
//    Modo C, Paso 1: estima HT desde nivel cognitivo predominante.
//
//    @param {number} nivelPredominante - 1..4 (el mas alto de los seleccionados)
//    @param {string} perfil - 'pregrado' | 'postgrado' | 'continua'
//    @param {string} modalidad - 'virtual' | 'semipresencial' (de la AC, no del trabajo)
//    @param {number} semanas - duracion en semanas
//    @param {number|null} sctPropuesto - si hay SCT fijo (ej: CUECH=2), se usa
//    @returns {object} {
//      ht: number,
//      sct: number,
//      horasBasePorSCT: number,  // horas base usadas del nivel
//      multiplicador: number,
//      nivelUsado: number,
//      semanasViable: number,    // semanas sugeridas si no se paso valor
//      cargaSemanalEstimada: number
//    }
// ----------------------------------------------------------
SCTEngine.calculateFromCognitive = function(nivelPredominante, perfil, modalidad, semanas, sctPropuesto) {
  var nivel = Math.min(4, Math.max(1, parseInt(nivelPredominante) || 1));
  var profileParams = PROFILE_PARAMS[perfil] || PROFILE_PARAMS.pregrado;
  var levelData = HOURS_BY_LEVEL[nivel];

  // Si hay SCT fijo (CUECH u otro formato con creditos predeterminados)
  if (sctPropuesto !== null && sctPropuesto !== undefined && sctPropuesto > 0) {
    var htFijo = sctPropuesto * levelData.horasBase;
    var cargaSemanalFijo = semanas > 0 ? htFijo / semanas : htFijo;

    // Si la carga semanal excede el maximo del perfil, sugerir mas semanas
    var semanasViable = semanas;
    if (cargaSemanalFijo > profileParams.maxHrsSemanaAC) {
      semanasViable = Math.ceil(htFijo / profileParams.maxHrsSemanaAC);
    }

    return {
      ht: htFijo,
      sct: sctPropuesto,
      horasBasePorSCT: levelData.horasBase,
      multiplicador: levelData.horasBase / SCT_HOURS,
      nivelUsado: nivel,
      semanas: semanas,
      semanasViable: semanasViable,
      cargaSemanalEstimada: cargaSemanalFijo
    };
  }

  // Sin SCT fijo: estimar desde carga semanal viable
  // Usa el maximo de hrs/semana del perfil para derivar semanas
  // y luego calcular HT y SCT.
  var maxSemanal = profileParams.maxHrsSemanaAC;
  var htEstimado = maxSemanal * semanas;
  var result = SCTEngine.calculateSCT(htEstimado);

  // Refinar: calcular HT real usando horasBase del nivel
  var htReal = result.sct * levelData.horasBase;
  var cargaSemanal = semanas > 0 ? htReal / semanas : htReal;

  // Si la carga semanal con horasBase excede el maximo, ajustar SCT a la baja
  if (cargaSemanal > maxSemanal && semanas > 0) {
    htReal = maxSemanal * semanas;
    result = SCTEngine.calculateSCT(htReal);
    htReal = result.sct * levelData.horasBase;
    cargaSemanal = htReal / semanas;
  }

  return {
    ht: htReal,
    sct: result.sct,
    horasBasePorSCT: levelData.horasBase,
    multiplicador: levelData.horasBase / SCT_HOURS,
    nivelUsado: nivel,
    semanas: semanas,
    semanasViable: semanas,
    cargaSemanalEstimada: cargaSemanal
  };
};

// ----------------------------------------------------------
// 5. distributeByModality(ht, modalidades, proporciones)
//    Modo C, Paso 2: distribuye HT proporcionalmente entre modalidades.
//
//    @param {number} ht - Horas totales a distribuir
//    @param {Array<string>} modalidades - ['estudio_individual', 'produccion_escrita', ...]
//    @param {object|null} proporciones - { estudio_individual: 0.3, ... }
//      Si null, distribucion equitativa entre las marcadas.
//    @returns {object} {
//      horasPorModalidad: { estudio_individual: number, ... },
//      proporciones: { estudio_individual: number, ... },
//      totalVerificacion: number  // debe ser === ht
//    }
// ----------------------------------------------------------
SCTEngine.distributeByModality = function(ht, modalidades, proporciones) {
  ht = Math.max(0, ht);

  if (!modalidades || modalidades.length === 0) {
    return {
      horasPorModalidad: {},
      proporciones: {},
      totalVerificacion: 0
    };
  }

  // Si no hay proporciones, distribucion equitativa
  var props = {};
  if (!proporciones || Object.keys(proporciones).length === 0) {
    var equal = 1.0 / modalidades.length;
    for (var i = 0; i < modalidades.length; i++) {
      props[modalidades[i]] = equal;
    }
  } else {
    // Normalizar proporciones para que sumen 1.0
    var suma = 0;
    for (var m = 0; m < modalidades.length; m++) {
      suma += (proporciones[modalidades[m]] || 0);
    }
    if (suma === 0) suma = 1;
    for (var n = 0; n < modalidades.length; n++) {
      props[modalidades[n]] = (proporciones[modalidades[n]] || 0) / suma;
    }
  }

  // Distribuir horas
  var horasPorModalidad = {};
  var totalVerif = 0;
  for (var k = 0; k < modalidades.length; k++) {
    var mod = modalidades[k];
    var horas = ht * props[mod];
    horasPorModalidad[mod] = Math.round(horas * 10) / 10; // 1 decimal
    totalVerif += horasPorModalidad[mod];
  }

  // Ajustar ultimo para que la suma sea exacta
  if (modalidades.length > 0 && totalVerif !== ht) {
    var lastMod = modalidades[modalidades.length - 1];
    horasPorModalidad[lastMod] += (ht - totalVerif);
    horasPorModalidad[lastMod] = Math.round(horasPorModalidad[lastMod] * 10) / 10;
  }

  return {
    horasPorModalidad: horasPorModalidad,
    proporciones: props,
    totalVerificacion: ht
  };
};

// ----------------------------------------------------------
// 6. applyRatios(horasPorModalidad, perfil)
//    Modo C, Paso 3: aplica ratios sync/async/auto a cada modalidad
//    y produce el triple obligatorio.
//
//    @param {object} horasPorModalidad - { estudio_individual: 20, ... }
//    @param {string} perfil - 'pregrado' | 'postgrado' | 'continua'
//    @returns {object} {
//      triple: { hSinc: number, hAsinc: number, hAut: number },
//      detallesPorModalidad: {
//        estudio_individual: { hSinc, hAsinc, hAut, ratioUsado },
//        ...
//      },
//      ugci: { hp: number, ha: number }
//    }
// ----------------------------------------------------------
SCTEngine.applyRatios = function(horasPorModalidad, perfil) {
  var profileParams = PROFILE_PARAMS[perfil] || PROFILE_PARAMS.pregrado;
  var syncAdj = profileParams.syncAdjust;

  var totalSinc = 0;
  var totalAsinc = 0;
  var totalAut = 0;
  var detalles = {};

  var modalidades = Object.keys(horasPorModalidad);
  for (var i = 0; i < modalidades.length; i++) {
    var mod = modalidades[i];
    var horas = horasPorModalidad[mod];
    var laurillardTypes = MODALITY_TO_LAURILLARD[mod];

    if (!laurillardTypes || laurillardTypes.length === 0) {
      // Fallback: distribucion equitativa sync/async/auto
      detalles[mod] = {
        hSinc: horas * 0.33,
        hAsinc: horas * 0.33,
        hAut: horas * 0.34,
        ratioUsado: { sync: 0.33, async: 0.33, auto: 0.34 }
      };
    } else {
      // Promediar los ratios de los tipos Laurillard asociados
      var avgSync = 0, avgAsync = 0, avgAuto = 0;
      for (var j = 0; j < laurillardTypes.length; j++) {
        var ratio = LAURILLARD_RATIOS[laurillardTypes[j]];
        avgSync += ratio.sync;
        avgAsync += ratio.async;
        avgAuto += ratio.auto;
      }
      avgSync /= laurillardTypes.length;
      avgAsync /= laurillardTypes.length;
      avgAuto /= laurillardTypes.length;

      // Ajustar por perfil: postgrado reduce sync, aumenta async/auto
      // syncAdjust < 1.0 redistribuye proporcionalmente.
      if (syncAdj !== 1.0) {
        var syncDelta = avgSync * (1 - syncAdj);
        avgSync = avgSync * syncAdj;
        avgAsync += syncDelta * 0.5;
        avgAuto += syncDelta * 0.5;
      }

      // Normalizar para que sumen 1.0
      var total = avgSync + avgAsync + avgAuto;
      avgSync /= total;
      avgAsync /= total;
      avgAuto /= total;

      var hSinc = Math.round(horas * avgSync * 10) / 10;
      var hAsinc = Math.round(horas * avgAsync * 10) / 10;
      var hAut = Math.round(horas * avgAuto * 10) / 10;

      // Ajustar ultimo para exactitud
      var diff = horas - (hSinc + hAsinc + hAut);
      hAut = Math.round((hAut + diff) * 10) / 10;

      detalles[mod] = {
        hSinc: hSinc,
        hAsinc: hAsinc,
        hAut: hAut,
        ratioUsado: { sync: avgSync, async: avgAsync, auto: avgAuto }
      };
    }

    totalSinc += detalles[mod].hSinc;
    totalAsinc += detalles[mod].hAsinc;
    totalAut += detalles[mod].hAut;
  }

  return {
    triple: {
      hSinc: Math.round(totalSinc * 10) / 10,
      hAsinc: Math.round(totalAsinc * 10) / 10,
      hAut: Math.round(totalAut * 10) / 10
    },
    detallesPorModalidad: detalles,
    ugci: {
      hp: Math.round(totalSinc * 10) / 10,
      ha: Math.round((totalAsinc + totalAut) * 10) / 10
    }
  };
};

// ----------------------------------------------------------
// 7. verify(triple, semanas, perfil, concurrentes)
//    Verificaciones de consistencia. Comun a los 3 modos.
//
//    @param {object} triple - { hSinc, hAsinc, hAut }
//    @param {number} semanas
//    @param {string} perfil - 'pregrado' | 'postgrado' | 'continua'
//    @param {number} concurrentes - ACs concurrentes
//    @returns {object} {
//      checks: Array<{ id, label, ok, warn, desc, value, threshold }>,
//      semaforo: string,     // 'verde' | 'amarillo' | 'rojo'
//      recs: Array<string>   // recomendaciones textuales
//    }
// ----------------------------------------------------------
SCTEngine.verify = function(triple, semanas, perfil, concurrentes) {
  var params = PROFILE_PARAMS[perfil] || PROFILE_PARAMS.pregrado;
  var ht = triple.hSinc + triple.hAsinc + triple.hAut;
  var weekly = semanas > 0 ? ht / semanas : ht;
  var autPct = ht > 0 ? triple.hAut / ht : 0;
  var syncWeekly = semanas > 0 ? triple.hSinc / semanas : triple.hSinc;
  var projectedSync = syncWeekly * (concurrentes || 1);

  var checks = [];
  var recs = [];

  // Check 1: Carga semanal recomendada
  var weeklyOk = weekly <= params.semaforoVerde;
  checks.push({
    id: 'carga_semanal_recomendada',
    label: 'Carga semanal recomendada (<=' + params.semaforoVerde + ' hrs/sem)',
    ok: weeklyOk,
    warn: false,
    desc: 'Actual: ' + weekly.toFixed(1) + ' hrs/semana.',
    value: weekly,
    threshold: params.semaforoVerde
  });

  // Check 2: Carga semanal maxima
  var weeklyMaxOk = weekly <= params.semaforoAmarillo;
  checks.push({
    id: 'carga_semanal_maxima',
    label: 'Carga semanal maxima (<=' + params.semaforoAmarillo + ' hrs/sem)',
    ok: weeklyMaxOk,
    warn: !weeklyMaxOk,
    desc: 'Actual: ' + weekly.toFixed(1) + ' hrs/semana. Superar ' + params.semaforoAmarillo + ' hrs genera sobrecarga.',
    value: weekly,
    threshold: params.semaforoAmarillo
  });

  // Check 3: Autonomo 25-40%
  var autOk = autPct >= params.autRangoMin && autPct <= params.autRangoMax;
  checks.push({
    id: 'autonomo_rango',
    label: 'Proporcion de trabajo autonomo (HAut entre 25-40%)',
    ok: autOk,
    warn: false,
    desc: 'HAut actual: ' + Math.round(autPct * 100) + '% de la carga total (Doc. N. 004-2020).',
    value: autPct,
    threshold: [params.autRangoMin, params.autRangoMax]
  });

  // Check 4: HP + HA = HT (verificacion algebraica)
  var hp = triple.hSinc;
  var ha = triple.hAsinc + triple.hAut;
  var sumaOk = Math.abs((hp + ha) - ht) < 0.1;
  checks.push({
    id: 'hp_ha_ht',
    label: 'HP + HA = HT (consistencia formato UGCI)',
    ok: sumaOk,
    warn: !sumaOk,
    desc: 'HP (' + hp.toFixed(1) + ') + HA (' + ha.toFixed(1) + ') = ' + (hp + ha).toFixed(1) + '; HT = ' + ht.toFixed(1),
    value: hp + ha,
    threshold: ht
  });

  // Check 5: Orientacion sincronica (informativa, siempre ok)
  checks.push({
    id: 'orientacion_sincronica',
    label: 'Orientacion sincronica segun perfil (' + params.label + ')',
    ok: true,
    warn: false,
    desc: 'Con ' + syncWeekly.toFixed(1) + ' hrs sincronicas/sem y ' + concurrentes + ' actividad(es) concurrente(s), la carga sincronica agregada estimada es ~' + projectedSync.toFixed(1) + ' hrs/semana.',
    value: projectedSync,
    threshold: null
  });

  // Recomendaciones
  if (!weeklyMaxOk) {
    recs.push('Reducir la carga semanal por debajo de ' + params.semaforoAmarillo + ' hrs/semana.');
  } else if (!weeklyOk) {
    recs.push('La carga esta entre ' + params.semaforoVerde + ' y ' + params.semaforoAmarillo + ' hrs/semana. Evaluar sostenibilidad.');
  }
  if (!autOk && autPct < params.autRangoMin) {
    recs.push('El trabajo autonomo (' + Math.round(autPct * 100) + '%) es menor al 25% recomendado.');
  }
  if (!autOk && autPct > params.autRangoMax) {
    recs.push('El trabajo autonomo (' + Math.round(autPct * 100) + '%) supera el 40%. Verificar interaccion docente.');
  }
  if (projectedSync > params.semaforoAmarillo) {
    recs.push('La carga sincronica agregada (' + projectedSync.toFixed(1) + ' hrs/sem) supera el umbral. Reducir HS o actividades concurrentes.');
  }
  if (recs.length === 0) {
    recs.push('El diseno cumple con los estandares institucionales.');
  }

  // Semaforo global
  var hardChecks = checks.slice(0, 4); // excluir orientacion (informativa)
  var failCount = 0;
  var warnCount = 0;
  for (var c = 0; c < hardChecks.length; c++) {
    if (hardChecks[c].warn) failCount++;
    else if (!hardChecks[c].ok) warnCount++;
  }

  var semaforo = 'verde';
  if (failCount > 0) semaforo = 'rojo';
  else if (warnCount > 0) semaforo = 'amarillo';

  return {
    checks: checks,
    semaforo: semaforo,
    recs: recs
  };
};

// ----------------------------------------------------------
// 8. distributeCUECH(modalidades, niveles)
//    Modo C con SCT fijo: distribuye horas (en vez de estimar SCT).
//    Logica invertida del Modo C (seccion 4.3.3 del consolidado).
//
//    @param {Array<string>} modalidades - modalidades marcadas
//    @param {object} niveles - { estudio_individual: 2, ... } nivel por modalidad
//    @param {number} sctFijo - creditos fijos (default 2)
//    @param {number} semanas - semanas (default 16)
//    @param {string} perfil - perfil de estudiante
//    @returns {object} {
//      ht: number,
//      sct: number,
//      distribucion: resultado de distributeByModality(),
//      triple: resultado de applyRatios(),
//      proporciones: object  // ponderadas por nivel cognitivo
//    }
// ----------------------------------------------------------
SCTEngine.distributeCUECH = function(modalidades, niveles, sctFijo, semanas, perfil) {
  sctFijo = sctFijo || 2;
  semanas = semanas || 16;
  var ht = sctFijo * SCT_HOURS; // 2 SCT = 54 horas

  // Las modalidades con nivel cognitivo mas alto reciben mayor proporcion.
  // Ponderacion: cada modalidad recibe un peso = nivel^2 (cuadratico para
  // acentuar la diferencia entre niveles).
  var totalPeso = 0;
  var proporciones = {};
  for (var i = 0; i < modalidades.length; i++) {
    var mod = modalidades[i];
    var nivel = (niveles && niveles[mod]) || 2;
    var peso = nivel * nivel; // 1, 4, 9, 16
    proporciones[mod] = peso;
    totalPeso += peso;
  }
  // Normalizar
  for (var j = 0; j < modalidades.length; j++) {
    proporciones[modalidades[j]] /= totalPeso;
  }

  var dist = SCTEngine.distributeByModality(ht, modalidades, proporciones);
  var ratios = SCTEngine.applyRatios(dist.horasPorModalidad, perfil);

  return {
    ht: ht,
    sct: sctFijo,
    semanas: semanas,
    distribucion: dist,
    triple: ratios.triple,
    ugci: ratios.ugci,
    detallesPorModalidad: ratios.detallesPorModalidad,
    proporciones: proporciones
  };
};

// ----------------------------------------------------------
// 9. checkCoherenceAlerts(modalidades, niveles)
//    Evalua alertas de coherencia nivel-modalidad (Modo C).
//
//    @param {Array<string>} modalidades - modalidades marcadas
//    @param {object} niveles - { estudio_individual: 2, ... }
//    @returns {Array<{ message: string, severity: string }>}
// ----------------------------------------------------------
SCTEngine.checkCoherenceAlerts = function(modalidades, niveles) {
  var alerts = [];
  for (var i = 0; i < COHERENCE_ALERTS.length; i++) {
    var rule = COHERENCE_ALERTS[i];
    if (rule.condition(modalidades, niveles)) {
      alerts.push({
        message: rule.message,
        severity: rule.severity
      });
    }
  }
  return alerts;
};

// ----------------------------------------------------------
// 10. getNivelPredominante(modalidades, niveles)
//     Utilidad: retorna el nivel mas alto entre todas las
//     modalidades marcadas.
//
//     @param {Array<string>} modalidades
//     @param {object} niveles - { modalidad: nivel, ... }
//     @returns {number} 1..4
// ----------------------------------------------------------
SCTEngine.getNivelPredominante = function(modalidades, niveles) {
  var max = 1;
  for (var i = 0; i < modalidades.length; i++) {
    var nivel = (niveles && niveles[modalidades[i]]) || 1;
    if (nivel > max) max = nivel;
  }
  return max;
};

// ----------------------------------------------------------
// 11. getDefaultDistribution(areaDisciplinar)
//     Fallback: retorna distribucion default cuando no se
//     marcan modalidades (seccion 4.3.2 del consolidado).
//
//     @param {string} areaDisciplinar - 'ciencias' | 'humanidades' | etc.
//     @returns {object} { modalidades: [...], proporciones: {...} }
// ----------------------------------------------------------
SCTEngine.getDefaultDistribution = function(areaDisciplinar) {
  var defaults = DISCIPLINE_DEFAULTS[areaDisciplinar] || DISCIPLINE_DEFAULTS.educacion;
  var modalidades = Object.keys(defaults);
  return {
    modalidades: modalidades,
    proporciones: defaults
  };
};

// ----------------------------------------------------------
// 12. runModeC(config)
//     Pipeline completo del Modo C: Pasos 1-4 en secuencia.
//     Funcion de conveniencia que encadena las funciones anteriores.
//
//     @param {object} config - {
//       modalidades: ['estudio_individual', ...],
//       niveles: { estudio_individual: 2, ... },
//       proporciones: { estudio_individual: 0.3, ... } | null,
//       perfil: 'pregrado',
//       modalidadAC: 'virtual',
//       semanas: 18,
//       areaDisciplinar: 'educacion',
//       sctFijo: null | number
//     }
//     @returns {object} resultado completo con todos los pasos
// ----------------------------------------------------------
SCTEngine.runModeC = function(config) {
  var modalidades = config.modalidades || [];
  var niveles = config.niveles || {};
  var proporciones = config.proporciones || null;
  var perfil = config.perfil || 'pregrado';
  var semanas = config.semanas || 18;
  var sctFijo = config.sctFijo || null;

  // Si no hay modalidades, usar fallback por area disciplinar
  if (modalidades.length === 0) {
    var fallback = SCTEngine.getDefaultDistribution(config.areaDisciplinar || 'educacion');
    modalidades = fallback.modalidades;
    proporciones = fallback.proporciones;
    // Asignar niveles default
    for (var f = 0; f < modalidades.length; f++) {
      if (!niveles[modalidades[f]]) {
        niveles[modalidades[f]] = MODALITY_DEFAULTS[modalidades[f]].nivelDefault;
      }
    }
  }

  // Alertas de coherencia
  var alerts = SCTEngine.checkCoherenceAlerts(modalidades, niveles);

  // Si SCT fijo (CUECH), usar logica invertida
  if (sctFijo !== null && sctFijo > 0) {
    var cuech = SCTEngine.distributeCUECH(modalidades, niveles, sctFijo, semanas, perfil);
    cuech.alerts = alerts;
    cuech.modo = 'C-invertido';
    cuech.nivelPredominante = SCTEngine.getNivelPredominante(modalidades, niveles);

    // Conversion a formato semanal
    cuech.weeklyTriple = {
      hs: semanas > 0 ? Math.round(cuech.triple.hSinc / semanas * 10) / 10 : 0,
      has: semanas > 0 ? Math.round(cuech.triple.hAsinc / semanas * 10) / 10 : 0,
      haut: semanas > 0 ? Math.round(cuech.triple.hAut / semanas * 10) / 10 : 0
    };

    return cuech;
  }

  // Paso 1: Estimar HT
  var nivelPred = SCTEngine.getNivelPredominante(modalidades, niveles);
  var paso1 = SCTEngine.calculateFromCognitive(nivelPred, perfil, config.modalidadAC, semanas, null);

  // Paso 2: Distribuir por modalidad
  var paso2 = SCTEngine.distributeByModality(paso1.ht, modalidades, proporciones);

  // Paso 3: Aplicar ratios sync/async/auto
  var paso3 = SCTEngine.applyRatios(paso2.horasPorModalidad, perfil);

  // Paso 4: Creditos y duracion
  var paso4 = SCTEngine.calculateSCT(paso1.ht);

  // Conversion a formato semanal
  var weeklyTriple = {
    hs: semanas > 0 ? Math.round(paso3.triple.hSinc / semanas * 10) / 10 : 0,
    has: semanas > 0 ? Math.round(paso3.triple.hAsinc / semanas * 10) / 10 : 0,
    haut: semanas > 0 ? Math.round(paso3.triple.hAut / semanas * 10) / 10 : 0
  };

  return {
    modo: 'C',
    ht: paso1.ht,
    sct: paso4.sct,
    exact: paso4.exact,
    nivelPredominante: nivelPred,
    horasBasePorSCT: paso1.horasBasePorSCT,
    multiplicador: paso1.multiplicador,
    semanas: semanas,
    cargaSemanalEstimada: paso1.cargaSemanalEstimada,
    distribucion: paso2,
    triple: paso3.triple,
    ugci: paso3.ugci,
    detallesPorModalidad: paso3.detallesPorModalidad,
    weeklyTriple: weeklyTriple,
    alerts: alerts,
    formula: paso4.formula
  };
};
```


---

## 2. ReportGenerator -- Generador de Informe

### 2.1. Descripcion

Genera el informe imprimible unificado de 2 bloques para los 3 modos. Cada funcion retorna un string HTML que se inyecta en un contenedor del DOM. El informe se muestra en pantalla y se imprime con `window.print()`.

### 2.2. API publica

```javascript
// ============================================================
// ReportGenerator
// ============================================================

var ReportGenerator = {};

// ----------------------------------------------------------
// 1. generateBlock1(datos)
//    Bloque 1: Resultado PAC (identico para los 3 modos).
//
//    @param {object} datos - {
//      nombre: string,
//      codigo: string,
//      programa: string,
//      semestre: string,
//      perfil: string,
//      sct: number,
//      ht: number,
//      triple: { hSinc, hAsinc, hAut },
//      semanas: number,
//      weeklyTriple: { hs, has, haut }  // horas por semana
//    }
//    @returns {string} HTML del Bloque 1
// ----------------------------------------------------------
ReportGenerator.generateBlock1 = function(datos) {
  var d = datos;
  var weekly = d.weeklyTriple;
  var hp = d.triple.hSinc;
  var ha = d.triple.hAsinc + d.triple.hAut;
  var autPct = d.ht > 0 ? Math.round(d.triple.hAut / d.ht * 100) : 0;
  var hpHaCheck = Math.abs((hp + ha) - d.ht) < 0.1;
  var autRangeOk = autPct >= 25 && autPct <= 40;

  var html = '';

  // Header institucional
  html += '<div class="flex items-start justify-between gap-4 border-b pb-4 mb-5">';
  html += '  <div>';
  html += '    <div class="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Universidad Metropolitana de Ciencias de la Educacion</div>';
  html += '    <h2 class="font-heading font-extrabold text-xl text-umce-azul">Informe de Calculo SCT</h2>';
  html += '    <div class="text-sm text-gray-500 mt-1">Unidad de Desarrollo y Formacion Virtual</div>';
  html += '  </div>';
  html += '  <div class="text-right flex-shrink-0">';
  html += '    <div class="text-xs text-gray-400">' + new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }) + '</div>';
  html += '    <div class="text-xs text-gray-400">umce.online/virtualizacion/sct</div>';
  html += '  </div>';
  html += '</div>';

  // Datos del curso
  html += '<h3 class="font-heading font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Datos del curso</h3>';
  html += '<div class="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-5">';
  html += '  <div class="flex gap-2"><span class="text-gray-400 w-24 flex-shrink-0">Nombre:</span><span class="font-semibold">' + (d.nombre || '\u2014') + '</span></div>';
  html += '  <div class="flex gap-2"><span class="text-gray-400 w-24 flex-shrink-0">Codigo:</span><span class="font-semibold">' + (d.codigo || '\u2014') + '</span></div>';
  html += '  <div class="flex gap-2"><span class="text-gray-400 w-24 flex-shrink-0">Programa:</span><span class="font-semibold">' + (d.programa || '\u2014') + '</span></div>';
  html += '  <div class="flex gap-2"><span class="text-gray-400 w-24 flex-shrink-0">Periodo:</span><span class="font-semibold">' + (d.semestre || '\u2014') + '</span></div>';
  html += '  <div class="flex gap-2"><span class="text-gray-400 w-24 flex-shrink-0">Perfil:</span><span class="font-semibold">' + (PROFILE_PARAMS[d.perfil] ? PROFILE_PARAMS[d.perfil].label : d.perfil) + '</span></div>';
  html += '</div>';

  // Tabla principal Bloque 1
  html += '<div class="overflow-x-auto mb-4">';
  html += '<table class="w-full border border-gray-200 rounded-lg overflow-hidden text-sm">';
  html += '<thead><tr class="bg-gray-50">';
  html += '  <th class="text-left p-2 font-bold text-xs uppercase tracking-wide text-gray-500">Curso</th>';
  html += '  <th class="text-left p-2 font-bold text-xs uppercase tracking-wide text-gray-500">Programa</th>';
  html += '  <th class="text-center p-2 font-bold text-xs uppercase tracking-wide text-gray-500">SCT</th>';
  html += '  <th class="text-center p-2 font-bold text-xs uppercase tracking-wide text-gray-500">HT</th>';
  html += '  <th class="text-center p-2 font-bold text-xs uppercase tracking-wide text-gray-500">HS/sem</th>';
  html += '  <th class="text-center p-2 font-bold text-xs uppercase tracking-wide text-gray-500">HAs/sem</th>';
  html += '  <th class="text-center p-2 font-bold text-xs uppercase tracking-wide text-gray-500">HAut/sem</th>';
  html += '  <th class="text-center p-2 font-bold text-xs uppercase tracking-wide text-gray-500">NS</th>';
  html += '  <th class="text-center p-2 font-bold text-xs uppercase tracking-wide text-gray-500">HP(UGCI)</th>';
  html += '  <th class="text-center p-2 font-bold text-xs uppercase tracking-wide text-gray-500">HA(UGCI)</th>';
  html += '</tr></thead>';
  html += '<tbody><tr class="border-t border-gray-100">';
  html += '  <td class="p-2 font-semibold">' + (d.nombre || '\u2014') + '</td>';
  html += '  <td class="p-2">' + (d.programa || '\u2014') + '</td>';
  html += '  <td class="p-2 text-center font-bold text-umce-azul">' + d.sct + '</td>';
  html += '  <td class="p-2 text-center font-bold">' + d.ht.toFixed(1) + '</td>';
  html += '  <td class="p-2 text-center">' + weekly.hs.toFixed(1) + '</td>';
  html += '  <td class="p-2 text-center">' + weekly.has.toFixed(1) + '</td>';
  html += '  <td class="p-2 text-center">' + weekly.haut.toFixed(1) + '</td>';
  html += '  <td class="p-2 text-center">' + d.semanas + '</td>';
  html += '  <td class="p-2 text-center">' + hp.toFixed(1) + '</td>';
  html += '  <td class="p-2 text-center">' + ha.toFixed(1) + '</td>';
  html += '</tr></tbody></table></div>';

  // Verificaciones automaticas
  html += '<div class="space-y-1 mb-4">';
  // HP + HA = HT
  var checkIcon = hpHaCheck
    ? '<span class="text-green-600 font-bold">OK</span>'
    : '<span class="text-red-600 font-bold">ALERTA</span>';
  html += '<div class="flex items-center gap-2 text-xs">';
  html += '  ' + checkIcon + ' <span class="text-gray-600">HP + HA = HT: ' + hp.toFixed(1) + ' + ' + ha.toFixed(1) + ' = ' + (hp + ha).toFixed(1) + ' (HT = ' + d.ht.toFixed(1) + ')</span>';
  html += '</div>';
  // Autonomo 25-40%
  var autIcon = autRangeOk
    ? '<span class="text-green-600 font-bold">OK</span>'
    : '<span class="text-amber-600 font-bold">REVISAR</span>';
  html += '<div class="flex items-center gap-2 text-xs">';
  html += '  ' + autIcon + ' <span class="text-gray-600">Trabajo autonomo: ' + autPct + '% de HT (rango esperado: 25-40%, Doc. N. 004-2020)</span>';
  html += '</div>';
  html += '</div>';

  return html;
};

// ----------------------------------------------------------
// 2. generateBlock2(modo, datos)
//    Bloque 2: Anexo metodologico (varia por modo).
//
//    @param {string} modo - 'A' | 'B' | 'C'
//    @param {object} datos - contenido depende del modo:
//      Modo A: { tipo, weeklyTriple, formato, perfil, sctDeclarados }
//      Modo B: { acs: [...resultados de calculateSemester()], semaforo }
//      Modo C: { nivelPredominante, multiplicador, areaDisciplinar,
//                distribucion, detallesPorModalidad, weeklyTriple,
//                alerts, modo: 'C' | 'C-invertido' }
//    @returns {string} HTML del Bloque 2
// ----------------------------------------------------------
ReportGenerator.generateBlock2 = function(modo, datos) {
  var html = '<h3 class="font-heading font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide mt-6">Anexo metodologico</h3>';
  html += '<div class="text-xs text-gray-400 mb-3">Modo de calculo: ' + modo + '</div>';

  if (modo === 'A') {
    return html + ReportGenerator._block2ModoA(datos);
  } else if (modo === 'B') {
    return html + ReportGenerator._block2ModoB(datos);
  } else if (modo === 'C') {
    return html + ReportGenerator._block2ModoC(datos);
  }
  return html;
};

// Modo A: Inputs directos
ReportGenerator._block2ModoA = function(d) {
  var html = '<div class="space-y-2 text-sm text-gray-700">';
  html += '<p><strong>Tipo de actividad:</strong> ' + (ACTIVITY_TYPES[d.tipo] ? ACTIVITY_TYPES[d.tipo].label : d.tipo || 'No seleccionado') + '</p>';
  html += '<p><strong>Horas semanales ingresadas:</strong> HS=' + d.weeklyTriple.hs + ', HAs=' + d.weeklyTriple.has + ', HAut=' + d.weeklyTriple.haut + '</p>';
  html += '<p><strong>Formato:</strong> ' + (FORMATOS[d.formato] ? FORMATOS[d.formato].label : d.formato) + '</p>';
  html += '<p><strong>Perfil:</strong> ' + (PROFILE_PARAMS[d.perfil] ? PROFILE_PARAMS[d.perfil].label : d.perfil) + '</p>';
  if (d.sctDeclarados) {
    html += '<p><strong>SCT declarados (resolucion):</strong> ' + d.sctDeclarados + '</p>';
  }
  html += '</div>';
  return html;
};

// Modo B: Tabla de ACs con subtotales
ReportGenerator._block2ModoB = function(d) {
  var html = '<div class="overflow-x-auto mb-4">';
  html += '<table class="w-full border border-gray-200 rounded-lg overflow-hidden text-xs">';
  html += '<thead><tr class="bg-gray-50">';
  html += '<th class="text-left p-2">Actividad Curricular</th>';
  html += '<th class="text-center p-2">Tipo</th>';
  html += '<th class="text-center p-2">HS/sem</th>';
  html += '<th class="text-center p-2">HAs/sem</th>';
  html += '<th class="text-center p-2">HAut/sem</th>';
  html += '<th class="text-center p-2">NS</th>';
  html += '<th class="text-center p-2">SCT</th>';
  html += '<th class="text-center p-2">HT</th>';
  html += '</tr></thead><tbody>';

  for (var i = 0; i < d.acs.length; i++) {
    var ac = d.acs[i];
    html += '<tr class="border-t border-gray-100">';
    html += '<td class="p-2 font-semibold">' + ac.nombre + '</td>';
    html += '<td class="p-2 text-center">' + (ACTIVITY_TYPES[ac.tipo] ? ACTIVITY_TYPES[ac.tipo].label : ac.tipo || '-') + '</td>';
    html += '<td class="p-2 text-center">' + ac.weeklyTriple.hs.toFixed(1) + '</td>';
    html += '<td class="p-2 text-center">' + ac.weeklyTriple.has.toFixed(1) + '</td>';
    html += '<td class="p-2 text-center">' + ac.weeklyTriple.haut.toFixed(1) + '</td>';
    html += '<td class="p-2 text-center">' + ac.semanas + '</td>';
    html += '<td class="p-2 text-center font-bold">' + ac.sct + '</td>';
    html += '<td class="p-2 text-center">' + ac.ht.toFixed(1) + '</td>';
    html += '</tr>';
  }

  // Fila de totales
  html += '<tr class="border-t-2 border-gray-300 bg-gray-50 font-bold">';
  html += '<td class="p-2" colspan="6">TOTAL SEMESTRE</td>';
  html += '<td class="p-2 text-center">' + d.sctTotal + '</td>';
  html += '<td class="p-2 text-center">' + d.htTotal.toFixed(1) + '</td>';
  html += '</tr>';
  html += '</tbody></table></div>';

  // Semaforo
  var semaforoColor = d.semaforo === 'verde' ? 'text-green-600' : (d.semaforo === 'amarillo' ? 'text-amber-600' : 'text-red-600');
  html += '<p class="text-sm"><strong>Carga semanal agregada:</strong> <span class="' + semaforoColor + ' font-bold">' + d.cargaSemanal.toFixed(1) + ' hrs/semana (' + d.semaforo + ')</span></p>';

  return html;
};

// Modo C: Tabla de modalidades + conversion semanal
ReportGenerator._block2ModoC = function(d) {
  var html = '';

  // Nivel cognitivo predominante
  var levelData = HOURS_BY_LEVEL[d.nivelPredominante] || HOURS_BY_LEVEL[1];
  html += '<div class="space-y-2 text-sm text-gray-700 mb-4">';
  html += '<p><strong>Nivel cognitivo predominante:</strong> ' + levelData.label + ' (nivel ' + d.nivelPredominante + ')</p>';
  html += '<p><strong>Multiplicador Wake Forest:</strong> ' + d.multiplicador.toFixed(2) + 'x (' + levelData.horasBase + ' h/SCT)</p>';
  if (d.areaDisciplinar) {
    html += '<p><strong>Area disciplinar:</strong> ' + d.areaDisciplinar + '</p>';
  }
  if (d.modo === 'C-invertido') {
    html += '<p class="text-amber-700 font-semibold">SCT fijo: las horas fueron distribuidas (logica invertida), no estimadas.</p>';
  }
  html += '</div>';

  // Tabla de modalidades
  html += '<div class="overflow-x-auto mb-4">';
  html += '<table class="w-full border border-gray-200 rounded-lg overflow-hidden text-xs">';
  html += '<thead><tr class="bg-gray-50">';
  html += '<th class="text-left p-2">Modalidad de trabajo</th>';
  html += '<th class="text-center p-2">Proporcion</th>';
  html += '<th class="text-center p-2">Nivel cognitivo</th>';
  html += '<th class="text-center p-2">Horas estimadas</th>';
  html += '<th class="text-center p-2">H sinc</th>';
  html += '<th class="text-center p-2">H asinc</th>';
  html += '<th class="text-center p-2">H auto</th>';
  html += '</tr></thead><tbody>';

  var modalidades = d.distribucion ? Object.keys(d.distribucion.horasPorModalidad) : [];
  for (var i = 0; i < modalidades.length; i++) {
    var mod = modalidades[i];
    var horas = d.distribucion.horasPorModalidad[mod];
    var prop = d.distribucion.proporciones[mod] || 0;
    var det = d.detallesPorModalidad ? d.detallesPorModalidad[mod] : {};
    var nivelMod = (d.niveles && d.niveles[mod]) || '-';

    html += '<tr class="border-t border-gray-100">';
    html += '<td class="p-2 font-semibold">' + (MODALITY_LABELS[mod] || mod) + '</td>';
    html += '<td class="p-2 text-center">' + Math.round(prop * 100) + '%</td>';
    html += '<td class="p-2 text-center">' + nivelMod + '</td>';
    html += '<td class="p-2 text-center">' + (horas || 0).toFixed(1) + '</td>';
    html += '<td class="p-2 text-center">' + (det.hSinc || 0).toFixed(1) + '</td>';
    html += '<td class="p-2 text-center">' + (det.hAsinc || 0).toFixed(1) + '</td>';
    html += '<td class="p-2 text-center">' + (det.hAut || 0).toFixed(1) + '</td>';
    html += '</tr>';
  }
  html += '</tbody></table></div>';

  // Conversion a formato semanal
  if (d.weeklyTriple) {
    html += '<div class="bg-gray-50 rounded-lg p-3 text-sm">';
    html += '<strong>Conversion a formato semanal:</strong> ';
    html += 'HS/sem = ' + d.weeklyTriple.hs.toFixed(1) + ', ';
    html += 'HAs/sem = ' + d.weeklyTriple.has.toFixed(1) + ', ';
    html += 'HAut/sem = ' + d.weeklyTriple.haut.toFixed(1);
    html += '<p class="text-xs text-gray-400 mt-1">Valores editables antes de exportar. El mapeo default es heuristico.</p>';
    html += '</div>';
  }

  // Alertas
  if (d.alerts && d.alerts.length > 0) {
    html += '<div class="mt-3 space-y-1">';
    for (var a = 0; a < d.alerts.length; a++) {
      var alertClass = d.alerts[a].severity === 'warning' ? 'text-amber-700 bg-amber-50' : 'text-blue-700 bg-blue-50';
      html += '<div class="text-xs p-2 rounded ' + alertClass + '">' + d.alerts[a].message + '</div>';
    }
    html += '</div>';
  }

  return html;
};

// ----------------------------------------------------------
// 3. generateFooter(modo, formula)
//    Pie del informe (comun a los 3 modos).
//
//    @param {string} modo - 'A' | 'B' | 'C'
//    @param {string} formula - string de la formula (ej: "ceil(81/27) = 3")
//    @returns {string} HTML del pie
// ----------------------------------------------------------
ReportGenerator.generateFooter = function(modo, formula) {
  var html = '<div class="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 space-y-1 mt-6">';
  html += '<p><strong>Formula utilizada:</strong> SCT = ceil(HT / 27) con 1 SCT = 27 h (Res. Exenta N. 002140, UMCE, 2011). ' + (formula || '') + '</p>';
  html += '<p><strong>Modo de calculo:</strong> ' + modo + '</p>';
  html += '<p><strong>Fecha de generacion:</strong> ' + new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }) + '</p>';
  html += '<p><strong>Aviso:</strong> Las estimaciones son un punto de partida para la decision del comite curricular. Herramienta de estimacion, no de prescripcion.</p>';
  html += '<p><strong>Herramienta:</strong> Calculadora SCT UMCE v3.0 &mdash; Unidad de Desarrollo y Formacion Virtual, UMCE, 2026.</p>';
  html += '</div>';
  return html;
};

// ----------------------------------------------------------
// 4. generateFull(modo, datos)
//    Informe completo: Bloque 1 + Bloque 2 + Pie.
//
//    @param {string} modo - 'A' | 'B' | 'C'
//    @param {object} datos - union de datos para ambos bloques
//    @returns {string} HTML completo del informe
// ----------------------------------------------------------
ReportGenerator.generateFull = function(modo, datos) {
  var html = '<div class="bg-white border border-gray-200 rounded-xl p-6 space-y-2">';
  html += ReportGenerator.generateBlock1(datos);
  html += ReportGenerator.generateBlock2(modo, datos);
  html += ReportGenerator.generateFooter(modo, datos.formula);
  html += '</div>';
  return html;
};

// ----------------------------------------------------------
// 5. print()
//    Lanza el dialogo de impresion del navegador.
// ----------------------------------------------------------
ReportGenerator.print = function() {
  window.print();
};
```


---

## 3. DataLayer -- Capa de Datos

### 3.1. Descripcion

Persistencia client-side en `localStorage`. Almacena calculos guardados, permite listar, recuperar, eliminar, exportar e importar. Tambien gestiona el "sobre presupuestario" que conecta M1 (esta calculadora) con M3 (el Planificador Curricular).

### 3.2. Clave de localStorage

```
sct_calculos     → JSON array de calculos guardados
sct_sobre_M3     → JSON object con sobres presupuestarios para M3
sct_config       → JSON object con preferencias del usuario (ultimo perfil, ultimo formato, etc.)
```

### 3.3. API publica

```javascript
// ============================================================
// DataLayer
// ============================================================

var DataLayer = {};

// Constantes internas
var STORAGE_KEY = 'sct_calculos';
var SOBRE_KEY = 'sct_sobre_M3';
var CONFIG_KEY = 'sct_config';

// ----------------------------------------------------------
// 1. save(modo, datos)
//    Guarda un calculo en localStorage.
//
//    @param {string} modo - 'A' | 'B' | 'C'
//    @param {object} datos - el objeto de resultado completo del motor
//    @returns {string} id generado (timestamp + random)
// ----------------------------------------------------------
DataLayer.save = function(modo, datos) {
  var id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  var registro = {
    id: id,
    modo: modo,
    nombre: datos.nombre || datos.acs ? 'Semestre' : 'Calculo SCT',
    fecha: new Date().toISOString(),
    version: '3.0',
    datos: datos
  };

  var lista = DataLayer._getAll();
  lista.push(registro);
  DataLayer._saveAll(lista);

  return id;
};

// ----------------------------------------------------------
// 2. load(id)
//    Recupera un calculo por ID.
//
//    @param {string} id
//    @returns {object|null} el registro completo o null
// ----------------------------------------------------------
DataLayer.load = function(id) {
  var lista = DataLayer._getAll();
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === id) return lista[i];
  }
  return null;
};

// ----------------------------------------------------------
// 3. list()
//    Retorna resumen de todos los calculos guardados.
//
//    @returns {Array<{ id, nombre, fecha, modo }>}
// ----------------------------------------------------------
DataLayer.list = function() {
  var lista = DataLayer._getAll();
  var resumen = [];
  for (var i = 0; i < lista.length; i++) {
    resumen.push({
      id: lista[i].id,
      nombre: lista[i].nombre,
      fecha: lista[i].fecha,
      modo: lista[i].modo
    });
  }
  return resumen;
};

// ----------------------------------------------------------
// 4. delete(id)
//    Elimina un calculo por ID.
//
//    @param {string} id
// ----------------------------------------------------------
DataLayer.delete = function(id) {
  var lista = DataLayer._getAll();
  var nueva = [];
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id !== id) nueva.push(lista[i]);
  }
  DataLayer._saveAll(nueva);
};

// ----------------------------------------------------------
// 5. exportJSON(id)
//    Exporta un calculo como string JSON descargable.
//
//    @param {string} id - si null, exporta todos
//    @returns {string} JSON
// ----------------------------------------------------------
DataLayer.exportJSON = function(id) {
  if (id) {
    var reg = DataLayer.load(id);
    return reg ? JSON.stringify(reg, null, 2) : null;
  }
  return JSON.stringify(DataLayer._getAll(), null, 2);
};

// ----------------------------------------------------------
// 6. importJSON(jsonString)
//    Importa un calculo desde JSON.
//    Acepta un solo registro o un array.
//
//    @param {string} jsonString
//    @returns {string|Array<string>} id(s) importado(s)
// ----------------------------------------------------------
DataLayer.importJSON = function(jsonString) {
  var parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch(e) {
    return null;
  }

  var lista = DataLayer._getAll();
  var ids = [];

  var registros = Array.isArray(parsed) ? parsed : [parsed];
  for (var i = 0; i < registros.length; i++) {
    var reg = registros[i];
    // Generar nuevo ID para evitar colisiones
    reg.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    reg.fecha = reg.fecha || new Date().toISOString();
    lista.push(reg);
    ids.push(reg.id);
  }
  DataLayer._saveAll(lista);

  return ids.length === 1 ? ids[0] : ids;
};

// ----------------------------------------------------------
// 7. downloadJSON(id)
//    Dispara descarga de archivo JSON en el navegador.
//
//    @param {string|null} id - si null, exporta todos
// ----------------------------------------------------------
DataLayer.downloadJSON = function(id) {
  var json = DataLayer.exportJSON(id);
  if (!json) return;

  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'sct-calculo-' + (id || 'todos') + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ----------------------------------------------------------
// Sobre presupuestario M1 → M3
// ----------------------------------------------------------

// 8. saveSobre(acId, sobre)
//    Guarda el sobre presupuestario de una AC para M3.
//
//    @param {string} acId - identificador de la AC
//    @param {object} sobre - {
//      nombre: string,
//      sct: number,
//      ht: number,
//      triple: { hSinc, hAsinc, hAut },
//      weeklyTriple: { hs, has, haut },
//      semanas: number,
//      perfil: string,
//      laurillardDominante: string | null,   // solo Modo C
//      nivelCognitivoDominante: number | null, // solo Modo C
//      tolerancia: 0.10,                      // +-10%
//      modo: string,
//      fecha: string
//    }
// ----------------------------------------------------------
DataLayer.saveSobre = function(acId, sobre) {
  var sobres = DataLayer._getSobres();
  sobre.fecha = sobre.fecha || new Date().toISOString();
  sobre.tolerancia = sobre.tolerancia || 0.10;
  sobres[acId] = sobre;
  try { localStorage.setItem(SOBRE_KEY, JSON.stringify(sobres)); } catch(e) {}
};

// 9. getSobre(acId)
DataLayer.getSobre = function(acId) {
  var sobres = DataLayer._getSobres();
  return sobres[acId] || null;
};

// 10. listSobres()
DataLayer.listSobres = function() {
  var sobres = DataLayer._getSobres();
  var lista = [];
  var keys = Object.keys(sobres);
  for (var i = 0; i < keys.length; i++) {
    lista.push({
      acId: keys[i],
      nombre: sobres[keys[i]].nombre,
      sct: sobres[keys[i]].sct,
      fecha: sobres[keys[i]].fecha,
      modo: sobres[keys[i]].modo
    });
  }
  return lista;
};

// 11. deleteSobre(acId)
DataLayer.deleteSobre = function(acId) {
  var sobres = DataLayer._getSobres();
  delete sobres[acId];
  try { localStorage.setItem(SOBRE_KEY, JSON.stringify(sobres)); } catch(e) {}
};

// ----------------------------------------------------------
// Helpers internos
// ----------------------------------------------------------
DataLayer._getAll = function() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e) {
    return [];
  }
};

DataLayer._saveAll = function(lista) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch(e) {
    console.warn('DataLayer: no se pudo guardar en localStorage', e);
  }
};

DataLayer._getSobres = function() {
  try {
    var raw = localStorage.getItem(SOBRE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e) {
    return {};
  }
};
```

### 3.4. Schemas JSON por modo

#### Modo A — Calculo individual

```json
{
  "id": "m1abc12de",
  "modo": "A",
  "nombre": "Metodologia Cualitativa",
  "fecha": "2026-04-13T15:30:00.000Z",
  "version": "3.0",
  "datos": {
    "nombre": "Metodologia Cualitativa",
    "codigo": "EDU3210",
    "programa": "Ped. en Ed. Basica",
    "semestre": "2do sem. 2026",
    "perfil": "postgrado",
    "formato": "semestral",
    "tipo": "seminario",
    "sctDeclarados": 3,
    "concurrentes": 3,
    "ht": 81,
    "sct": 3,
    "exact": 3.0,
    "weekly": 4.5,
    "semanas": 18,
    "triple": { "hSinc": 27, "hAsinc": 36, "hAut": 18 },
    "ugci": { "hp": 27, "ha": 54 },
    "weeklyTriple": { "hs": 1.5, "has": 2, "haut": 1 },
    "formula": "((1.5 + 2 + 1) x 18) / 27 = 3.000 -> 3"
  }
}
```

#### Modo B — Semestre completo

```json
{
  "id": "m2xyz45fg",
  "modo": "B",
  "nombre": "Semestre 2026-2 Postgrado",
  "fecha": "2026-04-13T16:00:00.000Z",
  "version": "3.0",
  "datos": {
    "perfil": "postgrado",
    "semestre": "2do sem. 2026",
    "programa": "Magister en Educacion",
    "acs": [
      {
        "nombre": "Metodologia Cualitativa",
        "tipo": "seminario",
        "ht": 81,
        "sct": 3,
        "weekly": 4.5,
        "semanas": 18,
        "triple": { "hSinc": 27, "hAsinc": 36, "hAut": 18 },
        "weeklyTriple": { "hs": 1.5, "has": 2, "haut": 1 }
      },
      {
        "nombre": "Seminario de Investigacion",
        "tipo": "proyecto",
        "ht": 108,
        "sct": 4,
        "weekly": 6.0,
        "semanas": 18,
        "triple": { "hSinc": 18, "hAsinc": 36, "hAut": 54 },
        "weeklyTriple": { "hs": 1, "has": 2, "haut": 3 }
      }
    ],
    "htTotal": 189,
    "sctTotal": 7,
    "tripleTotal": { "hSinc": 45, "hAsinc": 72, "hAut": 72 },
    "cargaSemanal": 10.5,
    "semaforo": "amarillo"
  }
}
```

#### Modo C — Estimacion desde competencias

```json
{
  "id": "m3qrs67hi",
  "modo": "C",
  "nombre": "Practica Profesional I",
  "fecha": "2026-04-13T17:00:00.000Z",
  "version": "3.0",
  "datos": {
    "nombre": "Practica Profesional I",
    "programa": "Ped. en Ed. Basica",
    "perfil": "pregrado",
    "modalidadAC": "semipresencial",
    "areaDisciplinar": "educacion",
    "semanas": 18,
    "sctFijo": null,
    "modo": "C",
    "ht": 162.5,
    "sct": 7,
    "exact": 6.018,
    "nivelPredominante": 3,
    "horasBasePorSCT": 32.5,
    "multiplicador": 1.20,
    "modalidades": ["estudio_individual", "practica_aplicada", "produccion_integrada"],
    "niveles": {
      "estudio_individual": 2,
      "practica_aplicada": 3,
      "produccion_integrada": 3
    },
    "proporciones": {
      "estudio_individual": 0.20,
      "practica_aplicada": 0.40,
      "produccion_integrada": 0.40
    },
    "distribucion": {
      "horasPorModalidad": {
        "estudio_individual": 32.5,
        "practica_aplicada": 65.0,
        "produccion_integrada": 65.0
      }
    },
    "triple": { "hSinc": 52.8, "hAsinc": 49.4, "hAut": 60.3 },
    "ugci": { "hp": 52.8, "ha": 109.7 },
    "weeklyTriple": { "hs": 2.9, "has": 2.7, "haut": 3.4 },
    "alerts": []
  }
}
```

#### Sobre presupuestario (M1 → M3)

```json
{
  "m3qrs67hi": {
    "nombre": "Practica Profesional I",
    "sct": 7,
    "ht": 162.5,
    "triple": { "hSinc": 52.8, "hAsinc": 49.4, "hAut": 60.3 },
    "weeklyTriple": { "hs": 2.9, "has": 2.7, "haut": 3.4 },
    "semanas": 18,
    "perfil": "pregrado",
    "laurillardDominante": "practica",
    "nivelCognitivoDominante": 3,
    "tolerancia": 0.10,
    "modo": "C",
    "fecha": "2026-04-13T17:00:00.000Z"
  }
}
```

### 3.5. Transicion M1 → M3: el sobre presupuestario

La conexion entre la calculadora (M1) y el planificador curricular (M3) se implementa con tres mecanismos complementarios:

**Mecanismo 1: localStorage compartido (primario)**

Ambas herramientas (calculadora y planificador) viven en el mismo dominio (`umce.online`), por lo que comparten `localStorage`. La calculadora escribe en la clave `sct_sobre_M3` mediante `DataLayer.saveSobre()`. El planificador lee esa clave al iniciar y despliega los sobres disponibles.

Flujo:
1. El usuario calcula en la calculadora (Modo B o C).
2. La calculadora ofrece un boton "Enviar al Planificador" que ejecuta `DataLayer.saveSobre(acId, sobre)`.
3. El usuario navega al Planificador (`/virtualizacion/planificador`).
4. El Planificador ejecuta `DataLayer.listSobres()` y muestra las ACs disponibles.
5. El usuario selecciona una AC y el planificador carga el sobre con `DataLayer.getSobre(acId)`.
6. El planificador despliega las horas del sobre como presupuesto: el disenador instruccional elige e-actividades dentro del presupuesto.
7. Si el disenador necesita exceder el presupuesto (>tolerancia del 10%), documenta la justificacion.

**Mecanismo 2: Export/Import JSON (compartir entre usuarios)**

Para compartir calculos entre distintos navegadores o usuarios:
1. `DataLayer.downloadJSON(id)` descarga un archivo `.json`.
2. El receptor usa `DataLayer.importJSON(jsonString)` para cargarlo en su propio localStorage.
3. Los sobres tambien se pueden exportar como parte del calculo completo.

**Mecanismo 3: URL params (linking directo, futuro)**

Reservado para implementacion futura. Permite generar un link directo al planificador con el sobre codificado en base64 como query param:
```
/virtualizacion/planificador?sobre=eyJub21icmUiOi...
```
No se implementa en v3.0 porque los sobres pueden ser grandes. Se evalua para v3.1 con compresion.

---

## 4. Integracion: como los 3 componentes se conectan

### 4.1. Flujo Modo A

```
Usuario ingresa hs, has, haut, semanas
    ↓
SCTEngine.calculateFromWeekly(hs, has, haut, semanas) → resultado
    ↓
SCTEngine.verify(resultado.triple, semanas, perfil, concurrentes) → checks
    ↓
ReportGenerator.generateFull('A', { ...resultado, ...metadata }) → HTML
    ↓
DataLayer.save('A', resultado) → id  [opcional, si el usuario guarda]
```

### 4.2. Flujo Modo B

```
Usuario ingresa array de ACs (cada una con hs, has, haut, semanas)
    ↓
SCTEngine.calculateSemester(arrayACs) → resultado
    ↓
Para cada AC: SCTEngine.verify(...) → checks individuales
SCTEngine.verify(resultado.tripleTotal, ...) → checks agregados
    ↓
ReportGenerator.generateFull('B', resultado) → HTML
    ↓
DataLayer.save('B', resultado) → id  [opcional]
```

### 4.3. Flujo Modo C

```
Usuario marca modalidades, ajusta niveles cognitivos, proporciones
    ↓
SCTEngine.runModeC(config) → resultado
  (internamente: calculateFromCognitive → distributeByModality → applyRatios → calculateSCT)
    ↓
SCTEngine.verify(resultado.triple, semanas, perfil, concurrentes) → checks
    ↓
ReportGenerator.generateFull('C', resultado) → HTML
    ↓
DataLayer.save('C', resultado) → id  [opcional]
DataLayer.saveSobre(acId, sobre) → [para pasar a M3]
```

### 4.4. Flujo CUECH (SCT fijo)

```
Formato CUECH seleccionado → sctFijo = 2, semanas = 16
    ↓
Modo C: SCTEngine.runModeC({ ...config, sctFijo: 2 }) → resultado
  (internamente: distributeCUECH → distributeByModality → applyRatios)
    ↓
Modo A: SCTEngine.calculateFromWeekly(hs, has, haut, 16) con SCT fijo en 2
    ↓
Resto identico a cada modo respectivo
```

---

## 5. Archivo fisico y carga

Los tres componentes se escriben como un unico archivo JavaScript:

```
/src/public/shared/sct-engine.js
```

Este archivo contiene, en orden:
1. Constantes (SCT_HOURS, FORMATOS, HOURS_BY_LEVEL, etc.)
2. SCTEngine (todas las funciones)
3. ReportGenerator (todas las funciones)
4. DataLayer (todas las funciones)

Se carga en el HTML antes del script inline de la calculadora:

```html
<script src="/shared/sct-engine.js"></script>
<script>
(function() {
  'use strict';
  // Logica de UI del wizard que CONSUME SCTEngine, ReportGenerator, DataLayer
  // ...
})();
</script>
```

El script inline del wizard se limita a:
- Manejo del DOM (bind inputs, wizard steps, etc.)
- Llamar a SCTEngine para calculos
- Llamar a ReportGenerator para generar HTML de informes
- Llamar a DataLayer para guardar/cargar

La logica de calculo, generacion de informes y persistencia queda totalmente encapsulada en `sct-engine.js`.

---

## 6. Compatibilidad con la v1 actual

La v1 actual (`virtualizacion-sct.html`) tiene estas funciones inline:

| Funcion v1 | Reemplazo v3 |
|-----------|-------------|
| `FORMATOS` (objeto) | `FORMATOS` (misma estructura, extendida) |
| `bindInputs()` | Se preserva en el script inline del wizard |
| `updatePreview()` | Usa `SCTEngine.calculateFromWeekly()` + logica de DOM |
| `updateOrientacionPanel()` | Se preserva (logica de UI, no de calculo) |
| `updateLiveVerdict()` | Usa `SCTEngine.verify()` para los checks |
| `runCalc()` | `SCTEngine.calculateFromWeekly()` |
| `renderDonut()` | Se preserva (logica de SVG, visual) |
| `renderSemaforo()` | Se preserva (logica de DOM), datos desde `SCTEngine.verify()` |
| `renderWeeklyBars()` | Se preserva (logica de DOM) |
| `updatePresentation()` | `ReportGenerator.generateBlock1()` + `generateBlock2('A', ...)` |
| `runVerification()` | `SCTEngine.verify()` + renderizado en DOM |
| `goToStep()` | Se preserva |
| `resetCalc()` | Se preserva |

La migracion es incremental: la v1 se convierte en Modo A del wizard, reemplazando las funciones de calculo internas por llamadas a SCTEngine, pero preservando toda la logica de DOM y wizard navigation.

---

*Documento de planificacion tecnica. Los valores concretos de constantes, formulas y schemas son definitivos y listos para implementacion. El codigo JS es produccion-ready (vanilla JS, sin dependencias, compatible con el patron actual del HTML).*
